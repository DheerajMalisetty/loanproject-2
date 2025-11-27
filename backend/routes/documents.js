const express = require('express');
const Document = require('../models/Document');
const Loan = require('../models/Loan');
const { 
  authenticateToken, 
  canAccessLoan, 
  canVerifyDocuments,
  logActivity 
} = require('../middleware/auth');
const { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError, 
  validateUploadRequest,
  getFileInfo 
} = require('../middleware/upload');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// @route   POST /api/documents/upload
// @desc    Upload a single document
// @access  Private
router.post('/upload', 
  authenticateToken, 
  validateUploadRequest,
  logActivity('upload_document'),
  uploadSingle,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { loanId, documentType, description, tags } = req.body;

      // Verify loan exists and user has access
      const loan = await Loan.findById(loanId);
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      // Check if user can access this loan
      if (req.user.role === 'employee' && loan.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this loan' });
      }

      // Create document record
      const documentData = getFileInfo(req.file, documentType, loanId, req.user._id);
      if (description) documentData.description = description;
      if (tags) documentData.tags = tags.split(',').map(tag => tag.trim());

      const document = new Document(documentData);
      await document.save();

      // Add document to loan
      await Loan.findByIdAndUpdate(loanId, {
        $push: { documents: document._id }
      });

      // Populate user info
      await document.populate('uploadedBy', 'firstName lastName username');

      res.status(201).json({
        message: 'Document uploaded successfully',
        document
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ 
        message: 'Error uploading document',
        error: error.message 
      });
    }
  }
);

// @route   POST /api/documents/upload-multiple
// @desc    Upload multiple documents
// @access  Private
router.post('/upload-multiple', 
  authenticateToken, 
  validateUploadRequest,
  logActivity('upload_multiple_documents'),
  uploadMultiple,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const { loanId, documentType, description, tags } = req.body;

      // Verify loan exists and user has access
      const loan = await Loan.findById(loanId);
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      // Check if user can access this loan
      if (req.user.role === 'employee' && loan.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this loan' });
      }

      const documents = [];
      const documentIds = [];

      // Process each uploaded file
      for (const file of req.files) {
        const documentData = getFileInfo(file, documentType, loanId, req.user._id);
        if (description) documentData.description = description;
        if (tags) documentData.tags = tags.split(',').map(tag => tag.trim());

        const document = new Document(documentData);
        await document.save();
        
        documentIds.push(document._id);
        documents.push(document);
      }

      // Add documents to loan
      await Loan.findByIdAndUpdate(loanId, {
        $push: { documents: { $each: documentIds } }
      });

      // Populate user info for all documents
      await Document.populate(documents, {
        path: 'uploadedBy',
        select: 'firstName lastName username'
      });

      res.status(201).json({
        message: `${documents.length} documents uploaded successfully`,
        documents
      });

    } catch (error) {
      console.error('Multiple documents upload error:', error);
      res.status(500).json({ 
        message: 'Error uploading documents',
        error: error.message 
      });
    }
  }
);

// @route   GET /api/documents/loan/:loanId
// @desc    Get all documents for a specific loan
// @access  Private
router.get('/loan/:loanId', authenticateToken, canAccessLoan, async (req, res) => {
  try {
    const { loanId } = req.params;

    const documents = await Document.find({ 
      loanId, 
      isActive: true 
    }).populate('uploadedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json({ documents });

  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching documents',
      error: error.message 
    });
  }
});

// @route   GET /api/documents/:documentId
// @desc    Get a specific document by ID
// @access  Private
router.get('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
      .populate('uploadedBy', 'firstName lastName username')
      .populate('verifiedBy', 'firstName lastName username');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user can access this document
    const loan = await Loan.findById(document.loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Associated loan not found' });
    }

    if (req.user.role === 'employee' && loan.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this document' });
    }

    res.json({ document });

  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ 
      message: 'Error fetching document',
      error: error.message 
    });
  }
});

// @route   PUT /api/documents/:documentId/verify
// @desc    Verify a document (admin/loan officer only)
// @access  Private (Admin/Loan Officer)
router.put('/:documentId/verify', 
  authenticateToken, 
  canVerifyDocuments,
  logActivity('verify_document'),
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { isVerified, verificationNotes } = req.body;

      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: 'isVerified must be a boolean' });
      }

      const updates = { isVerified };
      if (verificationNotes) updates.verificationNotes = verificationNotes;

      if (isVerified) {
        updates.verifiedBy = req.user._id;
        updates.verificationDate = new Date();
      } else {
        updates.verifiedBy = null;
        updates.verificationDate = null;
      }

      const document = await Document.findByIdAndUpdate(
        documentId,
        updates,
        { new: true, runValidators: true }
      ).populate('uploadedBy', 'firstName lastName username')
       .populate('verifiedBy', 'firstName lastName username');

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({
        message: `Document ${isVerified ? 'verified' : 'unverified'} successfully`,
        document
      });

    } catch (error) {
      console.error('Document verification error:', error);
      res.status(500).json({ 
        message: 'Error verifying document',
        error: error.message 
      });
    }
  }
);

// @route   PUT /api/documents/:documentId
// @desc    Update document metadata
// @access  Private (owner or admin/loan officer)
router.put('/:documentId', authenticateToken, logActivity('update_document'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { description, tags, documentType } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user can modify this document
    const loan = await Loan.findById(document.loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Associated loan not found' });
    }

    if (req.user.role === 'employee' && loan.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this document' });
    }

    const updates = {};
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags.split(',').map(tag => tag.trim());
    if (documentType !== undefined) updates.documentType = documentType;

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      updates,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'firstName lastName username')
     .populate('verifiedBy', 'firstName lastName username');

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });

  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({ 
      message: 'Error updating document',
      error: error.message 
    });
  }
});

// @route   DELETE /api/documents/:documentId
// @desc    Delete a document (soft delete)
// @access  Private (owner or admin/loan officer)
router.delete('/:documentId', authenticateToken, logActivity('delete_document'), async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user can delete this document
    const loan = await Loan.findById(document.loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Associated loan not found' });
    }

    if (req.user.role === 'employee' && loan.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this document' });
    }

    // Soft delete
    document.isActive = false;
    await document.save();

    // Remove from loan documents array
    await Loan.findByIdAndUpdate(document.loanId, {
      $pull: { documents: documentId }
    });

    res.json({
      message: 'Document deleted successfully',
      document
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting document',
      error: error.message 
    });
  }
});

// @route   GET /api/documents/search
// @desc    Search documents with filters
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      documentType,
      isVerified,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (documentType) filter.documentType = documentType;
    if (typeof isVerified === 'boolean') filter.isVerified = isVerified;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'employee') {
      // Get loans submitted by this employee
      const userLoans = await Loan.find({ submittedBy: req.user._id }).select('_id');
      const loanIds = userLoans.map(loan => loan._id);
      filter.loanId = { $in: loanIds };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const documents = await Document.find(filter)
      .populate('uploadedBy', 'firstName lastName username')
      .populate('verifiedBy', 'firstName lastName username')
      .populate('loanId', 'loanId applicantName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      documents,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({ 
      message: 'Error searching documents',
      error: error.message 
    });
  }
});

module.exports = router;
