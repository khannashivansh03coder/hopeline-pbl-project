@echo off
title HopeLine Emergency System - Localhost Server
echo ========================================================
echo  Starting HopeLine Central Emergency Portal (Localhost)
echo  Opening http://localhost:3000 in your browser...
echo ========================================================
start http://localhost:3000
python -m http.server 3000
if %errorlevel% neq 0 (
    echo.
    echo Python server stopped. You can also directly double-click index.html to view the website!
    pause
)
