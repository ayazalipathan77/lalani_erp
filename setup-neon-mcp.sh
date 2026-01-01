#!/bin/bash

# Neon MCP Setup Script for Claude Code
# This script will help you configure the Neon MCP server

set -e

echo "=========================================="
echo "  Neon MCP Server Setup for Claude Code"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npx is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx is not installed${NC}"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ npx found${NC}"

# Test if Neon MCP server package is accessible
echo ""
echo "Testing Neon MCP server package..."
if npx -y @neondatabase/mcp-server-neon --version 2>/dev/null; then
    echo -e "${GREEN}✅ Neon MCP server package is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Neon MCP server package test failed, but it will be installed on first use${NC}"
fi

# Get Neon API Key
echo ""
echo "=========================================="
echo "  Step 1: Get Your Neon API Key"
echo "=========================================="
echo ""
echo "1. Open your browser and go to: https://console.neon.tech"
echo "2. Click on your profile icon (top-right corner)"
echo "3. Select 'Account Settings'"
echo "4. Navigate to 'API Keys' tab"
echo "5. Click 'Create API Key'"
echo "6. Name it: 'Claude Code MCP'"
echo "7. Copy the API key (starts with 'napi_')"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Save this key securely - it won't be shown again!${NC}"
echo ""
read -p "Press Enter when you have your API key ready..."

# Prompt for API key
echo ""
read -sp "Paste your Neon API key: " NEON_API_KEY
echo ""

# Validate API key format
if [[ ! $NEON_API_KEY =~ ^napi_ ]]; then
    echo -e "${RED}❌ Error: API key should start with 'napi_'${NC}"
    echo "Please run this script again with a valid API key"
    exit 1
fi

echo -e "${GREEN}✅ API key format looks good${NC}"

# Update config file
echo ""
echo "=========================================="
echo "  Step 2: Updating Configuration"
echo "=========================================="
echo ""

CONFIG_FILE="$HOME/.config/Claude/claude_desktop_config.json"

# Create backup if file exists
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup created: $CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)${NC}"
fi

# Create config with API key
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "neon-lalani-erp": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon"
      ],
      "env": {
        "NEON_API_KEY": "$NEON_API_KEY"
      }
    }
  }
}
EOF

echo -e "${GREEN}✅ Configuration file updated: $CONFIG_FILE${NC}"

# Also save to environment variable (optional)
echo ""
read -p "Would you like to save the API key to your shell environment? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Detect shell
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        SHELL_RC="$HOME/.profile"
    fi

    echo "" >> "$SHELL_RC"
    echo "# Neon API Key for Claude Code MCP" >> "$SHELL_RC"
    echo "export NEON_API_KEY=\"$NEON_API_KEY\"" >> "$SHELL_RC"

    echo -e "${GREEN}✅ API key added to $SHELL_RC${NC}"
    echo "Run: source $SHELL_RC"
fi

# Final instructions
echo ""
echo "=========================================="
echo "  Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. ${YELLOW}Restart Claude Code completely${NC}"
echo "   - Quit the application entirely (not just close window)"
echo "   - Wait 5 seconds"
echo "   - Restart Claude Code"
echo ""
echo "2. ${YELLOW}Verify the connection${NC}"
echo "   In Claude Code, ask:"
echo "   \"Can you list all tables in my Neon database?\""
echo ""
echo "3. ${YELLOW}Test some queries${NC}"
echo "   Try these examples:"
echo "   - \"Show me all products in inventory\""
echo "   - \"How many sales invoices are there?\""
echo "   - \"List customers with outstanding balance\""
echo ""
echo "Configuration file location:"
echo "  $CONFIG_FILE"
echo ""
echo "For troubleshooting, see:"
echo "  $(dirname "$0")/NEON_MCP_SETUP.md"
echo ""
echo -e "${GREEN}Happy querying! 🚀${NC}"
echo ""
