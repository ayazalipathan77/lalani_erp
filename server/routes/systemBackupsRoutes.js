import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default (app, pool, logger) => {
    // Admin role check middleware
    const requireAdmin = (req, res, next) => {
        if (!req.user || req.user.role !== 'ADMIN') {
            logger.security('UNAUTHORIZED_ACCESS_ATTEMPT', { userId: req.user?.id, endpoint: req.path });
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    };

    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // System Backups - List all backups (Admin only)
    app.get('/api/system/backups', requireAdmin, async (req, res) => {
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

    // Create new backup (Admin only)
    app.post('/api/system/backups/create', requireAdmin, async (req, res) => {
        const { backup_type = 'FULL' } = req.body;
        const companyCode = getCompanyContext(req);

        try {
            // Generate backup filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup_${backup_type.toLowerCase()}_${timestamp}.sql`;
            const filepath = path.join(process.cwd(), 'backups', filename);

            // Ensure backups directory exists
            if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
                fs.mkdirSync(path.join(process.cwd(), 'backups'), { recursive: true });
            }

            // Get database connection details
            const dbConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database.json'), 'utf8'));
            const config = process.env.NODE_ENV === 'production' ? dbConfig.production : dbConfig.dev;

            let pgDumpCommand;
            if (config.url) {
                // Production: use DATABASE_URL
                const dbUrl = process.env.DATABASE_URL;
                pgDumpCommand = `pg_dump "${dbUrl}" --no-owner --no-privileges --clean --if-exists --format=custom --compress=9 --file="${filepath}"`;
            } else {
                // Development: use individual connection params
                pgDumpCommand = `pg_dump --host=${config.host} --port=${config.port} --username=${config.user} --dbname=${config.database} --no-owner --no-privileges --clean --if-exists --format=custom --compress=9 --file="${filepath}"`;
                // Set PGPASSWORD environment variable
                process.env.PGPASSWORD = config.password;
            }

            logger.info('Starting database backup', { userId: req.user?.id, filename, type: backup_type });

            // Execute pg_dump
            await execAsync(pgDumpCommand);

            // Get file size
            const stats = fs.statSync(filepath);
            const fileSize = stats.size;

            // Record backup in database
            const result = await pool.query(
                `INSERT INTO system_backups (backup_type, file_path, file_size, comp_code, created_by, status)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [backup_type, filename, fileSize, companyCode, req.user?.id, 'COMPLETED']
            );

            logger.info('Database backup completed successfully', {
                userId: req.user?.id,
                backupId: result.rows[0].backup_id,
                filename,
                size: fileSize
            });

            res.json({
                ...result.rows[0],
                message: 'Backup created successfully'
            });

        } catch (err) {
            logger.error('System backup creation error', err, { userId: req.user?.id });
            res.status(500).json({ error: 'Failed to create backup: ' + err.message });
        } finally {
            // Clean up PGPASSWORD
            delete process.env.PGPASSWORD;
        }
    });

    // Download backup file (Admin only)
    app.get('/api/system/backups/download/:id', requireAdmin, async (req, res) => {
        const { id } = req.params;

        try {
            // Get backup details
            const backupResult = await pool.query(
                'SELECT * FROM system_backups WHERE backup_id = $1',
                [id]
            );

            if (backupResult.rows.length === 0) {
                return res.status(404).json({ error: 'Backup not found' });
            }

            const backup = backupResult.rows[0];
            const filepath = path.join(process.cwd(), 'backups', backup.file_path);

            // Check if backup file exists
            if (!fs.existsSync(filepath)) {
                return res.status(404).json({ error: 'Backup file not found on disk' });
            }

            logger.info('Backup file download initiated', {
                userId: req.user?.id,
                backupId: id,
                filename: backup.file_path
            });

            // Read and send the file
            const fileContent = fs.readFileSync(filepath);

            // Set headers for file download
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${backup.file_path}"`);
            res.setHeader('Content-Length', fileContent.length);

            // Send the file content
            res.send(fileContent);

        } catch (err) {
            logger.error('System backup download error', err, { userId: req.user?.id, backupId: id });
            res.status(500).json({ error: 'Failed to download backup: ' + err.message });
        }
    });

    // Restore from backup (Admin only)
    app.post('/api/system/backups/restore/:id', requireAdmin, async (req, res) => {
        const { id } = req.params;

        try {
            // Get backup details
            const backupResult = await pool.query(
                'SELECT * FROM system_backups WHERE backup_id = $1',
                [id]
            );

            if (backupResult.rows.length === 0) {
                return res.status(404).json({ error: 'Backup not found' });
            }

            const backup = backupResult.rows[0];
            const filepath = path.join(process.cwd(), 'backups', backup.file_path);

            // Check if backup file exists
            if (!fs.existsSync(filepath)) {
                return res.status(404).json({ error: 'Backup file not found on disk' });
            }

            logger.info('Starting database restore', {
                userId: req.user?.id,
                backupId: id,
                filename: backup.file_path
            });

            // Get database connection details
            const dbConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database.json'), 'utf8'));
            const config = process.env.NODE_ENV === 'production' ? dbConfig.production : dbConfig.dev;

            let psqlCommand;
            if (config.url) {
                // Production: use DATABASE_URL
                const dbUrl = process.env.DATABASE_URL;
                psqlCommand = `pg_restore --clean --if-exists --no-owner --no-privileges --dbname="${dbUrl}" "${filepath}"`;
            } else {
                // Development: use individual connection params
                psqlCommand = `pg_restore --clean --if-exists --no-owner --no-privileges --host=${config.host} --port=${config.port} --username=${config.user} --dbname=${config.database} "${filepath}"`;
                // Set PGPASSWORD environment variable
                process.env.PGPASSWORD = config.password;
            }

            // Execute pg_restore
            await execAsync(psqlCommand);

            // Update backup status to indicate it was used for restore
            await pool.query(
                'UPDATE system_backups SET status = $1 WHERE backup_id = $2',
                ['RESTORED', id]
            );

            logger.info('Database restore completed successfully', {
                userId: req.user?.id,
                backupId: id,
                filename: backup.file_path
            });

            res.json({
                message: 'Database restored successfully from backup',
                backup: backup
            });

        } catch (err) {
            logger.error('System backup restore error', err, { userId: req.user?.id, backupId: id });
            res.status(500).json({ error: 'Failed to restore backup: ' + err.message });
        } finally {
            // Clean up PGPASSWORD
            delete process.env.PGPASSWORD;
        }
    });

    // Legacy endpoint for recording backups (kept for compatibility)
    app.post('/api/system/backups', requireAdmin, async (req, res) => {
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
};