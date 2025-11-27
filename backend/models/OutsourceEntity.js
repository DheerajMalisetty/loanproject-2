const mongoose = require('mongoose');

const outsourceEntitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Entity name is required'],
    trim: true,
    maxlength: [100, 'Entity name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['organization', 'individual'],
    required: [true, 'Entity type is required'],
    default: 'organization'
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0.1, 'Interest rate must be at least 0.1%'],
    max: [36, 'Interest rate cannot exceed 36%']
  },
  maxLoanAmount: {
    type: Number,
    required: [true, 'Maximum loan amount is required'],
    min: [1000, 'Maximum loan amount must be at least ₹1,000'],
    max: [10000000, 'Maximum loan amount cannot exceed ₹1,00,00,000']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
outsourceEntitySchema.index({ name: 1 });
outsourceEntitySchema.index({ type: 1 });
outsourceEntitySchema.index({ status: 1 });
outsourceEntitySchema.index({ createdBy: 1 });

// Virtual for entity display name
outsourceEntitySchema.virtual('displayName').get(function() {
  return this.type === 'individual' ? this.contactPerson : this.name;
});

// Ensure virtual fields are serialized
outsourceEntitySchema.set('toObject', { virtuals: true });
outsourceEntitySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('OutsourceEntity', outsourceEntitySchema);
