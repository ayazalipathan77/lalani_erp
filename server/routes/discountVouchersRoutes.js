export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

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
};