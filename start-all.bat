@echo off
echo Starting Price Tracker Services...
echo.

echo 1. Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo 2. Starting Web App...
cd ..\web-app
start "Web App" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo 3. Starting Admin Dashboard...
cd ..\admin-dashboard
start "Admin Dashboard" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo All services are starting...
echo api: http://localhost:3001
echo Web App: http://localhost:3000
echo Admin Dashboard: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul 