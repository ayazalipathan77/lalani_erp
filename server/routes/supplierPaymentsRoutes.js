export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

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
};