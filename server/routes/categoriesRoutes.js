export default (app, pool, logger) => {
    // Categories
    app.get('/api/categories', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM categories');
            res.json(result.rows);
        } catch (err) {
            logger.error('Categories fetch error', err, { userId: req.user?.id });
            res.status(500).json({ error: err.message });
        }
    });
};