import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import logger from './logger.js';
import authRoutes from './server/routes/authRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import productsRoutes from './server/routes/productsRoutes.js';
import customersRoutes from './server/routes/customersRoutes.js';
import suppliersRoutes from './server/routes/suppliersRoutes.js';
import invoicesRoutes from './server/routes/invoicesRoutes.js';
import financeRoutes from './server/routes/financeRoutes.js';
import categoriesRoutes from './server/routes/categoriesRoutes.js';
import analyticsRoutes from './server/routes/analyticsRoutes.js';
import salesReturnsRoutes from './server/routes/salesReturnsRoutes.js';
import purchaseInvoicesRoutes from './server/routes/purchaseInvoicesRoutes.js';
import paymentReceiptsRoutes from './server/routes/paymentReceiptsRoutes.js';
import supplierPaymentsRoutes from './server/routes/supplierPaymentsRoutes.js';
import discountVouchersRoutes from './server/routes/discountVouchersRoutes.js';
import companiesRoutes from './server/routes/companiesRoutes.js';
import systemBackupsRoutes from './server/routes/systemBackupsRoutes.js';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';

dotenv.config();

// Run database migrations on startup
async function runMigrations() {
    console.log('🚀 Running database migrations...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found, skipping migrations');
        return;
    }

    console.log('📋 DATABASE_URL found, connecting...');

    const { Pool } = pg;
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connection successful');

        // Check for force reset flag
        const forceReset = process.env.FORCE_DB_RESET === 'true';
        if (forceReset) {
            console.log('🔄 FORCE_DB_RESET detected, cleaning all tables...');
            await client.query(`
                DROP TABLE IF EXISTS sales_return_items CASCADE;
                DROP TABLE IF EXISTS sales_returns CASCADE;
                DROP TABLE IF EXISTS purchase_invoice_items CASCADE;
                DROP TABLE IF EXISTS purchase_invoices CASCADE;
                DROP TABLE IF EXISTS sales_invoice_items CASCADE;
                DROP TABLE IF EXISTS sales_invoices CASCADE;
                DROP TABLE IF EXISTS payment_receipts CASCADE;
                DROP TABLE IF EXISTS supplier_payments CASCADE;
                DROP TABLE IF EXISTS discount_vouchers CASCADE;
                DROP TABLE IF EXISTS loan_return CASCADE;
                DROP TABLE IF EXISTS loan_taken CASCADE;
                DROP TABLE IF EXISTS opening_cash_balance CASCADE;
                DROP TABLE IF EXISTS cash_balance CASCADE;
                DROP TABLE IF EXISTS expenses CASCADE;
                DROP TABLE IF EXISTS expense_heads CASCADE;
                DROP TABLE IF EXISTS products CASCADE;
                DROP TABLE IF EXISTS categories CASCADE;
                DROP TABLE IF EXISTS customers CASCADE;
                DROP TABLE IF EXISTS suppliers CASCADE;
                DROP TABLE IF EXISTS user_webauthn_credentials CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
                DROP TABLE IF EXISTS tax_rates CASCADE;
                DROP TABLE IF EXISTS system_backups CASCADE;
                DROP TABLE IF EXISTS companies CASCADE;
            `);
            console.log('✅ All tables dropped for clean reset');
        } else {
            // Check if our key tables exist and are complete
            try {
                const schemaCheck = await client.query(`
                    SELECT COUNT(*) as count FROM information_schema.tables
                    WHERE table_name IN ('tax_rates', 'purchase_invoices', 'sales_invoices', 'users', 'products', 'companies')
                `);

                if (schemaCheck.rows[0].count >= 6) {
                    console.log('✅ Database schema appears to be initialized');
                    client.release();
                    await pool.end();
                    return;
                }
            } catch (schemaError) {
                console.log('ℹ️  Could not check schema, database might be empty');
            }

            // If we get here, we need to apply the schema
            // First, drop all existing tables to ensure clean state
            console.log('🧹 Cleaning up any partial tables...');
            try {
                await client.query(`
                DROP TABLE IF EXISTS sales_return_items CASCADE;
                DROP TABLE IF EXISTS sales_returns CASCADE;
                DROP TABLE IF EXISTS purchase_invoice_items CASCADE;
                DROP TABLE IF EXISTS purchase_invoices CASCADE;
                DROP TABLE IF EXISTS sales_invoice_items CASCADE;
                DROP TABLE IF EXISTS sales_invoices CASCADE;
                DROP TABLE IF EXISTS payment_receipts CASCADE;
                DROP TABLE IF EXISTS supplier_payments CASCADE;
                DROP TABLE IF EXISTS discount_vouchers CASCADE;
                DROP TABLE IF EXISTS loan_return CASCADE;
                DROP TABLE IF EXISTS loan_taken CASCADE;
                DROP TABLE IF EXISTS opening_cash_balance CASCADE;
                DROP TABLE IF EXISTS cash_balance CASCADE;
                DROP TABLE IF EXISTS expenses CASCADE;
                DROP TABLE IF EXISTS expense_heads CASCADE;
                DROP TABLE IF EXISTS products CASCADE;
                DROP TABLE IF EXISTS categories CASCADE;
                DROP TABLE IF EXISTS customers CASCADE;
                DROP TABLE IF EXISTS suppliers CASCADE;
                DROP TABLE IF EXISTS user_webauthn_credentials CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
                DROP TABLE IF EXISTS tax_rates CASCADE;
                DROP TABLE IF EXISTS system_backups CASCADE;
                DROP TABLE IF EXISTS companies CASCADE;
            `);
                console.log('✅ Cleaned up partial tables');
            } catch (cleanupError) {
                console.log('⚠️  Cleanup encountered issues, proceeding anyway:', cleanupError.message);
            }
        }

        console.log('📄 Applying initial database schema...');

        // Read and execute the migration SQL
        const migrationPath = path.join(__dirname, 'migrations', 'sqls', '20251209002519-initial-schema-up.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        await client.query(migrationSQL);
        console.log('✅ Database schema applied successfully!');

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);

        // Don't exit - let the app start anyway
        try {
            await pool.end();
        } catch (e) {
            // Ignore pool end errors
        }
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Database Configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    logger.error('DATABASE_URL environment variable is not set', null, { environment: 'startup' });
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

// Set proper MIME types for JavaScript modules
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
    }
    next();
});

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
            logger.auth('TOKEN_VERIFICATION_FAILED', null, null, req.ip);
        } else {
            req.user = {
                id: decoded.userId,
                username: decoded.username,
                selectedCompany: decoded.selectedCompany || 'CMP01'
            };
            // Only log successful token verification for important endpoints, not every request
            // This prevents log spam from frontend polling and routine requests
        }
        next();
    });
};

// Company context middleware
const getCompanyContext = (req) => {
    // Priority: 1. Request header, 2. User session, 3. Default
    return req.headers['x-company-code'] ||
        req.user?.selectedCompany ||
        'CMP01';
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
    logger.error('Unexpected error on idle client', err, { type: 'database' });
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// --- API ROUTES ---

// Initialize route modules
authRoutes(app, pool, WEBAUTHN_RP_NAME, WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN);
userRoutes(app, pool, logger);
productsRoutes(app, pool, logger);
customersRoutes(app, pool, logger);
suppliersRoutes(app, pool, logger);
invoicesRoutes(app, pool, logger);
financeRoutes(app, pool, logger);
categoriesRoutes(app, pool, logger);
analyticsRoutes(app, pool, logger);
salesReturnsRoutes(app, pool, logger);
purchaseInvoicesRoutes(app, pool, logger);
paymentReceiptsRoutes(app, pool, logger);
supplierPaymentsRoutes(app, pool, logger);
discountVouchersRoutes(app, pool, logger);
companiesRoutes(app, pool, logger);
systemBackupsRoutes(app, pool, logger);







app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    // Run migrations after server starts
    await runMigrations();
});
