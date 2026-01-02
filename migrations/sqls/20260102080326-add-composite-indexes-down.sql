/*
 * Rollback Composite Indexes
 *
 * This migration removes all composite indexes added for performance optimization
 */

-- Sales Invoices Indexes
DROP INDEX IF EXISTS idx_invoices_comp_date;
DROP INDEX IF EXISTS idx_invoices_comp_customer;
DROP INDEX IF EXISTS idx_invoices_comp_date_paid;
DROP INDEX IF EXISTS idx_invoices_comp_pending;

-- Sales Invoice Items Indexes
DROP INDEX IF EXISTS idx_invoice_items_inv_prod;
DROP INDEX IF EXISTS idx_invoice_items_prod_inv;

-- Products Indexes
DROP INDEX IF EXISTS idx_products_comp_category;
DROP INDEX IF EXISTS idx_products_comp_low_stock;
DROP INDEX IF EXISTS idx_products_comp_active;
DROP INDEX IF EXISTS idx_products_code_comp;

-- Customers Indexes
DROP INDEX IF EXISTS idx_customers_comp_name;
DROP INDEX IF EXISTS idx_customers_comp_active;
DROP INDEX IF EXISTS idx_customers_code_comp;
DROP INDEX IF EXISTS idx_customers_comp_outstanding;

-- Purchase Invoices Indexes
DROP INDEX IF EXISTS idx_purchase_inv_comp_date;
DROP INDEX IF EXISTS idx_purchase_inv_comp_supplier;
DROP INDEX IF EXISTS idx_purchase_items_inv_prod;

-- Suppliers Indexes
DROP INDEX IF EXISTS idx_suppliers_comp_name;
DROP INDEX IF EXISTS idx_suppliers_code_comp;
DROP INDEX IF EXISTS idx_suppliers_comp_outstanding;

-- Sales Returns Indexes
DROP INDEX IF EXISTS idx_sales_returns_comp_date;
DROP INDEX IF EXISTS idx_sales_returns_comp_inv;
DROP INDEX IF EXISTS idx_return_items_return_prod;

-- Finance Indexes
DROP INDEX IF EXISTS idx_cash_balance_comp_date;
DROP INDEX IF EXISTS idx_expenses_comp_date;
DROP INDEX IF EXISTS idx_expenses_comp_head;
DROP INDEX IF EXISTS idx_payment_receipts_comp_date;
DROP INDEX IF EXISTS idx_payment_receipts_comp_cust;
DROP INDEX IF EXISTS idx_supplier_payments_comp_date;
DROP INDEX IF EXISTS idx_supplier_payments_comp_supp;
DROP INDEX IF EXISTS idx_loan_taken_comp_date;
DROP INDEX IF EXISTS idx_loan_return_comp_loan;

-- Categories and Tax Rates
DROP INDEX IF EXISTS idx_categories_comp_name;
DROP INDEX IF EXISTS idx_categories_code_comp;
DROP INDEX IF EXISTS idx_tax_rates_comp_code;

-- Discount Vouchers
DROP INDEX IF EXISTS idx_discount_vouchers_comp_active;
DROP INDEX IF EXISTS idx_discount_vouchers_comp_date;

-- Expense Heads
DROP INDEX IF EXISTS idx_expense_heads_comp_code;

-- Users
DROP INDEX IF EXISTS idx_users_username_active;
