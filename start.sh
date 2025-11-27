#!/bin/bash

echo "🚀 Starting Gold Loan Management System..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 Starting MongoDB..."
    mkdir -p ~/data/db
    mongod --dbpath ~/data/db &
    sleep 3
else
    echo "✅ MongoDB is already running"
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp backend/env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend .env file..."
    cp frontend/env.example frontend/.env
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

# Start backend
echo "🔧 Starting backend server..."
cd ../backend && npm run dev &

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend && npm run dev &

echo "✅ All services started!"
echo ""
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend: http://localhost:5001"
echo "📊 MongoDB: mongodb://localhost:27017"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
