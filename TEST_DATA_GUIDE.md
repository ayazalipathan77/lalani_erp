# 📊 Test Data Guide - Lalani ERP

**Comprehensive Functional Test Data for Local Testing**

---

## ✅ What Was Created

A comprehensive test data SQL file with realistic business data across **3 companies**:

**File**: `database/seed-test-data.sql`

---

## 📦 Test Data Contents

### **3 Companies**
1. **CMP01** - Lalani Traders (Karachi) - Main Branch
2. **CMP02** - Lalani Traders Lahore Branch
3. **CMP03** - Lalani Traders Islamabad Branch

### **Master Data**
- **27 Products** (10+ per company)
  - Truck tires, car tires, SUV tires
  - Motorcycle tires, industrial tires
  - Inner tubes
- **17 Customers** (across all companies)
  - With credit limits, outstanding balances
  - Different discount rates
- **9 Suppliers** (across all companies)
  - With outstanding balances
- **Additional Categories** (Bike, Industrial)

### **Transaction Data (Nov 2025 - Jan 2026)**

#### **Sales Invoices**: 29 Total
- **CMP01**: 22 invoices
  - Nov 2025: 10 invoices
  - Dec 2025: 10 invoices
  - Jan 2026: 2 invoices
- **CMP02 (Lahore)**: 7 invoices
- **CMP03 (Islamabad)**: 5 invoices

Each invoice includes:
- Multiple line items with products
- Discount calculations
- Tax calculations
- Net amounts

#### **Purchase Invoices**: 17 Total
- **CMP01**: 9 invoices
- **CMP02**: 4 invoices
- **CMP03**: 4 invoices

#### **Payment Receipts**: 18 Total
- Customer payments via:
  - Bank transfers
  - Cheques
  - Cash

#### **Supplier Payments**: 13 Total
- Payments to suppliers
- Various payment methods

#### **Expenses**: 33 Records
- Salaries (monthly)
- Rent
- Utilities
- Fuel
- Maintenance
- Marketing
- Office supplies
- Taxes

#### **Sales Returns**: 4 Records
- Returns with reason codes
- Credit notes

#### **Cash Balance Transactions**: 37 Records
- Receipts
- Payments
- Expenses
- Complete cash flow tracking

---

## 🚀 How to Apply Test Data

### **Method 1: Automatic (Recommended)**

The test data is automatically applied when you run:

```bash
npm run db:fresh
```

This will:
1. Drop all tables
2. Create schema with indexes
3. Insert basic seed data
4. **Automatically apply comprehensive test data**

### **Method 2: Manual Application**

If you already have the schema and just want to add test data:

```bash
cd lalani_erp
PGPASSWORD=ayaz12344321 psql -h 127.0.0.1 -U user -d lalani_erp -f database/seed-test-data.sql
```

---

## 📊 Data Summary After Reset

```
📦 Master Data:
   ✓ Companies: 3 (CMP01, CMP02, CMP03)
   ✓ Users: 2 (admin, user)
   ✓ Products: 27 (distributed across companies)
   ✓ Categories: 12
   ✓ Customers: 17
   ✓ Suppliers: 9

📈 Transaction Data:
   ✓ Sales Invoices: 29 (with ~50+ line items)
   ✓ Purchase Invoices: 17
   ✓ Payment Receipts: 18
   ✓ Supplier Payments: 13
   ✓ Expenses: 33
   ✓ Sales Returns: 4
   ✓ Cash Transactions: 37
```

---

## 🧪 Testing Scenarios

### **Test Company Filtering**

1. Login as admin
2. Switch between companies in header dropdown:
   - **CMP01** (Karachi) - Should show 22 invoices
   - **CMP02** (Lahore) - Should show 7 invoices
   - **CMP03** (Islamabad) - Should show 5 invoices

### **Test Sales Module**

- **View Invoices**: Browse invoices by company
- **Check Balances**: Some invoices are paid, some have balance due
- **Filter by Date**: Nov 2025, Dec 2025, Jan 2026
- **Customer Outstanding**: Check customers with balances

### **Test Purchase Module**

- **Purchase History**: View purchases by company
- **Supplier Balances**: Check supplier outstanding amounts
- **Stock Updates**: Verify stock levels match purchases

### **Test Finance Module**

- **Payment Receipts**: View customer payments
- **Supplier Payments**: View payments to suppliers
- **Expenses**: Monthly expenses (salaries, rent, utilities)
- **Cash Flow**: View cash balance transactions

### **Test Returns Module**

- **Sales Returns**: View return records
- **Credit Notes**: Check credit note generation

### **Test Dashboard**

- **Metrics**: Revenue, expenses, profit
- **Company Comparison**: Switch companies and see different metrics
- **Date Filters**: Filter by month/quarter

---

## 📋 Sample Data Details

### **CMP01 (Karachi) - Sample Invoice**

```
Invoice: INV-2025-0001
Date: 2025-11-01
Customer: C-001 (Karachi Auto Parts)
Items:
  - T-1001 (Radial Truck Tire) x 4 @ PKR 45,000 = PKR 180,000
  - Discount (2%): PKR 3,600
  - Tax (5%): PKR 8,820
  - Total: PKR 185,220
Status: Balance Due PKR 185,400
```

### **CMP02 (Lahore) - Sample Invoice**

```
Invoice: LHR-INV-0001
Date: 2025-11-05
Customer: LHR-C001 (Lahore Central Auto)
Items:
  - LHR-T001 (Lahore Special Radial) x 4 @ PKR 46,000 = PKR 184,000
  - Discount (3%): PKR 5,520
  - Tax (5%): PKR 8,924
  - Total: PKR 187,404
Status: Balance Due PKR 187,680
```

### **Sample Expense Records**

```
CMP01 - November 2025:
  - Salaries: PKR 450,000
  - Rent: PKR 150,000
  - Utilities: PKR 45,000
  - Fuel: PKR 32,000
  - Marketing: PKR 75,000
  Total: PKR 752,000
```

---

## 🎯 Key Features to Test

### ✅ **Multi-Company Support**
- Switch between CMP01, CMP02, CMP03
- Verify data isolation
- Check company-specific products

### ✅ **Financial Transactions**
- Create new invoices
- Record payments
- Generate reports

### ✅ **Inventory Management**
- Check stock levels
- View low stock alerts
- Track product movements

### ✅ **Customer Management**
- View customer balances
- Check credit limits
- Track payment history

### ✅ **Supplier Management**
- View supplier balances
- Track purchases
- Record payments

### ✅ **Reports & Analytics**
- Sales by period
- Purchase summary
- Expense breakdown
- Cash flow statement
- Customer aging
- Supplier aging

---

## 🔍 Quick Verification Queries

### Check Data Was Loaded

```sql
-- Check invoices by company
SELECT comp_code, COUNT(*) as invoice_count
FROM sales_invoices
GROUP BY comp_code
ORDER BY comp_code;

-- Expected:
-- CMP01: 22
-- CMP02: 7
-- CMP03: 5

-- Check products by company
SELECT comp_code, COUNT(*) as product_count
FROM products
GROUP BY comp_code
ORDER BY comp_code;

-- Expected:
-- CMP01: 16+
-- CMP02: 5+
-- CMP03: 5+

-- Check revenue by company
SELECT comp_code,
       SUM(total_amount) as total_revenue,
       SUM(balance_due) as total_outstanding
FROM sales_invoices
GROUP BY comp_code
ORDER BY comp_code;
```

---

## 💡 Customizing Test Data

To add more test data:

1. **Edit** `database/seed-test-data.sql`
2. **Add your data** following the existing patterns
3. **Reset database**: `npm run db:fresh`

### Example: Add New Invoice

```sql
INSERT INTO sales_invoices (inv_number, inv_date, cust_code, comp_code, sub_total, tax_amount, discount_amount, total_amount, balance_due, created_by) VALUES
('INV-2026-0003', '2026-01-03', 'C-001', 'CMP01', 100000.00, 5000.00, 2000.00, 103000.00, 103000.00, 1);

INSERT INTO sales_invoice_items (inv_id, prod_code, quantity, unit_price, discount_rate, tax_rate, line_total, discount_amount, tax_amount, net_amount) VALUES
((SELECT inv_id FROM sales_invoices WHERE inv_number = 'INV-2026-0003'), 'T-1002', 8, 12000.00, 2.00, 5.00, 96000.00, 1920.00, 4704.00, 98784.00);
```

---

## 🐛 Troubleshooting

### Issue: "Foreign key constraint violation"

**Cause**: Test data references master data that doesn't exist

**Solution**: Always run `npm run db:fresh` to reset everything from scratch

### Issue: "No data showing in application"

**Checks**:
1. Verify company is selected in header
2. Check date filters (data is from Nov 2025 - Jan 2026)
3. Verify user has correct permissions

### Issue: "Data seems incorrect"

**Solution**: Re-run database reset:
```bash
npm run db:fresh
```

---

## 📈 Performance Testing

With this test data, you can test:

### **Load Testing**
- 29 invoices across 3 companies
- ~50+ invoice line items
- Multiple concurrent transactions

### **Query Performance**
- Company-filtered queries (composite indexes)
- Date range queries
- Outstanding balance calculations
- Report generation

### **Data Integrity**
- Foreign key constraints
- Transaction consistency
- Balance calculations

---

## 🎓 Learning the System

Use this test data to:

1. **Understand Workflow**
   - See how invoices are created
   - Understand payment flow
   - Learn expense tracking

2. **Test Features**
   - Create test invoices
   - Record test payments
   - Generate test reports

3. **Explore Data**
   - Browse customers
   - View products
   - Check transactions

4. **Practice Operations**
   - Sales process
   - Purchase process
   - Finance operations

---

## ✅ Summary

You now have:

✅ **29 Sales Invoices** - Realistic invoice data
✅ **17 Purchase Invoices** - Supplier purchases
✅ **18 Payment Receipts** - Customer payments
✅ **13 Supplier Payments** - Payments to suppliers
✅ **33 Expense Records** - Operating expenses
✅ **4 Sales Returns** - Return transactions
✅ **37 Cash Transactions** - Complete cash flow
✅ **3 Companies** - Multi-tenant testing
✅ **27 Products** - Inventory items
✅ **17 Customers** - Customer base
✅ **9 Suppliers** - Supplier network

**Total Transactions**: 100+ records across all modules!

---

**Created**: 2026-01-02
**Purpose**: Functional testing with realistic business data
**How to Apply**: `npm run db:fresh`
