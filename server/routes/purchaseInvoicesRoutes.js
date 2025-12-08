export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Purchase Invoices
    app.get('/api/purchase-invoices', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM purchase_invoices');
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data with items
            const result = await pool.query(`
                SELECT pi.*,
                (SELECT json_agg(json_build_object('prod_code', pii.prod_code, 'quantity', pii.quantity, 'unit_price', pii.unit_price, 'line_total', pii.line_total, 'prod_name', p.prod_name))
                 FROM purchase_invoice_items pii
                 JOIN products p ON pii.prod_code = p.prod_code
                 WHERE pii.purchase_id = pi.purchase_id) as items
                FROM purchase_invoices pi
                ORDER BY pi.purchase_date DESC, pi.purchase_id DESC
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
            logger.error('Purchase invoices fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/purchase-invoices', async (req, res) => {
        const { supplier_code, items, purchase_date } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const totalAmount = items.reduce((acc, item) => acc + Number(item.line_total), 0);
            const purchaseNumber = `PUR-${Date.now()}`;

            // Create purchase invoice
            const purchaseResult = await client.query(
                `INSERT INTO purchase_invoices (purchase_number, purchase_date, supplier_code, total_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [purchaseNumber, purchase_date, supplier_code, totalAmount, companyCode, req.user?.id]
            );

            const purchaseId = purchaseResult.rows[0].purchase_id;

            // Add purchase items and increase stock
            for (const item of items) {
                await client.query(
                    `INSERT INTO purchase_invoice_items (purchase_id, prod_code, quantity, unit_price, line_total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [purchaseId, item.prod_code, item.quantity, item.unit_price, item.line_total]
                );

                // Increase stock
                await client.query(
                    `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Update supplier balance (increase outstanding)
            await client.query(
                `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
                [totalAmount, supplier_code]
            );

            await client.query('COMMIT');
            res.json(purchaseResult.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Purchase invoice creation error', e, { userId: req.user?.id, supplierCode: supplier_code });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Update Purchase Invoice
    app.put('/api/purchase-invoices/:id', async (req, res) => {
        const { id } = req.params;
        const { supplier_code, items, purchase_date, status } = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get original purchase invoice
            const originalInv = await client.query(
                'SELECT * FROM purchase_invoices WHERE purchase_id = $1',
                [id]
            );

            if (originalInv.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Purchase invoice not found' });
            }

            const oldInv = originalInv.rows[0];

            // Get original purchase invoice items
            const originalItems = await client.query(
                'SELECT * FROM purchase_invoice_items WHERE purchase_id = $1',
                [id]
            );

            // Reverse stock changes for original items
            for (const item of originalItems.rows) {
                await client.query(
                    `UPDATE products SET current_stock = current_stock - $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Reverse supplier balance if it was different
            if (oldInv.supplier_code !== supplier_code) {
                await client.query(
                    `UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE supplier_code = $2`,
                    [oldInv.total_amount, oldInv.supplier_code]
                );
            }

            // Calculate new totals
            const totalAmount = items.reduce((acc, item) => acc + Number(item.line_total), 0);

            // Update purchase invoice header
            const updateRes = await client.query(
                `UPDATE purchase_invoices SET purchase_date=$1, supplier_code=$2, total_amount=$3, status=$4, updated_by=$5
                 WHERE purchase_id=$6 RETURNING *`,
                [purchase_date, supplier_code, totalAmount, status || 'PENDING', req.user?.id, id]
            );

            // Delete old purchase invoice items
            await client.query('DELETE FROM purchase_invoice_items WHERE purchase_id = $1', [id]);

            // Insert new purchase items and increase stock
            for (const item of items) {
                await client.query(
                    `INSERT INTO purchase_invoice_items (purchase_id, prod_code, quantity, unit_price, line_total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, item.prod_code, item.quantity, item.unit_price, item.line_total]
                );

                // Increase stock
                await client.query(
                    `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Update supplier balance for new invoice
            if (oldInv.supplier_code !== supplier_code) {
                await client.query(
                    `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
                    [totalAmount, supplier_code]
                );
            } else {
                // Update balance for same supplier (amount change)
                const balanceDiff = totalAmount - oldInv.total_amount;
                if (balanceDiff !== 0) {
                    await client.query(
                        `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
                        [balanceDiff, supplier_code]
                    );
                }
            }

            await client.query('COMMIT');
            res.json(updateRes.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Purchase invoice update error', e, { purchaseId: id, userId: req.user?.id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });
};