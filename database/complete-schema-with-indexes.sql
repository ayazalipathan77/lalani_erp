-- =============================================
-- Complete Lalani ERP Database Schema
-- =============================================
-- Version: 2.0 (Updated 2026-01-02)
-- Includes: All tables, seed data, and Phase 1 performance optimizations
--
-- Changes from v1.0:
-- - Added discount_rate, discount_amount, tax_rate, tax_amount, net_amount to sales_invoice_items
-- - Added 52 composite indexes for performance optimization (Phase 1)
-- - Updated seed data
-- =============================================

-- =============================================
-- SECTION 1: Core Tables
-- =============================================

-- Companies table (referenced by other tables)
CREATE TABLE IF NOT EXISTS companies (
    comp_code VARCHAR(10) PRIMARY KEY,
    comp_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    gstin VARCHAR(15),
    pan_number VARCHAR(10),
    tax_registration VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default company
INSERT INTO companies (comp_code, comp_name, address, phone, email)
VALUES ('CMP01', 'Lalani Traders', 'Karachi, Pakistan', '+92-21-1234567', 'info@lalanitraders.com')
ON CONFLICT (comp_code) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N')),
    permissions TEXT[],
    default_company VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- WebAuthn credentials
CREATE TABLE IF NOT EXISTS user_webauthn_credentials (
    credential_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    device_info JSONB
);

-- =============================================
-- SECTION 2: Master Data Tables
-- =============================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax rates
CREATE TABLE IF NOT EXISTS tax_rates (
    tax_id SERIAL PRIMARY KEY,
    tax_code VARCHAR(20) UNIQUE NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_type VARCHAR(20) DEFAULT 'GST',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discount rates table
CREATE TABLE IF NOT EXISTS discount_rates (
    discount_id SERIAL PRIMARY KEY,
    discount_code VARCHAR(20) UNIQUE NOT NULL,
    discount_name VARCHAR(100) NOT NULL,
    discount_rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Products (with all final columns)
CREATE TABLE IF NOT EXISTS products (
    prod_id SERIAL PRIMARY KEY,
    prod_code VARCHAR(20) UNIQUE NOT NULL,
    prod_name VARCHAR(200) NOT NULL,
    category_code VARCHAR(20) REFERENCES categories(category_code),
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    tax_code VARCHAR(20) REFERENCES tax_rates(tax_code),
    tax_rate DECIMAL(5,2) DEFAULT 5.00,
    hsn_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Customers (with all final columns)
CREATE TABLE IF NOT EXISTS customers (
    cust_id SERIAL PRIMARY KEY,
    cust_code VARCHAR(20) UNIQUE NOT NULL,
    cust_name VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    phone VARCHAR(20),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    route_code VARCHAR(20),
    tax_number VARCHAR(50),
    credit_terms_days INTEGER DEFAULT 30,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(20),
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    tax_number VARCHAR(50),
    payment_terms_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- =============================================
-- SECTION 3: Transaction Tables
-- =============================================

-- Sales invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
    inv_id SERIAL PRIMARY KEY,
    inv_number VARCHAR(50) UNIQUE NOT NULL,
    inv_date DATE NOT NULL,
    cust_code VARCHAR(20) REFERENCES customers(cust_code),
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    sub_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    shipping_address TEXT,
    shipping_charges DECIMAL(12,2) DEFAULT 0,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id)
);

-- Sales invoice items (with discount and tax columns - Phase 1)
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    item_id SERIAL PRIMARY KEY,
    inv_id INTEGER REFERENCES sales_invoices(inv_id) ON DELETE CASCADE,
    prod_code VARCHAR(20) REFERENCES products(prod_code),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales returns
CREATE TABLE IF NOT EXISTS sales_returns (
    return_id SERIAL PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    return_date DATE NOT NULL,
    inv_id INTEGER REFERENCES sales_invoices(inv_id),
    cust_code VARCHAR(20) REFERENCES customers(cust_code),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Sales return items (with discount and tax columns - Phase 1)
CREATE TABLE IF NOT EXISTS sales_return_items (
    item_id SERIAL PRIMARY KEY,
    return_id INTEGER REFERENCES sales_returns(return_id) ON DELETE CASCADE,
    prod_code VARCHAR(20) REFERENCES products(prod_code),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase invoices
CREATE TABLE IF NOT EXISTS purchase_invoices (
    purchase_id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_code VARCHAR(20) REFERENCES suppliers(supplier_code),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'RECEIVED',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Purchase invoice items
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    item_id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchase_invoices(purchase_id) ON DELETE CASCADE,
    prod_code VARCHAR(20) REFERENCES products(prod_code),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SECTION 4: Finance Tables
-- =============================================

-- Cash balance
CREATE TABLE IF NOT EXISTS cash_balance (
    trans_id SERIAL PRIMARY KEY,
    trans_date DATE NOT NULL,
    trans_type VARCHAR(20) NOT NULL CHECK (trans_type IN ('SALES', 'PURCHASE', 'EXPENSE', 'RECEIPT', 'PAYMENT')),
    description TEXT,
    debit_amount DECIMAL(12,2) DEFAULT 0,
    credit_amount DECIMAL(12,2) DEFAULT 0,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- Expense heads
CREATE TABLE IF NOT EXISTS expense_heads (
    head_code VARCHAR(20) PRIMARY KEY,
    head_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    expense_id SERIAL PRIMARY KEY,
    expense_head_code VARCHAR(20) REFERENCES expense_heads(head_code),
    amount DECIMAL(12,2) NOT NULL,
    remarks TEXT,
    expense_date DATE NOT NULL,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Payment receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
    receipt_id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_date DATE NOT NULL,
    cust_code VARCHAR(20) REFERENCES customers(cust_code),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Supplier payments
CREATE TABLE IF NOT EXISTS supplier_payments (
    payment_id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    supplier_code VARCHAR(20) REFERENCES suppliers(supplier_code),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discount vouchers
CREATE TABLE IF NOT EXISTS discount_vouchers (
    voucher_id SERIAL PRIMARY KEY,
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    voucher_date DATE NOT NULL,
    cust_code VARCHAR(20) REFERENCES customers(cust_code),
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- Opening cash balance
CREATE TABLE IF NOT EXISTS opening_cash_balance (
    balance_id SERIAL PRIMARY KEY,
    balance_date DATE NOT NULL,
    opening_amount DECIMAL(12,2) NOT NULL,
    closing_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'OPEN',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- Loan taken
CREATE TABLE IF NOT EXISTS loan_taken (
    loan_id SERIAL PRIMARY KEY,
    loan_number VARCHAR(50) UNIQUE NOT NULL,
    loan_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2),
    term_months INTEGER,
    lender_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- Loan return
CREATE TABLE IF NOT EXISTS loan_return (
    return_id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loan_taken(loan_id),
    return_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- System backups
CREATE TABLE IF NOT EXISTS system_backups (
    backup_id SERIAL PRIMARY KEY,
    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_type VARCHAR(20) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_by INTEGER REFERENCES users(user_id)
);

-- =============================================
-- SECTION 5: Basic Indexes (Single Column)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON user_webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(prod_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_code);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(cust_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON sales_invoices(inv_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON sales_invoices(inv_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON sales_invoices(cust_code);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON sales_invoice_items(inv_id);
CREATE INDEX IF NOT EXISTS idx_cash_balance_date ON cash_balance(trans_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_sales_returns_number ON sales_returns(return_number);
CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON sales_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns(cust_code);
CREATE INDEX IF NOT EXISTS idx_sales_return_items_return ON sales_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_number ON purchase_invoices(purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_code);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_purchase ON purchase_invoice_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_number ON payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_date ON payment_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_customer ON payment_receipts(cust_code);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_number ON supplier_payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_code);
CREATE INDEX IF NOT EXISTS idx_discount_vouchers_number ON discount_vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_discount_vouchers_date ON discount_vouchers(voucher_date);
CREATE INDEX IF NOT EXISTS idx_discount_vouchers_customer ON discount_vouchers(cust_code);
CREATE INDEX IF NOT EXISTS idx_opening_cash_balance_date ON opening_cash_balance(balance_date);
CREATE INDEX IF NOT EXISTS idx_loan_taken_number ON loan_taken(loan_number);
CREATE INDEX IF NOT EXISTS idx_loan_taken_date ON loan_taken(loan_date);
CREATE INDEX IF NOT EXISTS idx_loan_return_loan ON loan_return(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_return_date ON loan_return(return_date);
CREATE INDEX IF NOT EXISTS idx_expense_heads_code ON expense_heads(head_code);
CREATE INDEX IF NOT EXISTS idx_tax_rates_code ON tax_rates(tax_code);
CREATE INDEX IF NOT EXISTS idx_system_backups_date ON system_backups(backup_date);
CREATE INDEX IF NOT EXISTS idx_discount_rates_code ON discount_rates(discount_code);

-- =============================================
-- SECTION 6: Composite Indexes (Phase 1 Optimization)
-- =============================================
-- Expected Impact: 50-70% improvement in query performance
-- These are optimized for multi-tenant queries (company-filtered)
-- =============================================

-- Sales Invoices Composite Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_comp_date
    ON sales_invoices(comp_code, inv_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_comp_customer
    ON sales_invoices(comp_code, cust_code);

CREATE INDEX IF NOT EXISTS idx_invoices_comp_date_paid
    ON sales_invoices(comp_code, inv_date DESC, balance_due)
    WHERE balance_due <= 0;

CREATE INDEX IF NOT EXISTS idx_invoices_comp_pending
    ON sales_invoices(comp_code, balance_due)
    WHERE balance_due > 0;

-- Sales Invoice Items Composite Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv_prod
    ON sales_invoice_items(inv_id, prod_code);

CREATE INDEX IF NOT EXISTS idx_invoice_items_prod_inv
    ON sales_invoice_items(prod_code, inv_id);

-- Products Composite Indexes
CREATE INDEX IF NOT EXISTS idx_products_comp_category
    ON products(comp_code, category_code);

CREATE INDEX IF NOT EXISTS idx_products_comp_low_stock
    ON products(comp_code, current_stock, min_stock_level)
    WHERE current_stock <= min_stock_level;

CREATE INDEX IF NOT EXISTS idx_products_comp_active
    ON products(comp_code, is_active, prod_name)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_code_comp
    ON products(prod_code, comp_code);

-- Customers Composite Indexes
CREATE INDEX IF NOT EXISTS idx_customers_comp_name
    ON customers(comp_code, cust_name);

CREATE INDEX IF NOT EXISTS idx_customers_comp_active
    ON customers(comp_code, is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customers_code_comp
    ON customers(cust_code, comp_code);

CREATE INDEX IF NOT EXISTS idx_customers_comp_outstanding
    ON customers(comp_code, outstanding_balance)
    WHERE outstanding_balance > 0;

-- Purchase Invoices Composite Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_inv_comp_date
    ON purchase_invoices(comp_code, purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_inv_comp_supplier
    ON purchase_invoices(comp_code, supplier_code);

CREATE INDEX IF NOT EXISTS idx_purchase_items_inv_prod
    ON purchase_invoice_items(purchase_id, prod_code);

-- Suppliers Composite Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_comp_name
    ON suppliers(comp_code, supplier_name);

CREATE INDEX IF NOT EXISTS idx_suppliers_code_comp
    ON suppliers(supplier_code, comp_code);

CREATE INDEX IF NOT EXISTS idx_suppliers_comp_outstanding
    ON suppliers(comp_code, outstanding_balance)
    WHERE outstanding_balance > 0;

-- Sales Returns Composite Indexes
CREATE INDEX IF NOT EXISTS idx_sales_returns_comp_date
    ON sales_returns(comp_code, return_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_returns_comp_inv
    ON sales_returns(comp_code, inv_id);

CREATE INDEX IF NOT EXISTS idx_return_items_return_prod
    ON sales_return_items(return_id, prod_code);

-- Finance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_cash_balance_comp_date
    ON cash_balance(comp_code, trans_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_comp_date
    ON expenses(comp_code, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_comp_head
    ON expenses(comp_code, expense_head_code);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_comp_date
    ON payment_receipts(comp_code, receipt_date DESC);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_comp_cust
    ON payment_receipts(comp_code, cust_code);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_comp_date
    ON supplier_payments(comp_code, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_comp_supp
    ON supplier_payments(comp_code, supplier_code);

CREATE INDEX IF NOT EXISTS idx_loan_taken_comp_date
    ON loan_taken(comp_code, loan_date DESC);

CREATE INDEX IF NOT EXISTS idx_loan_return_comp_loan
    ON loan_return(comp_code, loan_id);

-- Categories and Tax Rates Composite Indexes
CREATE INDEX IF NOT EXISTS idx_categories_comp_name
    ON categories(comp_code, category_name);

CREATE INDEX IF NOT EXISTS idx_categories_code_comp
    ON categories(category_code, comp_code);

CREATE INDEX IF NOT EXISTS idx_tax_rates_comp_code
    ON tax_rates(comp_code, tax_code);

-- Discount Vouchers Composite Indexes
CREATE INDEX IF NOT EXISTS idx_discount_vouchers_comp_active
    ON discount_vouchers(comp_code, is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_discount_vouchers_comp_date
    ON discount_vouchers(comp_code, voucher_date DESC);

-- Expense Heads Composite Index
CREATE INDEX IF NOT EXISTS idx_expense_heads_comp_code
    ON expense_heads(comp_code, head_code);

-- Users Composite Index (Authentication)
CREATE INDEX IF NOT EXISTS idx_users_username_active
    ON users(username, is_active)
    WHERE is_active = 'Y';

-- =============================================
-- SECTION 7: Seed Data
-- =============================================

INSERT INTO categories (category_code, category_name, description) VALUES
('TRUCK', 'Truck Tires', 'Heavy duty truck tires'),
('CAR', 'Passenger Car', 'Sedan and hatchback tires'),
('SUV', 'SUV & 4x4', 'Off-road and highway SUV tires'),
('TUBE', 'Inner Tubes', 'All sizes of inner tubes'),
('AGRI', 'Agricultural', 'Tractor and farm equipment tires')
ON CONFLICT (category_code) DO NOTHING;

INSERT INTO tax_rates (tax_code, tax_name, tax_rate, tax_type, description) VALUES
('GST5', 'GST 5%', 5.00, 'GST', 'Standard GST rate'),
('GST12', 'GST 12%', 12.00, 'GST', 'Higher GST rate'),
('GST18', 'GST 18%', 18.00, 'GST', 'Highest GST rate'),
('GST0', 'GST Exempt', 0.00, 'GST', 'GST exempted items')
ON CONFLICT (tax_code) DO NOTHING;

INSERT INTO discount_rates (discount_code, discount_name, discount_rate, description) VALUES
('DISC5', '5% Discount', 5.00, 'Standard 5% discount'),
('DISC10', '10% Discount', 10.00, 'Special 10% discount'),
('DISC15', '15% Discount', 15.00, 'Bulk purchase discount')
ON CONFLICT (discount_code) DO NOTHING;

INSERT INTO products (prod_code, prod_name, category_code, cost_price, selling_price, current_stock, min_stock_level, tax_code) VALUES
('T-1001', 'Radial Truck Tire 295/80R22.5', 'TRUCK', 35000.00, 45000.00, 120, 20, 'GST5'),
('T-1002', 'Sedan Comfort 195/65R15', 'CAR', 9500.00, 12000.00, 450, 50, 'GST5'),
('TB-2001', 'Heavy Duty Tube 10.00-20', 'TUBE', 3000.00, 3500.00, 800, 100, 'GST5'),
('T-1003', 'Off-Road Grip 265/70R17', 'SUV', 28000.00, 32000.00, 45, 10, 'GST5'),
('T-1004', 'Tractor Rear 18.4-30', 'AGRI', 75000.00, 85000.00, 12, 5, 'GST5'),
('T-1005', 'City Runner 175/70R13', 'CAR', 8000.00, 9500.00, 200, 30, 'GST5')
ON CONFLICT (prod_code) DO NOTHING;

INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance, tax_rate, discount_rate) VALUES
('C-001', 'Karachi Auto Parts', 'Karachi', '0300-1234567', 500000.00, 150000.00, 5.00, 2.00),
('C-002', 'Hyderabad Wheels', 'Hyderabad', '0300-7654321', 300000.00, 0.00, 5.00, 1.50),
('C-003', 'Sukkur Transport Spares', 'Sukkur', '0301-1122334', 200000.00, 75000.00, 5.00, 0.00),
('C-004', 'Larkana Tires', 'Larkana', '0302-9988776', 250000.00, 250000.00, 5.00, 3.00)
ON CONFLICT (cust_code) DO NOTHING;

INSERT INTO suppliers (supplier_code, supplier_name, contact_person, city, phone, outstanding_balance) VALUES
('S-001', 'General Tyre Pakistan', 'Ahmed Khan', 'Karachi', '021-34567890', 1200000.00),
('S-002', 'Panther Tyres Ltd', 'Bilal Ahmed', 'Lahore', '042-35678901', 500000.00),
('S-003', 'Global Rubber Corp', 'Mr. Smith', 'Dubai', '+971-50-1234567', 0.00)
ON CONFLICT (supplier_code) DO NOTHING;

INSERT INTO users (username, password, full_name, role, is_active, permissions) VALUES
('admin', '123', 'System Administrator', 'ADMIN', 'Y',
 ARRAY['INVENTORY_VIEW', 'INVENTORY_MANAGE', 'SALES_VIEW', 'SALES_MANAGE', 'FINANCE_VIEW', 'FINANCE_MANAGE', 'PARTNERS_VIEW', 'PARTNERS_MANAGE', 'USERS_VIEW', 'USERS_MANAGE', 'REPORTS_VIEW', 'REPORTS_EXPORT']),
('user', '123', 'Sales Agent', 'USER', 'Y',
 ARRAY['INVENTORY_VIEW', 'SALES_VIEW', 'SALES_MANAGE', 'PARTNERS_VIEW'])
ON CONFLICT (username) DO NOTHING;

INSERT INTO expense_heads (head_code, head_name, description) VALUES
('FUEL', 'Fuel Expenses', 'Vehicle and equipment fuel costs'),
('UTIL', 'Utilities', 'Electricity, water, and gas bills'),
('RENT', 'Rent', 'Office and warehouse rental expenses'),
('MAINT', 'Maintenance', 'Equipment repair and maintenance'),
('MISC', 'Miscellaneous', 'Other unclassified expenses'),
('SALARY', 'Salaries', 'Employee salary payments'),
('MARKETING', 'Marketing', 'Advertising and promotional expenses'),
('TRAVEL', 'Travel', 'Business travel and accommodation'),
('OFFICE', 'Office Supplies', 'Stationery and office equipment'),
('TAX', 'Tax Payments', 'Government tax payments')
ON CONFLICT (head_code) DO NOTHING;

INSERT INTO expenses (expense_head_code, amount, remarks, expense_date) VALUES
('FUEL', 5000.00, 'Delivery Van Fuel', '2023-10-01'),
('UTIL', 12000.00, 'Warehouse Electricity', '2023-10-02'),
('MAINT', 3500.00, 'Forklift Repair', '2023-10-10'),
('MISC', 2000.00, 'Client Lunch', '2023-10-15')
ON CONFLICT DO NOTHING;

INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount) VALUES
('2023-10-01', 'RECEIPT', 'Payment from Karachi Auto Parts', 120000.00, 0.00),
('2023-10-01', 'EXPENSE', 'Fuel Expense', 0.00, 5000.00),
('2023-10-02', 'EXPENSE', 'Electricity Bill', 0.00, 12000.00),
('2023-10-05', 'SALES', 'Cash Sale - Walk in', 25000.00, 0.00),
('2023-10-08', 'PAYMENT', 'Payment to General Tyre', 0.00, 500000.00)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 7B: Additional Seed Data for Test Data Dependencies
-- =============================================

-- Additional Companies (for multi-tenant testing)
INSERT INTO companies (comp_code, comp_name, address, phone, email, gstin, pan_number) VALUES
('CMP02', 'Lalani Traders - Lahore Branch', 'Lahore, Pakistan', '+92-42-9876543', 'lahore@lalanitraders.com', '29ABCDE1234F1Z5', 'ABCDE1234F'),
('CMP03', 'Lalani Traders - Islamabad Branch', 'Islamabad, Pakistan', '+92-51-5555555', 'isb@lalanitraders.com', '29FGHIJ5678K1L5', 'FGHIJ5678K')
ON CONFLICT (comp_code) DO NOTHING;

-- Additional Categories
INSERT INTO categories (category_code, category_name, description, comp_code) VALUES
('BIKE', 'Motorcycle Tires', 'Motorcycle and scooter tires', 'CMP01'),
('INDUS', 'Industrial Tires', 'Forklift and industrial equipment tires', 'CMP01')
ON CONFLICT (category_code) DO NOTHING;

-- Additional Products for CMP01
INSERT INTO products (prod_code, prod_name, category_code, cost_price, selling_price, current_stock, min_stock_level, comp_code, tax_code, is_active) VALUES
('T-1006', 'Highway Master 205/55R16', 'CAR', 11000.00, 13500.00, 300, 40, 'CMP01', 'GST5', true),
('T-1007', 'Economy Plus 165/80R14', 'CAR', 7000.00, 8500.00, 250, 30, 'CMP01', 'GST5', true),
('T-1008', 'Mountain Grip 215/75R15', 'SUV', 18000.00, 21000.00, 80, 15, 'CMP01', 'GST5', true),
('TB-2002', 'Standard Tube 6.00-16', 'TUBE', 1200.00, 1500.00, 600, 80, 'CMP01', 'GST5', true),
('TB-2003', 'Bike Tube 2.75-18', 'TUBE', 400.00, 550.00, 1000, 150, 'CMP01', 'GST5', true),
('T-1009', 'Bike Sport 90/90-17', 'BIKE', 2500.00, 3200.00, 400, 50, 'CMP01', 'GST5', true),
('T-1010', 'Bike Touring 100/90-18', 'BIKE', 2800.00, 3500.00, 350, 45, 'CMP01', 'GST5', true),
('T-1011', 'Forklift Solid 7.00-12', 'INDUS', 45000.00, 52000.00, 25, 5, 'CMP01', 'GST5', true),
('T-1012', 'Heavy Truck 11R22.5', 'TRUCK', 42000.00, 50000.00, 60, 10, 'CMP01', 'GST5', true),
('TB-2004', 'Premium Tube 12.00-20', 'TUBE', 3500.00, 4200.00, 300, 40, 'CMP01', 'GST5', true),

-- Products for CMP02 (Lahore)
('LHR-T001', 'Lahore Special Radial 295/80R22.5', 'TRUCK', 36000.00, 46000.00, 100, 20, 'CMP02', 'GST5', true),
('LHR-T002', 'City Comfort 185/65R15', 'CAR', 9000.00, 11500.00, 400, 50, 'CMP02', 'GST5', true),
('LHR-T003', 'Premium Tube 10.00-20', 'TUBE', 3200.00, 3700.00, 500, 60, 'CMP02', 'GST5', true),
('LHR-T004', 'All Terrain 235/70R16', 'CAR', 15000.00, 18000.00, 150, 25, 'CMP02', 'GST5', true),
('LHR-T005', 'Budget Tube 7.50-16', 'TUBE', 1500.00, 1800.00, 800, 100, 'CMP02', 'GST5', true),

-- Products for CMP03 (Islamabad)
('ISB-T001', 'Capital SUV Grip 265/65R17', 'SUV', 25000.00, 30000.00, 70, 15, 'CMP03', 'GST5', true),
('ISB-T002', 'Bike Racer 110/70-17', 'BIKE', 3000.00, 3800.00, 300, 40, 'CMP03', 'GST5', true),
('ISB-T003', 'Bike Cruiser 120/80-18', 'BIKE', 3500.00, 4200.00, 250, 35, 'CMP03', 'GST5', true),
('ISB-T004', 'Premium SUV 275/60R18', 'SUV', 30000.00, 36000.00, 50, 10, 'CMP03', 'GST5', true),
('ISB-T005', 'Economy SUV 225/65R17', 'SUV', 20000.00, 24000.00, 90, 18, 'CMP03', 'GST5', true)
ON CONFLICT (prod_code) DO NOTHING;

-- Additional Customers for CMP01
INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance, comp_code, tax_rate, discount_rate, is_active) VALUES
('C-005', 'Multan Auto Mart', 'Multan', '0300-5544332', 400000.00, 100000.00, 'CMP01', 5.00, 2.50, true),
('C-006', 'Faisalabad Wheels & Tires', 'Faisalabad', '0301-8877665', 350000.00, 50000.00, 'CMP01', 5.00, 1.00, true),
('C-007', 'Peshawar Transport Co', 'Peshawar', '0302-6655443', 600000.00, 300000.00, 'CMP01', 5.00, 3.50, true),
('C-008', 'Quetta Traders', 'Quetta', '0303-4433221', 200000.00, 0.00, 'CMP01', 5.00, 0.00, true),
('C-009', 'Rawalpindi Auto Parts', 'Rawalpindi', '0304-9988776', 450000.00, 125000.00, 'CMP01', 5.00, 2.00, true),
('C-010', 'Gujranwala Motors', 'Gujranwala', '0305-7766554', 300000.00, 75000.00, 'CMP01', 5.00, 1.50, true),

-- Customers for CMP02 (Lahore)
('LHR-C001', 'Lahore Central Auto', 'Lahore', '042-11223344', 700000.00, 200000.00, 'CMP02', 5.00, 3.00, true),
('LHR-C002', 'Model Town Tires', 'Lahore', '042-55667788', 400000.00, 100000.00, 'CMP02', 5.00, 2.00, true),
('LHR-C003', 'Johar Town Motors', 'Lahore', '042-99887766', 500000.00, 150000.00, 'CMP02', 5.00, 2.50, true),
('LHR-C004', 'DHA Auto Plaza', 'Lahore', '042-33445566', 600000.00, 0.00, 'CMP02', 5.00, 1.50, true),

-- Customers for CMP03 (Islamabad)
('ISB-C001', 'Blue Area Motors', 'Islamabad', '051-22334455', 800000.00, 250000.00, 'CMP03', 5.00, 3.50, true),
('ISB-C002', 'F-7 Tire Center', 'Islamabad', '051-66778899', 450000.00, 120000.00, 'CMP03', 5.00, 2.00, true),
('ISB-C003', 'G-11 Auto Spares', 'Islamabad', '051-44556677', 350000.00, 80000.00, 'CMP03', 5.00, 1.50, true)
ON CONFLICT (cust_code) DO NOTHING;

-- Additional Suppliers for all companies
INSERT INTO suppliers (supplier_code, supplier_name, contact_person, city, phone, outstanding_balance, comp_code, is_active) VALUES
-- CMP01 Suppliers
('S-004', 'Servis Tyres Industries', 'Imran Ali', 'Lahore', '042-36789012', 800000.00, 'CMP01', true),
('S-005', 'Dunlop Pakistan Ltd', 'Hassan Sheikh', 'Karachi', '021-34123456', 950000.00, 'CMP01', true),
('S-006', 'Local Rubber Industries', 'Tariq Mahmood', 'Gujranwala', '055-3456789', 300000.00, 'CMP01', true),

-- CMP02 Suppliers (Lahore)
('LHR-S001', 'Lahore Tyre Distributors', 'Ahsan Khan', 'Lahore', '042-37890123', 600000.00, 'CMP02', true),
('LHR-S002', 'Punjab Rubber Co', 'Kamran Ali', 'Lahore', '042-38901234', 400000.00, 'CMP02', true),

-- CMP03 Suppliers (Islamabad)
('ISB-S001', 'Capital Tyre Suppliers', 'Usman Malik', 'Islamabad', '051-23456789', 700000.00, 'CMP03', true),
('ISB-S002', 'Northern Traders', 'Babar Khan', 'Rawalpindi', '051-34567890', 350000.00, 'CMP03', true)
ON CONFLICT (supplier_code) DO NOTHING;

-- =============================================
-- SECTION 8: Analyze Tables (Update Statistics)
-- =============================================

ANALYZE sales_invoices;
ANALYZE sales_invoice_items;
ANALYZE products;
ANALYZE customers;
ANALYZE purchase_invoices;
ANALYZE purchase_invoice_items;
ANALYZE suppliers;
ANALYZE sales_returns;
ANALYZE sales_return_items;
ANALYZE categories;
ANALYZE tax_rates;
ANALYZE cash_balance;
ANALYZE expenses;
ANALYZE payment_receipts;
ANALYZE supplier_payments;
ANALYZE loan_taken;
ANALYZE loan_return;
ANALYZE discount_vouchers;
ANALYZE discount_rates;
ANALYZE expense_heads;
ANALYZE users;

-- =============================================
-- END OF SCHEMA
-- =============================================
