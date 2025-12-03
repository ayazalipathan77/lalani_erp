import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import logger from './logger.js';
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

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE lower(username) = lower($1) AND password = $2 AND is_active = $3',
            [username.trim(), password, 'Y']
        );
        if (result.rows.length > 0) {
            const user = result.rows[0];
            delete user.password;
            const token = jwt.sign({
                userId: user.user_id,
                username: user.username,
                selectedCompany: user.default_company || 'CMP01'
            }, process.env.JWT_SECRET, { expiresIn: '24h' });

            // Log successful login
            logger.login(username, true, clientIP, userAgent);
            logger.auth('LOGIN_SUCCESS', user.username, user.user_id, clientIP);

            res.json({ user, token });
        } else {
            // Log failed login
            logger.login(username, false, clientIP, userAgent);
            logger.auth('LOGIN_FAILED', username, null, clientIP);

            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        logger.error('Login error', err, { username, ip: clientIP });
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify token
app.post('/api/auth/verify', (req, res) => {
    const { token } = req.body;
    const clientIP = req.ip;

    if (!token) {
        logger.auth('TOKEN_VERIFY_NO_TOKEN', null, null, clientIP);
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Don't log successful token verification to reduce log spam
        res.json({ valid: true, userId: decoded.userId, username: decoded.username });
    } catch (err) {
        logger.auth('TOKEN_VERIFY_FAILED', null, null, clientIP);
        logger.error('Token verification error', err, { ip: clientIP });
        res.status(401).json({ message: 'Invalid token' });
    }
});

// WebAuthn Registration Start
app.post('/api/auth/webauthn/register-start', async (req, res) => {
    const { username } = req.body;
    const clientIP = req.ip;

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
            logger.security('WEBAUTHN_REGISTRATION_USER_NOT_FOUND', { username }, clientIP);
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

        logger.auth('WEBAUTHN_REGISTRATION_START', user.username, user.user_id, clientIP);
        console.log('Registration options generated successfully');
        res.json(options);
    } catch (error) {
        logger.error('WebAuthn registration start error', error, { username, ip: clientIP });
        res.status(500).json({ message: 'Failed to start registration', error: error.message });
    }
});

// WebAuthn Registration Finish
app.post('/api/auth/webauthn/register-finish', async (req, res) => {
    const { username, credential } = req.body;
    const clientIP = req.ip;

    console.log('WebAuthn registration finish for user:', username);
    console.log('Credential received:', !!credential);

    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            logger.security('WEBAUTHN_REGISTRATION_FINISH_USER_NOT_FOUND', { username }, clientIP);
            console.log('User not found during finish:', username);
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];
        console.log('Found user for finish:', user);

        const expectedChallenge = global.webauthnChallenges?.[user.user_id];
        console.log('Expected challenge:', !!expectedChallenge);
        if (!expectedChallenge) {
            logger.security('WEBAUTHN_REGISTRATION_NO_CHALLENGE', { userId: user.user_id }, clientIP);
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
            logger.security('WEBAUTHN_REGISTRATION_VERIFICATION_FAILED', { username }, clientIP);
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

        logger.auth('WEBAUTHN_REGISTRATION_SUCCESS', user.username, user.user_id, clientIP);
        res.json({ success: true, message: 'Biometric registration successful' });
    } catch (error) {
        logger.error('WebAuthn registration finish error', error, { username, ip: clientIP });
        res.status(500).json({ message: 'Failed to complete registration', error: error.message });
    }
});

// WebAuthn Authentication Start
app.post('/api/auth/webauthn/login-start', async (req, res) => {
    const { username } = req.body;
    const clientIP = req.ip;

    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            logger.security('WEBAUTHN_LOGIN_USER_NOT_FOUND', { username }, clientIP);
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        // Get user's credentials
        const credentialsResult = await pool.query(
            'SELECT credential_id FROM user_webauthn_credentials WHERE user_id = $1',
            [user.user_id]
        );

        if (credentialsResult.rows.length === 0) {
            logger.security('WEBAUTHN_LOGIN_NO_CREDENTIALS', { username }, clientIP);
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

        logger.auth('WEBAUTHN_LOGIN_START', username, user.user_id, clientIP);
        res.json(options);
    } catch (error) {
        logger.error('WebAuthn login start error', error, { username, ip: clientIP });
        res.status(500).json({ message: 'Failed to start authentication' });
    }
});

// WebAuthn Authentication Finish
app.post('/api/auth/webauthn/login-finish', async (req, res) => {
    const { username, credential } = req.body;
    const clientIP = req.ip;

    try {
        // Get user
        const userResult = await pool.query(
            'SELECT user_id, username FROM users WHERE username = $1 AND is_active = $2',
            [username, 'Y']
        );
        if (userResult.rows.length === 0) {
            logger.security('WEBAUTHN_LOGIN_FINISH_USER_NOT_FOUND', { username }, clientIP);
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        const expectedChallenge = global.webauthnChallenges?.[user.user_id];
        if (!expectedChallenge) {
            logger.security('WEBAUTHN_LOGIN_NO_CHALLENGE', { username, userId: user.user_id }, clientIP);
            return res.status(400).json({ message: 'No authentication in progress' });
        }

        // Get credential from database
        const credentialResult = await pool.query(
            'SELECT public_key, counter FROM user_webauthn_credentials WHERE credential_id = $1 AND user_id = $2',
            [credential.id, user.user_id]
        );

        if (credentialResult.rows.length === 0) {
            logger.security('WEBAUTHN_LOGIN_CREDENTIAL_NOT_FOUND', { username, credentialId: credential.id }, clientIP);
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
            logger.security('WEBAUTHN_LOGIN_VERIFICATION_FAILED', { username }, clientIP);
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

        logger.auth('WEBAUTHN_LOGIN_SUCCESS', user.username, user.user_id, clientIP);
        res.json({ user, token, message: 'Biometric authentication successful' });
    } catch (error) {
        logger.error('WebAuthn login finish error', error, { username, ip: clientIP });
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
        logger.error('Get credentials error', error, { userId: req.user?.id });
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
        logger.error('Delete credential error', error, { userId: req.user?.id, credentialId: req.params.id });
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
        const companyCode = getCompanyContext(req);

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM products WHERE comp_code = $1', [companyCode]);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM products WHERE comp_code = $1 ORDER BY prod_name LIMIT $2 OFFSET $3',
            [companyCode, limit, offset]
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
    const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code } = req.body;
    const companyCode = getCompanyContext(req);
    try {
        const result = await pool.query(
            'INSERT INTO products (prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code || 'GST5', companyCode, req.user?.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET prod_code=$1, prod_name=$2, category_code=$3, unit_price=$4, current_stock=$5, min_stock_level=$6, tax_code=$7, updated_by=$8 WHERE prod_id=$9 RETURNING *',
            [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code, req.user?.id, id]
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
        const companyCode = getCompanyContext(req);

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM customers WHERE comp_code = $1', [companyCode]);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const result = await pool.query(
            'SELECT * FROM customers WHERE comp_code = $1 ORDER BY cust_name LIMIT $2 OFFSET $3',
            [companyCode, limit, offset]
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
    const companyCode = getCompanyContext(req);
    try {
        const result = await pool.query(
            'INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [cust_code, cust_name, city, phone, credit_limit, outstanding_balance, companyCode, req.user?.id]
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
    const companyCode = getCompanyContext(req);
    try {
        const result = await pool.query(
            'INSERT INTO suppliers (supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, companyCode, req.user?.id]
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
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sub_total = items.reduce((acc, item) => acc + Number(item.line_total), 0);

        // Calculate tax based on product tax rates
        let totalTaxAmount = 0;
        for (const item of items) {
            const productResult = await client.query(
                'SELECT p.*, tr.tax_rate FROM products p LEFT JOIN tax_rates tr ON p.tax_code = tr.tax_code WHERE p.prod_code = $1 AND p.comp_code = $2',
                [item.prod_code, companyCode]
            );
            const product = productResult.rows[0];
            if (!product) {
                throw new Error(`Product ${item.prod_code} not found`);
            }
            // Use tax_rate from JOIN or fallback to product's tax_rate field or default 5%
            const taxRate = product.tax_rate || 5.00;
            const itemTax = item.line_total * (taxRate / 100);
            totalTaxAmount += itemTax;
        }

        const tax_amount = totalTaxAmount;
        const total_amount = sub_total + tax_amount;
        const balance_due = status === 'PAID' ? 0 : total_amount;
        const inv_number = `INV-${Date.now()}`;

        const invRes = await client.query(
            `INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, tax_amount, total_amount, balance_due, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING inv_id`,
            [inv_number, date, cust_code, companyCode, sub_total, tax_amount, total_amount, balance_due, req.user?.id]
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
                [date, 'SALES', `Cash Sale ${inv_number}`, total_amount, 0, companyCode, req.user?.id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Invoice created successfully', inv_id });
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Invoice creation error', e, {
            customerCode: cust_code,
            userId: req.user?.id,
            items: items?.length || 0
        });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Edit invoice
app.put('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    const { cust_code, items, inv_date, status } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get original invoice
        const originalInv = await client.query(
            'SELECT * FROM sales_invoices WHERE inv_id = $1',
            [id]
        );

        if (originalInv.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const oldInv = originalInv.rows[0];

        // Get original invoice items
        const originalItems = await client.query(
            'SELECT * FROM sales_invoice_items WHERE inv_id = $1',
            [id]
        );

        // Reverse stock changes for original items
        for (const item of originalItems.rows) {
            await client.query(
                `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                [item.quantity, item.prod_code]
            );
        }

        // Reverse customer balance if it was pending
        if (oldInv.balance_due > 0) {
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                [oldInv.total_amount, oldInv.cust_code]
            );
        }

        // Reverse cash transaction if it was paid
        if (oldInv.balance_due <= 0) {
            await client.query(
                `DELETE FROM cash_balance
                 WHERE trans_type = 'SALES'
                 AND description LIKE $1
                 AND trans_date = $2
                 AND debit_amount = $3`,
                [`Cash Sale ${oldInv.inv_number}%`, oldInv.inv_date, oldInv.total_amount]
            );
        }

        // Calculate new totals with dynamic tax rates
        const sub_total = items.reduce((acc, item) => acc + Number(item.line_total), 0);

        // Calculate tax based on product tax rates
        let totalTaxAmount = 0;
        for (const item of items) {
            const productResult = await client.query(
                'SELECT p.*, tr.tax_rate FROM products p LEFT JOIN tax_rates tr ON p.tax_code = tr.tax_code WHERE p.prod_code = $1',
                [item.prod_code]
            );
            const product = productResult.rows[0];
            if (!product) {
                throw new Error(`Product ${item.prod_code} not found`);
            }
            // Use tax_rate from JOIN or fallback to product's tax_rate field or default 5%
            const taxRate = product.tax_rate || 5.00;
            const itemTax = item.line_total * (taxRate / 100);
            totalTaxAmount += itemTax;
        }

        const tax_amount = totalTaxAmount;
        const total_amount = sub_total + tax_amount;
        const balance_due = status === 'PAID' ? 0 : total_amount;

        // Update invoice header
        const updateRes = await client.query(
            `UPDATE sales_invoices SET inv_date=$1, cust_code=$2, sub_total=$3, tax_amount=$4,
             total_amount=$5, balance_due=$6, updated_by=$7 WHERE inv_id=$8 RETURNING *`,
            [inv_date, cust_code, sub_total, tax_amount, total_amount, balance_due, req.user?.id, id]
        );

        // Delete old invoice items
        await client.query('DELETE FROM sales_invoice_items WHERE inv_id = $1', [id]);

        // Insert new invoice items and update stock
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, item.prod_code, item.quantity, item.unit_price, item.line_total]
            );
            await client.query(
                `UPDATE products SET current_stock = current_stock - $1 WHERE prod_code = $2`,
                [item.quantity, item.prod_code]
            );
        }

        // Update customer balance for new invoice
        if (status === 'PENDING') {
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                [total_amount, cust_code]
            );
        }

        // Create cash transaction if paid
        if (status === 'PAID') {
            await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [inv_date, 'SALES', `Cash Sale ${oldInv.inv_number}`, total_amount, 0, companyCode, req.user?.id]
            );
        }

        await client.query('COMMIT');
        res.json(updateRes.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Invoice update error', e, { invoiceId: id, userId: req.user?.id });
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
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const expRes = await client.query(
            `INSERT INTO expenses (head_code, amount, remarks, expense_date, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [head_code, amount, remarks, expense_date, companyCode, req.user?.id]
        );
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [expense_date, 'EXPENSE', `EXP: ${head_code} - ${remarks}`, 0, amount, companyCode, req.user?.id]
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
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const debit = type === 'RECEIPT' ? amount : 0;
        const credit = type === 'PAYMENT' ? amount : 0;

        const transRes = await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [date, type, `${type}: ${party_code} - ${remarks}`, debit, credit, companyCode, req.user?.id]
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

// Edit expense
app.put('/api/finance/expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { head_code, amount, remarks, expense_date } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get original expense to reverse the transaction
        const originalExpense = await client.query(
            'SELECT * FROM expenses WHERE expense_id = $1',
            [id]
        );

        if (originalExpense.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Expense not found' });
        }

        const oldExpense = originalExpense.rows[0];

        // Reverse the old cash transaction
        await client.query(
            `DELETE FROM cash_balance
             WHERE trans_type = 'EXPENSE'
             AND description LIKE $1
             AND trans_date = $2
             AND credit_amount = $3`,
            [`EXP: ${oldExpense.head_code}%`, oldExpense.expense_date, oldExpense.amount]
        );

        // Update the expense
        const updateRes = await client.query(
            `UPDATE expenses SET head_code=$1, amount=$2, remarks=$3, expense_date=$4, updated_by=$5
             WHERE expense_id=$6 RETURNING *`,
            [head_code, amount, remarks, expense_date, req.user?.id, id]
        );

        // Create new cash transaction
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [expense_date, 'EXPENSE', `EXP: ${head_code} - ${remarks}`, 0, amount, companyCode, req.user?.id]
        );

        await client.query('COMMIT');
        res.json(updateRes.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Expense update error', e, { expenseId: id, userId: req.user?.id });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Edit payment/receipt transaction
app.put('/api/finance/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { trans_type, party_code, amount, trans_date, description } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get original transaction
        const originalTrans = await client.query(
            'SELECT * FROM cash_balance WHERE trans_id = $1',
            [id]
        );

        if (originalTrans.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const oldTrans = originalTrans.rows[0];

        // Reverse the old transaction effects
        if (oldTrans.trans_type === 'RECEIPT') {
            // Reverse customer balance update
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                [oldTrans.debit_amount, oldTrans.description.split(': ')[1]?.split(' - ')[0]]
            );
        } else if (oldTrans.trans_type === 'PAYMENT') {
            // Reverse supplier balance update
            await client.query(
                `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
                [oldTrans.credit_amount, oldTrans.description.split(': ')[1]?.split(' - ')[0]]
            );
        }

        // Calculate new amounts
        const debit = trans_type === 'RECEIPT' ? amount : 0;
        const credit = trans_type === 'PAYMENT' ? amount : 0;

        // Update the transaction
        const updateRes = await client.query(
            `UPDATE cash_balance SET trans_date=$1, trans_type=$2, description=$3, debit_amount=$4, credit_amount=$5
             WHERE trans_id=$6 RETURNING *`,
            [trans_date, trans_type, description, debit, credit, id]
        );

        // Apply new transaction effects
        if (trans_type === 'RECEIPT') {
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                [amount, party_code]
            );
        } else if (trans_type === 'PAYMENT') {
            await client.query(
                `UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE supplier_code = $2`,
                [amount, party_code]
            );
        }

        await client.query('COMMIT');
        res.json(updateRes.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Transaction update error', e, { transactionId: id, userId: req.user?.id });
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
        logger.error('Dashboard metrics error', error, { userId: req.user?.id });
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
        logger.error('Sales trends error', error, { userId: req.user?.id });
        console.error('Sales trends error:', error);
        res.status(500).json({ error: 'Failed to fetch sales trends' });
    }
});

// --- NEW API ENDPOINTS FOR PHASE 3 ---

// Sales Returns
app.get('/api/sales-returns', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM sales_returns');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data with items
        const result = await pool.query(`
            SELECT sr.*,
            (SELECT json_agg(json_build_object('prod_code', sri.prod_code, 'quantity', sri.quantity, 'unit_price', sri.unit_price, 'line_total', sri.line_total, 'prod_name', p.prod_name))
             FROM sales_return_items sri
             JOIN products p ON sri.prod_code = p.prod_code
             WHERE sri.return_id = sr.return_id) as items
            FROM sales_returns sr
            ORDER BY sr.return_date DESC, sr.return_id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        logger.error('Sales returns fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sales-returns', async (req, res) => {
    const { inv_id, items, return_date } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get original invoice
        const invResult = await client.query(
            'SELECT * FROM sales_invoices WHERE inv_id = $1',
            [inv_id]
        );

        if (invResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = invResult.rows[0];
        const totalAmount = items.reduce((acc, item) => acc + Number(item.line_total), 0);
        const returnNumber = `RTN-${Date.now()}`;

        // Create sales return
        const companyCode = getCompanyContext(req);
        const returnResult = await client.query(
            `INSERT INTO sales_returns (return_number, return_date, inv_id, cust_code, total_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [returnNumber, return_date, inv_id, invoice.cust_code, totalAmount, companyCode, req.user?.id]
        );

        const returnId = returnResult.rows[0].return_id;

        // Add return items and restore stock
        for (const item of items) {
            await client.query(
                `INSERT INTO sales_return_items (return_id, prod_code, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [returnId, item.prod_code, item.quantity, item.unit_price, item.line_total]
            );

            // Restore stock
            await client.query(
                `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                [item.quantity, item.prod_code]
            );
        }

        // Update customer balance (reduce outstanding)
        await client.query(
            `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
            [totalAmount, invoice.cust_code]
        );

        // Update invoice balance
        await client.query(
            `UPDATE sales_invoices SET balance_due = balance_due - $1 WHERE inv_id = $2`,
            [totalAmount, inv_id]
        );

        await client.query('COMMIT');
        res.json(returnResult.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Sales return creation error', e, { userId: req.user?.id, invoiceId: inv_id });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Purchase Invoices
app.get('/api/purchase-invoices', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM purchase_invoices');
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data with items
        const result = await pool.query(`
            SELECT pi.*,
            (SELECT json_agg(json_build_object('prod_code', pii.prod_code, 'quantity', pii.quantity, 'unit_price', pii.unit_price, 'line_total', pii.line_total, 'prod_name', p.prod_name))
             FROM purchase_invoice_items pii
             JOIN products p ON pii.prod_code = p.prod_code
             WHERE pii.purchase_id = pi.purchase_id) as items
            FROM purchase_invoices pi
            ORDER BY pi.purchase_date DESC, pi.purchase_id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        res.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        logger.error('Purchase invoices fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/purchase-invoices', async (req, res) => {
    const { supplier_code, items, purchase_date } = req.body;
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const totalAmount = items.reduce((acc, item) => acc + Number(item.line_total), 0);
        const purchaseNumber = `PUR-${Date.now()}`;

        // Create purchase invoice
        const purchaseResult = await client.query(
            `INSERT INTO purchase_invoices (purchase_number, purchase_date, supplier_code, total_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [purchaseNumber, purchase_date, supplier_code, totalAmount, companyCode, req.user?.id]
        );

        const purchaseId = purchaseResult.rows[0].purchase_id;

        // Add purchase items and increase stock
        for (const item of items) {
            await client.query(
                `INSERT INTO purchase_invoice_items (purchase_id, prod_code, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [purchaseId, item.prod_code, item.quantity, item.unit_price, item.line_total]
            );

            // Increase stock
            await client.query(
                `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                [item.quantity, item.prod_code]
            );
        }

        // Update supplier balance (increase outstanding)
        await client.query(
            `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
            [totalAmount, supplier_code]
        );

        await client.query('COMMIT');
        res.json(purchaseResult.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Purchase invoice creation error', e, { userId: req.user?.id, supplierCode: supplier_code });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Payment Receipts
app.get('/api/payment-receipts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM payment_receipts');
        const total = parseInt(countResult.rows[0].total);

        const result = await pool.query(
            'SELECT * FROM payment_receipts ORDER BY receipt_date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        logger.error('Payment receipts fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payment-receipts', async (req, res) => {
    const { cust_code, amount, payment_method, reference_number, receipt_date } = req.body;
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const receiptNumber = `REC-${Date.now()}`;

        const result = await client.query(
            `INSERT INTO payment_receipts (receipt_number, receipt_date, cust_code, amount, payment_method, reference_number, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [receiptNumber, receipt_date, cust_code, amount, payment_method, reference_number, companyCode, req.user?.id]
        );

        // Update customer balance
        await client.query(
            `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
            [amount, cust_code]
        );

        // Add to cash balance
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [receipt_date, 'RECEIPT', `Payment receipt ${receiptNumber}`, amount, 0, companyCode, req.user?.id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Payment receipt creation error', e, { userId: req.user?.id, customerCode: cust_code });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Supplier Payments
app.get('/api/supplier-payments', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM supplier_payments');
        const total = parseInt(countResult.rows[0].total);

        const result = await pool.query(
            'SELECT * FROM supplier_payments ORDER BY payment_date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        logger.error('Supplier payments fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/supplier-payments', async (req, res) => {
    const { supplier_code, amount, payment_method, reference_number, payment_date } = req.body;
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const paymentNumber = `PAY-${Date.now()}`;

        const result = await client.query(
            `INSERT INTO supplier_payments (payment_number, payment_date, supplier_code, amount, payment_method, reference_number, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [paymentNumber, payment_date, supplier_code, amount, payment_method, reference_number, companyCode, req.user?.id]
        );

        // Update supplier balance
        await client.query(
            `UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE supplier_code = $2`,
            [amount, supplier_code]
        );

        // Add to cash balance
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [payment_date, 'PAYMENT', `Supplier payment ${paymentNumber}`, 0, amount, companyCode, req.user?.id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Supplier payment creation error', e, { userId: req.user?.id, supplierCode: supplier_code });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Discount Vouchers
app.get('/api/discount-vouchers', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM discount_vouchers');
        const total = parseInt(countResult.rows[0].total);

        const result = await pool.query(
            'SELECT * FROM discount_vouchers ORDER BY voucher_date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        logger.error('Discount vouchers fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/discount-vouchers', async (req, res) => {
    const { cust_code, amount, reason, voucher_date } = req.body;
    const companyCode = getCompanyContext(req);

    try {
        const voucherNumber = `VOU-${Date.now()}`;

        const result = await pool.query(
            `INSERT INTO discount_vouchers (voucher_number, voucher_date, cust_code, amount, reason, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [voucherNumber, voucher_date, cust_code, amount, reason, companyCode, req.user?.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Discount voucher creation error', err, { userId: req.user?.id, customerCode: cust_code });
        res.status(500).json({ error: err.message });
    }
});

// Opening Cash Balance
app.get('/api/finance/opening-balance', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM opening_cash_balance WHERE status = $1 ORDER BY balance_date DESC LIMIT 1',
            ['OPEN']
        );

        res.json(result.rows[0] || null);
    } catch (err) {
        logger.error('Opening cash balance fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finance/opening-balance', async (req, res) => {
    const { balance_date, opening_amount, closing_amount } = req.body;
    const companyCode = getCompanyContext(req);

    try {
        // Close any existing open balance
        await pool.query(
            'UPDATE opening_cash_balance SET status = $1 WHERE status = $2 AND comp_code = $3',
            ['CLOSED', 'OPEN', companyCode]
        );

        const result = await pool.query(
            `INSERT INTO opening_cash_balance (balance_date, opening_amount, closing_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [balance_date, opening_amount, closing_amount || opening_amount, companyCode, req.user?.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Opening cash balance creation error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

// Loan Management
app.get('/api/finance/loans', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM loan_taken');
        const total = parseInt(countResult.rows[0].total);

        const result = await pool.query(
            'SELECT * FROM loan_taken ORDER BY loan_date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        logger.error('Loans fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finance/loans', async (req, res) => {
    const { loan_number, loan_date, amount, interest_rate, term_months, lender_name } = req.body;
    const companyCode = getCompanyContext(req);

    try {
        const result = await pool.query(
            `INSERT INTO loan_taken (loan_number, loan_date, amount, interest_rate, term_months, lender_name, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [loan_number, loan_date, amount, interest_rate, term_months, lender_name, companyCode, req.user?.id]
        );

        // Add to cash balance as incoming money
        await pool.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [loan_date, 'RECEIPT', `Loan from ${lender_name}`, amount, 0, companyCode, req.user?.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Loan creation error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

// Loan Returns
app.get('/api/finance/loans/:loanId/returns', async (req, res) => {
    const { loanId } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM loan_return WHERE loan_id = $1 ORDER BY return_date DESC',
            [loanId]
        );

        res.json(result.rows);
    } catch (err) {
        logger.error('Loan returns fetch error', err, { userId: req.user?.id, loanId });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finance/loan-returns', async (req, res) => {
    const { loan_id, return_date, amount, payment_method, reference_number } = req.body;
    const companyCode = getCompanyContext(req);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO loan_return (loan_id, return_date, amount, payment_method, reference_number, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [loan_id, return_date, amount, payment_method, reference_number, companyCode, req.user?.id]
        );

        // Add to cash balance as outgoing money
        await client.query(
            `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [return_date, 'PAYMENT', `Loan return payment`, 0, amount, companyCode, req.user?.id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Loan return creation error', e, { userId: req.user?.id, loanId: loan_id });
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Expense Heads
app.get('/api/finance/expense-heads', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expense_heads WHERE is_active = true ORDER BY head_name'
        );

        res.json(result.rows);
    } catch (err) {
        logger.error('Expense heads fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finance/expense-heads', async (req, res) => {
    const { head_code, head_name, description } = req.body;
    const companyCode = getCompanyContext(req);

    try {
        const result = await pool.query(
            `INSERT INTO expense_heads (head_code, head_name, description, comp_code)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [head_code, head_name, description, companyCode]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Expense head creation error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

// Tax Rates Management
app.get('/api/finance/tax-rates', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tax_rates WHERE is_active = true ORDER BY tax_name'
        );

        res.json(result.rows);
    } catch (err) {
        logger.error('Tax rates fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/finance/tax-rates/:code', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tax_rates WHERE tax_code = $1',
            [req.params.code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tax rate not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Tax rate fetch error', err, { userId: req.user?.id, taxCode: req.params.code });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finance/tax-rates', async (req, res) => {
    const { tax_code, tax_name, tax_rate, tax_type, description } = req.body;
    const companyCode = getCompanyContext(req);

    try {
        const result = await pool.query(
            `INSERT INTO tax_rates (tax_code, tax_name, tax_rate, tax_type, description, comp_code)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [tax_code, tax_name, tax_rate, tax_type || 'GST', description, companyCode]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Tax rate creation error', err, { userId: req.user?.id, taxCode: tax_code });
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/finance/tax-rates/:code', async (req, res) => {
    const { tax_name, tax_rate, tax_type, description, is_active } = req.body;

    try {
        const result = await pool.query(
            `UPDATE tax_rates SET tax_name=$1, tax_rate=$2, tax_type=$3, description=$4, is_active=$5, updated_at=CURRENT_TIMESTAMP
             WHERE tax_code=$6 RETURNING *`,
            [tax_name, tax_rate, tax_type, description, is_active, req.params.code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tax rate not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Tax rate update error', err, { userId: req.user?.id, taxCode: req.params.code });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/finance/tax-rates/:code', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE tax_rates SET is_active = false WHERE tax_code = $1',
            [req.params.code]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tax rate not found' });
        }

        res.json({ message: 'Tax rate deactivated successfully' });
    } catch (err) {
        logger.error('Tax rate deletion error', err, { userId: req.user?.id, taxCode: req.params.code });
        res.status(500).json({ error: err.message });
    }
});

// Company Management
app.get('/api/companies', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM companies ORDER BY comp_name'
        );

        res.json(result.rows);
    } catch (err) {
        logger.error('Companies fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/:code', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM companies WHERE comp_code = $1',
            [req.params.code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Company fetch error', err, { userId: req.user?.id, compCode: req.params.code });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/companies', async (req, res) => {
    const { comp_code, comp_name, address, phone, email, gstin, pan_number, tax_registration } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO companies (comp_code, comp_name, address, phone, email, gstin, pan_number, tax_registration)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [comp_code, comp_name, address, phone, email, gstin, pan_number, tax_registration]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Company creation error', err, { userId: req.user?.id, compCode: comp_code });
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/companies/:code', async (req, res) => {
    const { comp_name, address, phone, email, gstin, pan_number, tax_registration } = req.body;

    try {
        const result = await pool.query(
            `UPDATE companies SET comp_name=$1, address=$2, phone=$3, email=$4, gstin=$5, pan_number=$6, tax_registration=$7
             WHERE comp_code=$8 RETURNING *`,
            [comp_name, address, phone, email, gstin, pan_number, tax_registration, req.params.code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Company update error', err, { userId: req.user?.id, compCode: req.params.code });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/companies/:code', async (req, res) => {
    try {
        // Check if company has dependent records
        const dependentTables = [
            'products', 'customers', 'suppliers', 'sales_invoices',
            'expenses', 'cash_balance', 'users'
        ];

        for (const table of dependentTables) {
            const countResult = await pool.query(
                `SELECT COUNT(*) as count FROM ${table} WHERE comp_code = $1`,
                [req.params.code]
            );

            if (parseInt(countResult.rows[0].count) > 0) {
                return res.status(400).json({
                    message: `Cannot delete company. It has ${countResult.rows[0].count} records in ${table}.`
                });
            }
        }

        const result = await pool.query(
            'DELETE FROM companies WHERE comp_code = $1',
            [req.params.code]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        logger.error('Company deletion error', err, { userId: req.user?.id, compCode: req.params.code });
        res.status(500).json({ error: err.message });
    }
});

// System Backups
app.get('/api/system/backups', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM system_backups ORDER BY backup_date DESC'
        );

        res.json(result.rows);
    } catch (err) {
        logger.error('System backups fetch error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/system/backups', async (req, res) => {
    const { backup_type, file_path, file_size } = req.body;
    const companyCode = getCompanyContext(req);

    try {
        const result = await pool.query(
            `INSERT INTO system_backups (backup_type, file_path, file_size, comp_code, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [backup_type, file_path, file_size, companyCode, req.user?.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('System backup creation error', err, { userId: req.user?.id });
        res.status(500).json({ error: err.message });
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
