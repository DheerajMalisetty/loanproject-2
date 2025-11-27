const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user can access loan (owner or admin/loan officer)
const canAccessLoan = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const user = req.user;

    // Admin and loan officers can access all loans
    if (['admin', 'loan_officer'].includes(user.role)) {
      return next();
    }

    // Employees can only access loans they submitted
    const Loan = require('../models/Loan');
    const loan = await Loan.findById(loanId);
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.submittedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this loan' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking loan access' });
  }
};

// Middleware to check if user can modify loan status
const canModifyLoanStatus = (req, res, next) => {
  const user = req.user;
  
  if (!['admin', 'loan_officer'].includes(user.role)) {
    return res.status(403).json({ message: 'Only admins and loan officers can modify loan status' });
  }

  next();
};

// Middleware to check if user can verify documents
const canVerifyDocuments = (req, res, next) => {
  const user = req.user;
  
  if (!['admin', 'loan_officer'].includes(user.role)) {
    return res.status(403).json({ message: 'Only admins and loan officers can verify documents' });
  }

  next();
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    req.userAction = action;
    req.actionTimestamp = new Date();
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  canAccessLoan,
  canModifyLoanStatus,
  canVerifyDocuments,
  logActivity
};
