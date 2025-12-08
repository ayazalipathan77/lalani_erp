export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Products
    app.get('/api/products', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const companyCode = getCompanyContext(req);

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM products WHERE comp_code = $1', [companyCode]);
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            const result = await pool.query(
                'SELECT * FROM products WHERE comp_code = $1 ORDER BY prod_name LIMIT $2 OFFSET $3',
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
            logger.error('Products fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/products', async (req, res) => {
        const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code } = req.body;
        const companyCode = getCompanyContext(req);
        try {
            const result = await pool.query(
                'INSERT INTO products (prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code || 'GST5', companyCode, req.user?.id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Product creation error', err, { userId: req.user?.id, prodCode: prod_code });
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/products/:id', async (req, res) => {
        const { id } = req.params;
        const { prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code } = req.body;
        try {
            const result = await pool.query(
                'UPDATE products SET prod_code=$1, prod_name=$2, category_code=$3, unit_price=$4, current_stock=$5, min_stock_level=$6, tax_code=$7, updated_by=$8 WHERE prod_id=$9 RETURNING *',
                [prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level, tax_code, req.user?.id, id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Product update error', err, { userId: req.user?.id, prodId: id });
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/products/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM products WHERE prod_id = $1', [req.params.id]);
            res.json({ message: 'Product deleted' });
        } catch (err) {
            logger.error('Product deletion error', err, { userId: req.user?.id, prodId: req.params.id });
            res.status(500).json({ error: err.message });
        }
    });
};