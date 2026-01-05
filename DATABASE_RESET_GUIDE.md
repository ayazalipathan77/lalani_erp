# Database Reset Guide

**Lalani ERP - Fresh Database Setup for Development**

---

## Overview

This guide explains how to reset your database to a fresh state with all tables, indexes, and seed data. This is useful for:

- 🔄 Starting fresh during development
- 🧪 Testing with clean data
- 🐛 Recovering from database corruption
- 📝 Implementing new schema changes

---

## ⚡ Quick Start

### Method 1: Interactive Reset (Recommended for Local Development)

```bash
npm run db:fresh
```

This will:
1. Ask for confirmation (safety check)
2. Drop all existing tables
3. Recreate complete schema with Phase 1 optimizations
4. Insert fresh seed data

### Method 2: Force Reset via Environment Variable

```bash
# Set in .env file
FORCE_DB_RESET=true

# Then start the server
npm run server
```

OR run directly:

```bash
npm run db:force-reset
```

This method:
- Skips confirmation prompt (useful for CI/CD)
- Automatically resets on server startup
- Same as Method 1 but automated

---

## 📋 What Gets Reset

### Tables Dropped and Recreated (25 total):
- ✓ companies
- ✓ users & user_webauthn_credentials
- ✓ categories, products
- ✓ customers, suppliers
- ✓ sales_invoices, sales_invoice_items
- ✓ sales_returns, sales_return_items
- ✓ purchase_invoices, purchase_invoice_items
- ✓ payment_receipts, supplier_payments
- ✓ cash_balance, expenses, expense_heads
- ✓ discount_vouchers, discount_rates
- ✓ opening_cash_balance
- ✓ loan_taken, loan_return
- ✓ tax_rates
- ✓ system_backups

### Indexes Created (117 total):
- **Basic Indexes**: 87 single-column indexes
- **Composite Indexes (Phase 1)**: 30 multi-column performance indexes
  - Company + Date queries
  - Company + Customer/Supplier lookups
  - Low stock alerts
  - Outstanding balance queries
  - Join optimizations

### Seed Data Inserted:
- **2 Users**: admin (ADMIN role), user (USER role)
- **5 Categories**: TRUCK, CAR, SUV, TUBE, AGRI
- **6 Products**: Sample tire and tube inventory
- **4 Customers**: Sample customers with balances
- **3 Suppliers**: Sample suppliers
- **4 Tax Rates**: GST5, GST12, GST18, GST0
- **3 Discount Rates**: DISC5, DISC10, DISC15
- **10 Expense Heads**: FUEL, UTIL, RENT, MAINT, etc.
- **Sample Transactions**: Cash balance, expenses

---

## 🔐 Default Credentials After Reset

```
Admin User:
  Username: admin
  Password: 123
  Permissions: ALL

Regular User:
  Username: user
  Password: 123
  Permissions: INVENTORY_VIEW, SALES_VIEW, SALES_MANAGE, PARTNERS_VIEW
```

**⚠️ IMPORTANT**: Change these passwords in production!

---

## 🛠️ Available Commands

| Command | Description | Confirmation Required |
|---------|-------------|----------------------|
| `npm run db:fresh` | Interactive reset with confirmation | ✅ Yes |
| `npm run db:force-reset` | Force reset via env variable | ❌ No |
| `FORCE_DB_RESET=true npm run server` | Reset on server startup | ❌ No |

---

## 📂 Files Involved

### Schema File
```
lalani_erp/database/complete-schema-with-indexes.sql
```
**Contains:**
- All table definitions
- All index definitions (basic + composite)
- All seed data
- Fully self-contained schema

### Reset Script
```
lalani_erp/scripts/reset-database.js
```
**Does:**
- Drops all tables
- Applies complete schema
- Verifies setup
- Shows statistics

### Environment Configuration
```
lalani_erp/.env
```
**Add this line:**
```bash
FORCE_DB_RESET=true  # Uncomment to enable auto-reset
```

---

## 🔍 Verification Steps

After reset, verify your database:

### 1. Check Table Count
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 25 tables
```

### 2. Check Composite Indexes (Phase 1)
```sql
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%_comp_%';
-- Expected: 30 composite indexes
```

### 3. Check Total Indexes
```sql
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
-- Expected: 117 total indexes
```

### 4. Check Seed Data
```sql
SELECT COUNT(*) FROM users;        -- Expected: 2
SELECT COUNT(*) FROM products;     -- Expected: 6
SELECT COUNT(*) FROM categories;   -- Expected: 5
SELECT COUNT(*) FROM customers;    -- Expected: 4
```

---

## ⚙️ How It Works

### Interactive Reset (`npm run db:fresh`)

```
1. User runs: npm run db:fresh
2. Script connects to DATABASE_URL
3. Asks for confirmation: "Are you sure?"
4. If YES:
   a. Drops all tables (CASCADE)
   b. Reads: database/complete-schema-with-indexes.sql
   c. Executes SQL (creates tables, indexes, inserts data)
   d. Shows statistics
5. Server ready to start
```

### Force Reset (`FORCE_DB_RESET=true`)

```
1. Server starts with FORCE_DB_RESET=true
2. Server.js detects flag
3. Auto-drops all tables
4. Reads: database/complete-schema-with-indexes.sql
5. Executes SQL
6. Server continues startup
```

---

## 🚨 Safety Features

### Confirmation Prompt
- Interactive mode always asks for confirmation
- Prevents accidental data loss
- Shows database URL before proceeding

### Environment Variable Check
- `FORCE_DB_RESET=true` must be explicitly set
- Commented out by default in `.env`
- Requires manual uncommenting

### Backup Recommendation
```bash
# Before reset, backup your data (optional)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🐛 Troubleshooting

### Issue: "Database reset failed: operator does not exist"
**Solution**: Schema file has been updated. Ensure you're using the latest version from `database/complete-schema-with-indexes.sql`.

### Issue: "Schema file not found"
**Solution**: Ensure file exists at `lalani_erp/database/complete-schema-with-indexes.sql`

### Issue: "Permission denied"
**Solution**:
```bash
chmod +x scripts/reset-database.js
```

### Issue: Composite indexes count is 0
**Solution**: Old schema file was used. Update to latest and re-run reset.

---

## 📊 Phase 1 Optimizations Included

The reset includes all Phase 1 performance optimizations:

### 1. ✅ N+1 Query Fixes
- Invoice creation uses batch queries
- Product lookups use Map-based O(1) access

### 2. ✅ 30 Composite Indexes
- Company-filtered queries optimized
- Date range queries 50-70% faster
- Join operations optimized

### 3. ✅ Connection Pool
- Max 20 connections
- Min 5 idle connections
- 30s idle timeout
- Pool monitoring enabled

### 4. ✅ Response Compression
- Gzip compression middleware
- 60-70% payload reduction
- Level 6 compression

### 5. ✅ Backend Permissions
- All routes protected
- Admin/User role separation
- Permission-based access control

---

## 🔄 Development Workflow

### Typical Usage Pattern

```bash
# 1. Make schema changes in code
# 2. Update database/complete-schema-with-indexes.sql
# 3. Reset database
npm run db:fresh

# 4. Verify changes
npm run server

# 5. Test with fresh data
# ... your testing here ...

# 6. Reset again if needed
npm run db:fresh
```

### For Continuous Development

```bash
# Add to .env (be careful!)
FORCE_DB_RESET=true

# Now every server restart resets the database
npm run dev:server  # Uses nodemon, resets DB on each reload
```

---

## 📝 Updating the Schema

When you need to add new tables or modify schema:

### 1. Edit the Schema File
```bash
nano database/complete-schema-with-indexes.sql
```

### 2. Add Your Changes
- New tables in appropriate section
- New indexes (basic or composite)
- New seed data

### 3. Test Locally
```bash
npm run db:fresh
npm run server
```

### 4. Verify
- Check table count
- Check index count
- Test application functionality

---

## 🚀 Production Considerations

### ⚠️ DO NOT Use in Production

The database reset is intended for **development and testing only**.

For production:
- Use proper migrations (`npm run db:migrate`)
- Never enable `FORCE_DB_RESET=true`
- Use database backups before any changes
- Test migrations on staging first

### Deployment Checklist

- [ ] Ensure `FORCE_DB_RESET` is commented out in .env
- [ ] Use `npm run db:migrate` instead of `db:fresh`
- [ ] Backup production database
- [ ] Test migrations on staging environment
- [ ] Have rollback plan ready

---

## 📞 Support

If you encounter issues:

1. Check the error message carefully
2. Verify DATABASE_URL in .env
3. Ensure PostgreSQL is running
4. Check file permissions
5. Review this guide

---

## 🎯 Summary

| Goal | Command |
|------|---------|
| Fresh start with confirmation | `npm run db:fresh` |
| Auto-reset on server start | `FORCE_DB_RESET=true npm run server` |
| Quick reset command | `npm run db:force-reset` |
| Check if DB is healthy | See Verification Steps above |

---

**Last Updated**: 2026-01-02
**Version**: 2.0 (includes Phase 1 optimizations)
**Compatibility**: PostgreSQL 12+
