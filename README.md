# 🏦 Gold Loan Management System

A comprehensive, modern gold loan management system built with cutting-edge technologies for seamless loan processing, document management, and user administration.

## ✨ Features

### 🔐 **Authentication & Security**
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Loan Officer, Employee)
- Secure password hashing with bcrypt
- Protected API endpoints with middleware

### 📋 **Loan Management**
- **Short Loan IDs**: Clean 6-digit IDs (GL100001, GL100002)
- **Simplified Status**: 3 clear statuses (Pending, Approved, Returned)
- **Collateral Tracking**: Multiple items with weights, purity, and values
- **Payment Management**: Monthly payment tracking and history
- **Remaining Months**: Shows how many months are left in loan term

### 📁 **Document Management**
- Secure file upload (PDF, Images, Documents)
- Document categorization and verification
- File type validation and size limits
- Organized storage with metadata

### 📊 **Dashboard & Analytics**
- Real-time loan statistics
- Recent loan applications with short IDs
- Status overview with visual indicators
- Quick action buttons for common tasks

### 📱 **User Experience**
- Modern, responsive design
- Mobile-first approach
- Intuitive navigation with sidebar
- Toast notifications and loading states

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** components (Radix UI + Tailwind)
- **React Query** for data fetching
- **React Hook Form** with Yup validation
- **Tailwind CSS** for styling
- **Heroicons** for beautiful icons

### **Backend**
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Morgan** for logging

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- MongoDB 5+

### **Automated Setup (Recommended)**
```bash
# macOS/Linux
./start-robust.sh

# Windows
start-robust.bat
```

### **Manual Setup**
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in new terminal)
cd frontend && npm install && npm run dev
```

## 🌐 Access URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5001/api
- **MongoDB**: mongodb://localhost:27017

## 👥 User Roles

### **Admin**
- Full system access
- User management
- System configuration
- All loan operations

### **Loan Officer**
- Loan approval/return
- Document verification
- Loan status updates
- Customer management

### **Employee**
- Submit loan applications
- Upload documents
- View own applications
- Basic profile management

## 📁 Project Structure

```
loanproject/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js + Express backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Custom middleware
│   └── package.json        # Backend dependencies
├── start-robust.sh         # Robust startup script (macOS/Linux)
├── start-robust.bat        # Robust startup script (Windows)
├── start.sh                # Simple startup script
├── start.bat               # Simple startup script (Windows)
├── add-sample-data.js      # Script to add sample loan data
├── package.json            # Root project configuration
└── README.md               # This file
```

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### **Loans**
- `POST /api/loans` - Create new loan
- `GET /api/loans` - Get all loans
- `GET /api/loans/:id` - Get loan by ID
- `PUT /api/loans/:id` - Update loan
- `PUT /api/loans/:id/status` - Update loan status
- `DELETE /api/loans/:id` - Delete loan
- `GET /api/loans/dashboard/stats` - Dashboard statistics

### **Documents**
- `POST /api/documents/upload` - Upload single document
- `POST /api/documents/upload-multiple` - Upload multiple documents
- `GET /api/documents/loan/:loanId` - Get documents by loan
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id/verify` - Verify document
- `DELETE /api/documents/:id` - Delete document

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js for enhanced security
- **File Upload Security**: Type and size validation
- **JWT Expiration**: Automatic token refresh

## 📱 Mobile Responsiveness

- **Mobile-First Design**: Optimized for small screens
- **Touch-Friendly Interface**: Large touch targets
- **Responsive Layout**: Adapts to all screen sizes
- **Progressive Web App**: PWA capabilities ready

## 🚀 Deployment

### **Frontend (Vite)**
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### **Backend**
```bash
cd backend
npm run build
# Deploy to your server or cloud platform
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

## 📈 Performance

- **Frontend**: Vite for instant hot reload
- **Backend**: Optimized database queries
- **File Uploads**: Streaming and chunked uploads
- **Caching**: React Query for smart data caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: README.md and inline code comments
- **Community**: GitHub Discussions

---

**Built with ❤️ using modern web technologies**
