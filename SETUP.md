# 🚀 Quick Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local or cloud) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** (for cloning) - [Download here](https://git-scm.com/)

## 🏃‍♂️ Quick Start (Recommended)

### Option 1: Automated Startup (Linux/Mac)
```bash
# Make script executable and run
chmod +x start.sh
./start.sh
```

### Option 2: Automated Startup (Windows)
```cmd
# Double-click the start.bat file
# Or run from command prompt:
start.bat
```

### Option 3: Manual Setup
Follow the detailed steps below.

## 📋 Manual Setup Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit environment file with your settings
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/loan-management-system
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
BCRYPT_ROUNDS=12
```

**Start MongoDB:**
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env file
```

**Start Backend:**
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit environment file
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Start Frontend:**
```bash
npm start
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## 👤 First User Setup

1. **Register the first user** (will automatically be admin)
2. **Login** with your credentials
3. **Create additional users** as needed

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if MongoDB is running
- Verify .env file exists and has correct values
- Check if port 5000 is available

**Frontend won't start:**
- Check if backend is running
- Verify .env file has correct API URL
- Check if port 3000 is available

**Database connection issues:**
- Verify MongoDB is running
- Check connection string in .env
- Ensure database exists

**File upload issues:**
- Check uploads directory permissions
- Verify file size limits in .env
- Check allowed file types

### Port Conflicts

If ports are already in use:

**Backend (5000):**
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Frontend (3000):**
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

## 📱 Testing the System

1. **Register a new user**
2. **Login to the system**
3. **Create a loan application**
4. **Upload documents**
5. **Test different user roles**

## 🚀 Production Deployment

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Deploy build folder to your hosting service
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production MongoDB URI
- Set appropriate CORS origins
- Consider cloud file storage

## 📚 Next Steps

- Review the main README.md for detailed documentation
- Check the backend/README.md for API details
- Explore the code structure in src/ folders
- Customize the system for your needs

## 🆘 Need Help?

- Check the documentation in README.md
- Review API endpoints in backend/README.md
- Check console logs for error messages
- Verify all environment variables are set correctly

---

**Happy coding! 🎉**
