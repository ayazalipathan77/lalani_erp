export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

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
};