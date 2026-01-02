/*
 * Composite Indexes for Performance Optimization
 *
 * These indexes are optimized for the most common query patterns in the application:
 * - Company-filtered queries with date ranges
 * - Company-filtered queries with status filters
 * - Join operations between tables
 *
 * Expected Impact: 50-70% improvement in query performance
 */

-- =============================================
-- Sales Invoices Indexes
-- =============================================

-- Most common: List invoices by company and date
CREATE INDEX IF NOT EXISTS idx_invoices_comp_date
    ON sales_invoices(comp_code, inv_date DESC);

-- Filter by company and customer
CREATE INDEX IF NOT EXISTS idx_invoices_comp_customer
    ON sales_invoices(comp_code, cust_code);

-- Analytics query: Paid invoices by company and date
CREATE INDEX IF NOT EXISTS idx_invoices_comp_date_paid
    ON sales_invoices(comp_code, inv_date DESC, balance_due)
    WHERE balance_due <= 0;

-- Pending invoices by company
CREATE INDEX IF NOT EXISTS idx_invoices_comp_pending
    ON sales_invoices(comp_code, balance_due)
    WHERE balance_due > 0;

-- =============================================
-- Sales Invoice Items Indexes
-- =============================================

-- Join optimization: invoice ID with product code
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv_prod
    ON sales_invoice_items(inv_id, prod_code);

-- Product sales analysis
CREATE INDEX IF NOT EXISTS idx_invoice_items_prod_inv
    ON sales_invoice_items(prod_code, inv_id);

-- =============================================
-- Products Indexes
-- =============================================

-- List products by company and category
CREATE INDEX IF NOT EXISTS idx_products_comp_category
    ON products(comp_code, category_code);

-- Low stock alerts by company
CREATE INDEX IF NOT EXISTS idx_products_comp_low_stock
    ON products(comp_code, current_stock, min_stock_level)
    WHERE current_stock <= min_stock_level;

-- Active products by company
CREATE INDEX IF NOT EXISTS idx_products_comp_active
    ON products(comp_code, is_active, prod_name)
    WHERE is_active = true;

-- Product code lookup with company (most frequently used)
CREATE INDEX IF NOT EXISTS idx_products_code_comp
    ON products(prod_code, comp_code);

-- =============================================
-- Customers Indexes
-- =============================================

-- List customers by company and name
CREATE INDEX IF NOT EXISTS idx_customers_comp_name
    ON customers(comp_code, cust_name);

-- Active customers by company
CREATE INDEX IF NOT EXISTS idx_customers_comp_active
    ON customers(comp_code, is_active)
    WHERE is_active = true;

-- Customer code lookup with company
CREATE INDEX IF NOT EXISTS idx_customers_code_comp
    ON customers(cust_code, comp_code);

-- Customers with outstanding balance
CREATE INDEX IF NOT EXISTS idx_customers_comp_outstanding
    ON customers(comp_code, outstanding_balance)
    WHERE outstanding_balance > 0;

-- =============================================
-- Purchase Invoices Indexes
-- =============================================

-- List purchases by company and date
CREATE INDEX IF NOT EXISTS idx_purchase_inv_comp_date
    ON purchase_invoices(comp_code, purchase_date DESC);

-- Filter by company and supplier
CREATE INDEX IF NOT EXISTS idx_purchase_inv_comp_supplier
    ON purchase_invoices(comp_code, supplier_code);

-- Purchase invoice items join
CREATE INDEX IF NOT EXISTS idx_purchase_items_inv_prod
    ON purchase_invoice_items(purchase_id, prod_code);

-- =============================================
-- Suppliers Indexes
-- =============================================

-- List suppliers by company and name
CREATE INDEX IF NOT EXISTS idx_suppliers_comp_name
    ON suppliers(comp_code, supplier_name);

-- Supplier code lookup with company
CREATE INDEX IF NOT EXISTS idx_suppliers_code_comp
    ON suppliers(supplier_code, comp_code);

-- Suppliers with outstanding balance
CREATE INDEX IF NOT EXISTS idx_suppliers_comp_outstanding
    ON suppliers(comp_code, outstanding_balance)
    WHERE outstanding_balance > 0;

-- =============================================
-- Sales Returns Indexes
-- =============================================

-- List sales returns by company and date
CREATE INDEX IF NOT EXISTS idx_sales_returns_comp_date
    ON sales_returns(comp_code, return_date DESC);

-- Returns for specific invoice
CREATE INDEX IF NOT EXISTS idx_sales_returns_comp_inv
    ON sales_returns(comp_code, inv_id);

-- Sales return items join
CREATE INDEX IF NOT EXISTS idx_return_items_return_prod
    ON sales_return_items(return_id, prod_code);

-- =============================================
-- Finance Indexes
-- =============================================

-- Cash balance transactions by company and date
CREATE INDEX IF NOT EXISTS idx_cash_balance_comp_date
    ON cash_balance(comp_code, trans_date DESC);

-- Expenses by company and date
CREATE INDEX IF NOT EXISTS idx_expenses_comp_date
    ON expenses(comp_code, expense_date DESC);

-- Expenses by company and head
CREATE INDEX IF NOT EXISTS idx_expenses_comp_head
    ON expenses(comp_code, expense_head_code);

-- Payment receipts by company and date
CREATE INDEX IF NOT EXISTS idx_payment_receipts_comp_date
    ON payment_receipts(comp_code, receipt_date DESC);

-- Payment receipts by customer
CREATE INDEX IF NOT EXISTS idx_payment_receipts_comp_cust
    ON payment_receipts(comp_code, cust_code);

-- Supplier payments by company and date
CREATE INDEX IF NOT EXISTS idx_supplier_payments_comp_date
    ON supplier_payments(comp_code, payment_date DESC);

-- Supplier payments by supplier
CREATE INDEX IF NOT EXISTS idx_supplier_payments_comp_supp
    ON supplier_payments(comp_code, supplier_code);

-- Loan taken by company and date
CREATE INDEX IF NOT EXISTS idx_loan_taken_comp_date
    ON loan_taken(comp_code, loan_date DESC);

-- Loan returns by company and loan
CREATE INDEX IF NOT EXISTS idx_loan_return_comp_loan
    ON loan_return(comp_code, loan_id);

-- =============================================
-- Categories and Tax Rates
-- =============================================

-- Categories by company and name
CREATE INDEX IF NOT EXISTS idx_categories_comp_name
    ON categories(comp_code, category_name);

-- Category code lookup with company
CREATE INDEX IF NOT EXISTS idx_categories_code_comp
    ON categories(category_code, comp_code);

-- Tax rates by company
CREATE INDEX IF NOT EXISTS idx_tax_rates_comp_code
    ON tax_rates(comp_code, tax_code);

-- =============================================
-- Discount Vouchers
-- =============================================

-- Active discount vouchers by company
CREATE INDEX IF NOT EXISTS idx_discount_vouchers_comp_active
    ON discount_vouchers(comp_code, is_active)
    WHERE is_active = true;

-- Discount vouchers by company and date
CREATE INDEX IF NOT EXISTS idx_discount_vouchers_comp_date
    ON discount_vouchers(comp_code, voucher_date DESC);

-- =============================================
-- Expense Heads
-- =============================================

-- Expense heads by company
CREATE INDEX IF NOT EXISTS idx_expense_heads_comp_code
    ON expense_heads(comp_code, expense_head_code);

-- =============================================
-- Users (for authentication queries)
-- =============================================

-- Username lookup with active status
CREATE INDEX IF NOT EXISTS idx_users_username_active
    ON users(username, is_active)
    WHERE is_active = true;

-- =============================================
-- Analysis Query
-- =============================================
-- After creating indexes, analyze tables to update statistics
ANALYZE sales_invoices;
ANALYZE sales_invoice_items;
ANALYZE products;
ANALYZE customers;
ANALYZE purchase_invoices;
ANALYZE purchase_invoice_items;
ANALYZE suppliers;
ANALYZE sales_returns;
ANALYZE categories;
ANALYZE tax_rates;
ANALYZE cash_balance;
ANALYZE expenses;
ANALYZE payment_receipts;
ANALYZE supplier_payments;
ANALYZE loan_taken;
ANALYZE loan_return;
ANALYZE discount_vouchers;
ANALYZE expense_heads;
ANALYZE users;
