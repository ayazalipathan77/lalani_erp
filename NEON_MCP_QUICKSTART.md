# Neon MCP Quick Start - Get Connected in 5 Minutes!

## What I Just Set Up For You

I've created the Neon MCP configuration file at:
```
~/.config/Claude/claude_desktop_config.json
```

Now you just need to add your Neon API key and restart Claude Code!

---

## Option 1: Automated Setup (Recommended)

Run the setup script I created:

```bash
cd /home/ayaz/AI/Lalani_ERP/lalani_erp
./setup-neon-mcp.sh
```

The script will:
1. Guide you to get your Neon API key
2. Update the configuration file
3. Optionally save to your shell environment
4. Show you next steps

---

## Option 2: Manual Setup (5 Steps)

### Step 1: Get Your Neon API Key

1. Open browser: https://console.neon.tech
2. Click **profile icon** (top-right) → **Account Settings**
3. Navigate to **API Keys** tab
4. Click **Create API Key**
5. Name: `Claude Code MCP`
6. **Copy the key** (starts with `napi_`)

### Step 2: Update Configuration File

```bash
# Edit the config file
nano ~/.config/Claude/claude_desktop_config.json
```

Replace `REPLACE_WITH_YOUR_NEON_API_KEY` with your actual API key:

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
        "NEON_API_KEY": "napi_YOUR_ACTUAL_KEY_HERE"
      }
    }
  }
}
```

Save the file (Ctrl+O, Enter, Ctrl+X in nano).

### Step 3: Verify Configuration

```bash
# Check the file is valid JSON
cat ~/.config/Claude/claude_desktop_config.json | python3 -m json.tool
```

Should output the formatted JSON without errors.

### Step 4: Restart Claude Code

**IMPORTANT:** Complete restart required!

1. **Quit Claude Code completely** (don't just close window)
   - Click menu → Quit
   - Or: `pkill -f claude` in terminal
2. Wait 5 seconds
3. **Start Claude Code** again

### Step 5: Test the Connection

In Claude Code, type:
```
Can you list all tables in my Neon database?
```

**Expected response:**
```
I can see your database has the following tables:
- companies
- users
- products
- categories
- customers
- suppliers
- sales_invoices
- sales_invoice_items
- cash_balance
- expenses
... (and more)
```

---

## Verify It's Working

### Test Query 1: Count Records
```
How many products are in the database?
```

### Test Query 2: View Data
```
Show me the latest 5 sales invoices with customer names
```

### Test Query 3: Schema Info
```
Describe the structure of the sales_invoices table
```

### Test Query 4: Business Insights
```
List all customers with outstanding balance greater than 10000
```

If these work, you're all set! 🎉

---

## What You Can Do Now

### Database Exploration
- "Show me all table names and row counts"
- "What indexes exist on the products table?"
- "Describe all foreign key relationships"

### Data Analysis
- "Calculate total sales for last 30 days"
- "Show top 10 products by sales quantity"
- "Find customers who haven't purchased in 90 days"

### Data Quality Checks
- "Find any duplicate product codes"
- "Check for NULL values in critical fields"
- "Identify invoices with zero total_amount"
- "Find orphaned records (items without parent invoices)"

### Debugging
- "Show me the most recent cash_balance transactions"
- "Find invoices where stock didn't update correctly"
- "List users with invalid permission arrays"

### Reporting
- "Generate a sales summary by product category"
- "Show expense breakdown by expense head"
- "List all pending invoices with balance due"

---

## Troubleshooting

### Issue: "I don't have access to your database"

**Solution:**
1. Check config file exists:
   ```bash
   cat ~/.config/Claude/claude_desktop_config.json
   ```

2. Verify API key is correct (not placeholder)

3. **Restart Claude Code completely** (this is often missed!)

4. Check Claude Code logs (if available)

### Issue: "Authentication failed"

**Solution:**
1. Verify API key starts with `napi_`
2. Get a fresh API key from Neon Console
3. Update config file
4. Restart Claude Code

### Issue: "Connection timeout"

**Solution:**
1. Check internet connection
2. Verify Neon is accessible:
   ```bash
   curl https://console.neon.tech
   ```
3. Check firewall allows npx/node

### Issue: JSON parse error

**Solution:**
```bash
# Validate JSON syntax
cat ~/.config/Claude/claude_desktop_config.json | python3 -m json.tool

# If error, use online validator: jsonlint.com
```

---

## Security Notes

🔒 **Your API key grants full access to your Neon account**

**Best Practices:**
- ✅ Never commit config file to git
- ✅ Use separate API keys for dev/prod
- ✅ Rotate keys every 90 days
- ✅ Monitor API usage in Neon Console
- ✅ Revoke compromised keys immediately

**To secure your config file:**
```bash
# Restrict file permissions
chmod 600 ~/.config/Claude/claude_desktop_config.json

# Verify
ls -la ~/.config/Claude/claude_desktop_config.json
# Should show: -rw------- (only owner can read/write)
```

---

## Configuration File Location

Your config file is at:
```
/home/ayaz/.config/Claude/claude_desktop_config.json
```

**To edit:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

**To view:**
```bash
cat ~/.config/Claude/claude_desktop_config.json
```

**To backup:**
```bash
cp ~/.config/Claude/claude_desktop_config.json \
   ~/.config/Claude/claude_desktop_config.json.backup
```

---

## Example: Full Workflow

Here's a real example of using MCP for debugging:

**You:** "I created a sales invoice but the stock didn't decrease. Can you help me debug?"

**Claude with MCP:**
```sql
-- I'll check the invoice
SELECT * FROM sales_invoices WHERE inv_id = 123;

-- Check the invoice items
SELECT * FROM sales_invoice_items WHERE inv_id = 123;

-- Check current product stock
SELECT prod_code, prod_name, current_stock
FROM products
WHERE prod_code IN (SELECT prod_code FROM sales_invoice_items WHERE inv_id = 123);

-- Check if there's a trigger or issue
```

Then I can tell you exactly what went wrong and how to fix it!

---

## Advanced Configuration

### Multiple Environments

If you want separate connections for dev/staging/prod:

```json
{
  "mcpServers": {
    "neon-lalani-prod": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "napi_PROD_KEY"
      }
    },
    "neon-lalani-dev": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "napi_DEV_KEY"
      }
    }
  }
}
```

Then specify: "Query the prod database" or "Query the dev database"

### Using Environment Variables

More secure approach:

```json
{
  "mcpServers": {
    "neon-lalani-erp": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "${NEON_API_KEY}"
      }
    }
  }
}
```

Then set in shell:
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export NEON_API_KEY="napi_YOUR_KEY"' >> ~/.bashrc
source ~/.bashrc
```

---

## Next Steps

1. ✅ **Run setup script** or update config manually
2. ✅ **Restart Claude Code**
3. ✅ **Test with simple query**
4. ✅ **Explore your data**
5. ✅ **Use for debugging and development**

---

## Quick Command Reference

```bash
# Run automated setup
./setup-neon-mcp.sh

# Edit config manually
nano ~/.config/Claude/claude_desktop_config.json

# Verify config is valid JSON
cat ~/.config/Claude/claude_desktop_config.json | python3 -m json.tool

# Check if config file exists
ls -la ~/.config/Claude/

# Restart Claude Code
pkill -f claude && sleep 2 && claude-code

# Test Neon MCP package
npx -y @neondatabase/mcp-server-neon --version
```

---

## Questions?

Once you have it set up, just ask me:
- "Is the MCP connection working?"
- "Can you query my database?"
- "List all tables"

And I'll be able to help you directly with your Neon database! 🚀

---

**Ready to start?**

Choose your method:
- **Easy:** Run `./setup-neon-mcp.sh`
- **Manual:** Follow "Option 2: Manual Setup" above

Then restart Claude Code and test with: **"List all tables in my database"**

Good luck! 🎉
