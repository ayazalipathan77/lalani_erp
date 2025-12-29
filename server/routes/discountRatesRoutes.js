export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Discount Rates
    app.get('/api/discount-rates', async (req, res) => {
        try {
            const companyCode = getCompanyContext(req);

            const result = await pool.query(
                'SELECT * FROM discount_rates WHERE comp_code = $1 ORDER BY discount_name',
                [companyCode]
            );

            res.json(result.rows);
        } catch (err) {
            logger.error('Discount rates fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/discount-rates', async (req, res) => {
        const { discount_code, discount_name, discount_rate, description, is_active } = req.body;
        const companyCode = getCompanyContext(req);
        try {
            const result = await pool.query(
                'INSERT INTO discount_rates (discount_code, discount_name, discount_rate, description, is_active, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [discount_code, discount_name, discount_rate, description, is_active !== false, companyCode, req.user?.id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Discount rate creation error', err, { userId: req.user?.id, discountCode: discount_code });
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/discount-rates/:id', async (req, res) => {
        const { id } = req.params;
        const { discount_code, discount_name, discount_rate, description, is_active } = req.body;
        const companyCode = getCompanyContext(req);

        try {
            // Validate input data
            if (!discount_code || !discount_name) {
                return res.status(400).json({ message: 'Discount code and name are required' });
            }

            if (discount_rate < 0 || discount_rate > 100) {
                return res.status(400).json({ message: 'Discount rate must be between 0 and 100' });
            }

            // Check if discount rate exists and belongs to company
            const existingRate = await pool.query(
                'SELECT * FROM discount_rates WHERE discount_id = $1 AND comp_code = $2',
                [id, companyCode]
            );

            if (existingRate.rows.length === 0) {
                return res.status(404).json({ message: 'Discount rate not found or access denied' });
            }

            const oldRate = existingRate.rows[0];

            // Business rule: Check for duplicate discount code (excluding current rate)
            if (discount_code !== oldRate.discount_code) {
                const duplicateCheck = await pool.query(
                    'SELECT discount_id FROM discount_rates WHERE discount_code = $1 AND comp_code = $2 AND discount_id != $3',
                    [discount_code, companyCode, id]
                );

                if (duplicateCheck.rows.length > 0) {
                    return res.status(400).json({ message: 'Discount code already exists' });
                }
            }

            const result = await pool.query(
                'UPDATE discount_rates SET discount_code=$1, discount_name=$2, discount_rate=$3, description=$4, is_active=$5, updated_by=$6 WHERE discount_id=$7 AND comp_code=$8 RETURNING *',
                [discount_code, discount_name, discount_rate, description, is_active !== false, req.user?.id, id, companyCode]
            );

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Discount rate update error', err, { userId: req.user?.id, discountId: id });
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/discount-rates/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM discount_rates WHERE discount_id=$1', [req.params.id]);
            res.json({ message: 'Discount rate deleted' });
        } catch (err) {
            logger.error('Discount rate deletion error', err, { userId: req.user?.id, discountId: req.params.id });
            res.status(500).json({ error: err.message });
        }
    });
};