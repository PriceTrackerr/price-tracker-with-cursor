@echo off
echo 🚀 PRICE TRACKER - FIXED STARTUP SCRIPT
echo ==========================================

echo.
echo 🧹 Step 1: Cleaning up any existing processes...
taskkill /f /im node.exe 2>NUL
timeout /t 2 /nobreak >NUL

echo.
echo 🔍 Step 2: Checking port availability...
netstat -ano | findstr :3000 >NUL
if %ERRORLEVEL% == 0 (
    echo ❌ Port 3000 is busy - killing processes
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a 2>NUL
)

netstat -ano | findstr :3001 >NUL
if %ERRORLEVEL% == 0 (
    echo ❌ Port 3001 is busy - killing processes  
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%a 2>NUL
)

netstat -ano | findstr :5173 >NUL
if %ERRORLEVEL% == 0 (
    echo ❌ Port 5173 is busy - killing processes
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a 2>NUL
)

echo.
echo ✅ Ports cleaned up successfully
timeout /t 3 /nobreak >NUL

echo.
echo 🚀 Step 3: Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd /d backend && npm run dev"
timeout /t 5 /nobreak >NUL

echo.
echo 🌐 Step 4: Starting Web App (Port 3000)...
start "Web App" cmd /k "cd /d web-app && npm run dev"
timeout /t 3 /nobreak >NUL

echo.
echo 📊 Step 5: Starting Admin Dashboard (Port 5173)...
start "Admin Dashboard" cmd /k "cd /d admin-dashboard && npm run dev"

echo.
echo ✅ ALL SERVICES STARTED!
echo ==========================================
echo 🌐 Web App: http://localhost:3000
echo 📊 Admin Dashboard: http://localhost:5173  
echo 🔧 Backend API: http://localhost:3001
echo ==========================================
echo.
echo Press any key to exit...
pause >NUL 