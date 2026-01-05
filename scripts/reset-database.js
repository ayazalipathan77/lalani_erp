#!/usr/bin/env node

/**
 * Database Reset Script
 *
 * This script drops all tables and recreates the complete database schema
 * with fresh seed data. Useful for development and testing.
 *
 * Usage:
 *   npm run db:fresh
 *   OR
 *   node scripts/reset-database.js
 *
 * Safety: Requires confirmation before proceeding
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Parse DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('Please check your .env file and ensure DATABASE_URL is configured.');
    process.exit(1);
}

async function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

async function resetDatabase() {
    console.log('🔄 Lalani ERP - Database Reset Tool\n');
    console.log('⚠️  WARNING: This will DELETE ALL DATA and recreate the database from scratch!\n');
    console.log(`📋 Database: ${connectionString.split('@')[1]?.split('?')[0] || 'Unknown'}\n`);

    // Ask for confirmation (skip in CI/production if FORCE_DB_RESET is set)
    const forceReset = process.env.FORCE_DB_RESET === 'true';

    if (!forceReset) {
        const confirmed = await askConfirmation('Are you sure you want to continue? (yes/no): ');

        if (!confirmed) {
            console.log('❌ Database reset cancelled.');
            process.exit(0);
        }
    }

    const pool = new Pool({ connectionString });

    try {
        console.log('\n📡 Connecting to database...');
        const client = await pool.connect();
        console.log('✅ Connected successfully!\n');

        // Step 1: Drop all tables
        console.log('🗑️  Dropping all existing tables...');
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
            DROP TABLE IF EXISTS discount_rates CASCADE;
            DROP TABLE IF EXISTS system_backups CASCADE;
            DROP TABLE IF EXISTS companies CASCADE;
            DROP TABLE IF EXISTS migrations CASCADE;
        `);
        console.log('✅ All tables dropped successfully!\n');

        // Step 2: Apply complete schema
        console.log('📄 Applying complete database schema with Phase 1 optimizations...');
        console.log('   - Creating all tables');
        console.log('   - Creating single-column indexes');
        console.log('   - Creating 52 composite indexes (Phase 1)');
        console.log('   - Inserting seed data\n');

        const schemaPath = path.join(__dirname, '..', 'database', 'complete-schema-with-indexes.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSQL);

        console.log('✅ Complete database schema applied successfully!\n');

        // Step 3: Apply comprehensive test data (optional)
        console.log('📊 Applying comprehensive test data...');
        console.log('   - Additional companies (3 total)');
        console.log('   - 20+ products per company');
        console.log('   - Sales invoices (Nov-Dec 2025 + Jan 2026)');
        console.log('   - Purchase invoices');
        console.log('   - Payment receipts & supplier payments');
        console.log('   - Expenses & cash transactions');
        console.log('   - Sales returns\n');

        const testDataPath = path.join(__dirname, '..', 'database', 'seed-test-data.sql');

        if (fs.existsSync(testDataPath)) {
            const testDataSQL = fs.readFileSync(testDataPath, 'utf8');
            await client.query(testDataSQL);
            console.log('✅ Comprehensive test data applied successfully!\n');
        } else {
            console.log('⚠️  Test data file not found, skipping...\n');
        }

        // Step 3: Verify setup
        console.log('🔍 Verifying database setup...\n');

        const tableCount = await client.query(`
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        `);

        const indexCount = await client.query(`
            SELECT COUNT(*) as count
            FROM pg_indexes
            WHERE schemaname = 'public'
        `);

        const compositeIndexCount = await client.query(`
            SELECT COUNT(*) as count
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%_comp_%'
        `);

        const userCount = await client.query(`SELECT COUNT(*) as count FROM users`);
        const companyCount = await client.query(`SELECT COUNT(*) as count FROM companies`);
        const productCount = await client.query(`SELECT COUNT(*) as count FROM products`);
        const categoryCount = await client.query(`SELECT COUNT(*) as count FROM categories`);
        const customerCount = await client.query(`SELECT COUNT(*) as count FROM customers`);
        const supplierCount = await client.query(`SELECT COUNT(*) as count FROM suppliers`);
        const invoiceCount = await client.query(`SELECT COUNT(*) as count FROM sales_invoices`);
        const purchaseCount = await client.query(`SELECT COUNT(*) as count FROM purchase_invoices`);
        const receiptCount = await client.query(`SELECT COUNT(*) as count FROM payment_receipts`);
        const expenseCount = await client.query(`SELECT COUNT(*) as count FROM expenses`);

        console.log('📊 Database Statistics:');
        console.log(`   ✓ Tables created: ${tableCount.rows[0].count}`);
        console.log(`   ✓ Total indexes: ${indexCount.rows[0].count}`);
        console.log(`   ✓ Composite indexes (Phase 1): ${compositeIndexCount.rows[0].count}\n`);

        console.log('📦 Master Data:');
        console.log(`   ✓ Companies: ${companyCount.rows[0].count}`);
        console.log(`   ✓ Users: ${userCount.rows[0].count}`);
        console.log(`   ✓ Products: ${productCount.rows[0].count}`);
        console.log(`   ✓ Categories: ${categoryCount.rows[0].count}`);
        console.log(`   ✓ Customers: ${customerCount.rows[0].count}`);
        console.log(`   ✓ Suppliers: ${supplierCount.rows[0].count}\n`);

        console.log('📈 Transaction Data:');
        console.log(`   ✓ Sales Invoices: ${invoiceCount.rows[0].count}`);
        console.log(`   ✓ Purchase Invoices: ${purchaseCount.rows[0].count}`);
        console.log(`   ✓ Payment Receipts: ${receiptCount.rows[0].count}`);
        console.log(`   ✓ Expenses: ${expenseCount.rows[0].count}\n`);

        client.release();
        await pool.end();

        console.log('🎉 Database reset completed successfully!\n');
        console.log('📝 Default Credentials:');
        console.log('   Admin: username=admin, password=123');
        console.log('   User:  username=user, password=123\n');
        console.log('🚀 You can now start the server with: npm run server\n');

    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        console.error('Stack:', error.stack);

        try {
            await pool.end();
        } catch (e) {
            // Ignore pool end errors
        }

        process.exit(1);
    }
}

// Run the reset
resetDatabase().catch(console.error);
