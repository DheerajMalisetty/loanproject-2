const express = require('express');
const OutsourceEntity = require('../models/OutsourceEntity');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/outsource/entities
// @desc    Create a new outsource entity
// @access  Private (Admin/Loan Officer)
router.post('/entities', authenticateToken, requireRole(['admin', 'loan_officer']), async (req, res) => {
  try {
    const {
      name,
      type,
      contactPerson,
      phone,
      email,
      address,
      interestRate,
      maxLoanAmount,
      notes
    } = req.body;

    // Create new outsource entity
    const entity = new OutsourceEntity({
      name,
      type,
      contactPerson,
      phone,
      email,
      address,
      interestRate,
      maxLoanAmount,
      notes,
      createdBy: req.user._id
    });

    await entity.save();

    // Populate createdBy field
    await entity.populate('createdBy', 'firstName lastName username');

    res.status(201).json({
      message: 'Outsource entity created successfully',
      entity
    });

  } catch (error) {
    console.error('Outsource entity creation error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      message: 'Error creating outsource entity',
      error: error.message
    });
  }
});

// @route   GET /api/outsource/entities
// @desc    Get all outsource entities with filtering and pagination
// @access  Private
router.get('/entities', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const entities = await OutsourceEntity.find(filter)
      .populate('createdBy', 'firstName lastName username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await OutsourceEntity.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      entities,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Outsource entities fetch error:', error);
    res.status(500).json({
      message: 'Error fetching outsource entities',
      error: error.message
    });
  }
});

// @route   GET /api/outsource/entities/:id
// @desc    Get a specific outsource entity by ID
// @access  Private
router.get('/entities/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const entity = await OutsourceEntity.findById(id)
      .populate('createdBy', 'firstName lastName username');

    if (!entity) {
      return res.status(404).json({ message: 'Outsource entity not found' });
    }

    res.json({ entity });

  } catch (error) {
    console.error('Outsource entity fetch error:', error);
    res.status(500).json({
      message: 'Error fetching outsource entity',
      error: error.message
    });
  }
});

// @route   PUT /api/outsource/entities/:id
// @desc    Update an outsource entity
// @access  Private (Admin/Loan Officer)
router.put('/entities/:id', authenticateToken, requireRole(['admin', 'loan_officer']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.createdBy;
    delete updates.createdAt;

    const entity = await OutsourceEntity.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName username');

    if (!entity) {
      return res.status(404).json({ message: 'Outsource entity not found' });
    }

    res.json({
      message: 'Outsource entity updated successfully',
      entity
    });

  } catch (error) {
    console.error('Outsource entity update error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      message: 'Error updating outsource entity',
      error: error.message
    });
  }
});

// @route   DELETE /api/outsource/entities/:id
// @desc    Delete an outsource entity (soft delete)
// @access  Private (Admin only)
router.delete('/entities/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const entity = await OutsourceEntity.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!entity) {
      return res.status(404).json({ message: 'Outsource entity not found' });
    }

    res.json({
      message: 'Outsource entity deactivated successfully',
      entity
    });

  } catch (error) {
    console.error('Outsource entity deletion error:', error);
    res.status(500).json({
      message: 'Error deactivating outsource entity',
      error: error.message
    });
  }
});

// @route   POST /api/outsource/loans
// @desc    Assign a loan to an outsource entity
// @access  Private (Admin/Loan Officer)
router.post('/loans', authenticateToken, requireRole(['admin', 'loan_officer']), async (req, res) => {
  try {
    const {
      loanId,
      entityId,
      customAmount,
      customInterestRate,
      notes
    } = req.body;

    // Validate required fields
    if (!loanId || !entityId) {
      return res.status(400).json({ 
        message: 'Loan ID and Entity ID are required' 
      });
    }

    // Get the loan details
    const Loan = require('../models/Loan');
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Get the outsource entity
    const entity = await OutsourceEntity.findById(entityId);
    if (!entity) {
      return res.status(404).json({ message: 'Outsource entity not found' });
    }

    // Check if loan is already outsourced
    if (loan.outsourcedTo) {
      return res.status(400).json({ 
        message: 'Loan is already outsourced' 
      });
    }

    // Calculate profit margin
    const originalInterestRate = loan.interestRate || 12.0;
    const outsourceInterestRate = customInterestRate || entity.interestRate;
    const profitMargin = originalInterestRate - outsourceInterestRate;

    // Update loan with outsource information
    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      {
        outsourcedTo: entityId,
        outsourceEntity: entity.name,
        outsourceDate: new Date(),
        outsourceAmount: customAmount || loan.loanAmount,
        outsourceInterestRate: outsourceInterestRate,
        profitMargin: profitMargin,
        outsourceNotes: notes
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Loan assigned to outsource entity successfully',
      loan: updatedLoan,
      profitMargin: profitMargin
    });

  } catch (error) {
    console.error('Outsource loan assignment error:', error);
    res.status(500).json({
      message: 'Error assigning loan to outsource entity',
      error: error.message
    });
  }
});

// @route   GET /api/outsource/available-loans
// @desc    Get available loans from No3 account (account3) not yet outsourced
// @access  Private
router.get('/available-loans', authenticateToken, async (req, res) => {
  try {
    const Loan = require('../models/Loan');
    
    const availableLoans = await Loan.find({ 
      outsourcedTo: { $exists: false },
      account: 'account3'
    })
      .select('loanId applicantName applicantPhone applicantEmail loanAmount interestRate loanTerm netWeight grossWeight goldPurity status account applicationDate submittedBy')
      .populate('submittedBy', 'firstName lastName username');

    res.json({
      availableLoans
    });

  } catch (error) {
    console.error('Available loans fetch error:', error);
    res.status(500).json({
      message: 'Error fetching available loans',
      error: error.message
    });
  }
});

// @route   GET /api/outsource/loans
// @desc    Get all outsourced loans
// @access  Private
router.get('/loans', authenticateToken, async (req, res) => {
  try {
    const Loan = require('../models/Loan');
    
    const outsourcedLoans = await Loan.find({ 
      outsourcedTo: { $exists: true, $ne: null } 
    }).populate('outsourcedTo', 'name type').populate('submittedBy', 'firstName lastName username');

    res.json({
      outsourcedLoans
    });

  } catch (error) {
    console.error('Outsourced loans fetch error:', error);
    res.status(500).json({
      message: 'Error fetching outsourced loans',
      error: error.message
    });
  }
});

module.exports = router;
