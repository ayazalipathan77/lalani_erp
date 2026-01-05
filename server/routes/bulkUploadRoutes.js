import multer from 'multer';
import xlsx from 'xlsx';
import { requirePermission } from '../middleware/permissions.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default (app, pool, logger) => {
    // Company context middleware
    const getCompanyContext = (req) => {
        return req.headers['x-company-code'] ||
            req.user?.selectedCompany ||
            'CMP01';
    };

    // Bulk Products Upload - POST (Manage permission required)
    app.post('/api/products/bulk-upload',
        requirePermission('INVENTORY_MANAGE'),
        upload.single('file'),
        async (req, res) => {
            const companyCode = getCompanyContext(req);

            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                // Parse Excel file
                const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(worksheet);

                if (data.length === 0) {
                    return res.status(400).json({ error: 'Excel file is empty' });
                }

                const results = {
                    total: data.length,
                    created: 0,
                    updated: 0,
                    errors: []
                };

                // Process each row
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const rowNumber = i + 2; // Excel rows start at 1, header is row 1

                    try {
                        // Validate required fields
                        if (!row.prod_code || !row.prod_name) {
                            results.errors.push({
                                row: rowNumber,
                                error: 'Missing required fields (prod_code, prod_name)'
                            });
                            continue;
                        }

                        // Check if product exists
                        const existingProduct = await pool.query(
                            'SELECT prod_id FROM products WHERE prod_code = $1 AND comp_code = $2',
                            [row.prod_code, companyCode]
                        );

                        const productData = {
                            prod_code: row.prod_code,
                            prod_name: row.prod_name,
                            category_code: row.category_code || null,
                            cost_price: parseFloat(row.cost_price) || 0,
                            selling_price: parseFloat(row.selling_price) || 0,
                            current_stock: parseInt(row.current_stock) || 0,
                            min_stock_level: parseInt(row.min_stock_level) || 0,
                            tax_code: row.tax_code || 'GST5'
                        };

                        if (existingProduct.rows.length > 0) {
                            // Update existing product
                            await pool.query(
                                `UPDATE products
                                 SET prod_name=$1, category_code=$2, cost_price=$3, selling_price=$4,
                                     current_stock=$5, min_stock_level=$6, tax_code=$7, updated_by=$8, updated_at=CURRENT_TIMESTAMP
                                 WHERE prod_code=$9 AND comp_code=$10`,
                                [
                                    productData.prod_name,
                                    productData.category_code,
                                    productData.cost_price,
                                    productData.selling_price,
                                    productData.current_stock,
                                    productData.min_stock_level,
                                    productData.tax_code,
                                    req.user?.id,
                                    productData.prod_code,
                                    companyCode
                                ]
                            );
                            results.updated++;
                        } else {
                            // Create new product
                            await pool.query(
                                `INSERT INTO products
                                 (prod_code, prod_name, category_code, cost_price, selling_price,
                                  current_stock, min_stock_level, tax_code, comp_code, created_by)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                                [
                                    productData.prod_code,
                                    productData.prod_name,
                                    productData.category_code,
                                    productData.cost_price,
                                    productData.selling_price,
                                    productData.current_stock,
                                    productData.min_stock_level,
                                    productData.tax_code,
                                    companyCode,
                                    req.user?.id
                                ]
                            );
                            results.created++;
                        }
                    } catch (rowError) {
                        results.errors.push({
                            row: rowNumber,
                            error: rowError.message
                        });
                    }
                }

                logger.info('Bulk product upload completed', {
                    userId: req.user?.id,
                    companyCode,
                    results
                });

                res.json({
                    message: 'Bulk upload completed',
                    results
                });
            } catch (err) {
                logger.error('Bulk product upload error', err, {
                    userId: req.user?.id,
                    companyCode
                });
                res.status(500).json({ error: err.message });
            }
        }
    );

    // Bulk Customers Upload - POST (Manage permission required)
    app.post('/api/customers/bulk-upload',
        requirePermission('PARTNERS_MANAGE'),
        upload.single('file'),
        async (req, res) => {
            const companyCode = getCompanyContext(req);

            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                // Parse Excel file
                const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(worksheet);

                if (data.length === 0) {
                    return res.status(400).json({ error: 'Excel file is empty' });
                }

                const results = {
                    total: data.length,
                    created: 0,
                    updated: 0,
                    errors: []
                };

                // Process each row
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const rowNumber = i + 2; // Excel rows start at 1, header is row 1

                    try {
                        // Validate required fields
                        if (!row.cust_code || !row.cust_name) {
                            results.errors.push({
                                row: rowNumber,
                                error: 'Missing required fields (cust_code, cust_name)'
                            });
                            continue;
                        }

                        // Check if customer exists
                        const existingCustomer = await pool.query(
                            'SELECT cust_id FROM customers WHERE cust_code = $1 AND comp_code = $2',
                            [row.cust_code, companyCode]
                        );

                        const customerData = {
                            cust_code: row.cust_code,
                            cust_name: row.cust_name,
                            city: row.city || null,
                            phone: row.phone || null,
                            credit_limit: parseFloat(row.credit_limit) || 0,
                            outstanding_balance: parseFloat(row.outstanding_balance) || 0,
                            tax_rate: parseFloat(row.tax_rate) || 0,
                            discount_rate: parseFloat(row.discount_rate) || 0
                        };

                        if (existingCustomer.rows.length > 0) {
                            // Update existing customer (only update tax_rate and discount_rate as requested)
                            await pool.query(
                                `UPDATE customers
                                 SET cust_name=$1, city=$2, phone=$3, credit_limit=$4,
                                     outstanding_balance=$5, tax_rate=$6, discount_rate=$7,
                                     updated_by=$8, updated_at=CURRENT_TIMESTAMP
                                 WHERE cust_code=$9 AND comp_code=$10`,
                                [
                                    customerData.cust_name,
                                    customerData.city,
                                    customerData.phone,
                                    customerData.credit_limit,
                                    customerData.outstanding_balance,
                                    customerData.tax_rate,
                                    customerData.discount_rate,
                                    req.user?.id,
                                    customerData.cust_code,
                                    companyCode
                                ]
                            );
                            results.updated++;
                        } else {
                            // Create new customer with all values including tax and discount
                            await pool.query(
                                `INSERT INTO customers
                                 (cust_code, cust_name, city, phone, credit_limit, outstanding_balance,
                                  tax_rate, discount_rate, comp_code, created_by)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                                [
                                    customerData.cust_code,
                                    customerData.cust_name,
                                    customerData.city,
                                    customerData.phone,
                                    customerData.credit_limit,
                                    customerData.outstanding_balance,
                                    customerData.tax_rate,
                                    customerData.discount_rate,
                                    companyCode,
                                    req.user?.id
                                ]
                            );
                            results.created++;
                        }
                    } catch (rowError) {
                        results.errors.push({
                            row: rowNumber,
                            error: rowError.message
                        });
                    }
                }

                logger.info('Bulk customer upload completed', {
                    userId: req.user?.id,
                    companyCode,
                    results
                });

                res.json({
                    message: 'Bulk upload completed',
                    results
                });
            } catch (err) {
                logger.error('Bulk customer upload error', err, {
                    userId: req.user?.id,
                    companyCode
                });
                res.status(500).json({ error: err.message });
            }
        }
    );

    // Download template endpoint for products
    app.get('/api/products/download-template',
        requirePermission('INVENTORY_VIEW', 'INVENTORY_MANAGE'),
        async (req, res) => {
            try {
                const templateData = [
                    {
                        prod_code: 'PROD001',
                        prod_name: 'Sample Product',
                        category_code: 'CAT01',
                        cost_price: 100.00,
                        selling_price: 150.00,
                        current_stock: 50,
                        min_stock_level: 10,
                        tax_code: 'GST5'
                    }
                ];

                const ws = xlsx.utils.json_to_sheet(templateData);
                const wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Products');

                const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

                res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.send(buffer);
            } catch (err) {
                logger.error('Template download error', err, { userId: req.user?.id });
                res.status(500).json({ error: err.message });
            }
        }
    );

    // Download template endpoint for customers
    app.get('/api/customers/download-template',
        requirePermission('PARTNERS_VIEW', 'PARTNERS_MANAGE'),
        async (req, res) => {
            try {
                const templateData = [
                    {
                        cust_code: 'CUST001',
                        cust_name: 'Sample Customer',
                        city: 'Karachi',
                        phone: '+92-300-1234567',
                        credit_limit: 50000.00,
                        outstanding_balance: 0.00,
                        tax_rate: 5.00,
                        discount_rate: 2.50
                    }
                ];

                const ws = xlsx.utils.json_to_sheet(templateData);
                const wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Customers');

                const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

                res.setHeader('Content-Disposition', 'attachment; filename=customers_template.xlsx');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.send(buffer);
            } catch (err) {
                logger.error('Template download error', err, { userId: req.user?.id });
                res.status(500).json({ error: err.message });
            }
        }
    );
};
