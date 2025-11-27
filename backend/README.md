# Loan Management System - Backend API

A robust Node.js backend API for managing gold loan applications with document management capabilities.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Loan Management**: Complete CRUD operations for loan applications
- **Document Management**: File upload, storage, and verification system
- **Role-based Access Control**: Admin, Loan Officer, and Employee roles
- **Security**: Rate limiting, helmet security, input validation
- **File Upload**: Support for multiple file types with size and type validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
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

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud service
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public (first user), then Admin only |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/profile` | Get user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| GET | `/api/auth/users` | Get all users | Admin only |
| PUT | `/api/auth/users/:userId/status` | Update user status | Admin only |

### Loans

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/loans` | Create new loan | Private |
| GET | `/api/loans` | Get all loans with filters | Private |
| GET | `/api/loans/:loanId` | Get specific loan | Private (owner/admin/loan officer) |
| PUT | `/api/loans/:loanId` | Update loan | Private (owner/admin/loan officer) |
| PUT | `/api/loans/:loanId/status` | Update loan status | Admin/Loan Officer only |
| DELETE | `/api/loans/:loanId` | Delete loan | Admin/Loan Officer only |
| GET | `/api/loans/dashboard/stats` | Get dashboard statistics | Private |

### Documents

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/documents/upload` | Upload single document | Private |
| POST | `/api/documents/upload-multiple` | Upload multiple documents | Private |
| GET | `/api/documents/loan/:loanId` | Get loan documents | Private (owner/admin/loan officer) |
| GET | `/api/documents/:documentId` | Get specific document | Private (owner/admin/loan officer) |
| PUT | `/api/documents/:documentId/verify` | Verify document | Admin/Loan Officer only |
| PUT | `/api/documents/:documentId` | Update document metadata | Private (owner/admin/loan officer) |
| DELETE | `/api/documents/:documentId` | Delete document | Private (owner/admin/loan officer) |
| GET | `/api/documents/search` | Search documents | Private |

## Data Models

### User
- Basic info (name, email, phone)
- Role-based permissions
- Authentication data
- Profile management

### Loan
- Applicant information
- Loan details (amount, term, interest)
- Gold specifications (weight, purity)
- Status tracking
- Automatic EMI calculations

### Document
- File metadata
- Document type classification
- Verification status
- Access control

## Role Permissions

### Admin
- Full system access
- User management
- All loan operations
- Document verification

### Loan Officer
- Loan review and approval
- Document verification
- Status updates
- View all loans

### Employee
- Submit loan applications
- Upload documents
- View own loans only
- Limited document access

## File Upload

### Supported Formats
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Text files

### File Size Limits
- Default: 10MB per file
- Configurable via environment variables

### Storage
- Local file system with organized directories
- File type-based organization
- Unique filename generation

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable request limits
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Configurable cross-origin settings
- **Helmet Security**: Security headers and protection

## Error Handling

- Centralized error handling middleware
- Consistent error response format
- Detailed logging for debugging
- User-friendly error messages

## Development

### Project Structure
```
backend/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── config/          # Configuration files
├── uploads/         # File storage
├── server.js        # Main application file
└── package.json     # Dependencies and scripts
```

### Adding New Features
1. Create/update models in `models/`
2. Add routes in `routes/`
3. Implement middleware if needed
4. Update documentation

### Testing
```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production MongoDB URI
- Set appropriate file size limits

### Security Considerations
- Use HTTPS in production
- Implement proper logging
- Regular security updates
- Database backup strategies

### Performance
- Enable database indexing
- Implement caching strategies
- Monitor API response times
- Use CDN for file serving

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

2. **File Upload Failures**
   - Verify file size limits
   - Check file type restrictions
   - Ensure upload directory permissions

3. **Authentication Issues**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Validate user credentials

### Logs
- Application logs are available in console
- Use `morgan` for HTTP request logging
- Implement file logging for production

## Contributing

1. Follow existing code style
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## License

This project is licensed under the ISC License.

## Support

For support and questions, please refer to the project documentation or create an issue in the repository.
