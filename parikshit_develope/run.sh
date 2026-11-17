#!/usr/bin/env bash
# HopeLine Local Launcher
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo " Starting HopeLine Clinical Portal for parikshit07.tech"
echo " Web Portal: http://localhost:3000"
echo "=========================================================="

(sleep 1.2 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

# Run local static server
python3 -m http.server -d "$SCRIPT_DIR" 3000
