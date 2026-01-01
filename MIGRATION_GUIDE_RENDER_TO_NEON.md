# Migration Guide: Render PostgreSQL to Neon DB

This guide will help you migrate your Lalani ERP database from Render PostgreSQL to Neon PostgreSQL while maintaining your Render deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Backup Render Database](#step-1-backup-render-database)
3. [Step 2: Setup Neon Database](#step-2-setup-neon-database)
4. [Step 3: Restore Data to Neon](#step-3-restore-data-to-neon)
5. [Step 4: Update Render Environment](#step-4-update-render-environment)
6. [Step 5: Verify Migration](#step-5-verify-migration)
7. [Step 6: Cleanup](#step-6-cleanup)
8. [Rollback Plan](#rollback-plan)
9. [Neon MCP Server Setup](#neon-mcp-server-setup)

---

## Prerequisites

**Before starting:**
- ✅ Access to Render dashboard
- ✅ Neon account created (https://neon.tech)
- ✅ PostgreSQL client installed locally (`psql` or `pg_dump`)
- ✅ Backup of current production data
- ✅ Maintenance window scheduled (15-30 minutes downtime recommended)

**Tools Required:**
```bash
# Install PostgreSQL client tools (if not already installed)
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

---

## Step 1: Backup Render Database

### 1.1 Get Render Database Connection String

1. Go to Render Dashboard: https://dashboard.render.com
2. Navigate to your PostgreSQL service
3. Click on "Connect" tab
4. Copy the **External Connection String**

It should look like:
```
postgresql://lalani_erp_user:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/lalani_erp_db
```

### 1.2 Create Backup from Render

**Option A: Using pg_dump (Recommended)**

```bash
# Set Render database URL
export RENDER_DB_URL="postgresql://lalani_erp_user:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/lalani_erp_db"

# Create timestamped backup
pg_dump "$RENDER_DB_URL" > render_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file
ls -lh render_backup_*.sql
```

**Option B: Using Render Dashboard**

1. In Render Dashboard → PostgreSQL service
2. Go to "Backups" tab
3. Click "Create Manual Backup"
4. Wait for backup to complete
5. Download backup file

### 1.3 Verify Backup

```bash
# Check backup file is not empty
wc -l render_backup_*.sql

# Should show thousands of lines
# Quick check for important tables
grep -i "CREATE TABLE" render_backup_*.sql

# Should see: companies, users, products, sales_invoices, etc.
```

---

## Step 2: Setup Neon Database

### 2.1 Create Neon Project

1. Go to https://neon.tech
2. Sign in / Sign up
3. Click **"Create Project"**
4. Configure:
   - **Project name:** lalani-erp-production
   - **Region:** Choose closest to your users (e.g., US East, EU West)
   - **Postgres version:** 15 or 16 (recommended)
   - **Compute size:** 0.25 CU (can scale later)

### 2.2 Get Neon Connection String

After project creation, you'll see connection details:

**Neon provides two connection strings:**
1. **Pooled connection** (recommended for applications):
   ```
   postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

2. **Direct connection** (for migrations and admin tasks):
   ```
   postgresql://neondb_owner:npg_XXXXX@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

**Use pooled connection for your application!**

### 2.3 Update Local .env File

```bash
# Edit your local .env file
nano .env
```

Update the DATABASE_URL:
```bash
# Old Render connection (keep for reference)
# DATABASE_URL=postgresql://lalani_erp_user:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/lalani_erp_db

# New Neon connection (POOLED)
DATABASE_URL=postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Step 3: Restore Data to Neon

### 3.1 Test Neon Connection

```bash
# Set Neon database URL (use DIRECT connection for restore)
export NEON_DB_URL="postgresql://neondb_owner:npg_XXXXX@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Test connection
psql "$NEON_DB_URL" -c "SELECT version();"

# Should show: PostgreSQL 15.x or 16.x
```

### 3.2 Clean Neon Database (if needed)

```bash
# If Neon DB has existing tables, drop them first
psql "$NEON_DB_URL" -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
"
```

### 3.3 Restore Backup to Neon

**Method 1: Using psql (Recommended)**

```bash
# Restore from backup file
psql "$NEON_DB_URL" < render_backup_20260101_120000.sql

# This may take 5-15 minutes depending on data size
```

**Method 2: Using pg_restore (if backup is in custom format)**

```bash
pg_restore -d "$NEON_DB_URL" --no-owner --no-acl render_backup.dump
```

### 3.4 Verify Data in Neon

```bash
# Connect to Neon
psql "$NEON_DB_URL"
```

```sql
-- Check tables exist
\dt

-- Expected tables:
-- companies, users, products, categories, customers, suppliers,
-- sales_invoices, sales_invoice_items, purchase_invoices, etc.

-- Check row counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'sales_invoices', COUNT(*) FROM sales_invoices
UNION ALL
SELECT 'sales_invoice_items', COUNT(*) FROM sales_invoice_items;

-- Compare these counts with Render database

-- Check a few sample records
SELECT * FROM users LIMIT 5;
SELECT * FROM products LIMIT 5;
SELECT * FROM sales_invoices ORDER BY created_at DESC LIMIT 5;

-- Exit psql
\q
```

### 3.5 Test Application Locally with Neon

```bash
# Update .env to use Neon (pooled connection)
DATABASE_URL=postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Start server
npm start

# Test endpoints
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'

# Should return JWT token and user data

# Test product listing
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return products list
```

---

## Step 4: Update Render Environment

### 4.1 Set Environment Variable on Render

**Option A: Via Render Dashboard (Recommended)**

1. Go to https://dashboard.render.com
2. Select your **Web Service** (not the database)
3. Go to **Environment** tab
4. Find `DATABASE_URL` variable
5. Click **Edit**
6. Replace with **Neon POOLED connection string**:
   ```
   postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
7. Click **Save Changes**

**Option B: Via render.yaml (if using IaC)**

```yaml
# render.yaml
services:
  - type: web
    name: lalani-erp
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
      - key: JWT_SECRET
        sync: false  # Use existing secret
      - key: WEBAUTHN_RP_ID
        value: your-app.onrender.com
      - key: WEBAUTHN_ORIGIN
        value: https://your-app.onrender.com
```

### 4.2 Trigger Deployment

**Automatic Deploy (if auto-deploy enabled):**
- Render will automatically redeploy when environment changes

**Manual Deploy:**
1. In Render Dashboard → Web Service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for deployment to complete (2-5 minutes)

### 4.3 Monitor Deployment Logs

```bash
# In Render Dashboard → Logs tab
# Watch for:
# ✅ Database connection successful
# ✅ Server is running on port 10000
# ✅ Database schema applied successfully (if migrations run)

# Look for errors:
# ❌ Connection refused
# ❌ Authentication failed
# ❌ SSL required
```

---

## Step 5: Verify Migration

### 5.1 Test Production Application

```bash
# Replace with your Render app URL
export APP_URL="https://lalani-erp.onrender.com"

# Test login
curl "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123"}'

# Should return 200 OK with JWT token

# Test products (use token from login)
curl "$APP_URL/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return products list
```

### 5.2 Test in Browser

1. Open: `https://lalani-erp.onrender.com` (your Render URL)
2. Login with admin credentials
3. Navigate through:
   - Dashboard (check metrics load)
   - Inventory (check products load)
   - Sales (check invoices load)
   - Create a test invoice
   - Verify stock updates
4. Check browser console for errors (F12)

### 5.3 Verify Database Operations

```bash
# Connect to Neon and check recent activity
psql "$NEON_DB_URL"
```

```sql
-- Check recent sales invoices (should include any new test invoice)
SELECT inv_number, inv_date, total_amount, created_at
FROM sales_invoices
ORDER BY created_at DESC
LIMIT 5;

-- Check recent cash transactions
SELECT trans_date, trans_type, description, credit_amount, debit_amount
FROM cash_balance
ORDER BY created_at DESC
LIMIT 10;

-- Check product stock (verify test invoice updated stock)
SELECT prod_code, prod_name, current_stock
FROM products
ORDER BY updated_at DESC
LIMIT 10;

\q
```

### 5.4 Performance Check

**Neon Console (https://console.neon.tech):**
1. Go to your project
2. Click **Monitoring** tab
3. Check:
   - Connection count (should be < 100 with pooling)
   - Query performance
   - CPU usage
   - Memory usage

**Expected Performance:**
- Query latency: < 50ms (same region)
- Connection pooling: Active
- Compute unit usage: < 0.5 CU for typical load

---

## Step 6: Cleanup

### 6.1 Document Connection Details

Create a secure note with:
```
Neon Production Database
========================
Project: lalani-erp-production
Region: us-east-1
Database: neondb

Pooled Connection (use in app):
postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

Direct Connection (admin only):
postgresql://neondb_owner:npg_XXXXX@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

Migrated from: Render PostgreSQL
Migration Date: 2026-01-01
Backup Location: /backups/render_backup_20260101.sql
```

### 6.2 Archive Render Backups

```bash
# Create archive directory
mkdir -p ~/database_backups/lalani_erp_render

# Move backup files
mv render_backup_*.sql ~/database_backups/lalani_erp_render/

# Create migration notes
cat > ~/database_backups/lalani_erp_render/MIGRATION_NOTES.txt << EOF
Render to Neon Migration
========================
Migration Date: $(date)
Render Database: dpg-XXXXX-a.oregon-postgres.render.com
Neon Database: ep-xxxxx-pooler.us-east-1.aws.neon.tech
Status: Successful
Verified: $(date)
EOF
```

### 6.3 Remove Render PostgreSQL Service (Optional)

**⚠️ WARNING: Only do this after 7-14 days of successful Neon usage**

1. Go to Render Dashboard
2. Navigate to PostgreSQL service
3. Create one final backup
4. Download backup
5. Click **Settings** → **Delete Service**
6. Confirm deletion

**Before deleting:**
- ✅ Neon database running smoothly for 1-2 weeks
- ✅ All features tested and working
- ✅ Final backup downloaded and stored securely
- ✅ No issues reported by users

---

## Rollback Plan

If migration fails or issues arise, here's how to rollback:

### Immediate Rollback (within 24 hours)

**Step 1: Revert Render Environment Variable**
1. Render Dashboard → Web Service → Environment
2. Update `DATABASE_URL` back to Render PostgreSQL:
   ```
   postgresql://lalani_erp_user:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/lalani_erp_db
   ```
3. Save and redeploy

**Step 2: Verify Render DB Still Has Data**
```bash
# Connect to Render DB
psql "postgresql://lalani_erp_user:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/lalani_erp_db"

# Check data
SELECT COUNT(*) FROM sales_invoices;

# If data is intact, you're good to go
```

**Step 3: Test Application**
- Login and verify functionality
- Check recent transactions

### Delayed Rollback (after data loss)

**If Render DB was deleted or data lost:**

1. **Restore from backup to Render:**
   ```bash
   # Create new Render PostgreSQL service
   # Get new connection string
   export NEW_RENDER_DB="postgresql://..."

   # Restore from backup
   psql "$NEW_RENDER_DB" < render_backup_20260101.sql
   ```

2. **Update Render environment to new DB**

3. **Sync any missing data manually**
   - Export new transactions from Neon
   - Import to restored Render DB

---

## Neon MCP Server Setup

Neon provides an MCP (Model Context Protocol) server that allows Claude to directly query and manage your database.

### What is Neon MCP?

The Neon MCP server enables:
- ✅ Direct SQL queries from Claude
- ✅ Schema inspection and analysis
- ✅ Data exploration and debugging
- ✅ Database administration tasks
- ✅ Migration assistance

### Installation Steps

**Step 1: Get Neon API Key**

1. Go to https://console.neon.tech
2. Click on your profile (top-right)
3. Go to **Account Settings**
4. Navigate to **API Keys** tab
5. Click **Create API Key**
6. Name: "Claude Code MCP"
7. Copy the API key (starts with `napi_...`)

**Step 2: Install Neon MCP Server**

```bash
# The Neon MCP server is typically installed via npx
# No global installation needed

# Test if it works
npx @neondatabase/mcp-server-neon --version
```

**Step 3: Configure Claude Code to Use Neon MCP**

Create or edit your Claude Code MCP configuration:

```bash
# Edit Claude Code config
# Location varies by OS:
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
# Linux: ~/.config/Claude/claude_desktop_config.json
# Windows: %APPDATA%/Claude/claude_desktop_config.json

# Add Neon MCP server
```

**Configuration File:**
```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon"
      ],
      "env": {
        "NEON_API_KEY": "napi_YOUR_KEY_HERE"
      }
    }
  }
}
```

**Step 4: Restart Claude Code**

After saving the configuration:
1. Completely quit Claude Code (not just close window)
2. Restart Claude Code
3. The Neon MCP server should auto-connect

**Step 5: Verify MCP Connection**

In Claude Code, you can now ask:
```
Can you list all tables in my Neon database?
```

Claude will use the MCP server to query your database.

### Using Neon MCP

**Example queries you can ask Claude:**

```
1. "Show me the schema for the sales_invoices table"
2. "How many products do we have in inventory?"
3. "List all sales invoices from last week"
4. "Show me customers with outstanding balance > 50000"
5. "Analyze the sales_invoice_items table structure"
6. "Find duplicate product codes"
7. "Check for any NULL values in critical fields"
```

**Security Note:**
- API key grants full access to your Neon databases
- Store API key securely
- Never commit config file with API key to git
- Consider using environment variables:

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "${NEON_API_KEY}"
      }
    }
  }
}
```

Then set environment variable:
```bash
# Add to ~/.bashrc or ~/.zshrc
export NEON_API_KEY="napi_YOUR_KEY_HERE"
```

### Alternative: Manual Database Queries

If you prefer not to use MCP, you can still query Neon directly:

```bash
# Set connection string
export NEON_DB="postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Query examples
psql "$NEON_DB" -c "SELECT * FROM products LIMIT 10"
psql "$NEON_DB" -c "SELECT COUNT(*) FROM sales_invoices"
```

---

## Neon Benefits Over Render PostgreSQL

### Cost Savings
- **Neon Free Tier:** 0.5GB storage, 1 project
- **Neon Pro:** $19/month (scalable compute)
- **Render:** $7/month (fixed resources)

### Performance
- ✅ Autoscaling compute (scales to zero when idle)
- ✅ Connection pooling built-in
- ✅ Instant read replicas
- ✅ Branch databases for testing

### Developer Experience
- ✅ Database branching (like git for databases)
- ✅ Time travel queries (point-in-time recovery)
- ✅ Serverless architecture
- ✅ MCP integration with Claude

### Availability
- ✅ 99.95% uptime SLA (Pro plan)
- ✅ Automatic failover
- ✅ Multi-region support
- ✅ Daily backups (7-day retention on free tier)

---

## Post-Migration Checklist

After successful migration, verify:

- [ ] All tables migrated successfully
- [ ] Row counts match Render database
- [ ] Application login working
- [ ] Product listing working
- [ ] Can create sales invoice
- [ ] Stock updates correctly
- [ ] Customer outstanding balance updates
- [ ] Cash balance updates
- [ ] PDF invoice generation working
- [ ] WebAuthn biometric login working
- [ ] No errors in Render logs
- [ ] Neon dashboard shows healthy metrics
- [ ] Connection pooling active
- [ ] Backup downloaded and archived
- [ ] Documentation updated with new connection details
- [ ] Team notified of migration

---

## Troubleshooting

### Issue: Connection Timeout

**Symptom:**
```
Error: connect ETIMEDOUT
```

**Solution:**
```bash
# Check if SSL is required
# Neon always requires SSL

# Ensure connection string has sslmode=require
DATABASE_URL="...?sslmode=require"

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Issue: Authentication Failed

**Symptom:**
```
Error: password authentication failed for user "neondb_owner"
```

**Solution:**
```bash
# Verify connection string is correct
# Copy fresh connection string from Neon console
# Check for special characters in password (URL encode if needed)

# Test in browser:
# https://console.neon.tech → Your Project → Connection Details → Copy
```

### Issue: Table Already Exists

**Symptom:**
```
ERROR: relation "users" already exists
```

**Solution:**
```sql
-- Drop existing schema and recreate
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then restore backup
```

### Issue: Migration Takes Too Long

**Symptom:**
- Restore running for > 30 minutes
- Connection drops during restore

**Solution:**
```bash
# Use direct connection (not pooled) for large restores
export NEON_DIRECT="postgresql://neondb_owner:...@ep-xxxxx.us-east-1.aws.neon.tech/..."

# Increase timeout
psql "$NEON_DIRECT" -v ON_ERROR_STOP=1 < backup.sql

# Or split into smaller chunks
# Restore schema first
psql "$NEON_DIRECT" < schema_only.sql

# Then restore data
psql "$NEON_DIRECT" < data_only.sql
```

---

## Support

**Neon Support:**
- Documentation: https://neon.tech/docs
- Discord: https://discord.gg/neon
- Support: support@neon.tech

**Render Support:**
- Documentation: https://render.com/docs
- Support: https://render.com/support

**Emergency Contacts:**
- Database issues: Check Neon status page (https://status.neon.tech)
- Application issues: Check Render logs and status

---

## Conclusion

You've successfully migrated from Render PostgreSQL to Neon!

**Key Points:**
- ✅ Neon provides better scalability and cost efficiency
- ✅ Connection pooling is built-in
- ✅ Database branching enables safe testing
- ✅ MCP integration makes development easier
- ✅ Keep Render database for 1-2 weeks as backup
- ✅ Monitor Neon metrics for first week

**Next Steps:**
1. Monitor application for 1 week
2. Setup automated backups
3. Explore Neon features (branching, read replicas)
4. Configure Neon MCP for Claude integration
5. Remove Render database after 14 days

---

**Migration Date:** January 1, 2026
**Status:** Complete
**Database:** Neon PostgreSQL
**Connection:** Pooled (optimized)
