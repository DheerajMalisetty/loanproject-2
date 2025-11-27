#!/bin/bash

echo "🛡️ Starting Gold Loan Management System (Robust Mode)..."

# Configuration
BACKEND_PORT=5001
FRONTEND_PORT=8080
MONGODB_PORT=27017
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
LOG_DIR="logs"

# Create logs directory
mkdir -p $LOG_DIR

# Function to log messages
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a $LOG_DIR/startup.log
}

# Function to check if port is available
is_port_available() {
    local port=$1
    ! lsof -i:$port >/dev/null 2>&1
}

# Function to wait for port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    log "Waiting for $service to be available on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if is_port_available $port; then
            log "✅ Port $port is now available"
            return 0
        fi
        
        log "⏳ Attempt $attempt/$max_attempts - Port $port still in use, waiting..."
        sleep 2
        ((attempt++))
    done
    
    log "❌ Timeout waiting for port $port to be available"
    return 1
}

# Function to kill processes on specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        log "🔄 Killing processes on port $port: $pids"
        echo $pids | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Function to cleanup on exit
cleanup() {
    log "🛑 Shutting down services..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        log "Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        log "Stopping frontend (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Kill any remaining processes
    pkill -f "node server.js" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    
    log "✅ Cleanup complete"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Step 1: Environment Setup
log "📋 Setting up environment..."

# Check if .env files exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    log "📝 Creating backend .env file..."
    cp $BACKEND_DIR/env.example $BACKEND_DIR/.env 2>/dev/null || log "⚠️ Could not create backend .env"
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
    log "📝 Creating frontend .env file..."
    cp $FRONTEND_DIR/env.example $FRONTEND_DIR/.env 2>/dev/null || log "⚠️ Could not create frontend .env"
fi

# Step 2: Clear Ports
log "🧹 Clearing ports..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Step 3: Start MongoDB
log "📊 Starting MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    mkdir -p ~/data/db
    mongod --dbpath ~/data/db > $LOG_DIR/mongodb.log 2>&1 &
    MONGODB_PID=$!
    log "MongoDB started with PID: $MONGODB_PID"
    sleep 3
else
    log "✅ MongoDB is already running"
fi

# Step 4: Install Dependencies
log "📦 Installing dependencies..."

# Backend dependencies
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    log "Installing backend dependencies..."
    cd $BACKEND_DIR && npm install > ../$LOG_DIR/backend-install.log 2>&1 && cd ..
    log "✅ Backend dependencies installed"
else
    log "✅ Backend dependencies already installed"
fi

# Frontend dependencies
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "Installing frontend dependencies..."
    cd $FRONTEND_DIR && npm install > ../$LOG_DIR/frontend-install.log 2>&1 && cd ..
    log "✅ Frontend dependencies installed"
else
    log "✅ Frontend dependencies already installed"
fi

# Step 5: Start Backend
log "🔧 Starting backend server..."
cd $BACKEND_DIR

# Start backend with logging
npm run dev > ../$LOG_DIR/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

log "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
if wait_for_port $BACKEND_PORT "Backend"; then
    log "✅ Backend is ready on port $BACKEND_PORT"
else
    log "❌ Backend failed to start properly"
    log "Check logs at $LOG_DIR/backend.log"
    exit 1
fi

# Step 6: Start Frontend
log "🎨 Starting frontend server..."
cd $FRONTEND_DIR

# Start frontend with logging
npm run dev > ../$LOG_DIR/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

log "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to be ready
if wait_for_port $FRONTEND_PORT "Frontend"; then
    log "✅ Frontend is ready on port $FRONTEND_PORT"
else
    log "⚠️ Frontend may be using a different port (check logs)"
fi

# Step 7: Final Status
log "🎉 System startup complete!"
echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend: http://localhost:$BACKEND_PORT/api"
echo "MongoDB: mongodb://localhost:$MONGODB_PORT"
echo ""
echo "📋 Log Files:"
echo "Startup: $LOG_DIR/startup.log"
echo "Backend: $LOG_DIR/backend.log"
echo "Frontend: $LOG_DIR/frontend.log"
echo "MongoDB: $LOG_DIR/mongodb.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running and monitor processes
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log "❌ Backend process died unexpectedly"
        break
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        log "❌ Frontend process died unexpectedly"
        break
    fi
    
    sleep 5
done

log "❌ One or more services crashed. Check logs for details."
exit 1
