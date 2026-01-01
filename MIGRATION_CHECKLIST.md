# Quick Migration Checklist: Render → Neon

**Migration Date:** _____________
**Estimated Time:** 15-30 minutes
**Downtime Required:** Yes (5-10 minutes)

---

## Pre-Migration (Do This First)

- [ ] **Backup Render Database**
  ```bash
  pg_dump "postgresql://user:pass@host/db" > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Create Neon Project**
  - Go to https://neon.tech
  - Create project: `lalani-erp-production`
  - Region: Choose closest to users
  - Copy **POOLED** connection string

- [ ] **Test Neon Connection Locally**
  ```bash
  psql "YOUR_NEON_POOLED_URL" -c "SELECT 1"
  ```

---

## Migration Steps

### Step 1: Restore to Neon (10-15 min)

- [ ] **Clean Neon database** (if needed)
  ```bash
  psql "$NEON_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  ```

- [ ] **Restore backup**
  ```bash
  psql "$NEON_URL" < backup_20260101.sql
  ```

- [ ] **Verify data**
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM products;
  SELECT COUNT(*) FROM sales_invoices;
  ```

### Step 2: Test Locally (5 min)

- [ ] **Update local .env**
  ```bash
  DATABASE_URL=YOUR_NEON_POOLED_URL
  ```

- [ ] **Start server**
  ```bash
  npm start
  ```

- [ ] **Test login**
  ```bash
  curl http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"123"}'
  ```

- [ ] **Test products**
  ```bash
  curl http://localhost:5000/api/products \
    -H "Authorization: Bearer TOKEN"
  ```

### Step 3: Update Render (2 min)

- [ ] **Go to Render Dashboard**
  - Navigate to your Web Service
  - Click **Environment** tab

- [ ] **Update DATABASE_URL**
  - Replace with Neon POOLED connection
  - Save changes

- [ ] **Trigger Deploy**
  - Manual deploy or wait for auto-deploy
  - Monitor logs

### Step 4: Verify Production (5 min)

- [ ] **Check deployment logs**
  - Look for: "✅ Database connection successful"
  - Look for: "Server is running on port 10000"

- [ ] **Test production login**
  ```bash
  curl https://your-app.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"123"}'
  ```

- [ ] **Test in browser**
  - Login
  - View dashboard
  - Create test invoice
  - Verify stock updates

- [ ] **Check Neon Console**
  - Go to https://console.neon.tech
  - Verify connections active
  - Check metrics

---

## Post-Migration

- [ ] **Monitor for 24 hours**
  - Check Render logs for errors
  - Monitor Neon metrics
  - Test all major features

- [ ] **Document connection details**
  - Save Neon credentials securely
  - Update team documentation

- [ ] **Archive Render backup**
  ```bash
  mkdir -p ~/backups/lalani_erp_render
  mv backup_*.sql ~/backups/lalani_erp_render/
  ```

- [ ] **Keep Render DB for 7-14 days**
  - Don't delete until confident
  - Create final backup before deletion

---

## Rollback Plan (If Needed)

If issues arise:

- [ ] **Revert Render DATABASE_URL**
  - Change back to Render PostgreSQL
  - Redeploy

- [ ] **Verify Render DB has data**
  ```bash
  psql "RENDER_DB_URL" -c "SELECT COUNT(*) FROM sales_invoices"
  ```

- [ ] **Test application**

---

## Optional: Setup Neon MCP

After successful migration, enhance Claude integration:

- [ ] **Get Neon API Key**
  - Console → Account Settings → API Keys
  - Create new key: "Claude Code MCP"

- [ ] **Configure Claude Code**
  - Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Add Neon MCP server config

- [ ] **Restart Claude Code**

- [ ] **Test: "List all tables in my database"**

See [NEON_MCP_SETUP.md](NEON_MCP_SETUP.md) for details.

---

## Quick Reference

**Your Neon Connection String:**
```
Pooled (use in app):
postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

Direct (admin only):
postgresql://neondb_owner:npg_XXXXX@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Your Render Service:**
```
App URL: https://your-app.onrender.com
Dashboard: https://dashboard.render.com
```

**Support:**
- Neon: https://neon.tech/docs
- Render: https://render.com/docs

---

## Success Criteria

Migration is successful when:

✅ Application loads without errors
✅ Login works
✅ All pages load data correctly
✅ Can create sales invoice
✅ Stock updates correctly
✅ No errors in Render logs
✅ Neon metrics show healthy connections
✅ Performance is same or better

---

**Status:** ⬜ Not Started | ⏳ In Progress | ✅ Complete

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
