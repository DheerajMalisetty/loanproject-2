const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Shorter loan ID: GL + 6 digits
      return 'GL' + Math.floor(100000 + Math.random() * 900000);
    }
  },
  applicantName: {
    type: String,
    required: [true, 'Applicant name is required'],
    trim: true,
    maxlength: [100, 'Applicant name cannot exceed 100 characters']
  },
  applicantPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  applicantEmail: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  applicantAddress: {
    street: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      required: false,
      trim: true,
      default: 'India'
    }
  },
  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [1000, 'Loan amount must be at least ₹1,000'],
    max: [10000000, 'Loan amount cannot exceed ₹1,00,00,000']
  },
  netWeight: {
    type: Number,
    required: [true, 'Net weight is required'],
    min: [0.1, 'Net weight must be at least 0.1 grams'],
    max: [10000, 'Net weight cannot exceed 10,000 grams']
  },
  grossWeight: {
    type: Number,
    required: [true, 'Gross weight is required'],
    min: [0.1, 'Gross weight must be at least 0.1 grams'],
    max: [10000, 'Gross weight cannot exceed 10,000 grams']
  },
  goldPurity: {
    type: String,
    required: [true, 'Gold purity is required'],
    enum: ['18K', '22K', '24K', '91.6%', '91.7%', '99.9%'],
    default: '22K'
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0.1, 'Interest rate must be at least 0.1%'],
    max: [36, 'Interest rate cannot exceed 36%'],
    default: 12
  },
  loanTerm: {
    type: Number,
    required: [true, 'Loan term is required'],
    min: [1, 'Loan term must be at least 1 month'],
    max: [60, 'Loan term cannot exceed 60 months'],
    default: 12
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review', 'closed'],
    default: 'approved'
  },
  account: {
    type: String,
    enum: ['account1', 'account2', 'account3'],
    default: 'account1',
    required: [true, 'Account selection is required']
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date
  },
  disbursementDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Calculated fields for EMI and amounts
  monthlyEMI: {
    type: Number,
    default: 0
  },
  totalInterest: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  
  // Digital signature support
  digitalSignature: {
    signatureData: String, // Base64 encoded signature
    signedAt: Date,
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Document workflow
  documents: [{
    filename: String,
    originalName: String,
    mimeType: String,
    documentType: {
      type: String,
      enum: ['identity_proof', 'address_proof', 'gold_photos', 'signed_form', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Document generation and signing workflow
  documentStatus: {
    type: String,
    enum: ['draft', 'generated', 'signed', 'completed'],
    default: 'draft'
  },
  
  // New fields for collateral items
  collateralItems: [{
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    itemType: {
      type: String,
      enum: ['gold', 'silver', 'diamond', 'other'],
      default: 'gold'
    },
    netWeight: {
      type: Number,
      required: true,
      min: [0.1, 'Net weight must be at least 0.1 grams']
    },
    grossWeight: {
      type: Number,
      required: true,
      min: [0.1, 'Gross weight must be at least 0.1 grams']
    },
    purity: {
      type: String,
      required: true
    },
    estimatedValue: {
      type: Number,
      required: true,
      min: [100, 'Value must be at least ₹100']
    },
    description: {
      type: String,
      trim: true
    },
    pictures: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Payment tracking
  payments: [{
    month: {
      type: Number,
      required: true,
      min: [1, 'Month must be at least 1']
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'online'],
      default: 'cash'
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Documents
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  // Total weight calculations
  totalNetWeight: {
    type: Number,
    default: 0
  },
  totalGrossWeight: {
    type: Number,
    default: 0
  },
  
  // Outsource functionality
  outsourcedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OutsourceEntity'
  },
  outsourceEntity: {
    type: String,
    trim: true
  },
  outsourceDate: {
    type: Date
  },
  outsourceAmount: {
    type: Number,
    min: [0, 'Outsource amount cannot be negative']
  },
  outsourceInterestRate: {
    type: Number,
    min: [0.1, 'Outsource interest rate must be at least 0.1%'],
    max: [36, 'Outsource interest rate cannot exceed 36%']
  },
  profitMargin: {
    type: Number
  },
  outsourceNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Outsource notes cannot exceed 1000 characters']
  },
  
  // Soft delete functionality
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Loan closure information
  closedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closureReason: {
    type: String,
    enum: ['fully_paid', 'settlement', 'write_off', 'collateral_auction', 'other'],
    trim: true
  },
  closureNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Closure notes cannot exceed 1000 characters']
  },
  finalAmount: {
    type: Number,
    min: [0, 'Final amount cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// Single field indexes
loanSchema.index({ loanId: 1 });
loanSchema.index({ applicantPhone: 1 });
loanSchema.index({ applicantEmail: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ submittedBy: 1 });
loanSchema.index({ applicationDate: 1 });
loanSchema.index({ outsourcedTo: 1 });
loanSchema.index({ isActive: 1 });
loanSchema.index({ account: 1 });

// Compound indexes for common queries
loanSchema.index({ status: 1, applicationDate: 1 });
loanSchema.index({ submittedBy: 1, status: 1 });
loanSchema.index({ status: 1, outsourcedTo: 1 });
loanSchema.index({ applicationDate: 1, status: 1, submittedBy: 1 });
loanSchema.index({ account: 1, status: 1 });
loanSchema.index({ account: 1, applicationDate: 1 });
loanSchema.index({ closedAt: 1 });
loanSchema.index({ closedBy: 1 });
loanSchema.index({ closureReason: 1 });

// Text search index for applicant information
loanSchema.index({ 
  applicantName: 'text', 
  applicantEmail: 'text', 
  loanId: 'text' 
});

// Pre-save middleware to calculate EMI and total amounts
loanSchema.pre('save', function(next) {
  if (this.isModified('loanAmount') || this.isModified('interestRate') || this.isModified('loanTerm')) {
    const principal = this.loanAmount;
    const rate = this.interestRate / 100 / 12; // Monthly interest rate
    const time = this.loanTerm;
    
    if (rate > 0 && time > 0) {
      // Calculate monthly EMI
      this.monthlyEMI = principal * (rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
      this.monthlyEMI = Math.round(this.monthlyEMI * 100) / 100; // Round to 2 decimal places
      
      // Calculate total interest and amount
      this.totalInterest = (this.monthlyEMI * time) - principal;
      this.totalInterest = Math.round(this.totalInterest * 100) / 100;
      this.totalAmount = principal + this.totalInterest;
      this.totalAmount = Math.round(this.totalAmount * 100) / 100;
    }
  }
  
  // Calculate total weights from collateral items if they exist
  if (this.isModified('collateralItems') && this.collateralItems && this.collateralItems.length > 0) {
    this.totalNetWeight = this.collateralItems.reduce((sum, item) => sum + (item.netWeight || 0), 0);
    this.totalGrossWeight = this.collateralItems.reduce((sum, item) => sum + (item.grossWeight || 0), 0);
    
    // Round to 2 decimal places
    this.totalNetWeight = Math.round(this.totalNetWeight * 100) / 100;
    this.totalGrossWeight = Math.round(this.totalGrossWeight * 100) / 100;
  }
  
  // Set due date based on loan term
  if (this.isModified('loanTerm') && this.loanTerm) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + this.loanTerm);
    this.dueDate = dueDate;
  }
  
  next();
});

// Virtual for loan age in days
loanSchema.virtual('loanAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.applicationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for remaining months
loanSchema.virtual('remainingMonths').get(function() {
  if (this.dueDate) {
    const now = new Date();
    const diffTime = this.dueDate - now;
    const monthsRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, monthsRemaining);
  }
  return this.loanTerm;
});

// Virtual for remaining amount
loanSchema.virtual('remainingAmount').get(function() {
  if (this.totalAmount && this.payments && this.payments.length > 0) {
    const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, this.totalAmount - totalPaid);
  }
  return this.totalAmount || 0;
});

// Virtual for next payment due
loanSchema.virtual('nextPaymentDue').get(function() {
  if (this.payments && this.payments.length > 0) {
    const lastPaymentMonth = Math.max(...this.payments.map(p => p.month));
    return lastPaymentMonth + 1;
  }
  return 1;
});

// Virtual for payment status
loanSchema.virtual('paymentStatus').get(function() {
  if (this.payments && this.payments.length > 0) {
    const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const expectedAmount = this.monthlyEMI * this.payments.length;
    
    if (totalPaid >= expectedAmount) {
      return 'up_to_date';
    } else if (totalPaid > 0) {
      return 'partial';
    } else {
      return 'overdue';
    }
  }
  return 'no_payments';
});

// Virtual for collateral total value
loanSchema.virtual('collateralTotalValue').get(function() {
  if (this.collateralItems && this.collateralItems.length > 0) {
    return this.collateralItems.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);
  }
  return 0;
});

// Ensure virtual fields are serialized
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);
