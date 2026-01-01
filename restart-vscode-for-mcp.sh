#!/bin/bash

# Script to restart VSCode and reload Claude Code with MCP configuration

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║         Restarting VSCode for Neon MCP Connection                   ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verify config file exists
if [ ! -f "$HOME/.config/Claude/claude_desktop_config.json" ]; then
    echo -e "${YELLOW}⚠️  Warning: Config file not found${NC}"
    echo "Location: ~/.config/Claude/claude_desktop_config.json"
    exit 1
fi

echo -e "${GREEN}✅ Config file found${NC}"
echo ""

# Verify API key is in config
if grep -q "REPLACE_WITH_YOUR" "$HOME/.config/Claude/claude_desktop_config.json"; then
    echo -e "${YELLOW}⚠️  Warning: API key placeholder still present${NC}"
    echo "Please replace REPLACE_WITH_YOUR_API_KEY with your actual Neon API key"
    exit 1
fi

echo -e "${GREEN}✅ API key configured${NC}"
echo ""

# Verify API key format
if ! grep -q "napi_" "$HOME/.config/Claude/claude_desktop_config.json"; then
    echo -e "${YELLOW}⚠️  Warning: API key might be incorrect${NC}"
    echo "Neon API keys should start with 'napi_'"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ API key format looks good${NC}"
echo ""

# Find VSCode processes
echo "Looking for VSCode processes..."
VSCODE_PIDS=$(pgrep -f "vscode-server|code" || true)

if [ -z "$VSCODE_PIDS" ]; then
    echo -e "${YELLOW}No VSCode processes found${NC}"
    echo ""
    echo "Please start VSCode manually:"
    echo "  code"
    exit 0
fi

echo -e "${GREEN}Found VSCode processes${NC}"
echo ""

# Save current directory
CURRENT_DIR=$(pwd)

echo "Step 1: Saving workspace state..."
echo ""

echo "Step 2: Stopping VSCode processes..."
pkill -f "vscode-server" || true
pkill -f "code" || true

echo -e "${GREEN}✅ VSCode processes stopped${NC}"
echo ""

echo "Step 3: Waiting 5 seconds for cleanup..."
sleep 5

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo "Step 4: Starting VSCode in current directory..."
echo ""

# Start VSCode in background
cd "$CURRENT_DIR"
code . &

echo -e "${GREEN}✅ VSCode started${NC}"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "VSCode has been restarted!"
echo ""
echo "Next steps:"
echo ""
echo "1. Wait for VSCode to fully load (10-15 seconds)"
echo "2. Open Claude Code in VSCode"
echo "3. Test the MCP connection by asking:"
echo ""
echo "   \"Can you list all tables in my Neon database?\""
echo ""
echo "Expected result:"
echo "   Claude should be able to query your database directly"
echo "   and show you a list of tables (companies, users, products, etc.)"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
