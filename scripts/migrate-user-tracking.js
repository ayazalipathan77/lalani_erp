// Migration script to add user tracking fields to existing tables
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting user tracking migration...');

        await client.query('BEGIN');

        // Add user tracking fields to users table
        console.log('📝 Adding user tracking to users table...');
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(user_id)
        `);

        // Add user tracking fields to products table
        console.log('📝 Adding user tracking to products table...');
        await client.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(user_id)
        `);

        // Add user tracking fields to customers table
        console.log('📝 Adding user tracking to customers table...');
        await client.query(`
            ALTER TABLE customers
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(user_id)
        `);

        // Add user tracking fields to suppliers table
        console.log('📝 Adding user tracking to suppliers table...');
        await client.query(`
            ALTER TABLE suppliers
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(user_id)
        `);

        // Add user tracking fields to expenses table
        console.log('📝 Adding user tracking to expenses table...');
        await client.query(`
            ALTER TABLE expenses
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(user_id)
        `);

        // Add user tracking fields to cash_balance table
        console.log('📝 Adding user tracking to cash_balance table...');
        await client.query(`
            ALTER TABLE cash_balance
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id)
        `);

        // Modify sales_invoices created_by column from VARCHAR to INTEGER
        console.log('📝 Updating sales_invoices created_by column...');
        await client.query(`
            ALTER TABLE sales_invoices
            ALTER COLUMN created_by DROP DEFAULT,
            ALTER COLUMN created_by TYPE INTEGER USING NULL
        `);
        await client.query(`
            ALTER TABLE sales_invoices
            ADD CONSTRAINT fk_sales_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(user_id)
        `);

        await client.query('COMMIT');
        console.log('✅ User tracking migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(console.error);