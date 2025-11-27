@echo off
echo 🚀 Starting Gold Loan Management System...

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is already running
) else (
    echo 📦 Starting MongoDB...
    start "MongoDB" mongod --dbpath %USERPROFILE%\data\db
    timeout /t 3 /nobreak >nul
)

REM Check if .env files exist
if not exist "backend\.env" (
    echo 📝 Creating backend .env file...
    copy "backend\env.example" "backend\.env"
)

if not exist "frontend\.env" (
    echo 📝 Creating frontend .env file...
    copy "frontend\env.example" "frontend\.env"
)

REM Install dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install

echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install

REM Start backend
echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ All services started!
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🔧 Backend: http://localhost:5001
echo 📊 MongoDB: mongodb://localhost:27017
echo.
echo Close the command windows to stop the services
pause
