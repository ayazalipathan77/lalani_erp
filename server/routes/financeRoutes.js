export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Finance - Transactions
    app.get('/api/finance/transactions', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM cash_balance');
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            const result = await pool.query(
                'SELECT * FROM cash_balance ORDER BY trans_date DESC, trans_id DESC LIMIT $1 OFFSET $2',
                [limit, offset]
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
            logger.error('Finance transactions fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/finance/expenses', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM expenses');
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            const result = await pool.query(
                'SELECT * FROM expenses ORDER BY expense_date DESC LIMIT $1 OFFSET $2',
                [limit, offset]
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
            logger.error('Finance expenses fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/finance/expenses', async (req, res) => {
        const { head_code, amount, remarks, expense_date } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const expRes = await client.query(
                `INSERT INTO expenses (head_code, amount, remarks, expense_date, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [head_code, amount, remarks, expense_date, companyCode, req.user?.id]
            );
            await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [expense_date, 'EXPENSE', `EXP: ${head_code} - ${remarks}`, 0, amount, companyCode, req.user?.id]
            );
            await client.query('COMMIT');
            res.json(expRes.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Finance expense creation error', e, { userId: req.user?.id, headCode: head_code });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    app.post('/api/finance/payment', async (req, res) => {
        const { type, party_code, amount, date, remarks } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const debit = type === 'RECEIPT' ? amount : 0;
            const credit = type === 'PAYMENT' ? amount : 0;

            const transRes = await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [date, type, `${type}: ${party_code} - ${remarks}`, debit, credit, companyCode, req.user?.id]
            );

            if (type === 'RECEIPT') {
                await client.query(
                    `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                    [amount, party_code]
                );
            } else {
                await client.query(
                    `UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE supplier_code = $2`,
                    [amount, party_code]
                );
            }
            await client.query('COMMIT');
            res.json(transRes.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Finance payment creation error', e, { userId: req.user?.id, type, partyCode: party_code });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Edit expense
    app.put('/api/finance/expenses/:id', async (req, res) => {
        const { id } = req.params;
        const { head_code, amount, remarks, expense_date } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Validate input data
            if (!head_code || !amount || !expense_date) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Head code, amount, and expense date are required' });
            }

            if (amount <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Expense amount must be greater than zero' });
            }

            // Validate expense date (not in future)
            const expenseDate = new Date(expense_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (expenseDate > today) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Expense date cannot be in the future' });
            }

            // Get original expense to reverse the transaction
            const originalExpense = await client.query(
                'SELECT * FROM expenses WHERE expense_id = $1 AND comp_code = $2',
                [id, companyCode]
            );

            if (originalExpense.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Expense not found or access denied' });
            }

            const oldExpense = originalExpense.rows[0];

            // Business rule: Check if expense is already reconciled/approved
            // This would need additional fields in the database, but for now we'll assume all expenses can be edited

            // Reverse the old cash transaction
            await client.query(
                `DELETE FROM cash_balance
                 WHERE trans_type = 'EXPENSE'
                 AND description LIKE $1
                 AND trans_date = $2
                 AND credit_amount = $3
                 AND comp_code = $4`,
                [`EXP: ${oldExpense.head_code}%`, oldExpense.expense_date, oldExpense.amount, companyCode]
            );

            // Update the expense
            const updateRes = await client.query(
                `UPDATE expenses SET head_code=$1, amount=$2, remarks=$3, expense_date=$4, updated_by=$5, updated_at=CURRENT_TIMESTAMP
                 WHERE expense_id=$6 AND comp_code=$7 RETURNING *`,
                [head_code, amount, remarks, expense_date, req.user?.id, id, companyCode]
            );

            // Create new cash transaction
            await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [expense_date, 'EXPENSE', `EXP: ${head_code} - ${remarks}`, 0, amount, companyCode, req.user?.id]
            );

            await client.query('COMMIT');
            res.json(updateRes.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Finance expense update error', e, { expenseId: id, userId: req.user?.id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Edit payment/receipt transaction
    app.put('/api/finance/transactions/:id', async (req, res) => {
        const { id } = req.params;
        const { trans_type, party_code, amount, trans_date, description } = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get original transaction
            const originalTrans = await client.query(
                'SELECT * FROM cash_balance WHERE trans_id = $1',
                [id]
            );

            if (originalTrans.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Transaction not found' });
            }

            const oldTrans = originalTrans.rows[0];

            // Reverse the old transaction effects
            if (oldTrans.trans_type === 'RECEIPT') {
                // Reverse customer balance update
                await client.query(
                    `UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE cust_code = $2`,
                    [oldTrans.debit_amount, oldTrans.description.split(': ')[1]?.split(' - ')[0]]
                );
            } else if (oldTrans.trans_type === 'PAYMENT') {
                // Reverse supplier balance update
                await client.query(
                    `UPDATE suppliers SET outstanding_balance = outstanding_balance + $1 WHERE supplier_code = $2`,
                    [oldTrans.credit_amount, oldTrans.description.split(': ')[1]?.split(' - ')[0]]
                );
            }

            // Calculate new amounts
            const debit = trans_type === 'RECEIPT' ? amount : 0;
            const credit = trans_type === 'PAYMENT' ? amount : 0;

            // Update the transaction
            const updateRes = await client.query(
                `UPDATE cash_balance SET trans_date=$1, trans_type=$2, description=$3, debit_amount=$4, credit_amount=$5
                 WHERE trans_id=$6 RETURNING *`,
                [trans_date, trans_type, description, debit, credit, id]
            );

            // Apply new transaction effects
            if (trans_type === 'RECEIPT') {
                await client.query(
                    `UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE cust_code = $2`,
                    [amount, party_code]
                );
            } else if (trans_type === 'PAYMENT') {
                await client.query(
                    `UPDATE suppliers SET outstanding_balance = outstanding_balance - $1 WHERE supplier_code = $2`,
                    [amount, party_code]
                );
            }

            await client.query('COMMIT');
            res.json(updateRes.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Finance transaction update error', e, { transactionId: id, userId: req.user?.id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Opening Cash Balance
    app.get('/api/finance/opening-balance', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM opening_cash_balance WHERE status = $1 ORDER BY balance_date DESC LIMIT 1',
                ['OPEN']
            );

            res.json(result.rows[0] || null);
        } catch (err) {
            logger.error('Opening cash balance fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/finance/opening-balance', async (req, res) => {
        const { balance_date, opening_amount, closing_amount } = req.body;
        const companyCode = getCompanyContext(req);

        try {
            // Close any existing open balance
            await pool.query(
                'UPDATE opening_cash_balance SET status = $1 WHERE status = $2 AND comp_code = $3',
                ['CLOSED', 'OPEN', companyCode]
            );

            const result = await pool.query(
                `INSERT INTO opening_cash_balance (balance_date, opening_amount, closing_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [balance_date, opening_amount, closing_amount || opening_amount, companyCode, req.user?.id]
            );

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Opening cash balance creation error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    // Loan Management
    app.get('/api/finance/loans', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const countResult = await pool.query('SELECT COUNT(*) as total FROM loan_taken');
            const total = parseInt(countResult.rows[0].total);

            const result = await pool.query(
                'SELECT * FROM loan_taken ORDER BY loan_date DESC LIMIT $1 OFFSET $2',
                [limit, offset]
            );

            res.json({
                data: result.rows,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            });
        } catch (err) {
            logger.error('Loans fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/finance/loans', async (req, res) => {
        const { loan_number, loan_date, amount, interest_rate, term_months, lender_name } = req.body;
        const companyCode = getCompanyContext(req);

        try {
            const result = await pool.query(
                `INSERT INTO loan_taken (loan_number, loan_date, amount, interest_rate, term_months, lender_name, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [loan_number, loan_date, amount, interest_rate, term_months, lender_name, companyCode, req.user?.id]
            );

            // Add to cash balance as incoming money
            await pool.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [loan_date, 'RECEIPT', `Loan from ${lender_name}`, amount, 0, companyCode, req.user?.id]
            );

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Loan creation error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/finance/loans/:loanId/returns', async (req, res) => {
        const { loanId } = req.params;

        try {
            const result = await pool.query(
                'SELECT * FROM loan_return WHERE loan_id = $1 ORDER BY return_date DESC',
                [loanId]
            );

            res.json(result.rows);
        } catch (err) {
            logger.error('Loan returns fetch error', err, { userId: req.user?.id, loanId });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/finance/loan-returns', async (req, res) => {
        const { loan_id, return_date, amount, payment_method, reference_number } = req.body;
        const companyCode = getCompanyContext(req);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                `INSERT INTO loan_return (loan_id, return_date, amount, payment_method, reference_number, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [loan_id, return_date, amount, payment_method, reference_number, companyCode, req.user?.id]
            );

            // Add to cash balance as outgoing money
            await client.query(
                `INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [return_date, 'PAYMENT', `Loan return payment`, 0, amount, companyCode, req.user?.id]
            );

            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            logger.error('Loan return creation error', e, { userId: req.user?.id, loanId: loan_id });
            res.status(500).json({ error: e.message });
        } finally {
            client.release();
        }
    });

    // Expense Heads
    app.get('/api/finance/expense-heads', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM expense_heads WHERE is_active = true ORDER BY head_name'
            );

            res.json(result.rows);
        } catch (err) {
            logger.error('Expense heads fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/finance/expense-heads', async (req, res) => {
        const { head_code, head_name, description } = req.body;
        const companyCode = getCompanyContext(req);

        try {
            const result = await pool.query(
                `INSERT INTO expense_heads (head_code, head_name, description, comp_code)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [head_code, head_name, description, companyCode]
            );

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Expense head creation error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/finance/expense-heads/:code', async (req, res) => {
        const { head_name, description } = req.body;

        try {
            const result = await pool.query(
                `UPDATE expense_heads SET head_name=$1, description=$2, updated_at=CURRENT_TIMESTAMP
                 WHERE head_code=$3 RETURNING *`,
                [head_name, description, req.params.code]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Expense head not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Expense head update error', err, { userId: req.user?.id, headCode: req.params.code });
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/finance/expense-heads/:code', async (req, res) => {
        try {
            const result = await pool.query(
                'UPDATE expense_heads SET is_active = false WHERE head_code = $1',
                [req.params.code]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Expense head not found' });
            }

            res.json({ message: 'Expense head deactivated successfully' });
        } catch (err) {
            logger.error('Expense head deletion error', err, { userId: req.user?.id, headCode: req.params.code });
            res.status(500).json({ error: err.message });
        }
    });

    // Tax Rates Management
    app.get('/api/finance/tax-rates', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM tax_rates WHERE is_active = true ORDER BY tax_name'
            );

            res.json(result.rows);
        } catch (err) {
            logger.error('Tax rates fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/finance/tax-rates/:code', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM tax_rates WHERE tax_code = $1',
                [req.params.code]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Tax rate fetch error', err, { userId: req.user?.id, taxCode: req.params.code });
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/finance/tax-rates', async (req, res) => {
        const { tax_code, tax_name, tax_rate, tax_type, description } = req.body;
        const companyCode = getCompanyContext(req);

        try {
            const result = await pool.query(
                `INSERT INTO tax_rates (tax_code, tax_name, tax_rate, tax_type, description, comp_code)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [tax_code, tax_name, tax_rate, tax_type || 'GST', description, companyCode]
            );

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Tax rate creation error', err, { userId: req.user?.id, taxCode: tax_code });
            res.status(500).json({ error: err.message });
        }
    });

    app.put('/api/finance/tax-rates/:code', async (req, res) => {
        const { tax_name, tax_rate, tax_type, description, is_active } = req.body;

        try {
            const result = await pool.query(
                `UPDATE tax_rates SET tax_name=$1, tax_rate=$2, tax_type=$3, description=$4, is_active=$5, updated_at=CURRENT_TIMESTAMP
                 WHERE tax_code=$6 RETURNING *`,
                [tax_name, tax_rate, tax_type, description, is_active, req.params.code]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Tax rate update error', err, { userId: req.user?.id, taxCode: req.params.code });
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/finance/tax-rates/:code', async (req, res) => {
        try {
            const result = await pool.query(
                'UPDATE tax_rates SET is_active = false WHERE tax_code = $1',
                [req.params.code]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }

            res.json({ message: 'Tax rate deactivated successfully' });
        } catch (err) {
            logger.error('Tax rate deletion error', err, { userId: req.user?.id, taxCode: req.params.code });
            res.status(500).json({ error: err.message });
        }
    });
};