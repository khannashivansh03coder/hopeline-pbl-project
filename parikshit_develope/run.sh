#!/usr/bin/env bash
# HopeLine Local Launcher (100% Offline Mode)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo " Starting HopeLine Emergency Portal (100% Offline Mode)"
echo " Opening in Google Chrome: http://localhost:3000"
echo "=========================================================="

# Automatically launch in Google Chrome (or default browser)
(sleep 1.0 && open -a "Google Chrome" "http://localhost:3000" 2>/dev/null || open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

# Run local server on port 3000 (binds to 127.0.0.1, zero internet needed)
python3 -m http.server -d "$SCRIPT_DIR" 3000
