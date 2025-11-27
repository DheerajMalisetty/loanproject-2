import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Loan {
  _id: string;
  loanId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  loanAmount: number;
  goldWeight: number;
  goldPurity: string;
  interestRate: number;
  loanTerm: number;
  status: 'pending' | 'approved' | 'returned';
  createdAt: string;
  submittedBy: {
    firstName: string;
    lastName: string;
  };
}

const Loans: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/loans');
      setLoans(response.data.loans || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loans');
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (loanId: string, newStatus: 'approved' | 'returned') => {
    try {
      await axios.put(`/api/loans/${loanId}/status`, { status: newStatus });
      toast.success(`Loan status updated to ${newStatus}`);
      fetchLoans(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update loan status');
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/loans/${loanId}`);
      toast.success('Loan deleted successfully');
      fetchLoans(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete loan');
    }
  };

  const filteredAndSortedLoans = loans
    .filter(loan => {
      const matchesSearch = 
        loan.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.applicantPhone.includes(searchTerm) ||
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Loan];
      let bValue: any = b[sortBy as keyof Loan];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      returned: { color: 'bg-red-100 text-red-800', label: 'Returned' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchLoans} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Records</h1>
          <p className="text-gray-600">Manage and track all gold loan applications</p>
        </div>
        <Link to="/loan/new">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            New Loan
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{loans.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Loan Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(loans.reduce((sum, loan) => sum + loan.loanAmount, 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loans.filter(loan => loan.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, phone, or loan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="applicantName">Applicant Name</SelectItem>
                  <SelectItem value="loanAmount">Loan Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sortOrder">Order</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedLoans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No loans found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Loan ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Applicant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Gold Details</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Submitted By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedLoans.map((loan) => (
                    <tr key={loan._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {loan.loanId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{loan.applicantName}</div>
                          <div className="text-sm text-gray-500">{loan.applicantPhone}</div>
                          <div className="text-sm text-gray-500">{loan.applicantEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{formatCurrency(loan.loanAmount)}</div>
                        <div className="text-sm text-gray-500">{loan.loanTerm} months</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{loan.goldWeight}g</div>
                          <div className="text-gray-500">{loan.goldPurity}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(loan.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {loan.submittedBy?.firstName} {loan.submittedBy?.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-500">
                          {formatDate(loan.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/loans/${loan._id}`}>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {loan.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(loan._id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(loan._id, 'returned')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLoan(loan._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Loans;