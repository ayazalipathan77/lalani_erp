export default (app, pool, logger) => {
    // Dashboard metrics
    app.get('/api/analytics/dashboard-metrics', async (req, res) => {
        try {
            // Get comprehensive dashboard data
            const [
                revenueResult,
                pendingResult,
                lowStockResult,
                customerCountResult,
                recentInvoicesResult,
                topProductsResult,
                salesByCategoryResult
            ] = await Promise.all([
                // Total revenue
                pool.query(`
                    SELECT COALESCE(SUM(total_amount), 0) as total_revenue
                    FROM sales_invoices
                    WHERE balance_due <= 0
                `),
                // Pending receivables
                pool.query(`
                    SELECT COALESCE(SUM(balance_due), 0) as pending_amount
                    FROM sales_invoices
                    WHERE balance_due > 0
                `),
                // Low stock items
                pool.query(`
                    SELECT COUNT(*) as low_stock_count
                    FROM products
                    WHERE current_stock <= min_stock_level
                `),
                // Customer count
                pool.query('SELECT COUNT(*) as customer_count FROM customers'),
                // Recent invoices
                pool.query(`
                    SELECT inv_id, inv_number, inv_date, cust_code, total_amount, balance_due,
                           CASE WHEN balance_due <= 0 THEN 'PAID' ELSE 'PENDING' END as status
                    FROM sales_invoices
                    ORDER BY inv_date DESC, inv_id DESC
                    LIMIT 5
                `),
                // Top products by revenue
                pool.query(`
                    SELECT p.prod_name, p.prod_code,
                           COALESCE(SUM(si.line_total), 0) as total_revenue
                    FROM products p
                    LEFT JOIN sales_invoice_items si ON p.prod_code = si.prod_code
                    GROUP BY p.prod_id, p.prod_name, p.prod_code
                    ORDER BY total_revenue DESC
                    LIMIT 10
                `),
                // Sales by category
                pool.query(`
                    SELECT c.category_name,
                           COALESCE(SUM(si.line_total), 0) as category_revenue
                    FROM categories c
                    LEFT JOIN products p ON c.category_code = p.category_code
                    LEFT JOIN sales_invoice_items si ON p.prod_code = si.prod_code
                    GROUP BY c.category_id, c.category_name
                    ORDER BY category_revenue DESC
                `)
            ]);

            const metrics = {
                totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
                pendingReceivables: parseFloat(pendingResult.rows[0].pending_amount),
                lowStockCount: parseInt(lowStockResult.rows[0].low_stock_count),
                customerCount: parseInt(customerCountResult.rows[0].customer_count),
                recentInvoices: recentInvoicesResult.rows,
                topProducts: topProductsResult.rows,
                salesByCategory: salesByCategoryResult.rows
            };

            res.json(metrics);
        } catch (error) {
            logger.error('Dashboard metrics error', error, { userId: req.user?.id });
            console.error('Dashboard metrics error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
        }
    });

    // Sales trends data
    app.get('/api/analytics/sales-trends', async (req, res) => {
        try {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentDate = new Date();
            const chartData = [];

            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthName = months[date.getMonth()];
                const year = date.getFullYear();

                const result = await pool.query(`
                    SELECT COALESCE(SUM(total_amount), 0) as month_sales
                    FROM sales_invoices
                    WHERE EXTRACT(MONTH FROM inv_date) = $1
                      AND EXTRACT(YEAR FROM inv_date) = $2
                      AND balance_due <= 0
                `, [date.getMonth() + 1, year]);

                chartData.push({
                    name: monthName,
                    sales: Math.round(parseFloat(result.rows[0].month_sales))
                });
            }

            res.json(chartData);
        } catch (error) {
            logger.error('Sales trends error', error, { userId: req.user?.id });
            console.error('Sales trends error:', error);
            res.status(500).json({ error: 'Failed to fetch sales trends' });
        }
    });
};