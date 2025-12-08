export default (app, pool, logger) => {
    // Sales Returns
    app.get('/api/sales-returns', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM sales_returns');
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data with items
            const result = await pool.query(`
                SELECT sr.*,
                (SELECT json_agg(json_build_object('prod_code', sri.prod_code, 'quantity', sri.quantity, 'unit_price', sri.unit_price, 'line_total', sri.line_total, 'prod_name', p.prod_name))
                 FROM sales_return_items sri
                 JOIN products p ON sri.prod_code = p.prod_code
                 WHERE sri.return_id = sr.return_id) as items
                FROM sales_returns sr
                ORDER BY sr.return_date DESC, sr.return_id DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

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
            logger.error('Sales returns fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/sales-returns', async (req, res) => {
        const { inv_id, items, return_date } = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get original invoice
            const invResult = await client.query(
                'SELECT * FROM sales_invoices WHERE inv_id = $1',
                [inv_id]
            );

            if (invResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Invoice not found' });
            }

            const invoice = invResult.rows[0];
            const totalAmount = items.reduce((acc, item) => acc + Number(item.line_total), 0);
            const returnNumber = `RTN-${Date.now()}`;

            // Create sales return
            const companyCode = req.headers['x-company-code'] ||
                req.user?.selectedCompany ||
                'CMP01';
            const returnResult = await client.query(
                `INSERT INTO sales_returns (return_number, return_date, inv_id, cust_code, total_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [returnNumber, return_date, inv_id, invoice.cust_code, totalAmount, companyCode, req.user?.id]
            );

            const returnId = returnResult.rows[0].return_id;

            // Add return items and restore stock
            for (const item of items) {
                await client.query(
                    `INSERT INTO sales_return_items (return_id, prod_code, quantity, unit_price, line_total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [returnId, item.prod_code, item.quantity, item.unit_price, item.line_total]
                );

                // Restore stock
                await client.query(
                    `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Update customer balance (reduce outstanding)
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                [totalAmount, invoice.cust_code]
            );

            // Update invoice balance
            await client.query(
                `UPDATE sales_invoices SET balance_due = balance_due - $1 WHERE inv_id = $2`,
                [totalAmount, inv_id]
            );

            await client.query('COMMIT');
            res.json(returnResult.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Sales return creation error', e, { userId: req.user?.id, invoiceId: inv_id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Update Sales Return
    app.put('/api/sales-returns/:id', async (req, res) => {
        const { id } = req.params;
        const { inv_id, items, return_date } = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get original return
            const originalReturn = await client.query(
                'SELECT * FROM sales_returns WHERE return_id = $1',
                [id]
            );

            if (originalReturn.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Sales return not found' });
            }

            const oldReturn = originalReturn.rows[0];

            // Get original return items
            const originalItems = await client.query(
                'SELECT * FROM sales_return_items WHERE return_id = $1',
                [id]
            );

            // Reverse stock changes for original items
            for (const item of originalItems.rows) {
                await client.query(
                    `UPDATE products SET current_stock = current_stock - $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Reverse customer balance adjustment
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                [oldReturn.total_amount, oldReturn.cust_code]
            );

            // Reverse invoice balance adjustment
            await client.query(
                `UPDATE sales_invoices SET balance_due = balance_due + $1 WHERE inv_id = $2`,
                [oldReturn.total_amount, oldReturn.inv_id]
            );

            // Get new invoice details
            const invResult = await client.query(
                'SELECT * FROM sales_invoices WHERE inv_id = $1',
                [inv_id]
            );

            if (invResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Invoice not found' });
            }

            const invoice = invResult.rows[0];
            const totalAmount = items.reduce((acc, item) => acc + Number(item.line_total), 0);

            // Update sales return
            const updateResult = await client.query(
                `UPDATE sales_returns SET inv_id=$1, cust_code=$2, total_amount=$3, return_date=$4, updated_by=$5
                 WHERE return_id=$6 RETURNING *`,
                [inv_id, invoice.cust_code, totalAmount, return_date, req.user?.id, id]
            );

            // Delete old return items
            await client.query('DELETE FROM sales_return_items WHERE return_id = $1', [id]);

            // Add new return items and restore stock
            for (const item of items) {
                await client.query(
                    `INSERT INTO sales_return_items (return_id, prod_code, quantity, unit_price, line_total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, item.prod_code, item.quantity, item.unit_price, item.line_total]
                );

                // Restore stock
                await client.query(
                    `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Update customer balance (reduce outstanding)
            await client.query(
                `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                [totalAmount, invoice.cust_code]
            );

            // Update invoice balance
            await client.query(
                `UPDATE sales_invoices SET balance_due = balance_due - $1 WHERE inv_id = $2`,
                [totalAmount, inv_id]
            );

            await client.query('COMMIT');
            res.json(updateResult.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Sales return update error', e, { returnId: id, userId: req.user?.id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });
};