@echo off
cd /d "%~dp0"
echo ========================================================
echo Starting local web server to bypass browser CORS blocks...
echo ========================================================
echo.
echo Your browser will open automatically. Keep this window open
echo while you are viewing the dashboard.
echo.
start http://localhost:8000/admission_status.html
python -m http.server 8000
