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

        // Run database migrations
        console.log('📄 Running database migrations...');

        const { spawn } = await import('child_process');

        // Set environment for db-migrate
        const env = { ...process.env };

        // For production, ensure DATABASE_URL is used if available
        if (process.env.DATABASE_URL) {
            env.DATABASE_URL = process.env.DATABASE_URL;
        }

        // Run db-migrate up
        const migrateProcess = spawn('npx', ['db-migrate', 'up'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            env: env
        });

        await new Promise((resolve, reject) => {
            migrateProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Database migrations completed successfully!');
                    console.log('📊 All tables, indexes, and sample data created');
                    resolve();
                } else {
                    reject(new Error(`Migration failed with exit code ${code}`));
                }
            });

            migrateProcess.on('error', (error) => {
                reject(error);
            });
        });

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