@echo off
setlocal enabledelayedexpansion

echo 🛡️ Starting Gold Loan Management System (Robust Mode)...

REM Configuration
set BACKEND_PORT=5001
set FRONTEND_PORT=8080
set MONGODB_PORT=27017
set BACKEND_DIR=backend
set FRONTEND_DIR=frontend
set LOG_DIR=logs

REM Create logs directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Function to log messages
call :log "📋 Setting up environment..."

REM Check if .env files exist
if not exist "%BACKEND_DIR%\.env" (
    call :log "📝 Creating backend .env file..."
    copy "%BACKEND_DIR%\env.example" "%BACKEND_DIR%\.env" >nul 2>&1
)

if not exist "%FRONTEND_DIR%\.env" (
    call :log "📝 Creating frontend .env file..."
    copy "%FRONTEND_DIR%\env.example" "%FRONTEND_DIR%\.env" >nul 2>&1
)

REM Clear ports
call :log "🧹 Clearing ports..."
call :kill_port %BACKEND_PORT%
call :kill_port %FRONTEND_PORT%

REM Start MongoDB
call :log "📊 Starting MongoDB..."
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    call :log "✅ MongoDB is already running"
) else (
    if not exist "%USERPROFILE%\data\db" mkdir "%USERPROFILE%\data\db"
    start "MongoDB" mongod --dbpath "%USERPROFILE%\data\db"
    timeout /t 3 /nobreak >nul
    call :log "✅ MongoDB started"
)

REM Install dependencies
call :log "📦 Installing dependencies..."

REM Backend dependencies
if not exist "%BACKEND_DIR%\node_modules" (
    call :log "Installing backend dependencies..."
    cd %BACKEND_DIR%
    call npm install > ..\%LOG_DIR%\backend-install.log 2>&1
    cd ..
    call :log "✅ Backend dependencies installed"
) else (
    call :log "✅ Backend dependencies already installed"
)

REM Frontend dependencies
if not exist "%FRONTEND_DIR%\node_modules" (
    call :log "Installing frontend dependencies..."
    cd %FRONTEND_DIR%
    call npm install > ..\%LOG_DIR%\frontend-install.log 2>&1
    cd ..
    call :log "✅ Frontend dependencies installed"
) else (
    call :log "✅ Frontend dependencies already installed"
)

REM Start backend
call :log "🔧 Starting backend server..."
start "Backend Server" cmd /k "cd %BACKEND_DIR% && npm run dev > ..\%LOG_DIR%\backend.log 2>&1"

REM Wait for backend to start
call :log "⏳ Waiting for backend to start..."
timeout /t 5 /nobreak >nul

REM Test backend
call :log "Testing backend connection..."
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%BACKEND_PORT%/api/health' -TimeoutSec 5; Write-Host 'SUCCESS' } catch { Write-Host 'FAILED' }" > temp_test.txt
set /p BACKEND_TEST=<temp_test.txt
del temp_test.txt

if "%BACKEND_TEST%"=="SUCCESS" (
    call :log "✅ Backend is ready on port %BACKEND_PORT%"
) else (
    call :log "❌ Backend failed to start properly"
    call :log "Check logs at %LOG_DIR%\backend.log"
    pause
    exit /b 1
)

REM Start frontend
call :log "🎨 Starting frontend server..."
start "Frontend Server" cmd /k "cd %FRONTEND_DIR% && npm run dev > ..\%LOG_DIR%\frontend.log 2>&1"

REM Wait for frontend to start
call :log "⏳ Waiting for frontend to start..."
timeout /t 3 /nobreak >nul

REM Final status
call :log "🎉 System startup complete!"
echo.
echo 🌐 Access URLs:
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend: http://localhost:%BACKEND_PORT%/api
echo MongoDB: mongodb://localhost:%MONGODB_PORT%
echo.
echo 📋 Log Files:
echo Startup: %LOG_DIR%\startup.log
echo Backend: %LOG_DIR%\backend.log
echo Frontend: %LOG_DIR%\frontend.log
echo.
echo Close the command windows to stop the services
pause
exit /b 0

REM Functions
:log
echo [%time%] %~1 | tee -a "%LOG_DIR%\startup.log"
goto :eof

:kill_port
set port=%~1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%port% ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
goto :eof
