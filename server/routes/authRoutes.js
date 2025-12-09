import jwt from 'jsonwebtoken';
import logger from '../../logger.js';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';

export default (app, pool, WEBAUTHN_RP_NAME, WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN) => {
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

                // Ensure permissions is an array (handle null/undefined)
                if (!user.permissions) {
                    user.permissions = [];
                }

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

            // Get full user data including permissions
            const fullUserResult = await pool.query(
                'SELECT user_id, username, full_name, role, permissions, default_company FROM users WHERE user_id = $1',
                [user.user_id]
            );

            if (fullUserResult.rows.length === 0) {
                logger.security('WEBAUTHN_LOGIN_USER_DATA_NOT_FOUND', { username }, clientIP);
                return res.status(500).json({ message: 'User data retrieval failed' });
            }

            const fullUser = fullUserResult.rows[0];

            // Ensure permissions is an array
            if (!fullUser.permissions) {
                fullUser.permissions = [];
            }

            // Generate JWT token
            const token = jwt.sign({
                userId: fullUser.user_id,
                username: fullUser.username,
                selectedCompany: fullUser.default_company || 'CMP01'
            }, process.env.JWT_SECRET, { expiresIn: '24h' });

            logger.auth('WEBAUTHN_LOGIN_SUCCESS', fullUser.username, fullUser.user_id, clientIP);
            res.json({ user: fullUser, token, message: 'Biometric authentication successful' });
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
};