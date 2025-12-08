export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

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
        } catch (err) {
            logger.error('Customers fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
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
        } catch (err) {
            logger.error('Customer creation error', err, { userId: req.user?.id, custCode: cust_code });
            res.status(500).json({ error: err.message });
        }
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
        } catch (err) {
            logger.error('Customer update error', err, { userId: req.user?.id, custId: id });
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/customers/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM customers WHERE cust_id=$1', [req.params.id]);
            res.json({ message: 'Deleted' });
        } catch (err) {
            logger.error('Customer deletion error', err, { userId: req.user?.id, custId: req.params.id });
            res.status(500).json({ error: err.message });
        }
    });
};