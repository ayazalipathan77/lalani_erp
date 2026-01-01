# Neon MCP Server Setup for Claude Code

Quick guide to connect Claude Code directly to your Neon database using the Model Context Protocol (MCP).

---

## What You'll Get

With Neon MCP configured, you can ask me (Claude) to:
- ✅ Query your database directly
- ✅ Analyze schema and data
- ✅ Debug database issues
- ✅ Generate reports
- ✅ Verify data integrity
- ✅ Assist with migrations

**Example queries:**
```
"Show me all products with low stock"
"List customers with outstanding balance > 50000"
"Analyze sales trends for last 30 days"
"Check for any NULL values in critical fields"
"Show me the schema for sales_invoices table"
```

---

## Step 1: Get Your Neon API Key

1. Go to **Neon Console**: https://console.neon.tech
2. Click your **profile icon** (top-right)
3. Select **Account Settings**
4. Navigate to **API Keys** tab
5. Click **Create API Key**
6. Name: `Claude Code MCP`
7. **Copy the API key** (starts with `napi_`)
   - ⚠️ Save it securely - it won't be shown again!

---

## Step 2: Configure Claude Code

### For Claude Desktop App

**Find your config file location:**

| OS | Config File Path |
|----|------------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### For Claude Code CLI (VSCode Extension)

**Config location:**
- Same as Claude Desktop App (uses shared config)

---

## Step 3: Edit Configuration File

**Create or edit the config file:**

```bash
# macOS/Linux
mkdir -p ~/Library/Application\ Support/Claude  # macOS
mkdir -p ~/.config/Claude                        # Linux

# Open in editor
code ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
code ~/.config/Claude/claude_desktop_config.json                        # Linux
```

**Add this configuration:**

```json
{
  "mcpServers": {
    "neon-lalani-erp": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon"
      ],
      "env": {
        "NEON_API_KEY": "napi_YOUR_KEY_HERE",
        "NEON_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

**To find your Project ID:**
1. Go to Neon Console: https://console.neon.tech
2. Select your project (lalani-erp-production)
3. Look at URL: `https://console.neon.tech/app/projects/PROJECT_ID_HERE`
4. Or find it in **Project Settings** → **General**

**Full example:**
```json
{
  "mcpServers": {
    "neon-lalani-erp": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon"
      ],
      "env": {
        "NEON_API_KEY": "napi_abcd1234xyz567890",
        "NEON_PROJECT_ID": "noisy-sea-12345678"
      }
    }
  }
}
```

---

## Step 4: Secure Your API Key (Recommended)

Instead of hardcoding the API key, use environment variables:

**Edit config file:**
```json
{
  "mcpServers": {
    "neon-lalani-erp": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "${NEON_API_KEY}",
        "NEON_PROJECT_ID": "${NEON_PROJECT_ID}"
      }
    }
  }
}
```

**Set environment variables:**

**macOS/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export NEON_API_KEY="napi_YOUR_KEY_HERE"' >> ~/.bashrc
echo 'export NEON_PROJECT_ID="your-project-id"' >> ~/.bashrc

# Reload
source ~/.bashrc

# Verify
echo $NEON_API_KEY
```

**Windows (PowerShell):**
```powershell
# Add to PowerShell profile
notepad $PROFILE

# Add these lines:
$env:NEON_API_KEY = "napi_YOUR_KEY_HERE"
$env:NEON_PROJECT_ID = "your-project-id"

# Save and restart PowerShell
```

---

## Step 5: Restart Claude Code

**Complete restart required:**
1. Quit Claude Code completely (not just close window)
   - macOS: `Cmd+Q`
   - Windows: Right-click taskbar → Quit
   - Linux: `killall claude` or quit from system tray
2. Restart Claude Code
3. Wait 5-10 seconds for MCP server to initialize

---

## Step 6: Verify Connection

**In Claude Code, ask:**

```
Can you list all tables in my Neon database?
```

**Expected response:**
```
I can see your database has the following tables:
- companies
- users
- user_webauthn_credentials
- categories
- products
- customers
- suppliers
- sales_invoices
- sales_invoice_items
- sales_returns
- sales_return_items
- purchase_invoices
- purchase_invoice_items
- cash_balance
- expenses
- expense_heads
- payment_receipts
- supplier_payments
- discount_vouchers
- opening_cash_balance
- loan_taken
- loan_return
- tax_rates
- discount_rates
- system_backups
```

---

## Example Queries to Try

### Schema Analysis
```
"Show me the complete schema for the sales_invoices table"
"What indexes exist on the products table?"
"Show me all foreign key relationships in the database"
```

### Data Exploration
```
"How many products do we have in inventory?"
"Show me the top 5 customers by total sales"
"List all invoices from today"
"Find products with stock below minimum level"
```

### Business Insights
```
"Calculate total sales for last 30 days"
"Show me customers with outstanding balance"
"List all expenses by category for this month"
"Analyze sales trends by product category"
```

### Data Quality
```
"Find any duplicate product codes"
"Check for NULL values in critical fields"
"Identify customers without phone numbers"
"Find invoices with zero total amount"
```

### Debugging
```
"Show me the most recent 10 cash balance transactions"
"Find invoices where balance_due doesn't match total_amount"
"List users with invalid permissions array"
```

---

## Troubleshooting

### Issue: MCP Server Not Found

**Symptoms:**
- Claude says "I don't have access to your database"
- No database queries work

**Solutions:**
```bash
# 1. Check if config file exists
ls ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
ls ~/.config/Claude/claude_desktop_config.json                        # Linux

# 2. Verify JSON syntax (use online validator: jsonlint.com)
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 3. Test MCP server manually
npx -y @neondatabase/mcp-server-neon
# Should show: "Neon MCP Server starting..."

# 4. Check environment variables
echo $NEON_API_KEY
echo $NEON_PROJECT_ID

# 5. Restart Claude Code completely
```

### Issue: Authentication Failed

**Symptoms:**
```
Error: Invalid API key
```

**Solutions:**
```bash
# 1. Verify API key is correct
# Go to Neon Console → Account Settings → API Keys
# Copy fresh API key

# 2. Check for typos in config file
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 3. Ensure no extra quotes or spaces
# Bad:  "NEON_API_KEY": " napi_xyz "
# Good: "NEON_API_KEY": "napi_xyz"
```

### Issue: Permission Denied

**Symptoms:**
```
Error: You don't have permission to access this resource
```

**Solutions:**
```bash
# 1. Verify API key has correct permissions
# Neon Console → Account Settings → API Keys
# Check key is not restricted

# 2. Verify Project ID is correct
# Neon Console → Your Project → Settings → General
# Copy Project ID

# 3. Try creating a new API key with full permissions
```

### Issue: Connection Timeout

**Symptoms:**
```
Error: Connection timed out
```

**Solutions:**
```bash
# 1. Check internet connection
ping console.neon.tech

# 2. Verify firewall allows npx/node
# macOS: System Preferences → Security & Privacy → Firewall
# Allow: node, npx

# 3. Try increasing timeout (edit config):
{
  "mcpServers": {
    "neon-lalani-erp": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "timeout": 30000,  // 30 seconds
      "env": { ... }
    }
  }
}
```

---

## Security Best Practices

### 1. Protect Your API Key

✅ **DO:**
- Store in environment variables
- Use secure password manager
- Rotate keys periodically (every 90 days)
- Create separate keys for dev/prod

❌ **DON'T:**
- Commit config file with API key to git
- Share API key in chat/email
- Use same key across multiple services
- Store in plain text files

### 2. Restrict API Key Permissions

In Neon Console:
1. Account Settings → API Keys
2. Click on your key
3. Enable **Restrict to specific projects**
4. Select only `lalani-erp-production`
5. Save

### 3. Monitor API Usage

Check Neon Console:
1. Account Settings → API Keys
2. View **Last Used** timestamp
3. Check **Request Count**
4. Review **Recent Activity**

If you see unexpected activity:
1. Revoke compromised key immediately
2. Create new key
3. Update configuration
4. Restart Claude Code

---

## Alternative: Direct Database Access

If you prefer not to use MCP, you can still query Neon manually:

```bash
# Set connection string
export NEON_DB="postgresql://neondb_owner:npg_XXXXX@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Interactive queries
psql "$NEON_DB"

# One-off queries
psql "$NEON_DB" -c "SELECT COUNT(*) FROM products"

# Query with output to file
psql "$NEON_DB" -c "SELECT * FROM sales_invoices" > invoices.csv
```

Then share results with me in the conversation.

---

## Advanced Configuration

### Multiple Databases

If you have separate dev/staging/production databases:

```json
{
  "mcpServers": {
    "neon-lalani-erp-prod": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "${NEON_API_KEY_PROD}",
        "NEON_PROJECT_ID": "prod-project-id"
      }
    },
    "neon-lalani-erp-dev": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "${NEON_API_KEY_DEV}",
        "NEON_PROJECT_ID": "dev-project-id"
      }
    }
  }
}
```

Then specify which database:
```
"Query the dev database: show me all test invoices"
"Query the prod database: calculate total sales"
```

### Read-Only Access

For safety, create a read-only database role:

```sql
-- Connect to Neon as admin
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE neondb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

Then use readonly connection in MCP config.

---

## Useful MCP Commands

Once configured, here are powerful queries:

### Database Health Check
```
"Run a health check on my database - check for:
1. Tables without primary keys
2. Indexes that might be missing
3. Tables with very high row counts
4. Unused indexes
5. Foreign key constraints"
```

### Performance Analysis
```
"Analyze query performance for the sales_invoices table"
"Show me the largest tables by size"
"Identify slow queries from pg_stat_statements"
```

### Data Validation
```
"Validate data integrity:
1. Check all foreign keys are valid
2. Find orphaned records
3. Identify inconsistent data
4. Verify calculated fields match"
```

### Schema Documentation
```
"Generate complete schema documentation with:
1. Table descriptions
2. Column types and constraints
3. Relationships (foreign keys)
4. Indexes
5. Sample data"
```

---

## Benefits Summary

**With Neon MCP:**
- ⚡ Instant database insights
- 🔍 Complex queries without writing SQL
- 🐛 Faster debugging
- 📊 Ad-hoc reporting
- 🔒 Secure API-based access
- 🤖 AI-powered data analysis

**Without MCP:**
- Manual SQL queries via psql
- Copy-paste results to chat
- Slower iteration
- More context switching

---

## Next Steps

1. ✅ Configure MCP as shown above
2. ✅ Test with simple queries
3. ✅ Explore your data
4. ✅ Use for debugging and development
5. ✅ Share insights with team

**Questions? Just ask!**

---

**Last Updated:** January 1, 2026
**MCP Server:** @neondatabase/mcp-server-neon
**Protocol:** Model Context Protocol (MCP)
