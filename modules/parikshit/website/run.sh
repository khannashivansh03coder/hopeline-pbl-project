#!/usr/bin/env bash
# Quick Launcher for HopeLine Website (Parikshit Module)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo " Starting HopeLine PBL Phase 3 Web Dashboard..."
echo " Opening browser at http://localhost:3000"
echo "=========================================================="

# Open browser after a brief delay
(sleep 1 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

# Run server
python3 server.py
