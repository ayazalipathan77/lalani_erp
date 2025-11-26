
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Database Configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://admin:fckyc6G0Ka5d2nYQlpAp4b9P8yjgcauW@dpg-d4j9ns15pdvs7399psrg-a.oregon-postgres.render.com/lalani?ssl=true';

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false 
  }
});

app.use(cors());
app.use(express.json());

// --- DATABASE INITIALIZATION ---
const initDB = async () => {
    try {
        console.log('Attempting to connect to database...');
        // Locate schema.sql in database/schema.sql relative to root
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            console.error(`Schema file not found at: ${schemaPath}`);
            return;
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log(`Read schema file (${schemaSql.length} bytes).`);

        const client = await pool.connect();
        try {
            console.log('Connected! Running schema initialization...');
            await client.query(schemaSql);
            console.log('Database initialized and seeded successfully.');
        } catch (queryErr) {
            console.error('SQL Execution Error:', queryErr.message);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Database initialization failed:', err);
    }
};

// Run DB Init on Startup
initDB();

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE lower(username) = lower($1) AND password = $2 AND is_active = $3',
      [username.trim(), password, 'Y']
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      delete user.password;
      res.json(user);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, full_name, role, is_active, permissions FROM users ORDER BY user_id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  const { username, password, full_name, role, is_active, permissions } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password, full_name, role, is_active, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, password, full_name, role, is_active, permissions]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, role, is_active, permissions, password } = req.body;
  try {
    let query, params;
    if (password) {
        query = 'UPDATE users SET full_name=$1, role=$2, is_active=$3, permissions=$4, password=$5 WHERE user_id=$6 RETURNING *';
        params = [full_name, role, is_active, permissions, password, id];
    } else {
        query = 'UPDATE users SET full_name=$1, role=$2, is_active=$3, permissions=$4 WHERE user_id=$5 RETURNING *';
        params = [full_name, role, is_active, permissions, id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Inventory (Products)
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY prod_name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', async (req, res) => {
  const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, comp_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, 'CMP01']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET prod_code=$1, prod_name=$2, category_code=$3, unit_price=$4, current_stock=$5, min_stock_level=$6 WHERE prod_id=$7 RETURNING *',
      [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE prod_id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Customers
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY cust_name');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/customers', async (req, res) => {
    const { cust_code, cust_name, city, phone, credit_limit, outstanding_balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance, comp_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [cust_code, cust_name, city, phone, credit_limit, outstanding_balance, 'CMP01']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { cust_code, cust_name, city, phone, credit_limit } = req.body;
    try {
        const result = await pool.query(
            'UPDATE customers SET cust_code=$1, cust_name=$2, city=$3, phone=$4, credit_limit=$5 WHERE cust_id=$6 RETURNING *',
            [cust_code, cust_name, city, phone, credit_limit, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM customers WHERE cust_id=$1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Suppliers
app.get('/api/suppliers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM suppliers ORDER BY supplier_name');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/suppliers', async (req, res) => {
    const { supplier_code, supplier_name, city, phone, contact_person, outstanding_balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO suppliers (supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, comp_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, 'CMP01']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    const { supplier_code, supplier_name, city, phone, contact_person } = req.body;
    try {
        const result = await pool.query(
            'UPDATE suppliers SET supplier_code=$1, supplier_name=$2, city=$3, phone=$4, contact_person=$5 WHERE supplier_id=$6 RETURNING *',
            [supplier_code, supplier_name, city, phone, contact_person, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM suppliers WHERE supplier_id=$1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- INVOICES ---
app.get('/api/invoices', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, 
            (SELECT json_agg(json_build_object('prod_code', it.prod_code, 'quantity', it.quantity, 'unit_price', it.unit_price, 'line_total', it.line_total, 'prod_name', p.prod_name)) 
             FROM sales_invoice_items it 
             JOIN products p ON it.prod_code = p.prod_code 
             WHERE it.inv_id = i.inv_id) as items 
            FROM sales_invoices i 
            ORDER BY i.inv_date DESC, i.inv_id DESC
        `);
        const invoices = result.rows.map(inv => ({
            ...inv,
            status: Number(inv.balance_due) <= 0 ? 'PAID' : (Number(inv.balance_due) < Number(inv.total_amount) ? 'PARTIAL' : 'PENDING') 
        }));
        res.json(invoices);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/invoices', async (req, res) => {
    const { cust_code, items, date, status } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sub_total = items.reduce((acc, item) => acc + Number(item.line_total), 0);
        const tax_amount = sub_total * 0.05;
        const total_amount = sub_total + tax_amount;
        const balance_due = status === 'PAID' ? 0 : total_amount;
        const inv_number = `INV-${Date.now()}`;

        const invRes = await client.query(
            `INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, tax_amount, total_amount, balance_due, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING inv_id`,
            [inv_number, date, cust_code, 'CMP01', sub_total, tax_amount, total_amount, balance_due, 'SYSTEM']
        );
        const inv_id = invRes.rows[0].inv_id;

        for (const item of items) {
            await client.query(
                `INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [inv_id, item.prod_code, item.quantity, item.unit_price, item.line_total]
            );
            await client.query(
                `UPDATE products SET current_stock = current_stock - $1 WHERE prod_code = $2`,
                [item.quantity, item.prod_code]
            );
        }

        if (status === 'PENDING') {
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                [total_amount, cust_code]
            );
        }

        if (status === 'PAID') {
            await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [date, 'SALES', `Cash Sale ${inv_number}`, total_amount, 0, 'CMP01']
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Invoice created successfully', inv_id });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// --- FINANCE ---
app.get('/api/finance/transactions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cash_balance ORDER BY trans_date DESC, trans_id DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/finance/expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/finance/expenses', async (req, res) => {
    const { head_code, amount, remarks, expense_date } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const expRes = await client.query(
            `INSERT INTO expenses (head_code, amount, remarks, expense_date, comp_code)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [head_code, amount, remarks, expense_date, 'CMP01']
        );
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [expense_date, 'EXPENSE', `EXP: ${head_code} - ${remarks}`, 0, amount, 'CMP01']
        );
        await client.query('COMMIT');
        res.json(expRes.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

app.post('/api/finance/payment', async (req, res) => {
    const { type, party_code, amount, date, remarks } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const debit = type === 'RECEIPT' ? amount : 0;
        const credit = type === 'PAYMENT' ? amount : 0;
        
        const transRes = await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [date, type, `${type}: ${party_code} - ${remarks}`, debit, credit, 'CMP01']
        );

        if (type === 'RECEIPT') {
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                [amount, party_code]
            );
        } else {
             await client.query(
                `UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE supplier_code = $2`,
                [amount, party_code]
            );
        }
        await client.query('COMMIT');
        res.json(transRes.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
