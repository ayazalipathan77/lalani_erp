import logger from '../../logger.js';
import { requireAdmin } from '../middleware/permissions.js';

export default (app, pool, logger) => {
    // Users - GET (Admin only)
    app.get('/api/users',
        requireAdmin,
        async (req, res) => {
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

    // Users - POST (Admin only)
    app.post('/api/users',
        requireAdmin,
        async (req, res) => {
        const { username, password, full_name, role, is_active, permissions } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO users (username, password, full_name, role, is_active, permissions, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, username, full_name, role, is_active, permissions, default_company, created_at',
                [username, password, full_name, role, is_active, permissions, req.user?.id]
            );
            res.json(result.rows[0]);
        } catch (err) {
            // Handle unique constraint violation for username
            if (err.code === '23505') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // Users - PUT (Admin only)
    app.put('/api/users/:id',
        requireAdmin,
        async (req, res) => {
        const { id } = req.params;
        const { username, full_name, role, is_active, permissions, password } = req.body;
        try {
            let query, params;
            if (password && password.trim() !== '') {
                // Update with password
                query = 'UPDATE users SET username=$1, full_name=$2, role=$3, is_active=$4, permissions=$5, password=$6, updated_by=$7, updated_at=CURRENT_TIMESTAMP WHERE user_id=$8 RETURNING user_id, username, full_name, role, is_active, permissions, default_company, created_at, updated_at';
                params = [username, full_name, role, is_active, permissions, password, req.user?.id, id];
            } else {
                // Update without password
                query = 'UPDATE users SET username=$1, full_name=$2, role=$3, is_active=$4, permissions=$5, updated_by=$6, updated_at=CURRENT_TIMESTAMP WHERE user_id=$7 RETURNING user_id, username, full_name, role, is_active, permissions, default_company, created_at, updated_at';
                params = [username, full_name, role, is_active, permissions, req.user?.id, id];
            }
            const result = await pool.query(query, params);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            // Handle unique constraint violation for username
            if (err.code === '23505') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // Users - DELETE (Admin only)
    app.delete('/api/users/:id',
        requireAdmin,
        async (req, res) => {
        try {
            const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            // Handle foreign key constraint violations
            if (err.code === '23503') {
                return res.status(400).json({ error: 'Cannot delete user: User has associated records in the system' });
            }
            res.status(500).json({ error: err.message });
        }
    });
};