const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be at least 1 byte']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'identity_proof',
      'address_proof',
      'income_proof',
      'gold_images',
      'loan_agreement',
      'bank_statement',
      'other'
    ]
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: [true, 'Loan ID is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: {
    type: Date
  },
  verificationNotes: {
    type: String,
    maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ loanId: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ isVerified: 1 });
documentSchema.index({ createdAt: 1 });

// Virtual for file extension
documentSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for isImage
documentSchema.virtual('isImage').get(function() {
  return this.mimeType.startsWith('image/');
});

// Virtual for isPDF
documentSchema.virtual('isPDF').get(function() {
  return this.mimeType === 'application/pdf';
});

// Virtual for formatted file size
documentSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Pre-save middleware to set verification date when verified
documentSchema.pre('save', function(next) {
  if (this.isModified('isVerified') && this.isVerified && !this.verificationDate) {
    this.verificationDate = new Date();
  }
  next();
});

// Method to get document URL
documentSchema.methods.getDocumentUrl = function() {
  return `/uploads/${this.filename}`;
};

// Method to check if document is viewable in browser
documentSchema.methods.isViewable = function() {
  const viewableTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain'
  ];
  return viewableTypes.includes(this.mimeType);
};

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);
