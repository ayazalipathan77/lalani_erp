export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

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
};