const express = require('express');
const Loan = require('../models/Loan');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments with filtering and search
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
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      if (status === 'paid') filter['payments.0'] = { $exists: true };
      if (status === 'unpaid') filter['payments.0'] = { $exists: false };
    }

    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { applicantPhone: { $regex: search, $options: 'i' } },
        { loanId: { $regex: search, $options: 'i' } }
      ];
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
      .populate('submittedBy', 'firstName lastName username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Transform loans to payment format
    const payments = loans.map(loan => {
      const monthlyEMI = loan.monthlyEMI || 0;
      const totalPaid = loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
      const isPaid = totalPaid >= monthlyEMI;
      
      return {
        _id: loan._id,
        loanId: loan.loanId,
        applicantName: loan.applicantName,
        applicantPhone: loan.applicantPhone,
        applicantEmail: loan.applicantEmail,
        monthlyEMI,
        dueDate: loan.dueDate,
        isPaid,
        paidDate: isPaid ? loan.payments?.[loan.payments.length - 1]?.paymentDate : undefined,
        paymentMethod: isPaid ? loan.payments?.[loan.payments.length - 1]?.paymentMethod : undefined,
        transactionId: isPaid ? `TXN${loan.loanId}${Date.now()}` : undefined,
        remainingAmount: Math.max(0, monthlyEMI - totalPaid),
        totalPaid
      };
    });

    const total = await Loan.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get summary statistics
    const summary = await Loan.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalEMI: { $sum: '$monthlyEMI' },
          paidLoans: {
            $sum: {
              $cond: [
                { $gte: [{ $size: '$payments' }, 1] },
                1,
                0
              ]
            }
          },
          unpaidLoans: {
            $sum: {
              $cond: [
                { $lt: [{ $size: '$payments' }, 1] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      summary: summary[0] || {
        totalLoans: 0,
        totalEMI: 0,
        paidLoans: 0,
        unpaidLoans: 0
      }
    });

  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// @route   GET /api/payments/summary
// @desc    Get payment summary dashboard
// @access  Private
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.submittedBy = req.user._id;
    }

    const summary = await Loan.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalEMI: { $sum: '$monthlyEMI' },
          totalPaid: {
            $sum: {
              $reduce: {
                input: '$payments',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.amount'] }
              }
            }
          },
          overdueLoans: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $lt: [{ $size: '$payments' }, 1] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalLoans: 0,
      totalEMI: 0,
      totalPaid: 0,
      overdueLoans: 0
    };

    result.collectionRate = result.totalEMI > 0 ? 
      Math.round((result.totalPaid / result.totalEMI) * 100) : 0;

    res.json(result);

  } catch (error) {
    console.error('Payment summary error:', error);
    res.status(500).json({
      message: 'Error fetching payment summary',
      error: error.message
    });
  }
});

module.exports = router;
