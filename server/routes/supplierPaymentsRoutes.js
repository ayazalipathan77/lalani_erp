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

    app.put('/api/supplier-payments/:id', async (req, res) => {
        const { id } = req.params;
        const { supplier_code, amount, payment_method, reference_number, payment_date } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Debug: Check if updated_by and updated_at columns exist
            const columnCheck = await client.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'supplier_payments' AND column_name IN ('updated_by', 'updated_at')
            `);
            logger.info('Supplier payments table columns check', {
                existingColumns: columnCheck.rows.map(r => r.column_name),
                userId: req.user?.id,
                paymentId: id
            });

            // Get the original payment to calculate balance adjustment
            const originalResult = await client.query(
                'SELECT * FROM supplier_payments WHERE payment_id = $1 AND comp_code = $2',
                [id, companyCode]
            );

            if (originalResult.rows.length === 0) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            const originalPayment = originalResult.rows[0];
            const balanceAdjustment = originalPayment.amount - amount;

            const result = await client.query(
                `UPDATE supplier_payments SET
                 supplier_code = $1, amount = $2, payment_method = $3, reference_number = $4, payment_date = $5, updated_by = $6, updated_at = CURRENT_TIMESTAMP
                 WHERE payment_id = $7 AND comp_code = $8 RETURNING *`,
                [supplier_code, amount, payment_method, reference_number, payment_date, req.user?.id, id, companyCode]
            );

            // Adjust supplier balance
            await client.query(
                `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
                [balanceAdjustment, supplier_code]
            );

            // Update cash balance - this is complex, might need to delete and reinsert or update
            // For simplicity, we'll delete the old transaction and create a new one
            await client.query(
                'DELETE FROM cash_balance WHERE description = $1 AND comp_code = $2',
                [`Supplier payment ${originalPayment.payment_number}`, companyCode]
            );

            await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [payment_date, 'PAYMENT', `Supplier payment ${originalPayment.payment_number}`, 0, amount, companyCode, req.user?.id]
            );

            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Supplier payment update error', e, { userId: req.user?.id, paymentId: id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });
};