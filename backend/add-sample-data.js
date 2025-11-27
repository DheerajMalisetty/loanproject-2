const mongoose = require('mongoose');
const Loan = require('./models/Loan');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/loan-management-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleLoans = [
  {
    loanId: 'GL100001',
    applicantName: 'Rajesh Kumar',
    applicantPhone: '+91 9876543210',
    applicantEmail: 'rajesh@example.com',
    applicantAddress: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    loanAmount: 50000,
    goldWeight: 25,
    goldPurity: '22K',
    interestRate: 12,
    loanTerm: 12,
    status: 'approved',
    applicationDate: new Date('2024-01-15'),
    approvalDate: new Date('2024-01-20'),
    notes: 'Gold chain as collateral',
    submittedBy: null, // Will be set if user exists
    approvedBy: null
  },
  {
    loanId: 'GL100002',
    applicantName: 'Priya Sharma',
    applicantPhone: '+91 9876543211',
    applicantEmail: 'priya@example.com',
    applicantAddress: {
      street: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India'
    },
    loanAmount: 75000,
    goldWeight: 35,
    goldPurity: '24K',
    interestRate: 11.5,
    loanTerm: 18,
    status: 'pending',
    applicationDate: new Date('2024-01-20'),
    notes: 'Gold ornaments and diamond ring',
    submittedBy: null,
  },
  {
    loanId: 'GL100003',
    applicantName: 'Amit Patel',
    applicantPhone: '+91 9876543212',
    applicantEmail: 'amit@example.com',
    applicantAddress: {
      street: '789 Lake Road',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    loanAmount: 100000,
    goldWeight: 45,
    goldPurity: '22K',
    interestRate: 12.5,
    loanTerm: 24,
    status: 'approved',
    applicationDate: new Date('2024-01-10'),
    approvalDate: new Date('2024-01-18'),
    notes: 'Multiple gold items',
    submittedBy: null,
    approvedBy: null
  },
  {
    loanId: 'GL100004',
    applicantName: 'Sunita Reddy',
    applicantPhone: '+91 9876543213',
    applicantEmail: 'sunita@example.com',
    applicantAddress: {
      street: '321 Garden Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600001',
      country: 'India'
    },
    loanAmount: 25000,
    goldWeight: 15,
    goldPurity: '18K',
    interestRate: 13,
    loanTerm: 6,
    status: 'returned',
    applicationDate: new Date('2024-01-25'),
    notes: 'Application returned for additional documents',
    submittedBy: null,
  },
  {
    loanId: 'GL100005',
    applicantName: 'Mohammad Ali',
    applicantPhone: '+91 9876543214',
    applicantEmail: 'ali@example.com',
    applicantAddress: {
      street: '654 Hill View',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500001',
      country: 'India'
    },
    loanAmount: 80000,
    goldWeight: 40,
    goldPurity: '22K',
    interestRate: 11.8,
    loanTerm: 15,
    status: 'approved',
    applicationDate: new Date('2024-01-12'),
    approvalDate: new Date('2024-01-22'),
    notes: 'Gold coins and jewelry',
    submittedBy: null,
    approvedBy: null
  }
];

async function addSampleData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connection.asPromise();
    console.log('Connected to MongoDB');

    // Check if loans already exist
    const existingLoans = await Loan.countDocuments();
    if (existingLoans > 0) {
      console.log(`Database already has ${existingLoans} loans. Skipping sample data creation.`);
      return;
    }

    // Get first user for submittedBy field
    const firstUser = await User.findOne();
    if (!firstUser) {
      console.log('No users found. Please create a user first.');
      return;
    }

    // Update loans with user references
    const loansWithUsers = sampleLoans.map(loan => ({
      ...loan,
      submittedBy: firstUser._id,
      approvedBy: loan.status === 'approved' ? firstUser._id : undefined
    }));

    // Insert sample loans
    const result = await Loan.insertMany(loansWithUsers);
    console.log(`Successfully added ${result.length} sample loans:`);
    
    result.forEach(loan => {
      console.log(`- ${loan.loanId}: ${loan.applicantName} (${loan.status})`);
    });

    console.log('\nSample data added successfully!');
    console.log('You can now view these loans in the dashboard.');

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    mongoose.connection.close();
  }
}

addSampleData();
