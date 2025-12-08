import logger from '../../logger.js';

export default (app, pool, logger) => {
    // Users
    app.get('/api/users', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            const result = await pool.query(
                'SELECT user_id, username, full_name, role, is_active, permissions FROM users ORDER BY user_id LIMIT $1 OFFSET $2',
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
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/users', async (req, res) => {
        const { username, password, full_name, role, is_active, permissions } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO users (username, password, full_name, role, is_active, permissions, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [username, password, full_name, role, is_active, permissions, req.user?.id]
            );
            res.json(result.rows[0]);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.put('/api/users/:id', async (req, res) => {
        const { id } = req.params;
        const { full_name, role, is_active, permissions, password } = req.body;
        try {
            let query, params;
            if (password) {
                query = 'UPDATE users SET full_name=$1, role=$2, is_active=$3, permissions=$4, password=$5, updated_by=$6 WHERE user_id=$7 RETURNING *';
                params = [full_name, role, is_active, permissions, password, req.user?.id, id];
            } else {
                query = 'UPDATE users SET full_name=$1, role=$2, is_active=$3, permissions=$4, updated_by=$5 WHERE user_id=$6 RETURNING *';
                params = [full_name, role, is_active, permissions, req.user?.id, id];
            }
            const result = await pool.query(query, params);
            res.json(result.rows[0]);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/users/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
            res.json({ message: 'User deleted' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });
};