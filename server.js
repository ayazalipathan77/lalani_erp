import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Database Configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('Please check your .env file and ensure DATABASE_URL is configured.');
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// WebAuthn configuration
const WEBAUTHN_RP_NAME = 'Lalani ERP';
const WEBAUTHN_RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'; // In production, use your domain
const WEBAUTHN_ORIGIN = process.env.WEBAUTHN_ORIGIN || `http://localhost:5173`; // Frontend URL - adjust port if needed

// Middleware to extract user from JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            req.user = null;
        } else {
            req.user = { id: decoded.userId, username: decoded.username };
        }
        next();
    });
};

// Apply authentication middleware to all routes except auth
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth/')) {
        return next(); // Skip auth for login/verify
    }
    authenticateToken(req, res, next);
});

// Test database connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

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
            const token = jwt.sign({ userId: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({ user, token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify token
app.post('/api/auth/verify', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, userId: decoded.userId, username: decoded.username });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// WebAuthn Registration Start
app.post('/api/auth/webauthn/register-start', async (req, res) => {
    const { username } = req.body;
    console.log('WebAuthn registration start for user:', username);
    console.log('WEBAUTHN_RP_ID:', WEBAUTHN_RP_ID);
    console.log('WEBAUTHN_ORIGIN:', WEBAUTHN_ORIGIN);
    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id, username FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            console.log('User not found:', username);
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];
        console.log('Found user:', user);

        // Get existing credentials for the user
        const credentialsResult = await pool.query(
            'SELECT credential_id FROM user_webauthn_credentials WHERE user_id = $1',
            [user.user_id]
        );
        const excludeCredentials = credentialsResult.rows.map(cred => ({
            id: cred.credential_id,
            type: 'public-key'
        }));
        console.log('Exclude credentials:', excludeCredentials.length);

        const options = generateRegistrationOptions({
            rpName: WEBAUTHN_RP_NAME,
            rpID: WEBAUTHN_RP_ID,
            userID: user.user_id.toString(),
            userName: user.username,
            userDisplayName: user.username,
            attestationType: 'direct',
            excludeCredentials,
            authenticatorSelection: {
                authenticatorAttachment: 'platform', // Prefer platform authenticators (biometrics)
                userVerification: 'preferred',
                requireResidentKey: false
            }
        });

        // Store challenge in session/database (simplified - in production use proper session management)
        // For demo, we'll store in memory, but in production use Redis or database
        global.webauthnChallenges = global.webauthnChallenges || {};
        global.webauthnChallenges[user.user_id] = options.challenge;
        console.log('Stored challenge for user:', user.user_id);

        console.log('Registration options generated successfully');
        res.json(options);
    } catch (error) {
        console.error('WebAuthn registration start error:', error);
        res.status(500).json({ message: 'Failed to start registration', error: error.message });
    }
});

// WebAuthn Registration Finish
app.post('/api/auth/webauthn/register-finish', async (req, res) => {
    const { username, credential } = req.body;
    console.log('WebAuthn registration finish for user:', username);
    console.log('Credential received:', !!credential);
    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            console.log('User not found during finish:', username);
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];
        console.log('Found user for finish:', user);

        const expectedChallenge = global.webauthnChallenges?.[user.user_id];
        console.log('Expected challenge:', !!expectedChallenge);
        if (!expectedChallenge) {
            console.log('No registration in progress for user:', user.user_id);
            return res.status(400).json({ message: 'No registration in progress' });
        }

        console.log('Verifying registration response...');
        console.log('Expected origin:', WEBAUTHN_ORIGIN);
        console.log('Expected RPID:', WEBAUTHN_RP_ID);

        const verification = verifyRegistrationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin: WEBAUTHN_ORIGIN,
            expectedRPID: WEBAUTHN_RP_ID,
        });

        console.log('Verification result:', verification.verified);
        if (!verification.verified) {
            console.log('Registration verification failed');
            return res.status(400).json({ message: 'Registration verification failed' });
        }

        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
        console.log('Credential info:', { credentialID: !!credentialID, publicKey: !!credentialPublicKey, counter });

        // Store credential
        console.log('Storing credential in database...');
        await pool.query(
            'INSERT INTO user_webauthn_credentials (credential_id, user_id, public_key, counter, device_info) VALUES ($1, $2, $3, $4, $5)',
            [credentialID, user.user_id, Buffer.from(credentialPublicKey).toString('base64'), counter, JSON.stringify(credential)]
        );
        console.log('Credential stored successfully');

        // Clean up challenge
        delete global.webauthnChallenges[user.user_id];
        console.log('Challenge cleaned up');

        res.json({ success: true, message: 'Biometric registration successful' });
    } catch (error) {
        console.error('WebAuthn registration finish error:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ message: 'Failed to complete registration', error: error.message });
    }
});

// WebAuthn Authentication Start
app.post('/api/auth/webauthn/login-start', async (req, res) => {
    const { username } = req.body;
    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        // Get user's credentials
        const credentialsResult = await pool.query(
            'SELECT credential_id FROM user_webauthn_credentials WHERE user_id = $1',
            [user.user_id]
        );

        if (credentialsResult.rows.length === 0) {
            return res.status(400).json({ message: 'No biometric credentials registered' });
        }

        const allowCredentials = credentialsResult.rows.map(cred => ({
            id: cred.credential_id,
            type: 'public-key'
        }));

        const options = generateAuthenticationOptions({
            allowCredentials,
            userVerification: 'preferred'
        });

        // Store challenge
        global.webauthnChallenges = global.webauthnChallenges || {};
        global.webauthnChallenges[user.user_id] = options.challenge;

        res.json(options);
    } catch (error) {
        console.error('WebAuthn login start error:', error);
        res.status(500).json({ message: 'Failed to start authentication' });
    }
});

// WebAuthn Authentication Finish
app.post('/api/auth/webauthn/login-finish', async (req, res) => {
    const { username, credential } = req.body;
    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id, username FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        const expectedChallenge = global.webauthnChallenges?.[user.user_id];
        if (!expectedChallenge) {
            return res.status(400).json({ message: 'No authentication in progress' });
        }

        // Get credential from database
        const credentialResult = await pool.query(
            'SELECT public_key, counter FROM user_webauthn_credentials WHERE credential_id = $1 AND user_id = $2',
            [credential.id, user.user_id]
        );

        if (credentialResult.rows.length === 0) {
            return res.status(400).json({ message: 'Credential not found' });
        }

        const dbCredential = credentialResult.rows[0];
        const publicKey = Buffer.from(dbCredential.public_key, 'base64');

        const verification = verifyAuthenticationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin: WEBAUTHN_ORIGIN,
            expectedRPID: WEBAUTHN_RP_ID,
            authenticator: {
                credentialID: credential.id,
                credentialPublicKey: publicKey,
                counter: dbCredential.counter
            }
        });

        if (!verification.verified) {
            return res.status(400).json({ message: 'Authentication verification failed' });
        }

        // Update counter
        await pool.query(
            'UPDATE user_webauthn_credentials SET counter = $1, last_used = CURRENT_TIMESTAMP WHERE credential_id = $2',
            [verification.authenticationInfo.newCounter, credential.id]
        );

        // Clean up challenge
        delete global.webauthnChallenges[user.user_id];

        // Generate JWT token
        const token = jwt.sign({ userId: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ user, token, message: 'Biometric authentication successful' });
    } catch (error) {
        console.error('WebAuthn login finish error:', error);
        res.status(500).json({ message: 'Failed to complete authentication' });
    }
});

// Get user's WebAuthn credentials
app.get('/api/auth/webauthn/credentials', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const result = await pool.query(
            'SELECT credential_id, created_at, last_used, device_info FROM user_webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get credentials error:', error);
        res.status(500).json({ message: 'Failed to fetch credentials' });
    }
});

// Delete WebAuthn credential
app.delete('/api/auth/webauthn/credentials/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const result = await pool.query(
            'DELETE FROM user_webauthn_credentials WHERE credential_id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Delete credential error:', error);
        res.status(500).json({ message: 'Failed to delete credential' });
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT user_id, username, full_name, role, is_active, permissions FROM users ORDER BY user_id LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
    const { username, password, full_name, role, is_active, permissions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password, full_name, role, is_active, permissions, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [username, password, full_name, role, is_active, permissions, req.user?.id]
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
            query = 'UPDATE users SET full_name=$1, role=$2, is_active=$3, permissions=$4, password=$5, updated_by=$6 WHERE user_id=$7 RETURNING *';
            params = [full_name, role, is_active, permissions, password, req.user?.id, id];
        } else {
            query = 'UPDATE users SET full_name=$1, role=$2, is_active=$3, permissions=$4, updated_by=$5 WHERE user_id=$6 RETURNING *';
            params = [full_name, role, is_active, permissions, req.user?.id, id];
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM products');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM products ORDER BY prod_name LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', async (req, res) => {
    const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, 'CMP01', req.user?.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET prod_code=$1, prod_name=$2, category_code=$3, unit_price=$4, current_stock=$5, min_stock_level=$6, updated_by=$7 WHERE prod_id=$8 RETURNING *',
            [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, req.user?.id, id]
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM customers');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM customers ORDER BY cust_name LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/customers', async (req, res) => {
    const { cust_code, cust_name, city, phone, credit_limit, outstanding_balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [cust_code, cust_name, city, phone, credit_limit, outstanding_balance, 'CMP01', req.user?.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { cust_code, cust_name, city, phone, credit_limit } = req.body;
    try {
        const result = await pool.query(
            'UPDATE customers SET cust_code=$1, cust_name=$2, city=$3, phone=$4, credit_limit=$5, updated_by=$6 WHERE cust_id=$7 RETURNING *',
            [cust_code, cust_name, city, phone, credit_limit, req.user?.id, id]
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM suppliers');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM suppliers ORDER BY supplier_name LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/suppliers', async (req, res) => {
    const { supplier_code, supplier_name, city, phone, contact_person, outstanding_balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO suppliers (supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, 'CMP01', req.user?.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    const { supplier_code, supplier_name, city, phone, contact_person } = req.body;
    try {
        const result = await pool.query(
            'UPDATE suppliers SET supplier_code=$1, supplier_name=$2, city=$3, phone=$4, contact_person=$5, updated_by=$6 WHERE supplier_id=$7 RETURNING *',
            [supplier_code, supplier_name, city, phone, contact_person, req.user?.id, id]
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM sales_invoices');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(`
            SELECT i.*,
            (SELECT json_agg(json_build_object('prod_code', it.prod_code, 'quantity', it.quantity, 'unit_price', it.unit_price, 'line_total', it.line_total, 'prod_name', p.prod_name))
             FROM sales_invoice_items it
             JOIN products p ON it.prod_code = p.prod_code
             WHERE it.inv_id = i.inv_id) as items
            FROM sales_invoices i
            ORDER BY i.inv_date DESC, i.inv_id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const invoices = result.rows.map(inv => ({
            ...inv,
            status: Number(inv.balance_due) <= 0 ? 'PAID' : (Number(inv.balance_due) < Number(inv.total_amount) ? 'PARTIAL' : 'PENDING')
        }));

        res.json({
            data: invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
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
            [inv_number, date, cust_code, 'CMP01', sub_total, tax_amount, total_amount, balance_due, req.user?.id]
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
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [date, 'SALES', `Cash Sale ${inv_number}`, total_amount, 0, 'CMP01', req.user?.id]
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM cash_balance');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM cash_balance ORDER BY trans_date DESC, trans_id DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/finance/expenses', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM expenses');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM expenses ORDER BY expense_date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/finance/expenses', async (req, res) => {
    const { head_code, amount, remarks, expense_date } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const expRes = await client.query(
            `INSERT INTO expenses (head_code, amount, remarks, expense_date, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [head_code, amount, remarks, expense_date, 'CMP01', req.user?.id]
        );
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [expense_date, 'EXPENSE', `EXP: ${head_code} - ${remarks}`, 0, amount, 'CMP01', req.user?.id]
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
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [date, type, `${type}: ${party_code} - ${remarks}`, debit, credit, 'CMP01', req.user?.id]
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

// --- ANALYTICS ENDPOINTS ---

// Dashboard metrics
app.get('/api/analytics/dashboard-metrics', async (req, res) => {
    try {
        // Get comprehensive dashboard data
        const [
            revenueResult,
            pendingResult,
            lowStockResult,
            customerCountResult,
            recentInvoicesResult,
            topProductsResult,
            salesByCategoryResult
        ] = await Promise.all([
            // Total revenue
            pool.query(`
                SELECT COALESCE(SUM(total_amount), 0) as total_revenue
                FROM sales_invoices
                WHERE balance_due <= 0
            `),
            // Pending receivables
            pool.query(`
                SELECT COALESCE(SUM(balance_due), 0) as pending_amount
                FROM sales_invoices
                WHERE balance_due > 0
            `),
            // Low stock items
            pool.query(`
                SELECT COUNT(*) as low_stock_count
                FROM products
                WHERE current_stock <= min_stock_level
            `),
            // Customer count
            pool.query('SELECT COUNT(*) as customer_count FROM customers'),
            // Recent invoices
            pool.query(`
                SELECT inv_id, inv_number, inv_date, cust_code, total_amount, balance_due,
                       CASE WHEN balance_due <= 0 THEN 'PAID' ELSE 'PENDING' END as status
                FROM sales_invoices
                ORDER BY inv_date DESC, inv_id DESC
                LIMIT 5
            `),
            // Top products by revenue
            pool.query(`
                SELECT p.prod_name, p.prod_code,
                       COALESCE(SUM(si.line_total), 0) as total_revenue
                FROM products p
                LEFT JOIN sales_invoice_items si ON p.prod_code = si.prod_code
                GROUP BY p.prod_id, p.prod_name, p.prod_code
                ORDER BY total_revenue DESC
                LIMIT 10
            `),
            // Sales by category
            pool.query(`
                SELECT c.category_name,
                       COALESCE(SUM(si.line_total), 0) as category_revenue
                FROM categories c
                LEFT JOIN products p ON c.category_code = p.category_code
                LEFT JOIN sales_invoice_items si ON p.prod_code = si.prod_code
                GROUP BY c.category_id, c.category_name
                ORDER BY category_revenue DESC
            `)
        ]);

        const metrics = {
            totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
            pendingReceivables: parseFloat(pendingResult.rows[0].pending_amount),
            lowStockCount: parseInt(lowStockResult.rows[0].low_stock_count),
            customerCount: parseInt(customerCountResult.rows[0].customer_count),
            recentInvoices: recentInvoicesResult.rows,
            topProducts: topProductsResult.rows,
            salesByCategory: salesByCategoryResult.rows
        };

        res.json(metrics);
    } catch (error) {
        console.error('Dashboard metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
});

// Sales trends data
app.get('/api/analytics/sales-trends', async (req, res) => {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentDate = new Date();
        const chartData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();

            const result = await pool.query(`
                SELECT COALESCE(SUM(total_amount), 0) as month_sales
                FROM sales_invoices
                WHERE EXTRACT(MONTH FROM inv_date) = $1
                  AND EXTRACT(YEAR FROM inv_date) = $2
                  AND balance_due <= 0
            `, [date.getMonth() + 1, year]);

            chartData.push({
                name: monthName,
                sales: Math.round(parseFloat(result.rows[0].month_sales))
            });
        }

        res.json(chartData);
    } catch (error) {
        console.error('Sales trends error:', error);
        res.status(500).json({ error: 'Failed to fetch sales trends' });
    }
});

// --- SERVE FRONTEND (PRODUCTION) ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
