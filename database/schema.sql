-- Lalani Traders ERP Database Schema
-- Company Code: CMP01 (Lalani Traders)

-- Create companies table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS companies (
    comp_code VARCHAR(10) PRIMARY KEY,
    comp_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default company
INSERT INTO companies (comp_code, comp_name, address, phone, email)
VALUES ('CMP01', 'Lalani Traders', 'Karachi, Pakistan', '+92-21-1234567', 'info@lalanitraders.com')
ON CONFLICT (comp_code) DO NOTHING;

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N')),
    permissions TEXT[], -- Array of permission strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Categories for product classification
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Inventory table
CREATE TABLE IF NOT EXISTS products (
    prod_id SERIAL PRIMARY KEY,
    prod_code VARCHAR(20) UNIQUE NOT NULL,
    prod_name VARCHAR(200) NOT NULL,
    category_code VARCHAR(20) REFERENCES categories(category_code),
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    cust_id SERIAL PRIMARY KEY,
    cust_code VARCHAR(20) UNIQUE NOT NULL,
    cust_name VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    phone VARCHAR(20),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(20),
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Sales Invoices header table
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
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id)
);

-- Sales Invoice Items (line items)
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    item_id SERIAL PRIMARY KEY,
    inv_id INTEGER REFERENCES sales_invoices(inv_id) ON DELETE CASCADE,
    prod_code VARCHAR(20) REFERENCES products(prod_code),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cash Balance/Financial Transactions table
CREATE TABLE IF NOT EXISTS cash_balance (
    trans_id SERIAL PRIMARY KEY,
    trans_date DATE NOT NULL,
    trans_type VARCHAR(20) NOT NULL CHECK (trans_type IN ('SALES', 'PURCHASE', 'EXPENSE', 'RECEIPT', 'PAYMENT')),
    description TEXT,
    debit_amount DECIMAL(12,2) DEFAULT 0,  -- Money In
    credit_amount DECIMAL(12,2) DEFAULT 0, -- Money Out
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    expense_id SERIAL PRIMARY KEY,
    head_code VARCHAR(20) NOT NULL, -- Expense category code
    amount DECIMAL(12,2) NOT NULL,
    remarks TEXT,
    expense_date DATE NOT NULL,
    comp_code VARCHAR(10) REFERENCES companies(comp_code) DEFAULT 'CMP01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
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

-- Insert sample data for testing

-- Sample categories
INSERT INTO categories (category_code, category_name, description) VALUES
('TRUCK', 'Truck Tires', 'Heavy duty truck tires'),
('CAR', 'Passenger Car', 'Sedan and hatchback tires'),
('SUV', 'SUV & 4x4', 'Off-road and highway SUV tires'),
('TUBE', 'Inner Tubes', 'All sizes of inner tubes'),
('AGRI', 'Agricultural', 'Tractor and farm equipment tires')
ON CONFLICT (category_code) DO NOTHING;

-- Sample products
INSERT INTO products (prod_code, prod_name, category_code, unit_price, current_stock, min_stock_level) VALUES
('T-1001', 'Radial Truck Tire 295/80R22.5', 'TRUCK', 45000.00, 120, 20),
('T-1002', 'Sedan Comfort 195/65R15', 'CAR', 12000.00, 450, 50),
('TB-2001', 'Heavy Duty Tube 10.00-20', 'TUBE', 3500.00, 800, 100),
('T-1003', 'Off-Road Grip 265/70R17', 'SUV', 32000.00, 45, 10),
('T-1004', 'Tractor Rear 18.4-30', 'AGRI', 85000.00, 12, 5),
('T-1005', 'City Runner 175/70R13', 'CAR', 9500.00, 200, 30)
ON CONFLICT (prod_code) DO NOTHING;

-- Sample customers
INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance) VALUES
('C-001', 'Karachi Auto Parts', 'Karachi', '0300-1234567', 500000.00, 150000.00),
('C-002', 'Hyderabad Wheels', 'Hyderabad', '0300-7654321', 300000.00, 0.00),
('C-003', 'Sukkur Transport Spares', 'Sukkur', '0301-1122334', 200000.00, 75000.00),
('C-004', 'Larkana Tires', 'Larkana', '0302-9988776', 250000.00, 250000.00)
ON CONFLICT (cust_code) DO NOTHING;

-- Sample suppliers
INSERT INTO suppliers (supplier_code, supplier_name, contact_person, city, phone, outstanding_balance) VALUES
('S-001', 'General Tyre Pakistan', 'Ahmed Khan', 'Karachi', '021-34567890', 1200000.00),
('S-002', 'Panther Tyres Ltd', 'Bilal Ahmed', 'Lahore', '042-35678901', 500000.00),
('S-003', 'Global Rubber Corp', 'Mr. Smith', 'Dubai', '+971-50-1234567', 0.00)
ON CONFLICT (supplier_code) DO NOTHING;

-- Sample users (passwords are '123' - in production, these should be hashed)
INSERT INTO users (username, password, full_name, role, is_active, permissions) VALUES
('admin', '123', 'System Administrator', 'ADMIN', 'Y',
 ARRAY['INVENTORY_VIEW', 'INVENTORY_MANAGE', 'SALES_VIEW', 'SALES_MANAGE', 'FINANCE_VIEW', 'FINANCE_MANAGE', 'PARTNERS_VIEW', 'PARTNERS_MANAGE', 'USERS_VIEW', 'USERS_MANAGE', 'REPORTS_VIEW']),
('user', '123', 'Sales Agent', 'USER', 'Y',
 ARRAY['INVENTORY_VIEW', 'SALES_VIEW', 'SALES_MANAGE', 'PARTNERS_VIEW'])
ON CONFLICT (username) DO NOTHING;

-- Sample expenses
INSERT INTO expenses (head_code, amount, remarks, expense_date) VALUES
('FUEL', 5000.00, 'Delivery Van Fuel', '2023-10-01'),
('UTIL', 12000.00, 'Warehouse Electricity', '2023-10-02'),
('MAINT', 3500.00, 'Forklift Repair', '2023-10-10'),
('ENT', 2000.00, 'Client Lunch', '2023-10-15')
ON CONFLICT DO NOTHING;

-- Sample cash transactions
INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount) VALUES
('2023-10-01', 'RECEIPT', 'Payment from Karachi Auto Parts', 120000.00, 0.00),
('2023-10-01', 'EXPENSE', 'Fuel Expense', 0.00, 5000.00),
('2023-10-02', 'EXPENSE', 'Electricity Bill', 0.00, 12000.00),
('2023-10-05', 'SALES', 'Cash Sale - Walk in', 25000.00, 0.00),
('2023-10-08', 'PAYMENT', 'Payment to General Tyre', 0.00, 500000.00)
ON CONFLICT DO NOTHING;