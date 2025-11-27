const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on document type
    const docType = req.body.documentType || 'other';
    const docDir = path.join(uploadsDir, docType);
    
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    
    cb(null, docDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files per request
  }
});

// Single file upload middleware
const uploadSingle = upload.single('document');

// Multiple files upload middleware
const uploadMultiple = upload.array('documents', 10);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large',
        error: `File size should not exceed ${process.env.MAX_FILE_SIZE || '10MB'}`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files',
        error: 'Maximum 10 files allowed per request'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field',
        error: 'Check file field names in your form'
      });
    }
  }
  
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({
      message: 'Invalid file type',
      error: err.message
    });
  }
  
  next(err);
};

// Middleware to validate file upload request
const validateUploadRequest = (req, res, next) => {
  if (!req.body.loanId) {
    return res.status(400).json({ message: 'Loan ID is required' });
  }
  
  if (!req.body.documentType) {
    return res.status(400).json({ message: 'Document type is required' });
  }
  
  const allowedDocTypes = [
    'identity_proof',
    'address_proof',
    'income_proof',
    'gold_images',
    'loan_agreement',
    'bank_statement',
    'other'
  ];
  
  if (!allowedDocTypes.includes(req.body.documentType)) {
    return res.status(400).json({ 
      message: 'Invalid document type',
      allowedTypes: allowedDocTypes
    });
  }
  
  next();
};

// Helper function to get file info
const getFileInfo = (file, documentType, loanId, uploadedBy) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    documentType: documentType,
    loanId: loanId,
    uploadedBy: uploadedBy
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  validateUploadRequest,
  getFileInfo,
  uploadsDir
};
