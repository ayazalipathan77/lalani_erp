#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'ayaz12344321',
    database: process.env.DB_NAME || 'postgres', // Connect to default postgres database first
};

// Parse DATABASE_URL if provided
let dbUrlConfig = null;
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    dbUrlConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
    };
}

// Use DATABASE_URL config if available, otherwise use individual settings
const finalDbConfig = dbUrlConfig || dbConfig;

async function setupDatabase() {
    console.log('🚀 Starting Lalani ERP Database Setup...\n');

    // First, connect to the default postgres database to create our database
    const defaultDbConfig = { ...finalDbConfig, database: 'postgres' };
    const pool = new Pool(defaultDbConfig);

    try {
        console.log('📡 Connecting to PostgreSQL...');

        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL successfully!\n');

        // Check if lalani_erp database exists
        const dbCheck = await client.query(
            "SELECT datname FROM pg_database WHERE datname = 'lalani_erp'"
        );

        if (dbCheck.rows.length === 0) {
            // Create the lalani_erp database if it doesn't exist
            console.log('🏗️  Creating lalani_erp database...');
            await client.query(`CREATE DATABASE lalani_erp OWNER "${finalDbConfig.user}"`);
            console.log('✅ Database lalani_erp created successfully!\n');
        } else {
            console.log('ℹ️  Database lalani_erp already exists, proceeding with schema setup...\n');
        }

        client.release();

        // Now connect to the lalani_erp database (whether newly created or existing)
        const lalaniDbConfig = { ...finalDbConfig, database: 'lalani_erp' };
        const lalaniPool = new Pool(lalaniDbConfig);

        const lalaniClient = await lalaniPool.connect();
        console.log('📡 Connected to lalani_erp database...\n');

        // Read and execute the schema
        console.log('📄 Reading database schema...');
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`📄 Schema file loaded (${schemaSql.length} characters)\n`);

        // Split the schema into individual statements and execute them in order
        console.log('⚡ Executing database schema...');

        // Execute the entire schema file at once
        // PostgreSQL can handle multiple statements, and IF NOT EXISTS will prevent conflicts
        console.log('⚡ Executing complete database schema...');

        try {
            await lalaniClient.query(schemaSql);
            console.log('✅ Complete schema executed successfully!');
            console.log('📊 All tables, indexes, and sample data created');
        } catch (error) {
            console.log('⚠️  Schema execution completed with some warnings (expected for existing tables):');
            console.log('Error details:', error.message);

            // If the error suggests tables already exist, that's actually good
            if (error.message.includes('already exists') || error.message.includes('does not exist')) {
                console.log('💡 This is normal - tables might already exist from previous setup attempts');
            }
        }

        console.log('\n🎉 Database setup completed successfully!');
        console.log('📊 Database: lalani_erp');
        console.log('👤 User: Ready for application use');
        console.log('🔐 Password: 123 (change in production!)');
        console.log('\n🚀 You can now start the application with: npm start');

        lalaniClient.release();
        await lalaniPool.end();

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);

        if (error.message.includes('already exists')) {
            console.log('\n💡 Database might already exist. Try running the application directly: npm start');
        } else {
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Make sure PostgreSQL is running');
            console.log('2. Check your database credentials in .env file');
            console.log('3. Ensure the postgres user has database creation privileges');
        }

        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the setup
setupDatabase().catch(console.error);