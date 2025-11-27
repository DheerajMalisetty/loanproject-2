import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Loan {
  _id: string;
  loanId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  loanAmount: number;
  goldWeight: number;
  goldPurity: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'disbursed' | 'closed';
  applicationDate: string;
  monthlyEMI: number;
  outsourcedTo?: string;
  outsourcedEntity?: string;
}

const Loans: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOutsourceModalOpen, setIsOutsourceModalOpen] = useState(false);
  const [outsourceEntities, setOutsourceEntities] = useState([
    { _id: '1', name: 'Global Finance Ltd', type: 'organization' as const },
    { _id: '2', name: 'Quick Loans Inc', type: 'organization' as const },
    { _id: '3', name: 'Raj Kumar', type: 'individual' as const }
  ]);
  const [loansData, setLoansData] = useState<Loan[]>([
    {
      _id: '1',
      loanId: 'GL001',
      applicantName: 'Rajesh Kumar',
      applicantPhone: '+91 9876543210',
      applicantEmail: 'rajesh@example.com',
      loanAmount: 50000,
      goldWeight: 25,
      goldPurity: '22K',
      status: 'pending',
      applicationDate: '2024-01-15',
      monthlyEMI: 4500
    },
    {
      _id: '2',
      loanId: 'GL002',
      applicantName: 'Priya Sharma',
      applicantPhone: '+91 9876543211',
      applicantEmail: 'priya@example.com',
      loanAmount: 75000,
      goldWeight: 35,
      goldPurity: '22K',
      status: 'approved',
      applicationDate: '2024-01-14',
      monthlyEMI: 6800
    },
    {
      _id: '3',
      loanId: 'GL003',
      applicantName: 'Amit Patel',
      applicantPhone: '+91 9876543212',
      applicantEmail: 'amit@example.com',
      loanAmount: 100000,
      goldWeight: 45,
      goldPurity: '24K',
      status: 'under_review',
      applicationDate: '2024-01-13',
      monthlyEMI: 9200
    },
    {
      _id: '4',
      loanId: 'GL004',
      applicantName: 'Sunita Reddy',
      applicantPhone: '+91 9876543213',
      applicantEmail: 'sunita@example.com',
      loanAmount: 25000,
      goldWeight: 15,
      goldPurity: '18K',
      status: 'approved',
      applicationDate: '2024-01-12',
      monthlyEMI: 2300
    },
    {
      _id: '5',
      loanId: 'GL005',
      applicantName: 'Mohammad Ali',
      applicantPhone: '+91 9876543214',
      applicantEmail: 'ali@example.com',
      loanAmount: 80000,
      goldWeight: 40,
      goldPurity: '22K',
      status: 'disbursed',
      applicationDate: '2024-01-11',
      monthlyEMI: 7400,
      outsourcedTo: 'QuickCash Finance',
      outsourcedEntity: 'Active'
    },
    {
      _id: '6',
      loanId: 'GL006',
      applicantName: 'Kavitha Iyer',
      applicantPhone: '+91 9876543215',
      applicantEmail: 'kavitha@example.com',
      loanAmount: 60000,
      goldWeight: 30,
      goldPurity: '22K',
      status: 'rejected',
      applicationDate: '2024-01-10',
      monthlyEMI: 5500
    }
  ]);
  const itemsPerPage = 10;

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsViewModalOpen(true);
  };

  const handleOutsourceLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsOutsourceModalOpen(true);
  };

  const assignToOutsource = (entityId: string, entityName: string) => {
    if (!selectedLoan) return;
    
    setLoansData(prev => prev.map(loan =>
      loan._id === selectedLoan._id
        ? { ...loan, outsourcedTo: entityId, outsourcedEntity: entityName }
        : loan
    ));
    
    setIsOutsourceModalOpen(false);
    setSelectedLoan(null);
  };

  const handleStatusChange = (loanId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      setLoansData(prevLoans =>
        prevLoans.map(loan =>
          loan._id === loanId ? { ...loan, status: nextStatus } : loan
        )
      );
    }
  };

  const getNextStatus = (currentStatus: string): 'pending' | 'approved' | 'rejected' | 'under_review' | 'disbursed' | 'closed' | null => {
    switch (currentStatus) {
      case 'pending':
        return 'approved';
      case 'approved':
        return 'disbursed';
      case 'under_review':
        return 'approved';
      case 'disbursed':
        return 'closed';
      case 'closed':
        return 'disbursed';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const nextStatus = getNextStatus(currentStatus);
    switch (nextStatus) {
      case 'approved':
        return 'Approve';
      case 'disbursed':
        return currentStatus === 'closed' ? 'Reopen' : 'Disburse';
      case 'closed':
        return 'Close';
      default:
        return 'Update';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="status-pending">Pending</span>;
      case 'approved':
        return <span className="status-approved">Approved</span>;
      case 'rejected':
        return <span className="status-rejected">Rejected</span>;
      case 'under_review':
        return <span className="status-pending">Under Review</span>;
      case 'disbursed':
        return <span className="status-approved">Disbursed</span>;
      case 'closed':
        return <span className="bg-muted text-muted-foreground border border-border px-3 py-1 rounded-full text-sm font-medium">Closed</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  const filteredLoans = loansData.filter(loan => {
    const matchesSearch = 
      loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.applicantPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);

  const totalAmount = loansData.reduce((sum, loan) => sum + loan.loanAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Records</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all gold loan applications
          </p>
        </div>
        <Link
          to="/loan/new"
          className="btn-gradient inline-flex items-center mt-4 sm:mt-0"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          New Loan
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">{loansData.length}</div>
          <div className="text-sm text-muted-foreground">Total Loans</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">₹{totalAmount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Amount</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">
            {loansData.filter(l => l.status === 'pending').length}
          </div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">
            {loansData.filter(l => l.status === 'approved').length}
          </div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by loan ID, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input min-w-40"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
              <option value="disbursed">Disbursed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Loan ID</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Applicant</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Phone</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Gold</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Outsourced</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">EMI</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLoans.map((loan) => (
                <tr key={loan._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6 font-medium text-foreground">{loan.loanId}</td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-foreground">{loan.applicantName}</div>
                      <div className="text-sm text-muted-foreground">{loan.applicantEmail}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-foreground">{loan.applicantPhone}</td>
                  <td className="py-4 px-6 font-medium text-foreground">₹{loan.loanAmount.toLocaleString()}</td>
                  <td className="py-4 px-6 text-muted-foreground">{loan.goldWeight}g ({loan.goldPurity})</td>
                  <td className="py-4 px-6">{getStatusBadge(loan.status)}</td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {loan.outsourcedEntity ? (
                      <span className="text-success">✓ {loan.outsourcedEntity}</span>
                    ) : (
                      <span className="text-muted-foreground">Not outsourced</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">{loan.applicationDate}</td>
                  <td className="py-4 px-6 text-foreground">₹{loan.monthlyEMI.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewLoan(loan)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {getNextStatus(loan.status) && loan.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(loan._id, loan.status)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title={getNextStatusLabel(loan.status)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      {(loan.status === 'approved' || loan.status === 'disbursed') && !loan.outsourcedEntity && (
                        <button
                          onClick={() => handleOutsourceLoan(loan)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="Assign to outsource"
                        >
                          <UserGroupIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLoans.length)} of {filteredLoans.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-border text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded border transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-border text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Loan Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Loan Details - {selectedLoan?.loanId}
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Applicant Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <p className="font-medium text-foreground">{selectedLoan.applicantName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <p className="text-foreground">{selectedLoan.applicantEmail}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <p className="text-foreground">{selectedLoan.applicantPhone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Loan Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Loan Amount:</span>
                      <p className="font-medium text-foreground">₹{selectedLoan.loanAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Monthly EMI:</span>
                      <p className="text-foreground">₹{selectedLoan.monthlyEMI.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Application Date:</span>
                      <p className="text-foreground">{selectedLoan.applicationDate}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Gold Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Weight:</span>
                      <p className="text-foreground">{selectedLoan.goldWeight}g</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Purity:</span>
                      <p className="text-foreground">{selectedLoan.goldPurity}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Status</h3>
                  <div>
                    {getStatusBadge(selectedLoan.status)}
                  </div>
                  {getNextStatus(selectedLoan.status) && (
                    <Button
                      onClick={() => {
                        handleStatusChange(selectedLoan._id, selectedLoan.status);
                        setIsViewModalOpen(false);
                      }}
                      className="btn-gradient mt-2"
                    >
                      {getNextStatusLabel(selectedLoan.status)}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Outsource Assignment Modal */}
      {isOutsourceModalOpen && selectedLoan && (
        <Dialog open={isOutsourceModalOpen} onOpenChange={setIsOutsourceModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Loan to Outsource</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Loan Details</h4>
                <p className="text-sm text-muted-foreground">
                  Loan ID: {selectedLoan.loanId}<br/>
                  Applicant: {selectedLoan.applicantName}<br/>
                  Amount: ₹{selectedLoan.loanAmount.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Select Outsource Entity</h4>
                {outsourceEntities.map((entity) => (
                  <button
                    key={entity._id}
                    onClick={() => assignToOutsource(entity._id, entity.name)}
                    className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{entity.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{entity.type}</p>
                      </div>
                      <UserGroupIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Loans;