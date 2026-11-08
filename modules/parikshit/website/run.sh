#!/usr/bin/env bash
# Quick Launcher for HopeLine Fullstack PBL Web Dashboard
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo " Starting HopeLine Fullstack System (FastAPI + SQLite)..."
echo " Web Dashboard:  http://localhost:8000"
echo " Swagger Docs:   http://localhost:8000/docs"
echo " Database File:  database/hopeline.db"
echo "=========================================================="

# Open browser after a brief delay
(sleep 1.5 && open "http://localhost:8000" 2>/dev/null || xdg-open "http://localhost:8000" 2>/dev/null) &

# Run FastAPI server via Uvicorn
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
