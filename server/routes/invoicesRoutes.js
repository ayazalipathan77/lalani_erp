export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Invoices
    app.get('/api/invoices', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM sales_invoices');
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            const result = await pool.query(`
                SELECT i.*,
                (SELECT json_agg(
                    json_build_object(
                        'prod_code', it.prod_code,
                        'quantity', it.quantity,
                        'unit_price', it.unit_price,
                        'discount_rate', COALESCE(it.discount_rate, 0),
                        'discount_amount', COALESCE(it.discount_amount, 0),
                        'tax_rate', COALESCE(it.tax_rate, 5.00),
                        'tax_amount', COALESCE(it.tax_amount, 0),
                        'net_amount', COALESCE(it.net_amount, it.line_total),
                        'line_total', it.line_total,
                        'prod_name', p.prod_name
                    )
                )
                 FROM sales_invoice_items it
                 JOIN products p ON it.prod_code = p.prod_code
                 WHERE it.inv_id = i.inv_id) as items
                FROM sales_invoices i
                ORDER BY i.inv_date DESC, i.inv_id DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            const invoices = result.rows.map(inv => ({
                ...inv,
                discount_amount: inv.discount_amount || 0,
                tax_amount: inv.tax_amount || 0,
                sub_total: inv.sub_total || inv.total_amount, // For old invoices without sub_total
                status: Number(inv.balance_due) <= 0 ? 'PAID' : (Number(inv.balance_due) < Number(inv.total_amount) ? 'PARTIAL' : 'PENDING')
            }));

            res.json({
                data: invoices,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            logger.error('Invoices fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/invoices', async (req, res) => {
        const { cust_code, items, date, status } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get customer discount rate
            const customerResult = await client.query(
                'SELECT discount_rate FROM customers WHERE cust_code = $1 AND comp_code = $2',
                [cust_code, companyCode]
            );
            const customerDiscountRate = customerResult.rows[0]?.discount_rate || 0;

            let sub_total = 0;
            let totalDiscountAmount = 0;
            let totalTaxAmount = 0;
            let totalNetAmount = 0;

            // Process each item with per-item discount and tax
            for (const item of items) {
                const productResult = await client.query(
                    'SELECT p.*, tr.tax_rate FROM products p LEFT JOIN tax_rates tr ON p.tax_code = tr.tax_code WHERE p.prod_code = $1 AND p.comp_code = $2',
                    [item.prod_code, companyCode]
                );
                const product = productResult.rows[0];
                if (!product) {
                    throw new Error(`Product ${item.prod_code} not found`);
                }

                const lineTotal = Number(item.line_total);
                const discountAmount = lineTotal * (customerDiscountRate / 100);
                const amountAfterDiscount = lineTotal - discountAmount;

                // Use tax_rate from JOIN or fallback to product's tax_rate field or default 5%
                const taxRate = product.tax_rate || 5.00;
                const taxAmount = amountAfterDiscount * (taxRate / 100);
                const netAmount = amountAfterDiscount + taxAmount;

                sub_total += lineTotal;
                totalDiscountAmount += discountAmount;
                totalTaxAmount += taxAmount;
                totalNetAmount += netAmount;
            }

            const balance_due = status === 'PAID' ? 0 : totalNetAmount;
            const inv_number = `INV-${Date.now()}`;

            const invRes = await client.query(
                `INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, discount_amount, tax_amount, total_amount, balance_due, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING inv_id`,
                [inv_number, date, cust_code, companyCode, sub_total, totalDiscountAmount, totalTaxAmount, totalNetAmount, balance_due, req.user?.id]
            );
            const inv_id = invRes.rows[0].inv_id;

            for (const item of items) {
                await client.query(
                    `INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, discount_rate, discount_amount, tax_rate, tax_amount, net_amount, line_total)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [inv_id, item.prod_code, item.quantity, item.unit_price, item.discount_rate || 0, item.discount_amount || 0, item.tax_rate || 0, item.tax_amount || 0, item.net_amount || 0, item.line_total]
                );
                await client.query(
                    `UPDATE products SET current_stock = current_stock - $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            if (status === 'PENDING') {
                await client.query(
                    `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                    [totalNetAmount, cust_code]
                );
            }

            if (status === 'PAID') {
                await client.query(
                    `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [date, 'SALES', `Cash Sale ${inv_number}`, totalNetAmount, 0, companyCode, req.user?.id]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Invoice created successfully', inv_id });
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Invoice creation error', e, {
                customerCode: cust_code,
                userId: req.user?.id,
                items: items?.length || 0
            });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Edit invoice
    app.put('/api/invoices/:id', async (req, res) => {
        const { id } = req.params;
        const { cust_code, items, inv_date, status } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get original invoice
            const originalInv = await client.query(
                'SELECT * FROM sales_invoices WHERE inv_id = $1',
                [id]
            );

            if (originalInv.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Invoice not found' });
            }

            const oldInv = originalInv.rows[0];

            // Get original invoice items
            const originalItems = await client.query(
                'SELECT * FROM sales_invoice_items WHERE inv_id = $1',
                [id]
            );

            // Reverse stock changes for original items
            for (const item of originalItems.rows) {
                await client.query(
                    `UPDATE products SET current_stock = current_stock + $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Reverse customer balance if it was pending
            if (oldInv.balance_due > 0) {
                await client.query(
                    `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                    [oldInv.total_amount, oldInv.cust_code]
                );
            }

            // Reverse cash transaction if it was paid
            if (oldInv.balance_due <= 0) {
                await client.query(
                    `DELETE FROM cash_balance
                     WHERE trans_type = 'SALES'
                     AND description LIKE $1
                     AND trans_date = $2
                     AND debit_amount = $3`,
                    [`Cash Sale ${oldInv.inv_number}%`, oldInv.inv_date, oldInv.total_amount]
                );
            }

            // Get customer discount rate
            const customerResult = await client.query(
                'SELECT discount_rate FROM customers WHERE cust_code = $1 AND comp_code = $2',
                [cust_code, companyCode]
            );
            const customerDiscountRate = customerResult.rows[0]?.discount_rate || 0;

            let sub_total = 0;
            let totalDiscountAmount = 0;
            let totalTaxAmount = 0;
            let totalNetAmount = 0;

            // Process each item with per-item discount and tax
            for (const item of items) {
                // Validate item data
                if (!item.prod_code || !item.quantity || !item.unit_price || !item.line_total) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: 'All item fields are required: prod_code, quantity, unit_price, line_total' });
                }

                if (item.quantity <= 0 || item.unit_price < 0 || item.line_total < 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: 'Invalid item values: quantity must be positive, prices cannot be negative' });
                }

                // Validate line total calculation
                const expectedLineTotal = item.quantity * item.unit_price;
                if (Math.abs(item.line_total - expectedLineTotal) > 0.01) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: `Invalid line total for product ${item.prod_code}` });
                }

                const productResult = await client.query(
                    'SELECT p.*, tr.tax_rate FROM products p LEFT JOIN tax_rates tr ON p.tax_code = tr.tax_code WHERE p.prod_code = $1 AND p.comp_code = $2',
                    [item.prod_code, companyCode]
                );
                const product = productResult.rows[0];
                if (!product) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: `Product ${item.prod_code} not found` });
                }

                // Business rule: Check stock availability for new items
                const currentStock = product.current_stock + (originalItems.rows.find(orig => orig.prod_code === item.prod_code)?.quantity || 0);
                if (currentStock < item.quantity) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        message: `Insufficient stock for product ${item.prod_code}. Available: ${currentStock}, Requested: ${item.quantity}`
                    });
                }

                const lineTotal = Number(item.line_total);
                const discountAmount = lineTotal * (customerDiscountRate / 100);
                const amountAfterDiscount = lineTotal - discountAmount;

                // Use tax_rate from JOIN or fallback to product's tax_rate field or default 5%
                const taxRate = product.tax_rate || 5.00;
                const taxAmount = amountAfterDiscount * (taxRate / 100);
                const netAmount = amountAfterDiscount + taxAmount;

                sub_total += lineTotal;
                totalDiscountAmount += discountAmount;
                totalTaxAmount += taxAmount;
                totalNetAmount += netAmount;
            }

            const balance_due = status === 'PAID' ? 0 : totalNetAmount;

            // Update invoice header
            const updateRes = await client.query(
                `UPDATE sales_invoices SET inv_date=$1, cust_code=$2, sub_total=$3, discount_amount=$4, tax_amount=$5,
                 total_amount=$6, balance_due=$7, updated_by=$8 WHERE inv_id=$9 RETURNING *`,
                [inv_date, cust_code, sub_total, totalDiscountAmount, totalTaxAmount, totalNetAmount, balance_due, req.user?.id, id]
            );

            // Delete old invoice items
            await client.query('DELETE FROM sales_invoice_items WHERE inv_id = $1', [id]);

            // Insert new invoice items and update stock
            for (const item of items) {
                const lineTotal = Number(item.line_total);
                const discountAmount = lineTotal * (customerDiscountRate / 100);
                const amountAfterDiscount = lineTotal - discountAmount;

                const productResult = await client.query(
                    'SELECT p.*, tr.tax_rate FROM products p LEFT JOIN tax_rates tr ON p.tax_code = tr.tax_code WHERE p.prod_code = $1 AND p.comp_code = $2',
                    [item.prod_code, companyCode]
                );
                const product = productResult.rows[0];
                const taxRate = product.tax_rate || 5.00;
                const taxAmount = amountAfterDiscount * (taxRate / 100);
                const netAmount = amountAfterDiscount + taxAmount;

                await client.query(
                    `INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, discount_rate, discount_amount, tax_rate, tax_amount, net_amount, line_total)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [id, item.prod_code, item.quantity, item.unit_price, customerDiscountRate, discountAmount, taxRate, taxAmount, netAmount, item.line_total]
                );
                await client.query(
                    `UPDATE products SET current_stock = current_stock - $1 WHERE prod_code = $2`,
                    [item.quantity, item.prod_code]
                );
            }

            // Update customer balance for new invoice with credit limit validation
            if (status === 'PENDING') {
                // Check customer's credit limit
                const customerResult = await client.query(
                    'SELECT outstanding_balance, credit_limit FROM customers WHERE cust_code = $1 AND comp_code = $2',
                    [cust_code, companyCode]
                );

                if (customerResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: 'Customer not found' });
                }

                const customer = customerResult.rows[0];
                const newOutstandingBalance = customer.outstanding_balance + total_amount;

                if (customer.credit_limit > 0 && newOutstandingBalance > customer.credit_limit) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        message: `Invoice amount exceeds customer's credit limit. Current balance: ${customer.outstanding_balance}, Credit limit: ${customer.credit_limit}, New total: ${newOutstandingBalance}`
                    });
                }

                await client.query(
                    `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                    [total_amount, cust_code]
                );
            }

            // Create cash transaction if paid
            if (status === 'PAID') {
                await client.query(
                    `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [inv_date, 'SALES', `Cash Sale ${oldInv.inv_number}`, total_amount, 0, companyCode, req.user?.id]
                );
            }

            await client.query('COMMIT');
            res.json(updateRes.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Invoice update error', e, { invoiceId: id, userId: req.user?.id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });
};