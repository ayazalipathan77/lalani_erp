import { requirePermission } from '../middleware/permissions.js';

export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        // Priority: 1. Request header, 2. User session, 3. Default
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Suppliers - GET (View permission required)
    app.get('/api/suppliers',
        requirePermission('PARTNERS_VIEW', 'PARTNERS_MANAGE'),
        async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const companyCode = getCompanyContext(req);

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM suppliers WHERE comp_code = $1', [companyCode]);
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            const result = await pool.query(
                'SELECT * FROM suppliers WHERE comp_code = $1 ORDER BY supplier_name LIMIT $2 OFFSET $3',
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
            logger.error('Suppliers fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });

    // Suppliers - POST (Manage permission required)
    app.post('/api/suppliers',
        requirePermission('PARTNERS_MANAGE'),
        async (req, res) => {
        const { supplier_code, supplier_name, city, phone, contact_person, outstanding_balance } = req.body;
        const companyCode = getCompanyContext(req);
        try {
            const result = await pool.query(
                'INSERT INTO suppliers (supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, comp_code, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [supplier_code, supplier_name, city, phone, contact_person, outstanding_balance, companyCode, req.user?.id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Supplier creation error', err, { userId: req.user?.id, supplierCode: supplier_code });
            res.status(500).json({ error: err.message });
        }
    });

    // Suppliers - PUT (Manage permission required)
    app.put('/api/suppliers/:id',
        requirePermission('PARTNERS_MANAGE'),
        async (req, res) => {
        const { id } = req.params;
        const { supplier_code, supplier_name, city, phone, contact_person } = req.body;
        try {
            const result = await pool.query(
                'UPDATE suppliers SET supplier_code=$1, supplier_name=$2, city=$3, phone=$4, contact_person=$5, updated_by=$6 WHERE supplier_id=$7 RETURNING *',
                [supplier_code, supplier_name, city, phone, contact_person, req.user?.id, id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            logger.error('Supplier update error', err, { userId: req.user?.id, supplierId: id });
            res.status(500).json({ error: err.message });
        }
    });

    // Suppliers - DELETE (Manage permission required)
    app.delete('/api/suppliers/:id',
        requirePermission('PARTNERS_MANAGE'),
        async (req, res) => {
        try {
            await pool.query('DELETE FROM suppliers WHERE supplier_id=$1', [req.params.id]);
            res.json({ message: 'Deleted' });
        } catch (err) {
            logger.error('Supplier deletion error', err, { userId: req.user?.id, supplierId: req.params.id });
            res.status(500).json({ error: err.message });
        }
    });
};