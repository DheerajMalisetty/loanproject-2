import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon
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
  applicantAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  loanAmount: number;
  netWeight: number;
  grossWeight: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  goldPurity: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'closed';
  account: 'account1' | 'account2' | 'account3';
  applicationDate: string;
  monthlyEMI: number;
  outsourcedTo?: {
    _id: string;
    name: string;
    type: string;
  };
  outsourceEntity?: string;
  outsourceAmount?: number;
  outsourceDate?: string;
  closedAt?: string;
  closedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  closureReason?: string;
  closureNotes?: string;
  finalAmount?: number;
}

const Loans: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOutsourceModalOpen, setIsOutsourceModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [outsourceEntities, setOutsourceEntities] = useState([]);
  const [loansData, setLoansData] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [closeFormData, setCloseFormData] = useState({
    closureReason: '',
    closureNotes: '',
    finalAmount: ''
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/loans?limit=100');
        setLoansData(response.data.loans || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loans:', error);
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsViewModalOpen(true);
  };

  const handleOutsourceLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsOutsourceModalOpen(true);
  };

  const assignToOutsource = async (entityId: string, entityName: string) => {
    if (!selectedLoan) return;
    
    try {
      // Call backend API to assign loan
      const response = await axios.post('http://localhost:5002/api/outsource/loans', {
        loanId: selectedLoan._id,
        entityId: entityId,
        notes: `Loan outsourced to ${entityName}`
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Update local state
        setLoansData(prev => prev.map(loan =>
          loan._id === selectedLoan._id
            ? { 
                ...loan, 
                outsourcedTo: { _id: entityId, name: entityName, type: 'entity' },
                outsourceEntity: entityName
              }
            : loan
        ));
        
        toast({
          title: 'Loan Outsourced',
          description: `Loan successfully assigned to ${entityName}`,
        });
      }
    } catch (error: any) {
      console.error('Error assigning loan to outsource:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign loan to outsource. Please try again.';
      toast({
        title: 'Outsource Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }
    
    setIsOutsourceModalOpen(false);
    setSelectedLoan(null);
  };

  const handleDownloadLoan = async (loan: Loan) => {
    try {
      toast({
        title: 'Downloading...',
        description: 'Preparing loan application for download.',
      });

      const response = await axios.get(`http://localhost:5002/api/loans/${loan._id}/download`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loan-application-${loan.loanId}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: 'Loan application has been downloaded successfully.',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.response?.data?.message || 'Failed to download loan application.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadTraditionalLoan = async (loan: Loan) => {
    try {
      toast({
        title: 'Downloading...',
        description: 'Preparing traditional Telugu format for download.',
      });

      const response = await axios.get(`http://localhost:5002/api/loans/${loan._id}/download/traditional`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `traditional-loan-${loan.loanId}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: 'Traditional format has been downloaded successfully.',
      });
    } catch (error: any) {
      console.error('Traditional download error:', error);
      toast({
        title: 'Download Failed',
        description: error.response?.data?.message || 'Failed to download traditional format.',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (loanId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    try {
      // Make API call to update loan status
      const response = await axios.put(`http://localhost:5002/api/loans/${loanId}/status`, {
        status: nextStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Update local state with the response from backend
        setLoansData(prevLoans =>
          prevLoans.map(loan =>
            loan._id === loanId ? response.data.loan : loan
          )
        );

        // Show success message
        toast({
          title: 'Status Updated',
          description: `Loan status changed to ${nextStatus} successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Error updating loan status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update loan status';
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleAccountChange = async (loanId: string, newAccount: string) => {
    try {
      const response = await axios.put(`http://localhost:5002/api/loans/${loanId}/account`, {
        account: newAccount
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Update local state with the response from backend
        setLoansData(prevLoans =>
          prevLoans.map(loan =>
            loan._id === loanId ? response.data.loan : loan
          )
        );

        const accountName = newAccount === 'account1' ? 'No1 Account (Tax Filing)' :
                           newAccount === 'account2' ? 'No2 Account (Internal)' :
                           newAccount === 'account3' ? 'No3 Account (Outsource)' :
                           'Unknown Account';

        toast({
          title: 'Account Updated',
          description: `Loan account changed to ${accountName} successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Error updating loan account:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update loan account';
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleCloseLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setCloseFormData({
      closureReason: '',
      closureNotes: '',
      finalAmount: loan.loanAmount.toString()
    });
    setIsCloseModalOpen(true);
  };

  const handleCloseLoanSubmit = async () => {
    if (!selectedLoan || !closeFormData.closureReason) {
      toast({
        title: 'Validation Error',
        description: 'Please select a closure reason.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5002/api/loans/${selectedLoan._id}/close`, {
        closureReason: closeFormData.closureReason,
        closureNotes: closeFormData.closureNotes,
        finalAmount: closeFormData.finalAmount ? parseFloat(closeFormData.finalAmount) : undefined
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setLoansData(prevLoans =>
          prevLoans.map(loan =>
            loan._id === selectedLoan._id ? response.data.loan : loan
          )
        );

        toast({
          title: 'Loan Closed Successfully',
          description: `Loan ${selectedLoan.loanId} has been closed.`,
        });

        setIsCloseModalOpen(false);
        setSelectedLoan(null);
        setCloseFormData({
          closureReason: '',
          closureNotes: '',
          finalAmount: ''
        });
      }
    } catch (error: any) {
      console.error('Error closing loan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to close loan';
      
      toast({
        title: 'Close Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const getNextStatus = (currentStatus: string): 'pending' | 'approved' | 'rejected' | 'under_review' | 'closed' | null => {
    switch (currentStatus) {
      case 'pending':
        return 'approved'; // Manual approval still possible for pending loans
      case 'approved':
        return null; // No automatic transition - use close button instead
      case 'under_review':
        return 'approved';
      case 'closed':
        return null;
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const nextStatus = getNextStatus(currentStatus);
    switch (nextStatus) {
      case 'approved':
        return 'Approve';
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
      case 'closed':
        return <span className="bg-muted text-muted-foreground border border-border px-3 py-1 rounded-full text-sm font-medium">Closed</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  const getAccountBadge = (account: string) => {
    switch (account) {
      case 'account1':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">No1 (Tax Filing)</span>;
      case 'account2':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">No2 (Internal)</span>;
      case 'account3':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">No3 (Outsource)</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
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
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Account</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Net/Gross Weight</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Outsourced</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">EMI</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading loans...</p>
                  </td>
                </tr>
              ) : loansData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No loans found</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first loan to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedLoans.map((loan) => (
                <tr key={loan._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6 font-medium text-foreground">{loan.loanId}</td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-foreground">{loan.applicantName}</div>
                      <div className="text-sm text-muted-foreground">{loan.applicantEmail || 'No email provided'}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-foreground">{loan.applicantPhone}</td>
                  <td className="py-4 px-6 font-medium text-foreground">₹{loan.loanAmount.toLocaleString()}</td>
                  <td className="py-4 px-6">{getAccountBadge(loan.account)}</td>
                  <td className="py-4 px-6 text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium">Net: {loan.netWeight}g</span>
                      <span className="text-sm text-muted-foreground">Gross: {loan.grossWeight}g</span>
                      <span className="text-xs text-muted-foreground">({loan.goldPurity})</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(loan.status)}</td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {loan.outsourcedTo ? (
                      <div className="flex flex-col">
                        <span className="text-success font-medium">✓ {loan.outsourcedTo.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{loan.outsourcedTo.type}</span>
                        {loan.outsourceAmount && (
                          <span className="text-xs text-muted-foreground">₹{loan.outsourceAmount.toLocaleString()}</span>
                        )}
                      </div>
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
                      <button 
                        onClick={() => handleDownloadLoan(loan)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Download Modern Format"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadTraditionalLoan(loan)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Download Traditional Format"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
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
                      <button
                        onClick={() => {
                          const newAccount = loan.account === 'account1' ? 'account2' : 
                                            loan.account === 'account2' ? 'account3' : 'account1';
                          handleAccountChange(loan._id, newAccount);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Change account type"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      {loan.status === 'approved' && !loan.outsourcedTo && (
                        <button
                          onClick={() => handleOutsourceLoan(loan)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="Assign to outsource"
                        >
                          <UserGroupIcon className="h-4 w-4" />
                        </button>
                      )}
                      {loan.status === 'approved' && (
                        <button
                          onClick={() => handleCloseLoan(loan)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Close loan"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
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
                      <p className="text-foreground">{selectedLoan.applicantEmail || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <p className="text-foreground">{selectedLoan.applicantPhone}</p>
                    </div>
                    {selectedLoan.applicantAddress && (
                      <div>
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <p className="text-foreground">
                          {[
                            selectedLoan.applicantAddress.street,
                            selectedLoan.applicantAddress.city,
                            selectedLoan.applicantAddress.state,
                            selectedLoan.applicantAddress.zipCode
                          ].filter(Boolean).join(', ') || 'Not provided'}
                          {selectedLoan.applicantAddress.country && `, ${selectedLoan.applicantAddress.country}`}
                        </p>
                      </div>
                    )}
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
                    <div>
                      <span className="text-sm text-muted-foreground">Account Type:</span>
                      <div className="flex items-center gap-2">
                        {getAccountBadge(selectedLoan.account)}
                        <button
                          onClick={() => {
                            const newAccount = selectedLoan.account === 'account1' ? 'account2' : 
                                              selectedLoan.account === 'account2' ? 'account3' : 'account1';
                            handleAccountChange(selectedLoan._id, newAccount);
                          }}
                          className="p-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          title="Change account type"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Gold Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Net Weight:</span>
                      <p className="text-foreground">{selectedLoan.netWeight}g</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Gross Weight:</span>
                      <p className="text-foreground">{selectedLoan.grossWeight}g</p>
                    </div>
                    {selectedLoan.totalNetWeight && selectedLoan.totalGrossWeight && (
                      <>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Net Weight:</span>
                          <p className="text-foreground">{selectedLoan.totalNetWeight}g</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Gross Weight:</span>
                          <p className="text-foreground">{selectedLoan.totalGrossWeight}g</p>
                        </div>
                      </>
                    )}
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
                  
                  {/* Closure Information */}
                  {selectedLoan.status === 'closed' && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-foreground mb-3">Closure Information</h4>
                      <div className="space-y-2 text-sm">
                        {selectedLoan.closedAt && (
                          <div>
                            <span className="text-muted-foreground">Closed Date:</span>
                            <span className="ml-2 text-foreground">{new Date(selectedLoan.closedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedLoan.closedBy && (
                          <div>
                            <span className="text-muted-foreground">Closed By:</span>
                            <span className="ml-2 text-foreground">{selectedLoan.closedBy.firstName} {selectedLoan.closedBy.lastName}</span>
                          </div>
                        )}
                        {selectedLoan.closureReason && (
                          <div>
                            <span className="text-muted-foreground">Reason:</span>
                            <span className="ml-2 text-foreground capitalize">{selectedLoan.closureReason.replace('_', ' ')}</span>
                          </div>
                        )}
                        {selectedLoan.finalAmount && (
                          <div>
                            <span className="text-muted-foreground">Final Amount:</span>
                            <span className="ml-2 text-foreground font-medium">₹{selectedLoan.finalAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedLoan.closureNotes && (
                          <div>
                            <span className="text-muted-foreground">Notes:</span>
                            <p className="text-foreground mt-1">{selectedLoan.closureNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <Button
                      onClick={() => {
                        handleDownloadLoan(selectedLoan);
                        setIsViewModalOpen(false);
                      }}
                      className="btn-outline-gradient"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download Modern Format
                    </Button>
                    <Button
                      onClick={() => {
                        handleDownloadTraditionalLoan(selectedLoan);
                        setIsViewModalOpen(false);
                      }}
                      className="btn-outline-gradient"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Download Traditional Format
                    </Button>
                  </div>
                </div>
                
                {selectedLoan.outsourcedTo && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Outsource Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Outsourced To:</span>
                        <p className="font-medium text-foreground">{selectedLoan.outsourcedTo.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Entity Type:</span>
                        <p className="text-foreground capitalize">{selectedLoan.outsourcedTo.type}</p>
                      </div>
                      {selectedLoan.outsourceAmount && (
                        <div>
                          <span className="text-sm text-muted-foreground">Outsource Amount:</span>
                          <p className="text-foreground">₹{selectedLoan.outsourceAmount.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedLoan.outsourceDate && (
                        <div>
                          <span className="text-sm text-muted-foreground">Outsource Date:</span>
                          <p className="text-foreground">{selectedLoan.outsourceDate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

      {/* Close Loan Modal */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close Loan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Loan Details</h4>
              <p className="text-sm text-muted-foreground">
                Loan ID: {selectedLoan?.loanId}<br/>
                Applicant: {selectedLoan?.applicantName}<br/>
                Amount: ₹{selectedLoan?.loanAmount.toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Closure Reason *
                </label>
                <select
                  value={closeFormData.closureReason}
                  onChange={(e) => setCloseFormData(prev => ({ ...prev, closureReason: e.target.value }))}
                  className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="settlement">Settlement</option>
                  <option value="write_off">Write Off</option>
                  <option value="collateral_auction">Collateral Auction</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Final Amount (₹)
                </label>
                <input
                  type="number"
                  value={closeFormData.finalAmount}
                  onChange={(e) => setCloseFormData(prev => ({ ...prev, finalAmount: e.target.value }))}
                  className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter final amount"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Closure Notes
                </label>
                <textarea
                  value={closeFormData.closureNotes}
                  onChange={(e) => setCloseFormData(prev => ({ ...prev, closureNotes: e.target.value }))}
                  className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCloseModalOpen(false);
                  setSelectedLoan(null);
                  setCloseFormData({
                    closureReason: '',
                    closureNotes: '',
                    finalAmount: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseLoanSubmit}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Close Loan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Loans;