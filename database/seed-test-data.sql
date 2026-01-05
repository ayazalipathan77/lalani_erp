-- =============================================
-- Comprehensive Test Data for Lalani ERP
-- =============================================
-- This file contains realistic functional test data including:
-- - Multiple companies
-- - Sales invoices with items
-- - Purchase invoices with items
-- - Payment receipts
-- - Supplier payments
-- - Expenses
-- - Sales returns
-- - Cash transactions
-- =============================================

-- =============================================
-- SECTION 1: Additional Companies
-- =============================================

INSERT INTO companies (comp_code, comp_name, address, phone, email, gstin, pan_number) VALUES
('CMP02', 'Lalani Traders - Lahore Branch', 'Lahore, Pakistan', '+92-42-9876543', 'lahore@lalanitraders.com', '29ABCDE1234F1Z5', 'ABCDE1234F'),
('CMP03', 'Lalani Traders - Islamabad Branch', 'Islamabad, Pakistan', '+92-51-5555555', 'isb@lalanitraders.com', '29FGHIJ5678K1L5', 'FGHIJ5678K')
ON CONFLICT (comp_code) DO NOTHING;

-- =============================================
-- SECTION 2: Additional Categories, Tax Rates, Discount Rates
-- =============================================

INSERT INTO categories (category_code, category_name, description, comp_code) VALUES
-- CMP01 categories (already exist, adding more)
('BIKE', 'Motorcycle Tires', 'Motorcycle and scooter tires', 'CMP01'),
('INDUS', 'Industrial Tires', 'Forklift and industrial equipment tires', 'CMP01'),
-- CMP02 categories
('TRUCK', 'Truck Tires', 'Heavy duty truck tires', 'CMP02'),
('CAR', 'Passenger Car', 'Sedan and hatchback tires', 'CMP02'),
('TUBE', 'Inner Tubes', 'All sizes of inner tubes', 'CMP02'),
-- CMP03 categories
('SUV', 'SUV & 4x4', 'Off-road and highway SUV tires', 'CMP03'),
('BIKE', 'Motorcycle Tires', 'Motorcycle and scooter tires', 'CMP03')
ON CONFLICT (category_code) DO NOTHING;

-- =============================================
-- SECTION 3: Additional Products (Stock Inventory)
-- =============================================

-- CMP01 - Additional products
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

-- CMP02 - Lahore Branch Products
('LHR-T001', 'Lahore Special Radial 295/80R22.5', 'TRUCK', 36000.00, 46000.00, 100, 20, 'CMP02', 'GST5', true),
('LHR-T002', 'City Comfort 185/65R15', 'CAR', 9000.00, 11500.00, 400, 50, 'CMP02', 'GST5', true),
('LHR-T003', 'Premium Tube 10.00-20', 'TUBE', 3200.00, 3700.00, 500, 60, 'CMP02', 'GST5', true),
('LHR-T004', 'All Terrain 235/70R16', 'CAR', 15000.00, 18000.00, 150, 25, 'CMP02', 'GST5', true),
('LHR-T005', 'Budget Tube 7.50-16', 'TUBE', 1500.00, 1800.00, 800, 100, 'CMP02', 'GST5', true),

-- CMP03 - Islamabad Branch Products
('ISB-T001', 'Capital SUV Grip 265/65R17', 'SUV', 25000.00, 30000.00, 70, 15, 'CMP03', 'GST5', true),
('ISB-T002', 'Bike Racer 110/70-17', 'BIKE', 3000.00, 3800.00, 300, 40, 'CMP03', 'GST5', true),
('ISB-T003', 'Bike Cruiser 120/80-18', 'BIKE', 3500.00, 4200.00, 250, 35, 'CMP03', 'GST5', true),
('ISB-T004', 'Premium SUV 275/60R18', 'SUV', 30000.00, 36000.00, 50, 10, 'CMP03', 'GST5', true),
('ISB-T005', 'Economy SUV 225/65R17', 'SUV', 20000.00, 24000.00, 90, 18, 'CMP03', 'GST5', true)
ON CONFLICT (prod_code) DO NOTHING;

-- =============================================
-- SECTION 4: Additional Customers
-- =============================================

-- CMP01 Customers (add to existing)
INSERT INTO customers (cust_code, cust_name, city, phone, credit_limit, outstanding_balance, comp_code, tax_rate, discount_rate, is_active) VALUES
('C-005', 'Multan Auto Mart', 'Multan', '0300-5544332', 400000.00, 100000.00, 'CMP01', 5.00, 2.50, true),
('C-006', 'Faisalabad Wheels & Tires', 'Faisalabad', '0301-8877665', 350000.00, 50000.00, 'CMP01', 5.00, 1.00, true),
('C-007', 'Peshawar Transport Co', 'Peshawar', '0302-6655443', 600000.00, 300000.00, 'CMP01', 5.00, 3.50, true),
('C-008', 'Quetta Traders', 'Quetta', '0303-4433221', 200000.00, 0.00, 'CMP01', 5.00, 0.00, true),
('C-009', 'Rawalpindi Auto Parts', 'Rawalpindi', '0304-9988776', 450000.00, 125000.00, 'CMP01', 5.00, 2.00, true),
('C-010', 'Gujranwala Motors', 'Gujranwala', '0305-7766554', 300000.00, 75000.00, 'CMP01', 5.00, 1.50, true),

-- CMP02 Customers (Lahore)
('LHR-C001', 'Lahore Central Auto', 'Lahore', '042-11223344', 700000.00, 200000.00, 'CMP02', 5.00, 3.00, true),
('LHR-C002', 'Model Town Tires', 'Lahore', '042-55667788', 400000.00, 100000.00, 'CMP02', 5.00, 2.00, true),
('LHR-C003', 'Johar Town Motors', 'Lahore', '042-99887766', 500000.00, 150000.00, 'CMP02', 5.00, 2.50, true),
('LHR-C004', 'DHA Auto Plaza', 'Lahore', '042-33445566', 600000.00, 0.00, 'CMP02', 5.00, 1.50, true),

-- CMP03 Customers (Islamabad)
('ISB-C001', 'Blue Area Motors', 'Islamabad', '051-22334455', 800000.00, 250000.00, 'CMP03', 5.00, 3.50, true),
('ISB-C002', 'F-7 Tire Center', 'Islamabad', '051-66778899', 450000.00, 120000.00, 'CMP03', 5.00, 2.00, true),
('ISB-C003', 'G-11 Auto Spares', 'Islamabad', '051-44556677', 350000.00, 80000.00, 'CMP03', 5.00, 1.50, true)
ON CONFLICT (cust_code) DO NOTHING;

-- =============================================
-- SECTION 5: Additional Suppliers
-- =============================================

-- Suppliers for all companies
INSERT INTO suppliers (supplier_code, supplier_name, contact_person, city, phone, outstanding_balance, comp_code, is_active) VALUES
-- CMP01 Suppliers (add to existing)
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
-- SECTION 6: Sales Invoices with Items (CMP01)
-- =============================================

-- November 2025 Sales
INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, tax_amount, discount_amount, total_amount, balance_due, created_by) VALUES
('INV-2025-0001', '2025-11-01', 'C-001', 'CMP01', 180000.00, 9000.00, 3600.00, 185400.00, 185400.00, 1),
('INV-2025-0002', '2025-11-03', 'C-002', 'CMP01', 120000.00, 6000.00, 1800.00, 124200.00, 0.00, 1),
('INV-2025-0003', '2025-11-05', 'C-003', 'CMP01', 96000.00, 4800.00, 0.00, 100800.00, 50000.00, 1),
('INV-2025-0004', '2025-11-08', 'C-004', 'CMP01', 256000.00, 12800.00, 7680.00, 261120.00, 261120.00, 1),
('INV-2025-0005', '2025-11-10', 'C-005', 'CMP01', 85000.00, 4250.00, 2125.00, 87125.00, 87125.00, 1),
('INV-2025-0006', '2025-11-12', 'C-001', 'CMP01', 210000.00, 10500.00, 4200.00, 216300.00, 0.00, 1),
('INV-2025-0007', '2025-11-15', 'C-006', 'CMP01', 67500.00, 3375.00, 675.00, 70200.00, 70200.00, 1),
('INV-2025-0008', '2025-11-18', 'C-007', 'CMP01', 450000.00, 22500.00, 15750.00, 456750.00, 456750.00, 1),
('INV-2025-0009', '2025-11-20', 'C-002', 'CMP01', 140000.00, 7000.00, 2100.00, 144900.00, 144900.00, 1),
('INV-2025-0010', '2025-11-22', 'C-008', 'CMP01', 48000.00, 2400.00, 0.00, 50400.00, 50400.00, 1),

-- December 2025 Sales
('INV-2025-0011', '2025-12-01', 'C-003', 'CMP01', 192000.00, 9600.00, 0.00, 201600.00, 201600.00, 1),
('INV-2025-0012', '2025-12-03', 'C-009', 'CMP01', 108000.00, 5400.00, 2160.00, 111240.00, 111240.00, 1),
('INV-2025-0013', '2025-12-05', 'C-004', 'CMP01', 168000.00, 8400.00, 5040.00, 171360.00, 171360.00, 1),
('INV-2025-0014', '2025-12-08', 'C-010', 'CMP01', 81000.00, 4050.00, 1215.00, 83835.00, 83835.00, 1),
('INV-2025-0015', '2025-12-10', 'C-001', 'CMP01', 270000.00, 13500.00, 5400.00, 278100.00, 0.00, 1),
('INV-2025-0016', '2025-12-12', 'C-005', 'CMP01', 156000.00, 7800.00, 3900.00, 159900.00, 159900.00, 1),
('INV-2025-0017', '2025-12-15', 'C-006', 'CMP01', 76500.00, 3825.00, 765.00, 79560.00, 0.00, 1),
('INV-2025-0018', '2025-12-18', 'C-007', 'CMP01', 500000.00, 25000.00, 17500.00, 507500.00, 507500.00, 1),
('INV-2025-0019', '2025-12-20', 'C-002', 'CMP01', 95000.00, 4750.00, 1425.00, 98325.00, 98325.00, 1),
('INV-2025-0020', '2025-12-22', 'C-009', 'CMP01', 126000.00, 6300.00, 2520.00, 129780.00, 129780.00, 1),

-- January 2026 Sales
('INV-2026-0001', '2026-01-02', 'C-001', 'CMP01', 225000.00, 11250.00, 4500.00, 231750.00, 231750.00, 1),
('INV-2026-0002', '2026-01-02', 'C-003', 'CMP01', 144000.00, 7200.00, 0.00, 151200.00, 151200.00, 1)
ON CONFLICT (inv_number) DO NOTHING;

-- Sales Invoice Items for CMP01
INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, discount_rate, tax_rate, line_total, discount_amount, tax_amount, net_amount) VALUES
-- INV-2025-0001 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0001'), 'T-1001', 4, 45000.00, 2.00, 5.00, 180000.00, 3600.00, 8820.00, 185220.00),

-- INV-2025-0002 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0002'), 'T-1002', 10, 12000.00, 1.50, 5.00, 120000.00, 1800.00, 5910.00, 124110.00),

-- INV-2025-0003 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0003'), 'T-1003', 3, 32000.00, 0.00, 5.00, 96000.00, 0.00, 4800.00, 100800.00),

-- INV-2025-0004 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0004'), 'T-1004', 3, 85000.00, 3.00, 5.00, 255000.00, 7650.00, 12367.50, 259717.50),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0004'), 'TB-2001', 100, 3500.00, 3.00, 5.00, 350000.00, 10500.00, 16975.00, 355475.00),

-- INV-2025-0005 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0005'), 'T-1006', 5, 13500.00, 2.50, 5.00, 67500.00, 1687.50, 3290.63, 69102.63),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0005'), 'T-1007', 2, 8500.00, 2.50, 5.00, 17000.00, 425.00, 828.75, 17403.75),

-- INV-2025-0006 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0006'), 'T-1008', 10, 21000.00, 2.00, 5.00, 210000.00, 4200.00, 10290.00, 216090.00),

-- INV-2025-0007 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0007'), 'T-1002', 5, 12000.00, 1.00, 5.00, 60000.00, 600.00, 2970.00, 62370.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0007'), 'TB-2002', 5, 1500.00, 1.00, 5.00, 7500.00, 75.00, 371.25, 7796.25),

-- INV-2025-0008 items (Large truck order)
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0008'), 'T-1012', 10, 50000.00, 3.50, 5.00, 500000.00, 17500.00, 24125.00, 506625.00),

-- INV-2025-0009 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0009'), 'T-1006', 10, 13500.00, 1.50, 5.00, 135000.00, 2025.00, 6648.75, 139623.75),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0009'), 'TB-2003', 10, 550.00, 1.50, 5.00, 5500.00, 82.50, 270.88, 5688.38),

-- INV-2025-0010 items
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0010'), 'T-1009', 15, 3200.00, 0.00, 5.00, 48000.00, 0.00, 2400.00, 50400.00),

-- Add more items for remaining invoices (simplified for brevity)
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0011'), 'T-1001', 4, 45000.00, 0.00, 5.00, 180000.00, 0.00, 9000.00, 189000.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0011'), 'T-1002', 1, 12000.00, 0.00, 5.00, 12000.00, 0.00, 600.00, 12600.00),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0012'), 'T-1003', 3, 32000.00, 2.00, 5.00, 96000.00, 1920.00, 4704.00, 98784.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0012'), 'T-1006', 1, 13500.00, 2.00, 5.00, 13500.00, 270.00, 661.50, 13891.50),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0013'), 'T-1004', 2, 85000.00, 3.00, 5.00, 170000.00, 5100.00, 8245.00, 173145.00),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0014'), 'T-1007', 9, 8500.00, 1.50, 5.00, 76500.00, 1147.50, 3767.63, 79120.13),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0014'), 'TB-2003', 10, 550.00, 1.50, 5.00, 5500.00, 82.50, 270.88, 5688.38),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0015'), 'T-1001', 6, 45000.00, 2.00, 5.00, 270000.00, 5400.00, 13230.00, 277830.00),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0016'), 'T-1008', 6, 21000.00, 2.50, 5.00, 126000.00, 3150.00, 6142.50, 128992.50),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0016'), 'T-1006', 2, 13500.00, 2.50, 5.00, 27000.00, 675.00, 1316.25, 27641.25),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0017'), 'T-1002', 6, 12000.00, 1.00, 5.00, 72000.00, 720.00, 3564.00, 74844.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0017'), 'TB-2002', 3, 1500.00, 1.00, 5.00, 4500.00, 45.00, 222.75, 4677.75),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0018'), 'T-1012', 10, 50000.00, 3.50, 5.00, 500000.00, 17500.00, 24125.00, 506625.00),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0019'), 'T-1006', 7, 13500.00, 1.50, 5.00, 94500.00, 1417.50, 4654.13, 97736.63),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0020'), 'T-1003', 4, 32000.00, 2.00, 5.00, 128000.00, 2560.00, 6272.00, 131712.00),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2026-0001'), 'T-1001', 5, 45000.00, 2.00, 5.00, 225000.00, 4500.00, 11025.00, 231525.00),

((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2026-0002'), 'T-1008', 6, 21000.00, 0.00, 5.00, 126000.00, 0.00, 6300.00, 132300.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2026-0002'), 'T-1009', 6, 3200.00, 0.00, 5.00, 19200.00, 0.00, 960.00, 20160.00)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 7: Sales Invoices for CMP02 (Lahore)
-- =============================================

INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, tax_amount, discount_amount, total_amount, balance_due, created_by) VALUES
('LHR-INV-0001', '2025-11-05', 'LHR-C001', 'CMP02', 184000.00, 9200.00, 5520.00, 187680.00, 187680.00, 1),
('LHR-INV-0002', '2025-11-10', 'LHR-C002', 'CMP02', 115000.00, 5750.00, 2300.00, 118450.00, 0.00, 1),
('LHR-INV-0003', '2025-11-15', 'LHR-C003', 'CMP02', 148000.00, 7400.00, 3700.00, 151700.00, 151700.00, 1),
('LHR-INV-0004', '2025-12-01', 'LHR-C004', 'CMP02', 90000.00, 4500.00, 1350.00, 93150.00, 93150.00, 1),
('LHR-INV-0005', '2025-12-10', 'LHR-C001', 'CMP02', 222000.00, 11100.00, 6660.00, 226440.00, 0.00, 1),
('LHR-INV-0006', '2025-12-20', 'LHR-C002', 'CMP02', 72000.00, 3600.00, 1440.00, 74160.00, 74160.00, 1),
('LHR-INV-0007', '2026-01-02', 'LHR-C003', 'CMP02', 180000.00, 9000.00, 4500.00, 184500.00, 184500.00, 1)
ON CONFLICT (inv_number) DO NOTHING;

-- Sales Invoice Items for CMP02
INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, discount_rate, tax_rate, line_total, discount_amount, tax_amount, net_amount) VALUES
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0001'), 'LHR-T001', 4, 46000.00, 3.00, 5.00, 184000.00, 5520.00, 8924.00, 187404.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0002'), 'LHR-T002', 10, 11500.00, 2.00, 5.00, 115000.00, 2300.00, 5635.00, 118335.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0003'), 'LHR-T004', 8, 18000.00, 2.50, 5.00, 144000.00, 3600.00, 7020.00, 147420.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0003'), 'LHR-T003', 2, 3700.00, 2.50, 5.00, 7400.00, 185.00, 360.75, 7575.75),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0004'), 'LHR-T005', 50, 1800.00, 1.50, 5.00, 90000.00, 1350.00, 4432.50, 93082.50),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0005'), 'LHR-T001', 5, 46000.00, 3.00, 5.00, 230000.00, 6900.00, 11155.00, 234255.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0006'), 'LHR-T002', 6, 11500.00, 2.00, 5.00, 69000.00, 1380.00, 3381.00, 71001.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0006'), 'LHR-T005', 2, 1800.00, 2.00, 5.00, 3600.00, 72.00, 176.40, 3704.40),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0007'), 'LHR-T004', 10, 18000.00, 2.50, 5.00, 180000.00, 4500.00, 8775.00, 184275.00)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 8: Sales Invoices for CMP03 (Islamabad)
-- =============================================

INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, tax_amount, discount_amount, total_amount, balance_due, created_by) VALUES
('ISB-INV-0001', '2025-11-08', 'ISB-C001', 'CMP03', 216000.00, 10800.00, 7560.00, 219240.00, 219240.00, 1),
('ISB-INV-0002', '2025-11-18', 'ISB-C002', 'CMP03', 114000.00, 5700.00, 2280.00, 117420.00, 0.00, 1),
('ISB-INV-0003', '2025-12-05', 'ISB-C003', 'CMP03', 96000.00, 4800.00, 1440.00, 99360.00, 99360.00, 1),
('ISB-INV-0004', '2025-12-15', 'ISB-C001', 'CMP02', 288000.00, 14400.00, 10080.00, 292320.00, 292320.00, 1),
('ISB-INV-0005', '2026-01-02', 'ISB-C002', 'CMP03', 126000.00, 6300.00, 2520.00, 129780.00, 129780.00, 1)
ON CONFLICT (inv_number) DO NOTHING;

-- Sales Invoice Items for CMP03
INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, discount_rate, tax_rate, line_total, discount_amount, tax_amount, net_amount) VALUES
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'ISB-INV-0001'), 'ISB-T004', 6, 36000.00, 3.50, 5.00, 216000.00, 7560.00, 10422.00, 218862.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'ISB-INV-0002'), 'ISB-T002', 30, 3800.00, 2.00, 5.00, 114000.00, 2280.00, 5586.00, 117306.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'ISB-INV-0003'), 'ISB-T005', 4, 24000.00, 1.50, 5.00, 96000.00, 1440.00, 4728.00, 99288.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'ISB-INV-0004'), 'ISB-T004', 8, 36000.00, 3.50, 5.00, 288000.00, 10080.00, 13896.00, 291816.00),
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'ISB-INV-0005'), 'ISB-T003', 30, 4200.00, 2.00, 5.00, 126000.00, 2520.00, 6174.00, 129654.00)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 9: Purchase Invoices (All Companies)
-- =============================================

-- CMP01 Purchase Invoices
INSERT INTO purchase_invoices (purchase_number, purchase_date, supplier_code, total_amount, status, comp_code, created_by) VALUES
('PINV-2025-0001', '2025-10-15', 'S-001', 4200000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0002', '2025-10-25', 'S-002', 1500000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0003', '2025-11-05', 'S-004', 2400000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0004', '2025-11-15', 'S-003', 800000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0005', '2025-11-25', 'S-005', 2850000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0006', '2025-12-05', 'S-001', 3600000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0007', '2025-12-15', 'S-006', 900000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2025-0008', '2025-12-25', 'S-004', 1950000.00, 'RECEIVED', 'CMP01', 1),
('PINV-2026-0001', '2026-01-01', 'S-002', 1800000.00, 'RECEIVED', 'CMP01', 1)
ON CONFLICT (purchase_number) DO NOTHING;

-- Purchase Invoice Items for CMP01
INSERT INTO purchase_invoice_items (purchase_id, prod_code, quantity, unit_price, line_total) VALUES
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0001'), 'T-1001', 120, 35000.00, 4200000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0002'), 'T-1002', 150, 9500.00, 1425000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0002'), 'TB-2001', 25, 3000.00, 75000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0003'), 'T-1006', 200, 11000.00, 2200000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0003'), 'T-1007', 20, 7000.00, 140000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0004'), 'TB-2002', 500, 1200.00, 600000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0004'), 'TB-2003', 500, 400.00, 200000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0005'), 'T-1012', 60, 42000.00, 2520000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0005'), 'TB-2004', 100, 3500.00, 350000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0006'), 'T-1001', 100, 35000.00, 3500000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0006'), 'T-1008', 10, 18000.00, 180000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0007'), 'T-1009', 300, 2500.00, 750000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0007'), 'T-1010', 50, 2800.00, 140000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0008'), 'T-1003', 60, 28000.00, 1680000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2025-0008'), 'T-1011', 6, 45000.00, 270000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2026-0001'), 'T-1006', 150, 11000.00, 1650000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'PINV-2026-0001'), 'TB-2001', 50, 3000.00, 150000.00)
ON CONFLICT DO NOTHING;

-- CMP02 Purchase Invoices (Lahore)
INSERT INTO purchase_invoices (purchase_number, purchase_date, supplier_code, total_amount, status, comp_code, created_by) VALUES
('LHR-PINV-0001', '2025-10-20', 'LHR-S001', 1840000.00, 'RECEIVED', 'CMP02', 1),
('LHR-PINV-0002', '2025-11-10', 'LHR-S002', 1350000.00, 'RECEIVED', 'CMP02', 1),
('LHR-PINV-0003', '2025-12-05', 'LHR-S001', 2200000.00, 'RECEIVED', 'CMP02', 1),
('LHR-PINV-0004', '2025-12-20', 'LHR-S002', 800000.00, 'RECEIVED', 'CMP02', 1)
ON CONFLICT (purchase_number) DO NOTHING;

-- Purchase Invoice Items for CMP02
INSERT INTO purchase_invoice_items (purchase_id, prod_code, quantity, unit_price, line_total) VALUES
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'LHR-PINV-0001'), 'LHR-T001', 50, 36000.00, 1800000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'LHR-PINV-0001'), 'LHR-T005', 30, 1500.00, 45000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'LHR-PINV-0002'), 'LHR-T002', 150, 9000.00, 1350000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'LHR-PINV-0003'), 'LHR-T004', 100, 15000.00, 1500000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'LHR-PINV-0003'), 'LHR-T003', 200, 3200.00, 640000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'LHR-PINV-0004'), 'LHR-T005', 500, 1500.00, 750000.00)
ON CONFLICT DO NOTHING;

-- CMP03 Purchase Invoices (Islamabad)
INSERT INTO purchase_invoices (purchase_number, purchase_date, supplier_code, total_amount, status, comp_code, created_by) VALUES
('ISB-PINV-0001', '2025-10-18', 'ISB-S001', 2100000.00, 'RECEIVED', 'CMP03', 1),
('ISB-PINV-0002', '2025-11-12', 'ISB-S002', 1260000.00, 'RECEIVED', 'CMP03', 1),
('ISB-PINV-0003', '2025-12-08', 'ISB-S001', 1800000.00, 'RECEIVED', 'CMP03', 1),
('ISB-PINV-0004', '2025-12-22', 'ISB-S002', 900000.00, 'RECEIVED', 'CMP03', 1)
ON CONFLICT (purchase_number) DO NOTHING;

-- Purchase Invoice Items for CMP03
INSERT INTO purchase_invoice_items (purchase_id, prod_code, quantity, unit_price, line_total) VALUES
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0001'), 'ISB-T004', 60, 30000.00, 1800000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0001'), 'ISB-T005', 15, 20000.00, 300000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0002'), 'ISB-T002', 300, 3000.00, 900000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0002'), 'ISB-T003', 100, 3500.00, 350000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0003'), 'ISB-T001', 60, 25000.00, 1500000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0003'), 'ISB-T005', 15, 20000.00, 300000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0004'), 'ISB-T002', 200, 3000.00, 600000.00),
((SELECT purchase_id FROM purchase_invoices WHERE purchase_number = 'ISB-PINV-0004'), 'ISB-T003', 80, 3500.00, 280000.00)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 10: Payment Receipts (Customer Payments)
-- =============================================

-- CMP01 Payment Receipts
INSERT INTO payment_receipts (receipt_number, receipt_date, cust_code, amount, payment_method, reference_number, status, comp_code, created_by) VALUES
('RCP-2025-0001', '2025-11-05', 'C-001', 185400.00, 'Bank Transfer', 'TRF-001', 'COMPLETED', 'CMP01', 1),
('RCP-2025-0002', '2025-11-08', 'C-002', 124200.00, 'Cheque', 'CHQ-5566', 'COMPLETED', 'CMP01', 1),
('RCP-2025-0003', '2025-11-12', 'C-003', 50800.00, 'Cash', NULL, 'COMPLETED', 'CMP01', 1),
('RCP-2025-0004', '2025-11-18', 'C-001', 216300.00, 'Bank Transfer', 'TRF-002', 'COMPLETED', 'CMP01', 1),
('RCP-2025-0005', '2025-11-25', 'C-006', 70200.00, 'Cash', NULL, 'COMPLETED', 'CMP01', 1),
('RCP-2025-0006', '2025-12-05', 'C-009', 111240.00, 'Cheque', 'CHQ-7788', 'COMPLETED', 'CMP01', 1),
('RCP-2025-0007', '2025-12-12', 'C-001', 278100.00, 'Bank Transfer', 'TRF-003', 'COMPLETED', 'CMP01', 1),
('RCP-2025-0008', '2025-12-18', 'C-006', 79560.00, 'Cash', NULL, 'COMPLETED', 'CMP01', 1),
('RCP-2025-0009', '2025-12-22', 'C-005', 100000.00, 'Bank Transfer', 'TRF-004', 'COMPLETED', 'CMP01', 1)
ON CONFLICT (receipt_number) DO NOTHING;

-- CMP02 Payment Receipts (Lahore)
INSERT INTO payment_receipts (receipt_number, receipt_date, cust_code, amount, payment_method, reference_number, status, comp_code, created_by) VALUES
('LHR-RCP-0001', '2025-11-12', 'LHR-C002', 118450.00, 'Bank Transfer', 'LHR-TRF-001', 'COMPLETED', 'CMP02', 1),
('LHR-RCP-0002', '2025-12-08', 'LHR-C001', 187680.00, 'Cheque', 'LHR-CHQ-1122', 'COMPLETED', 'CMP02', 1),
('LHR-RCP-0003', '2025-12-15', 'LHR-C004', 93150.00, 'Bank Transfer', 'LHR-TRF-002', 'COMPLETED', 'CMP02', 1),
('LHR-RCP-0004', '2025-12-28', 'LHR-C001', 226440.00, 'Bank Transfer', 'LHR-TRF-003', 'COMPLETED', 'CMP02', 1)
ON CONFLICT (receipt_number) DO NOTHING;

-- CMP03 Payment Receipts (Islamabad)
INSERT INTO payment_receipts (receipt_number, receipt_date, cust_code, amount, payment_method, reference_number, status, comp_code, created_by) VALUES
('ISB-RCP-0001', '2025-11-20', 'ISB-C002', 117420.00, 'Bank Transfer', 'ISB-TRF-001', 'COMPLETED', 'CMP03', 1),
('ISB-RCP-0002', '2025-12-18', 'ISB-C001', 219240.00, 'Cheque', 'ISB-CHQ-3344', 'COMPLETED', 'CMP03', 1)
ON CONFLICT (receipt_number) DO NOTHING;

-- =============================================
-- SECTION 11: Supplier Payments
-- =============================================

-- CMP01 Supplier Payments
INSERT INTO supplier_payments (payment_number, payment_date, supplier_code, amount, payment_method, reference_number, status, comp_code, created_by) VALUES
('PAY-2025-0001', '2025-10-25', 'S-001', 2000000.00, 'Bank Transfer', 'SUPP-TRF-001', 'COMPLETED', 'CMP01', 1),
('PAY-2025-0002', '2025-11-05', 'S-002', 1500000.00, 'Cheque', 'SUPP-CHQ-1001', 'COMPLETED', 'CMP01', 1),
('PAY-2025-0003', '2025-11-15', 'S-004', 1800000.00, 'Bank Transfer', 'SUPP-TRF-002', 'COMPLETED', 'CMP01', 1),
('PAY-2025-0004', '2025-11-28', 'S-005', 2000000.00, 'Bank Transfer', 'SUPP-TRF-003', 'COMPLETED', 'CMP01', 1),
('PAY-2025-0005', '2025-12-10', 'S-001', 3000000.00, 'Bank Transfer', 'SUPP-TRF-004', 'COMPLETED', 'CMP01', 1),
('PAY-2025-0006', '2025-12-20', 'S-006', 600000.00, 'Cheque', 'SUPP-CHQ-1002', 'COMPLETED', 'CMP01', 1),
('PAY-2025-0007', '2025-12-28', 'S-004', 1500000.00, 'Bank Transfer', 'SUPP-TRF-005', 'COMPLETED', 'CMP01', 1)
ON CONFLICT (payment_number) DO NOTHING;

-- CMP02 Supplier Payments (Lahore)
INSERT INTO supplier_payments (payment_number, payment_date, supplier_code, amount, payment_method, reference_number, status, comp_code, created_by) VALUES
('LHR-PAY-0001', '2025-11-01', 'LHR-S001', 1500000.00, 'Bank Transfer', 'LHR-SUPP-TRF-001', 'COMPLETED', 'CMP02', 1),
('LHR-PAY-0002', '2025-11-20', 'LHR-S002', 1000000.00, 'Bank Transfer', 'LHR-SUPP-TRF-002', 'COMPLETED', 'CMP02', 1),
('LHR-PAY-0003', '2025-12-15', 'LHR-S001', 1800000.00, 'Cheque', 'LHR-SUPP-CHQ-2001', 'COMPLETED', 'CMP02', 1)
ON CONFLICT (payment_number) DO NOTHING;

-- CMP03 Supplier Payments (Islamabad)
INSERT INTO supplier_payments (payment_number, payment_date, supplier_code, amount, payment_method, reference_number, status, comp_code, created_by) VALUES
('ISB-PAY-0001', '2025-11-05', 'ISB-S001', 1800000.00, 'Bank Transfer', 'ISB-SUPP-TRF-001', 'COMPLETED', 'CMP03', 1),
('ISB-PAY-0002', '2025-11-25', 'ISB-S002', 900000.00, 'Bank Transfer', 'ISB-SUPP-TRF-002', 'COMPLETED', 'CMP03', 1),
('ISB-PAY-0003', '2025-12-20', 'ISB-S001', 1500000.00, 'Cheque', 'ISB-SUPP-CHQ-3001', 'COMPLETED', 'CMP03', 1)
ON CONFLICT (payment_number) DO NOTHING;

-- =============================================
-- SECTION 12: Expenses (All Companies)
-- =============================================

-- CMP01 Expenses
INSERT INTO expenses (expense_head_code, amount, remarks, expense_date, comp_code, created_by) VALUES
('SALARY', 450000.00, 'November 2025 Staff Salaries', '2025-11-30', 'CMP01', 1),
('RENT', 150000.00, 'November 2025 Warehouse Rent', '2025-11-01', 'CMP01', 1),
('UTIL', 45000.00, 'November 2025 Electricity Bill', '2025-11-05', 'CMP01', 1),
('FUEL', 32000.00, 'Delivery Van Fuel - November', '2025-11-15', 'CMP01', 1),
('MAINT', 28000.00, 'Warehouse Equipment Maintenance', '2025-11-20', 'CMP01', 1),
('MARKETING', 75000.00, 'Facebook Ads Campaign', '2025-11-10', 'CMP01', 1),
('OFFICE', 18000.00, 'Stationery and Supplies', '2025-11-12', 'CMP01', 1),
('TAX', 85000.00, 'Property Tax Payment', '2025-11-25', 'CMP01', 1),

('SALARY', 450000.00, 'December 2025 Staff Salaries', '2025-12-30', 'CMP01', 1),
('RENT', 150000.00, 'December 2025 Warehouse Rent', '2025-12-01', 'CMP01', 1),
('UTIL', 52000.00, 'December 2025 Electricity Bill', '2025-12-05', 'CMP01', 1),
('FUEL', 38000.00, 'Delivery Van Fuel - December', '2025-12-15', 'CMP01', 1),
('MAINT', 65000.00, 'Forklift Major Service', '2025-12-10', 'CMP01', 1),
('TRAVEL', 42000.00, 'Business Trip to Lahore', '2025-12-08', 'CMP01', 1),
('MISC', 15000.00, 'Client Entertainment', '2025-12-18', 'CMP01', 1)
ON CONFLICT DO NOTHING;

-- CMP02 Expenses (Lahore)
INSERT INTO expenses (expense_head_code, amount, remarks, expense_date, comp_code, created_by) VALUES
('SALARY', 350000.00, 'November 2025 Staff Salaries - Lahore', '2025-11-30', 'CMP02', 1),
('RENT', 120000.00, 'November 2025 Office Rent - Lahore', '2025-11-01', 'CMP02', 1),
('UTIL', 35000.00, 'November 2025 Utilities - Lahore', '2025-11-05', 'CMP02', 1),
('FUEL', 25000.00, 'Vehicle Fuel - November', '2025-11-15', 'CMP02', 1),
('MARKETING', 60000.00, 'Local Newspaper Ads', '2025-11-20', 'CMP02', 1),

('SALARY', 350000.00, 'December 2025 Staff Salaries - Lahore', '2025-12-30', 'CMP02', 1),
('RENT', 120000.00, 'December 2025 Office Rent - Lahore', '2025-12-01', 'CMP02', 1),
('UTIL', 38000.00, 'December 2025 Utilities - Lahore', '2025-12-05', 'CMP02', 1),
('FUEL', 28000.00, 'Vehicle Fuel - December', '2025-12-15', 'CMP02', 1),
('OFFICE', 12000.00, 'Office Supplies', '2025-12-10', 'CMP02', 1)
ON CONFLICT DO NOTHING;

-- CMP03 Expenses (Islamabad)
INSERT INTO expenses (expense_head_code, amount, remarks, expense_date, comp_code, created_by) VALUES
('SALARY', 280000.00, 'November 2025 Staff Salaries - Islamabad', '2025-11-30', 'CMP03', 1),
('RENT', 100000.00, 'November 2025 Office Rent - Islamabad', '2025-11-01', 'CMP03', 1),
('UTIL', 28000.00, 'November 2025 Utilities - Islamabad', '2025-11-05', 'CMP03', 1),
('FUEL', 22000.00, 'Vehicle Fuel - November', '2025-11-15', 'CMP03', 1),

('SALARY', 280000.00, 'December 2025 Staff Salaries - Islamabad', '2025-12-30', 'CMP03', 1),
('RENT', 100000.00, 'December 2025 Office Rent - Islamabad', '2025-12-01', 'CMP03', 1),
('UTIL', 32000.00, 'December 2025 Utilities - Islamabad', '2025-12-05', 'CMP03', 1),
('FUEL', 25000.00, 'Vehicle Fuel - December', '2025-12-15', 'CMP03', 1),
('MAINT', 18000.00, 'Vehicle Service', '2025-12-12', 'CMP03', 1)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 13: Sales Returns (Sample Data)
-- =============================================

-- CMP01 Sales Returns
INSERT INTO sales_returns (return_number, return_date, inv_id, cust_code, total_amount, status, comp_code, created_by) VALUES
('RET-2025-0001', '2025-11-08', (SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0001'), 'C-001', 45000.00, 'COMPLETED', 'CMP01', 1),
('RET-2025-0002', '2025-11-22', (SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0006'), 'C-001', 21000.00, 'COMPLETED', 'CMP01', 1),
('RET-2025-0003', '2025-12-08', (SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2025-0011'), 'C-003', 45000.00, 'COMPLETED', 'CMP01', 1)
ON CONFLICT (return_number) DO NOTHING;

-- Sales Return Items
INSERT INTO sales_return_items (return_id, prod_code, quantity, unit_price, line_total, discount_rate, tax_rate, discount_amount, tax_amount, net_amount) VALUES
((SELECT return_id FROM sales_returns WHERE return_number = 'RET-2025-0001'), 'T-1001', 1, 45000.00, 45000.00, 2.00, 5.00, 900.00, 2205.00, 46305.00),
((SELECT return_id FROM sales_returns WHERE return_number = 'RET-2025-0002'), 'T-1008', 1, 21000.00, 21000.00, 2.00, 5.00, 420.00, 1029.00, 21609.00),
((SELECT return_id FROM sales_returns WHERE return_number = 'RET-2025-0003'), 'T-1001', 1, 45000.00, 45000.00, 0.00, 5.00, 0.00, 2250.00, 47250.00)
ON CONFLICT DO NOTHING;

-- CMP02 Sales Returns (Lahore)
INSERT INTO sales_returns (return_number, return_date, inv_id, cust_code, total_amount, status, comp_code, created_by) VALUES
('LHR-RET-0001', '2025-11-18', (SELECT inv_id FROM sales_invoices WHERE inv_number = 'LHR-INV-0002'), 'LHR-C002', 11500.00, 'COMPLETED', 'CMP02', 1)
ON CONFLICT (return_number) DO NOTHING;

INSERT INTO sales_return_items (return_id, prod_code, quantity, unit_price, line_total, discount_rate, tax_rate, discount_amount, tax_amount, net_amount) VALUES
((SELECT return_id FROM sales_returns WHERE return_number = 'LHR-RET-0001'), 'LHR-T002', 1, 11500.00, 11500.00, 2.00, 5.00, 230.00, 563.50, 11833.50)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 14: Cash Balance Transactions
-- =============================================

-- CMP01 Cash Balance
INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by) VALUES
('2025-11-05', 'RECEIPT', 'Payment from C-001 - INV-2025-0001', 185400.00, 0.00, 'CMP01', 1),
('2025-11-08', 'RECEIPT', 'Payment from C-002 - INV-2025-0002', 124200.00, 0.00, 'CMP01', 1),
('2025-11-12', 'RECEIPT', 'Partial payment from C-003', 50800.00, 0.00, 'CMP01', 1),
('2025-10-25', 'PAYMENT', 'Payment to S-001 - PINV-2025-0001', 0.00, 2000000.00, 'CMP01', 1),
('2025-11-05', 'PAYMENT', 'Payment to S-002 - PINV-2025-0002', 0.00, 1500000.00, 'CMP01', 1),
('2025-11-05', 'EXPENSE', 'November Utilities Payment', 0.00, 45000.00, 'CMP01', 1),
('2025-11-15', 'EXPENSE', 'Vehicle Fuel', 0.00, 32000.00, 'CMP01', 1),
('2025-11-18', 'RECEIPT', 'Payment from C-001 - INV-2025-0006', 216300.00, 0.00, 'CMP01', 1),
('2025-11-25', 'RECEIPT', 'Payment from C-006', 70200.00, 0.00, 'CMP01', 1),
('2025-11-30', 'EXPENSE', 'November Staff Salaries', 0.00, 450000.00, 'CMP01', 1),
('2025-12-05', 'RECEIPT', 'Payment from C-009', 111240.00, 0.00, 'CMP01', 1),
('2025-12-10', 'PAYMENT', 'Payment to S-001', 0.00, 3000000.00, 'CMP01', 1),
('2025-12-12', 'RECEIPT', 'Payment from C-001 - INV-2025-0015', 278100.00, 0.00, 'CMP01', 1),
('2025-12-18', 'RECEIPT', 'Payment from C-006', 79560.00, 0.00, 'CMP01', 1),
('2025-12-30', 'EXPENSE', 'December Staff Salaries', 0.00, 450000.00, 'CMP01', 1)
ON CONFLICT DO NOTHING;

-- CMP02 Cash Balance (Lahore)
INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by) VALUES
('2025-11-12', 'RECEIPT', 'Payment from LHR-C002', 118450.00, 0.00, 'CMP02', 1),
('2025-11-01', 'PAYMENT', 'Payment to LHR-S001', 0.00, 1500000.00, 'CMP02', 1),
('2025-11-05', 'EXPENSE', 'November Utilities', 0.00, 35000.00, 'CMP02', 1),
('2025-11-30', 'EXPENSE', 'November Salaries', 0.00, 350000.00, 'CMP02', 1),
('2025-12-08', 'RECEIPT', 'Payment from LHR-C001', 187680.00, 0.00, 'CMP02', 1),
('2025-12-15', 'PAYMENT', 'Payment to LHR-S001', 0.00, 1800000.00, 'CMP02', 1),
('2025-12-30', 'EXPENSE', 'December Salaries', 0.00, 350000.00, 'CMP02', 1)
ON CONFLICT DO NOTHING;

-- CMP03 Cash Balance (Islamabad)
INSERT INTO cash_balance (trans_date, trans_type, description, debit_amount, credit_amount, comp_code, created_by) VALUES
('2025-11-20', 'RECEIPT', 'Payment from ISB-C002', 117420.00, 0.00, 'CMP03', 1),
('2025-11-05', 'PAYMENT', 'Payment to ISB-S001', 0.00, 1800000.00, 'CMP03', 1),
('2025-11-05', 'EXPENSE', 'November Utilities', 0.00, 28000.00, 'CMP03', 1),
('2025-11-30', 'EXPENSE', 'November Salaries', 0.00, 280000.00, 'CMP03', 1),
('2025-12-18', 'RECEIPT', 'Payment from ISB-C001', 219240.00, 0.00, 'CMP03', 1),
('2025-12-20', 'PAYMENT', 'Payment to ISB-S001', 0.00, 1500000.00, 'CMP03', 1),
('2025-12-30', 'EXPENSE', 'December Salaries', 0.00, 280000.00, 'CMP03', 1)
ON CONFLICT DO NOTHING;

-- =============================================
-- END OF COMPREHENSIVE TEST DATA
-- =============================================
