export default (app, pool, logger) => {
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
};