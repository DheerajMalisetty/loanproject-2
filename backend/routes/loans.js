const express = require('express');
const Loan = require('../models/Loan');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireRole, 
  canAccessLoan, 
  canModifyLoanStatus,
  logActivity 
} = require('../middleware/auth');
const { dashboardCache, loanStatsCache, userCache } = require('../utils/cache');

const router = express.Router();

// @route   POST /api/loans
// @desc    Create a new loan application
// @access  Private
router.post('/', authenticateToken, logActivity('create_loan'), async (req, res) => {
  try {
    const {
      applicantName,
      applicantPhone,
      applicantEmail,
      applicantAddress,
      loanAmount,
      netWeight,
      grossWeight,
      goldPurity,
      interestRate,
      loanTerm,
      account,
      notes,
      items, // New field for multiple items
      digitalSignature // New field for digital signature
    } = req.body;

    // Transform items to collateralItems format
    const collateralItems = items ? items.map(item => ({
      itemName: item.name,
      itemType: item.itemType || 'gold',
      netWeight: parseFloat(item.netWeight) || 0,
      grossWeight: parseFloat(item.grossWeight) || 0,
      purity: item.purity || '22K',
      estimatedValue: parseFloat(item.estimatedValue) || 0,
      description: item.description || '',
      pictures: [] // Will be populated when documents are uploaded
    })) : [];

    // Create new loan (automatically approved)
    const loan = new Loan({
      applicantName,
      applicantPhone,
      applicantEmail,
      applicantAddress,
      loanAmount,
      netWeight,
      grossWeight,
      goldPurity,
      interestRate,
      loanTerm,
      account: account || 'account1',
      notes,
      collateralItems,
      digitalSignature: digitalSignature ? {
        signatureData: digitalSignature,
        signedAt: new Date(),
        signedBy: req.user._id
      } : undefined,
      submittedBy: req.user._id,
      approvedBy: req.user._id, // Auto-approve when created
      approvalDate: new Date() // Set approval date when created
    });

    await loan.save();

    // Populate submittedBy field
    await loan.populate('submittedBy', 'firstName lastName username');

    // Clear dashboard cache since we have new data
    dashboardCache.clear();

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan
    });

  } catch (error) {
    console.error('Loan creation error:', error);
    res.status(500).json({ 
      message: 'Error creating loan application',
      error: error.message 
    });
  }
});

// @route   GET /api/loans
// @desc    Get all loans with filtering and pagination
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'applicationDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.applicationDate = {};
      if (startDate) filter.applicationDate.$gte = new Date(startDate);
      if (endDate) filter.applicationDate.$lte = new Date(endDate);
    }

    // Search functionality - use text search for better performance
    if (search) {
      // Use text search if it looks like a general search
      if (search.length > 2) {
        filter.$text = { $search: search };
      } else {
        // Fallback to regex for short searches
        filter.$or = [
          { applicantName: { $regex: search, $options: 'i' } },
          { applicantPhone: { $regex: search, $options: 'i' } },
          { applicantEmail: { $regex: search, $options: 'i' } },
          { loanId: { $regex: search, $options: 'i' } }
        ];
      }
    }

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.submittedBy = req.user._id;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const loans = await Loan.find(filter)
      .select('loanId applicantName applicantPhone applicantEmail applicantAddress loanAmount netWeight grossWeight totalNetWeight totalGrossWeight goldPurity status account applicationDate monthlyEMI outsourcedTo outsourceAmount outsourceDate submittedBy approvedBy')
      .populate('submittedBy', 'firstName lastName username')
      .populate('approvedBy', 'firstName lastName username')
      .populate('outsourcedTo', 'name type')
      .lean() // Use lean for better performance when we don't need full mongoose documents
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get summary statistics
    const summary = await Loan.aggregate([
      { $match: {} },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: '$loanAmount' },
          pendingLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
        }
      }
    ]);

    res.json({
      loans,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      summary: summary[0] || {
        totalLoans: 0,
        totalAmount: 0,
        pendingLoans: 0,
        approvedLoans: 0
      }
    });

  } catch (error) {
    console.error('Loans fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching loans',
      error: error.message 
    });
  }
});

// @route   GET /api/loans/:loanId
// @desc    Get a specific loan by ID
// @access  Private
router.get('/:loanId', authenticateToken, canAccessLoan, async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId)
      .populate('submittedBy', 'firstName lastName username email phoneNumber')
      .populate('approvedBy', 'firstName lastName username')
      .populate('outsourcedTo', 'name type')
      .populate({
        path: 'documents',
        populate: {
          path: 'uploadedBy',
          select: 'firstName lastName username'
        }
      });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({ loan });

  } catch (error) {
    console.error('Loan fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching loan',
      error: error.message 
    });
  }
});

// @route   PUT /api/loans/:loanId
// @desc    Update a loan application
// @access  Private (owner or admin/loan officer)
router.put('/:loanId', authenticateToken, canAccessLoan, logActivity('update_loan'), async (req, res) => {
  try {
    const { loanId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.status;
    delete updates.approvalDate;
    delete updates.disbursementDate;
    delete updates.submittedBy;
    delete updates.approvedBy;

    // Only allow status updates for admin/loan officers
    if (['admin', 'loan_officer'].includes(req.user.role)) {
      if (updates.status) {
        if (updates.status === 'approved') {
          updates.approvalDate = new Date();
          updates.approvedBy = req.user._id;
        } else if (updates.status === 'disbursed') {
          updates.disbursementDate = new Date();
          if (!updates.approvedBy) {
            updates.approvedBy = req.user._id;
          }
        }
      }
    }

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      updates,
      { new: true, runValidators: true }
    ).populate('submittedBy', 'firstName lastName username')
     .populate('approvedBy', 'firstName lastName username')
     .populate('outsourcedTo', 'name type');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({
      message: 'Loan updated successfully',
      loan
    });

  } catch (error) {
    console.error('Loan update error:', error);
    res.status(500).json({ 
      message: 'Error updating loan',
      error: error.message 
    });
  }
});

// @route   PUT /api/loans/:loanId/account
// @desc    Change loan account type
// @access  Private (Admin/Loan Officer)
router.put('/:loanId/account', authenticateToken, canModifyLoanStatus, logActivity('change_loan_account'), async (req, res) => {
  try {
    const { loanId } = req.params;
    const { account } = req.body;

    // Validate account type
    if (!account || !['account1', 'account2', 'account3'].includes(account)) {
      return res.status(400).json({ 
        message: 'Invalid account type. Must be account1, account2, or account3' 
      });
    }

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      { account },
      { new: true, runValidators: true }
    ).populate('submittedBy', 'firstName lastName username')
     .populate('approvedBy', 'firstName lastName username')
     .populate('outsourcedTo', 'name type');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Clear dashboard cache since account statistics have changed
    dashboardCache.clear();

    res.json({
      message: 'Loan account updated successfully',
      loan
    });
  } catch (error) {
    console.error('Loan account update error:', error);
    res.status(500).json({ 
      message: 'Error updating loan account',
      error: error.message 
    });
  }
});

// @route   PUT /api/loans/:loanId/close
// @desc    Close a loan with validation and confirmation
// @access  Private (Admin/Loan Officer)
router.put('/:loanId/close', authenticateToken, canModifyLoanStatus, logActivity('close_loan'), async (req, res) => {
  try {
    const { loanId } = req.params;
    const { closureReason, closureNotes, finalAmount } = req.body;

    // Validate required fields
    if (!closureReason) {
      return res.status(400).json({ 
        message: 'Closure reason is required' 
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if loan is already closed
    if (loan.status === 'closed') {
      return res.status(400).json({ 
        message: 'Loan is already closed' 
      });
    }

    // Validate loan can be closed (must be approved)
    if (loan.status !== 'approved') {
      return res.status(400).json({ 
        message: `Cannot close loan with status '${loan.status}'. Loan must be approved first.` 
      });
    }

    // Update loan status and closure information
    loan.status = 'closed';
    loan.closedAt = new Date();
    loan.closedBy = req.user._id;
    loan.closureReason = closureReason;
    loan.closureNotes = closureNotes || '';
    
    // If final amount is provided, use it; otherwise calculate from payments
    if (finalAmount !== undefined) {
      loan.finalAmount = parseFloat(finalAmount);
    } else {
      // Calculate total payments made
      const totalPayments = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
      loan.finalAmount = totalPayments;
    }

    await loan.save();

    // Populate the updated loan for response
    await loan.populate([
      { path: 'submittedBy', select: 'firstName lastName username' },
      { path: 'approvedBy', select: 'firstName lastName username' },
      { path: 'closedBy', select: 'firstName lastName username' },
      { path: 'outsourcedTo', select: 'name type' }
    ]);

    // Clear dashboard cache since loan statistics have changed
    dashboardCache.clear();

    res.json({
      message: 'Loan closed successfully',
      loan
    });
  } catch (error) {
    console.error('Loan closure error:', error);
    res.status(500).json({ 
      message: 'Error closing loan',
      error: error.message 
    });
  }
});

// @route   PUT /api/loans/:loanId/status
// @desc    Update loan status (admin/loan officer only)
// @access  Private (Admin/Loan Officer)
router.put('/:loanId/status', authenticateToken, canModifyLoanStatus, logActivity('update_loan_status'), async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updates = { status };
    
    if (notes) updates.notes = notes;

    // Set appropriate dates based on status
    if (status === 'approved') {
      updates.approvalDate = new Date();
      updates.approvedBy = req.user._id;
    } else if (status === 'disbursed') {
      updates.disbursementDate = new Date();
      if (!updates.approvedBy) {
        updates.approvedBy = req.user._id;
      }
    }

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      updates,
      { new: true, runValidators: true }
    ).populate('submittedBy', 'firstName lastName username')
     .populate('approvedBy', 'firstName lastName username')
     .populate('outsourcedTo', 'name type');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({
      message: 'Loan status updated successfully',
      loan
    });

  } catch (error) {
    console.error('Loan status update error:', error);
    res.status(500).json({ 
      message: 'Error updating loan status',
      error: error.message 
    });
  }
});

// @route   DELETE /api/loans/:loanId
// @desc    Soft delete a loan (admin/loan officer only)
// @access  Private (Admin/Loan Officer)
router.delete('/:loanId', authenticateToken, requireRole(['admin', 'loan_officer']), logActivity('delete_loan'), async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      { isActive: false },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({
      message: 'Loan deleted successfully',
      loan
    });

  } catch (error) {
    console.error('Loan deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting loan',
      error: error.message 
    });
  }
});

// @route   GET /api/loans/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `dashboard_stats_${req.user.role}_${req.user._id}`;
    
    const result = await dashboardCache.getOrSet(cacheKey, async () => {
      const filter = { 
        $and: [
          { $or: [{ isActive: true }, { isActive: null }, { isActive: { $exists: false } }] }
        ]
      };
      
      // Role-based filtering
      if (req.user.role === 'employee') {
        filter.$and.push({ submittedBy: req.user._id });
      }

      const stats = await Loan.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalLoans: { $sum: 1 },
            totalAmount: { $sum: '$loanAmount' },
            pendingLoans: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            underReviewLoans: {
              $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] }
            },
            approvedLoans: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            rejectedLoans: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            closedLoans: {
              $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
            },
            outsourcedLoans: {
              $sum: { $cond: [{ $and: [{ $ne: ['$outsourcedTo', null] }, { $eq: [{ $type: '$outsourcedTo' }, 'objectId'] }] }, 1, 0] }
            },
            outsourcedAmount: {
              $sum: { $cond: [{ $and: [{ $ne: ['$outsourcedTo', null] }, { $eq: [{ $type: '$outsourcedTo' }, 'objectId'] }] }, '$loanAmount', 0] }
            },
            account1Loans: {
              $sum: { $cond: [{ $eq: [{ $ifNull: ['$account', 'account1'] }, 'account1'] }, 1, 0] }
            },
            account1Amount: {
              $sum: { $cond: [{ $eq: [{ $ifNull: ['$account', 'account1'] }, 'account1'] }, '$loanAmount', 0] }
            },
            account2Loans: {
              $sum: { $cond: [{ $eq: ['$account', 'account2'] }, 1, 0] }
            },
            account2Amount: {
              $sum: { $cond: [{ $eq: ['$account', 'account2'] }, '$loanAmount', 0] }
            },
            account3Loans: {
              $sum: { $cond: [{ $eq: ['$account', 'account3'] }, 1, 0] }
            },
            account3Amount: {
              $sum: { $cond: [{ $eq: ['$account', 'account3'] }, '$loanAmount', 0] }
            }
          }
        }
      ]);

      // Monthly loan trends for the current year
      const currentYear = new Date().getFullYear();
      const monthlyTrends = await Loan.aggregate([
        { 
          $match: { 
            ...filter,
            applicationDate: { 
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            }
          } 
        },
        {
          $group: {
            _id: { $month: '$applicationDate' },
            count: { $sum: 1 },
            totalAmount: { $sum: '$loanAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        stats: stats[0] || {
          totalLoans: 0,
          totalAmount: 0,
          pendingLoans: 0,
          underReviewLoans: 0,
          approvedLoans: 0,
          rejectedLoans: 0,
          closedLoans: 0,
          outsourcedLoans: 0,
          outsourcedAmount: 0,
          account1Loans: 0,
          account1Amount: 0,
          account2Loans: 0,
          account2Amount: 0,
          account3Loans: 0,
          account3Amount: 0
        },
        monthlyTrends
      };
    });

    res.json(result);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: error.message 
    });
  }
});

// @route   POST /api/loans/:id/payments
// @desc    Record a monthly payment for a loan
// @access  Private
router.post('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { month, amount, paymentMethod, notes } = req.body;
    const { id } = req.params;

    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if payment for this month already exists
    const existingPayment = loan.payments.find(p => p.month === month);
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment for this month already recorded' });
    }

    // Validate month is within loan term
    if (month < 1 || month > loan.loanTerm) {
      return res.status(400).json({ message: `Month must be between 1 and ${loan.loanTerm}` });
    }

    // Add payment
    loan.payments.push({
      month,
      amount,
      paymentMethod,
      notes,
      receivedBy: req.user._id,
      paymentDate: new Date()
    });

    await loan.save();

    res.json({
      message: 'Payment recorded successfully',
      payment: loan.payments[loan.payments.length - 1]
    });

  } catch (error) {
    console.error('Payment recording error:', error);
    res.status(500).json({ 
      message: 'Error recording payment',
      error: error.message 
    });
  }
});

// @route   PUT /api/loans/:id/payments/:paymentId
// @desc    Update a monthly payment
// @access  Private
router.put('/:id/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const { id, paymentId } = req.params;

    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const payment = loan.payments.id(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment fields
    if (amount !== undefined) payment.amount = amount;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (notes !== undefined) payment.notes = notes;
    payment.paymentDate = new Date(); // Update timestamp

    await loan.save();

    res.json({
      message: 'Payment updated successfully',
      payment
    });

  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({ 
      message: 'Error updating payment',
      error: error.message 
    });
  }
});

// @route   DELETE /api/loans/:id/payments/:paymentId
// @desc    Delete a monthly payment
// @access  Private
router.delete('/:id/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { id, paymentId } = req.params;

    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const payment = loan.payments.id(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Remove payment
    loan.payments.pull(paymentId);
    await loan.save();

    res.json({
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Payment deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting payment',
      error: error.message 
    });
  }
});

// @route   GET /api/loans/:loanId/download
// @desc    Download loan application as PDF
// @access  Private
router.get('/:loanId/download', authenticateToken, canAccessLoan, async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Create HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Gold Loan Application - ${loan.loanId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .field {
            margin-bottom: 10px;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
          }
          .value {
            display: inline-block;
          }
          .address-field {
            margin-left: 150px;
          }
          .signature-section {
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Gold Loan Application Form</h1>
          <p><strong>Application Date:</strong> ${new Date(loan.applicationDate).toLocaleDateString()}</p>
          <p><strong>Loan ID:</strong> ${loan.loanId}</p>
        </div>

        <div class="section">
          <h3>Applicant Information</h3>
          <div class="field">
            <span class="label">Name:</span>
            <span class="value">${loan.applicantName || 'Not provided'}</span>
          </div>
          <div class="field">
            <span class="label">Phone:</span>
            <span class="value">${loan.applicantPhone || 'Not provided'}</span>
          </div>
          <div class="field">
            <span class="label">Email:</span>
            <span class="value">${loan.applicantEmail || 'Not provided'}</span>
          </div>
          ${loan.applicantAddress ? `
          <div class="field">
            <span class="label">Address:</span>
            <div class="address-field">
              ${[
                loan.applicantAddress.street,
                loan.applicantAddress.city,
                loan.applicantAddress.state,
                loan.applicantAddress.zipCode,
                loan.applicantAddress.country
              ].filter(Boolean).join(', ') || 'Not provided'}
            </div>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h3>Loan Information</h3>
          <div class="field">
            <span class="label">Loan Amount:</span>
            <span class="value">₹${loan.loanAmount ? loan.loanAmount.toLocaleString() : '0'}</span>
          </div>
          <div class="field">
            <span class="label">Monthly EMI:</span>
            <span class="value">₹${loan.monthlyEMI ? loan.monthlyEMI.toLocaleString() : '0'}</span>
          </div>
          <div class="field">
            <span class="label">Interest Rate:</span>
            <span class="value">${loan.interestRate || '0'}%</span>
          </div>
          <div class="field">
            <span class="label">Loan Term:</span>
            <span class="value">${loan.loanTerm || '0'} months</span>
          </div>
        </div>

        <div class="section">
          <h3>Gold Details</h3>
          <div class="field">
            <span class="label">Net Weight:</span>
            <span class="value">${loan.netWeight || '0'}g</span>
          </div>
          <div class="field">
            <span class="label">Gross Weight:</span>
            <span class="value">${loan.grossWeight || '0'}g</span>
          </div>
          ${loan.totalNetWeight && loan.totalGrossWeight ? `
          <div class="field">
            <span class="label">Total Net Weight:</span>
            <span class="value">${loan.totalNetWeight}g</span>
          </div>
          <div class="field">
            <span class="label">Total Gross Weight:</span>
            <span class="value">${loan.totalGrossWeight}g</span>
          </div>
          ` : ''}
          <div class="field">
            <span class="label">Purity:</span>
            <span class="value">${loan.goldPurity || 'Not specified'}</span>
          </div>
        </div>

        ${loan.collateralItems && loan.collateralItems.length > 0 ? `
        <div class="section">
          <h3>Collateral Items</h3>
          ${loan.collateralItems.map((item, index) => `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px;">
              <div class="field">
                <span class="label">Item ${index + 1}:</span>
                <span class="value">${item.itemName || 'Unnamed item'}</span>
              </div>
              <div class="field">
                <span class="label">Type:</span>
                <span class="value">${item.itemType || 'Gold'}</span>
              </div>
              <div class="field">
                <span class="label">Net Weight:</span>
                <span class="value">${item.netWeight || '0'}g</span>
              </div>
              <div class="field">
                <span class="label">Gross Weight:</span>
                <span class="value">${item.grossWeight || '0'}g</span>
              </div>
              <div class="field">
                <span class="label">Purity:</span>
                <span class="value">${item.purity || 'Not specified'}</span>
              </div>
              ${item.estimatedValue ? `
              <div class="field">
                <span class="label">Estimated Value:</span>
                <span class="value">₹${item.estimatedValue.toLocaleString()}</span>
              </div>
              ` : ''}
              ${item.description ? `
              <div class="field">
                <span class="label">Description:</span>
                <span class="value">${item.description}</span>
              </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <h3>Status Information</h3>
          <div class="field">
            <span class="label">Current Status:</span>
            <span class="value">${loan.status || 'Pending'}</span>
          </div>
          ${loan.outsourcedTo ? `
          <div class="field">
            <span class="label">Outsourced To:</span>
            <span class="value">${loan.outsourceEntity || 'External Entity'}</span>
          </div>
          ` : ''}
        </div>

        ${loan.notes ? `
        <div class="section">
          <h3>Additional Notes</h3>
          <p>${loan.notes}</p>
        </div>
        ` : ''}

        <div class="signature-section">
          <h3>Signatures</h3>
          <div class="field">
            <span class="label">Applicant Signature:</span>
            <div class="signature-line"></div>
            <p>Date: _______________</p>
          </div>
          <div class="field">
            <span class="label">Authorized Signature:</span>
            <div class="signature-line"></div>
            <p>Date: _______________</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="loan-application-${loan.loanId}.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('Loan download error:', error);
    res.status(500).json({ 
      message: 'Error generating loan PDF',
      error: error.message 
    });
  }
});

// @route   GET /api/loans/:loanId/download/traditional
// @desc    Download loan application in traditional Telugu format
// @access  Private
router.get('/:loanId/download/traditional', authenticateToken, canAccessLoan, async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Helper function to convert number to Telugu words (simplified)
    const numberToTeluguWords = (num) => {
      if (num === 0) return 'సున్న';
      const ones = ['', 'ఒక్కటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది'];
      const tens = ['', '', 'ఇరవై', 'ముప్పై', 'నలభై', 'యాభై', 'అరవై', 'డెబ్బై', 'ఎనభై', 'తొంభై'];
      const hundreds = ['', 'వంద', 'రెండువందలు', 'మూడువందలు', 'నాలుగువందలు', 'ఐదువందలు', 'ఆరువందలు', 'ఏడువందలు', 'ఎనిమిదివందలు', 'తొమ్మిదివందలు'];
      
      if (num < 10) return ones[num];
      if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' ' + ones[num%10] : '');
      if (num < 1000) return hundreds[Math.floor(num/1000)] + (num%1000 ? ' ' + numberToTeluguWords(num%1000) : '');
      
      // For larger numbers, return simplified version
      if (num >= 100000) return `${Math.floor(num/100000)} లక్షలు`;
      if (num >= 1000) return `${Math.floor(num/1000)} వేలు`;
      return num.toString();
    };

    // Get current Telugu date (simplified)
    const currentDate = new Date();
    const teluguDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

    // Create traditional Telugu format HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>తాకట్టు పత్రం - ${loan.loanId}</title>
        <style>
          body {
            font-family: 'Noto Sans Telugu', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            line-height: 1.6;
          }
          .document {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ccc;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            margin: 0;
            color: #0066cc;
          }
          .date-field {
            text-align: right;
            margin-top: 10px;
            font-size: 14px;
          }
          .content {
            font-size: 16px;
            line-height: 2;
          }
          .loan-details {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
          }
          .field {
            margin: 15px 0;
          }
          .field-label {
            font-weight: bold;
            display: inline-block;
            min-width: 150px;
          }
          .field-value {
            display: inline-block;
            border-bottom: 1px solid #333;
            min-width: 200px;
            padding: 2px 5px;
          }
          .amount-in-words {
            font-style: italic;
            color: #666;
          }
          .terms {
            margin: 25px 0;
            padding: 15px;
            border: 1px solid #ccc;
            background-color: #fffacd;
          }
          .terms h3 {
            color: #b8860b;
            margin-top: 0;
          }
          .items-section {
            margin: 25px 0;
            padding: 15px;
            border: 1px solid #ddd;
          }
          .items-section h3 {
            color: #0066cc;
            border-bottom: 1px solid #0066cc;
            padding-bottom: 5px;
          }
          .weight-details {
            margin: 15px 0;
          }
          .signature-section {
            margin-top: 40px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .document { border: none; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            <h1>శ్రీరామ</h1>
            <div class="date-field">
              తేదీ: <span class="field-value">${teluguDate}</span>
            </div>
          </div>

          <div class="content">
            <p>
              <strong>${loan.applicantName || '________________'}</strong> అనే నేను ఈ దిగువ వ్రాసిన వస్తువులు తాకట్టు పెట్టి బదులు పుచ్చుకున్న రొట్టం
            </p>

            <div class="loan-details">
              <div class="field">
                <span class="field-label">రూ.</span>
                <span class="field-value">${loan.loanAmount ? loan.loanAmount.toLocaleString() : '________________'}</span>
                <span class="amount-in-words">
                  (${loan.loanAmount ? numberToTeluguWords(loan.loanAmount) + ' రూపాయలు' : 'అక్షరాల...'})
                </span>
              </div>
              
              <div class="field">
                <span class="field-label">వడ్డీ:</span>
                <span class="field-value">${loan.interestRate || '12'}%</span>
                <span class="amount-in-words">
                  (నెల 1కి 100కి ${loan.interestRate || '12'} రూపాయలు)
                </span>
              </div>

              <div class="field">
                <span class="field-label">తెలుగు తారీఖు:</span>
                <span class="field-value">${teluguDate}</span>
              </div>
            </div>

            <div class="terms">
              <h3>ఈ తాకట్టు వాయిదా ఆరుమాసములు మాత్రమే</h3>
              
              <p>
                లెక్కప్రకారము యిచ్చిన రోజు పుచ్చుకున్న రోజు వడ్డీతో అసలు ఫాయిదాలు అడిగిన తక్షణం యిచ్చి తాకట్టు విడిపించుకొందును. 
                సదరు తాకట్టు వస్తువులు నా స్వంతం అని మిమ్ములను నమ్మించి మీకు తాకట్టు ఇవ్వడమైనది. 
                నెల రోజుల లోపున అసలు ఫాయిదాలు యిచ్చే యెడల నెల వడ్డీ పూర్తి నిర్ణయం.
              </p>
              
              <p>
                <strong>ఆరుమాసములు దాటినయెడల నా అనుమతి లేకపోయిన తాకట్టు వస్తువులు మీరు అమ్ముకొనవచ్చును.</strong>
              </p>
            </div>

            <div class="items-section">
              <h3>తాకట్టు ఇచ్చిన వస్తువుల వివరము</h3>
              
              ${loan.collateralItems && loan.collateralItems.length > 0 ? 
                loan.collateralItems.map((item, index) => `
                  <div class="weight-details">
                    <div class="field">
                      <span class="field-label">వస్తువు ${index + 1}:</span>
                      <span class="field-value">${item.itemName || '________________'}</span>
                    </div>
                    <div class="field">
                      <span class="field-label">విధము:</span>
                      <span class="field-value">${item.itemType || 'బంగారం'}</span>
                    </div>
                    <div class="field">
                      <span class="field-label">శుద్ధత:</span>
                      <span class="field-value">${item.purity || '22K'}</span>
                    </div>
                    <div class="field">
                      <span class="field-label">నికర తూకం:</span>
                      <span class="field-value">${item.netWeight || loan.netWeight || '________________'} గ్రాములు</span>
                    </div>
                    <div class="field">
                      <span class="field-label">మొత్తం తూకం:</span>
                      <span class="field-value">${item.grossWeight || loan.grossWeight || '________________'} గ్రాములు</span>
                    </div>
                    ${item.estimatedValue ? `
                    <div class="field">
                      <span class="field-label">అంచనా విలువ:</span>
                      <span class="field-value">₹${item.estimatedValue.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    ${item.description ? `
                    <div class="field">
                      <span class="field-label">వివరణ:</span>
                      <span class="field-value">${item.description}</span>
                    </div>
                    ` : ''}
                  </div>
                `).join('') : 
                `
                <div class="weight-details">
                  <div class="field">
                    <span class="field-label">నికర తూకం:</span>
                    <span class="field-value">${loan.netWeight || '________________'} గ్రాములు</span>
                  </div>
                  <div class="field">
                    <span class="field-label">మొత్తం తూకం:</span>
                    <span class="field-value">${loan.grossWeight || '________________'} గ్రాములు</span>
                  </div>
                  <div class="field">
                    <span class="field-label">శుద్ధత:</span>
                    <span class="field-value">${loan.goldPurity || '22K'}</span>
                  </div>
                  ${loan.totalNetWeight && loan.totalGrossWeight ? `
                  <div class="field">
                    <span class="field-label">మొత్తం నికర తూకం:</span>
                    <span class="field-value">${loan.totalNetWeight} గ్రాములు</span>
                  </div>
                  <div class="field">
                    <span class="field-label">మొత్తం మొత్తం తూకం:</span>
                    <span class="field-value">${loan.totalGrossWeight} గ్రాములు</span>
                  </div>
                  ` : ''}
                </div>
                `
              }
            </div>

            <div class="signature-section">
              <div class="field">
                <span class="field-label">వస్తువులు డెలివరీ తీసుకొన్నవారి:</span>
                <div class="signature-line"></div>
                <p>తేదీ: _______________</p>
              </div>
              
              <div class="field">
                <span class="field-label">సంతకం / వేలిముద్ర:</span>
                <div class="signature-line"></div>
                <p>అప్లికేషన్ ID: ${loan.loanId}</p>
              </div>
            </div>

            <div class="footer">
              <p><strong>గమనిక:</strong> ఈ పత్రం డిజిటల్ రూపంలో ఉత్పత్తి చేయబడింది మరియు చట్టపరమైన ప్రామాణికతను కలిగి ఉంటుంది.</p>
              <p><strong>Note:</strong> This document is digitally generated and maintains legal authenticity.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Set response headers for HTML download
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="traditional-loan-${loan.loanId}.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('Traditional loan download error:', error);
    res.status(500).json({ 
      message: 'Error generating traditional loan format',
      error: error.message 
    });
  }
});

// @route   GET /api/loans/:id/payments
// @desc    Get all payments for a loan
// @access  Private
router.get('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id).select('payments loanTerm monthlyEMI');
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Sort payments by month
    const sortedPayments = loan.payments.sort((a, b) => a.month - b.month);

    res.json({
      payments: sortedPayments,
      loanTerm: loan.loanTerm,
      monthlyEMI: loan.monthlyEMI
    });

  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching payments',
      error: error.message 
    });
  }
});

// @route   PUT /api/loans/:id/signature
// @desc    Add digital signature to a loan
// @access  Private
router.put('/:id/signature', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureData } = req.body;

    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    loan.digitalSignature = {
      signatureData,
      signedAt: new Date(),
      signedBy: req.user._id
    };

    await loan.save();

    res.json({
      message: 'Digital signature added successfully',
      loan
    });
  } catch (error) {
    console.error('Signature update error:', error);
    res.status(500).json({
      message: 'Error adding digital signature',
      error: error.message
    });
  }
});

// @route   GET /api/loans/:id/analytics
// @desc    Get loan analytics and payment summary
// @access  Private
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('submittedBy', 'firstName lastName');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const analytics = {
      loanId: loan.loanId,
      applicantName: loan.applicantName,
      monthlyEMI: loan.monthlyEMI,
      totalAmount: loan.totalAmount,
      remainingAmount: loan.remainingAmount,
      remainingMonths: loan.remainingMonths,
      paymentStatus: loan.paymentStatus,
      nextPaymentDue: loan.nextPaymentDue,
      totalPaid: loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0,
      paymentHistory: loan.payments || [],
      collateralValue: loan.collateralTotalValue
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      message: 'Error fetching loan analytics',
      error: error.message
    });
  }
});

// @route   DELETE /api/loans/clear-all
// @desc    Clear all loans (for testing purposes)
// @access  Private (any authenticated user for testing)
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    // For testing purposes, allow any authenticated user to clear loans
    const result = await Loan.deleteMany({});
    
    // Clear all caches when loans are cleared
    dashboardCache.clear();
    loanStatsCache.clear();
    
    res.json({
      message: `Successfully cleared ${result.deletedCount} loans`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear loans error:', error);
    res.status(500).json({
      message: 'Error clearing loans',
      error: error.message
    });
  }
});

// @route   POST /api/loans/cache/clear
// @desc    Clear application cache (admin only)
// @access  Private (Admin only)
router.post('/cache/clear', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { cacheType } = req.body;
    
    switch (cacheType) {
      case 'dashboard':
        dashboardCache.clear();
        break;
      case 'loans':
        loanStatsCache.clear();
        break;
      case 'users':
        userCache.clear();
        break;
      case 'all':
      default:
        dashboardCache.clear();
        loanStatsCache.clear();
        userCache.clear();
        break;
    }
    
    res.json({
      message: `Successfully cleared ${cacheType || 'all'} cache`,
      cacheStats: {
        dashboard: dashboardCache.getStats(),
        loans: loanStatsCache.getStats(),
        users: userCache.getStats()
      }
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      message: 'Error clearing cache',
      error: error.message
    });
  }
});

// @route   GET /api/loans/cache/stats
// @desc    Get cache statistics (admin only)
// @access  Private (Admin only)
router.get('/cache/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    res.json({
      dashboard: dashboardCache.getStats(),
      loans: loanStatsCache.getStats(),
      users: userCache.getStats()
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      message: 'Error getting cache statistics',
      error: error.message
    });
  }
});

// @route   POST /api/loans/migrate/status
// @desc    Migrate existing loans: set status 'pending' and legacy 'disbursed' to 'approved'
// @access  Private (Admin only)
router.post('/migrate/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const now = new Date();

    // Find loans that are pending or disbursed
    const filter = { status: { $in: ['pending', 'disbursed'] } };

    const loansToUpdate = await Loan.find(filter).select('_id status approvalDate approvedBy');

    if (!loansToUpdate.length) {
      return res.json({ message: 'No loans to migrate', migrated: 0, details: { pending: 0, disbursed: 0 } });
    }

    let pendingCount = 0;
    let disbursedCount = 0;

    const bulkOps = loansToUpdate.map(l => {
      if (l.status === 'pending') pendingCount++;
      if (l.status === 'disbursed') disbursedCount++;

      return {
        updateOne: {
          filter: { _id: l._id },
          update: {
            $set: {
              status: 'approved',
              approvalDate: l.approvalDate || now,
              approvedBy: l.approvedBy || req.user._id
            },
            $unset: { disbursementDate: '' }
          }
        }
      };
    });

    const result = await Loan.bulkWrite(bulkOps);

    // Clear dashboard cache since statistics changed
    dashboardCache.clear();

    res.json({
      message: 'Migration completed',
      migrated: result.modifiedCount || loansToUpdate.length,
      details: { pending: pendingCount, disbursed: disbursedCount }
    });
  } catch (error) {
    console.error('Status migration error:', error);
    res.status(500).json({
      message: 'Error migrating loan statuses',
      error: error.message
    });
  }
});

module.exports = router;
