@echo off
echo ========================================
echo Starting Sevasangraha Hospital CRM
echo ========================================
echo.

echo Step 1: Starting Backend Server...
cd backend
start cmd /k "echo Backend Server && npm start"
cd ..

echo.
echo Step 2: Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak

echo.
echo Step 3: Starting Frontend...
start cmd /k "echo Frontend Dev Server && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo Backend: http://localhost:3002
echo Frontend: Will open in browser
echo.
echo Login credentials:
echo Email: admin@indic.com
echo Password: admin123
echo ========================================
