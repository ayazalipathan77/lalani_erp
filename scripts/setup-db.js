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
    console.log('🚀 Starting Lalani ERP Database Migration...\n');

    try {
        // For production/Render, assume database already exists
        // Just run migrations on the target database
        console.log('📡 Connecting to database...');

        const dbConfig = finalDbConfig;
        const pool = new Pool(dbConfig);

        // Test connection to the target database
        const client = await pool.connect();
        console.log('✅ Connected to database successfully!\n');

        client.release();
        await pool.end();

        // Run database migrations
        console.log('📄 Running database migrations...');

        const { spawn } = await import('child_process');

        // Set environment for db-migrate
        const env = {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV || 'production'
        };

        // Ensure DATABASE_URL is available for db-migrate
        if (process.env.DATABASE_URL) {
            env.DATABASE_URL = process.env.DATABASE_URL;
            console.log('📋 Using DATABASE_URL for migrations');
        }

        console.log('🔧 Executing: db-migrate up');

        // Run db-migrate up
        const migrateProcess = spawn('npx', ['db-migrate', 'up', '--config', 'database.json', '--migrations-dir', 'migrations'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            env: env
        });

        const migrationResult = await new Promise((resolve, reject) => {
            migrateProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Database migrations completed successfully!');
                    resolve(true);
                } else {
                    console.error(`❌ Migration process exited with code ${code}`);
                    reject(new Error(`Migration failed with exit code ${code}`));
                }
            });

            migrateProcess.on('error', (error) => {
                console.error('❌ Migration process error:', error);
                reject(error);
            });
        });

        if (migrationResult) {
            console.log('\n🎉 Database migration completed successfully!');
            console.log('📊 All tables, indexes, and sample data created');
        }

    } catch (error) {
        console.error('❌ Database migration failed:', error.message);
        console.error('Stack:', error.stack);

        // Don't exit with error in production - let the app try to start anyway
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️  Continuing with app startup despite migration issues...');
            return;
        }

        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check DATABASE_URL environment variable');
        console.log('2. Ensure database is accessible');
        console.log('3. Check database user permissions');

        process.exit(1);
    }
}

// Run the setup
setupDatabase().catch(console.error);