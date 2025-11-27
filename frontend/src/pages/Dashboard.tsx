import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Loan {
  _id: string;
  loanId: string;
  applicantName: string;
  loanAmount: number;
  status: string;
  account: string;
  applicationDate: string;
  netWeight: number;
  grossWeight: number;
  outsourcedTo?: {
    _id: string;
    name: string;
    type: string;
  };
}

interface DashboardStats {
  totalLoans: number;
  totalAmount: number;
  pendingLoans: number;
  underReviewLoans: number;
  approvedLoans: number;
  outsourcedLoans: number;
  outsourcedAmount: number;
  account1Loans: number;
  account1Amount: number;
  account2Loans: number;
  account2Amount: number;
  account3Loans: number;
  account3Amount: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    totalAmount: 0,
    pendingLoans: 0,
    underReviewLoans: 0,
    approvedLoans: 0,
    outsourcedLoans: 0,
    outsourcedAmount: 0,
    account1Loans: 0,
    account1Amount: 0,
    account2Loans: 0,
    account2Amount: 0,
    account3Loans: 0,
    account3Amount: 0
  });
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        // Get dashboard statistics
        const statsResponse = await axios.get('http://localhost:5002/api/loans/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Get recent loans
        const loansResponse = await axios.get('http://localhost:5002/api/loans?limit=10', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const statsData = statsResponse.data.stats;
        const loansData = loansResponse.data;

        // Transform data for stats
        const dashboardStats: DashboardStats = {
          totalLoans: statsData.totalLoans || 0,
          totalAmount: statsData.totalAmount || 0,
          pendingLoans: statsData.pendingLoans || 0,
          underReviewLoans: statsData.underReviewLoans || 0,
          approvedLoans: statsData.approvedLoans || 0,
          outsourcedLoans: statsData.outsourcedLoans || 0,
          outsourcedAmount: statsData.outsourcedAmount || 0,
          account1Loans: statsData.account1Loans || 0,
          account1Amount: statsData.account1Amount || 0,
          account2Loans: statsData.account2Loans || 0,
          account2Amount: statsData.account2Amount || 0,
          account3Loans: statsData.account3Loans || 0,
          account3Amount: statsData.account3Amount || 0
        };

        setStats(dashboardStats);
        setRecentLoans(loansData.loans || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statsData = [
    {
      name: 'Total Loans',
      value: stats.totalLoans.toString(),
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Amount',
      value: formatCurrency(stats.totalAmount),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Pending Loans',
      value: stats.pendingLoans.toString(),
      icon: ClockIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Approved Loans',
      value: stats.approvedLoans.toString(),
      icon: CheckCircleIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Under Review',
      value: stats.underReviewLoans.toString(),
      icon: ClockIcon,
      color: 'bg-orange-500'
    }
  ];

  const outsourceStats = [
    {
      name: 'Outsourced Loans',
      value: stats.outsourcedLoans.toString(),
      color: 'bg-orange-500'
    },
    {
      name: 'Outsourced Amount',
      value: formatCurrency(stats.outsourcedAmount),
      color: 'bg-teal-500'
    }
  ];

  const accountStats = [
    {
      name: 'No1 Account (Tax Filing)',
      loans: stats.account1Loans,
      amount: stats.account1Amount,
      color: 'bg-blue-600',
      description: 'Primary account for tax filing'
    },
    {
      name: 'No2 Account (Internal)',
      loans: stats.account2Loans,
      amount: stats.account2Amount,
      color: 'bg-green-600',
      description: 'Secondary internal account'
    },
    {
      name: 'No3 Account (Outsource)',
      loans: stats.account3Loans,
      amount: stats.account3Amount,
      color: 'bg-purple-600',
      description: 'External outsource account'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="status-pending">Pending</span>;
      case 'approved':
        return <span className="status-approved">Approved</span>;
      case 'under_review':
        return <span className="status-pending">Under Review</span>;
      case 'closed':
        return <span className="status-rejected">Closed</span>;
      case 'rejected':
        return <span className="status-rejected">Rejected</span>;
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here's an overview of your gold loan management.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/loan/new"
            className="btn-gradient inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            New Loan
          </Link>
          <Link
            to="/loans"
            className="btn-outline-gradient inline-flex items-center"
          >
            <EyeIcon className="mr-2 h-5 w-5" />
            View All
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <div 
            key={stat.name}
            className="card-stats p-6 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Statistics */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Account-wise Statistics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accountStats.map((account, index) => (
            <div 
              key={account.name}
              className="card-stats p-6 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${account.color}`}>
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {account.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account</p>
                  <p className="text-lg font-bold text-foreground">{account.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loans</p>
                    <p className="text-xl font-bold text-foreground">{account.loans}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(account.amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Loans */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Loan Applications</h2>
          <Link 
            to="/loans" 
            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
          >
            View all loans →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading loans...</p>
          </div>
        ) : recentLoans.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No loans found</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first loan to get started</p>
          </div>
        ) : (
          <>
            {/* Outsource Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {outsourceStats.map((stat, index) => (
                <div 
                  key={stat.name}
                  className="card-stats p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.name}
                      </p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <CurrencyDollarIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto mt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Loan ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applicant</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Net/Gross Weight</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => (
                    <tr key={loan._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{loan.loanId}</td>
                      <td className="py-4 px-4 text-foreground">{loan.applicantName}</td>
                      <td className="py-4 px-4 font-medium text-foreground">{formatCurrency(loan.loanAmount)}</td>
                      <td className="py-4 px-4">{getAccountBadge(loan.account)}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="font-medium">Net: {loan.netWeight}g</span>
                          <span className="text-sm text-muted-foreground">Gross: {loan.grossWeight}g</span>
                          {loan.outsourcedTo && (
                            <span className="text-xs text-orange-600">Outsourced</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(loan.status)}</td>
                      <td className="py-4 px-4 text-muted-foreground">{new Date(loan.applicationDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/loan/new" className="card-elevated p-6 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <PlusIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Create New Loan</h3>
              <p className="text-sm text-muted-foreground">Start a new loan application</p>
            </div>
          </div>
        </Link>

        <Link to="/loans" className="card-elevated p-6 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Manage Loans</h3>
              <p className="text-sm text-muted-foreground">View and manage all loans</p>
            </div>
          </div>
        </Link>

        <Link to="/outsource" className="card-elevated p-6 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Outsource Loans</h3>
              <p className="text-sm text-muted-foreground">Manage outsourced loans</p>
            </div>
          </div>
        </Link>

        <Link to="/profile" className="card-elevated p-6 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-foreground/10 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Profile Settings</h3>
              <p className="text-sm text-muted-foreground">Update your information</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;