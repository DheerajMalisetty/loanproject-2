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

interface DashboardStats {
  totalLoans: number;
  totalAmount: number;
  pendingLoans: number;
  approvedLoans: number;
}

interface RecentLoan {
  _id: string;
  loanId: string;
  applicantName: string;
  loanAmount: number;
  status: string;
  applicationDate: string;
  goldWeight: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    totalAmount: 0,
    pendingLoans: 0,
    approvedLoans: 0
  });
  const [recentLoans, setRecentLoans] = useState<RecentLoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API_BASE_URL}/loans/dashboard/stats`);
      setStats(statsResponse.data.stats);
      
      // Fetch recent loans
      const loansResponse = await axios.get(`${API_BASE_URL}/loans?limit=5&sort=-applicationDate`);
      setRecentLoans(loansResponse.data.loans);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      name: 'Total Loans',
      value: stats.totalLoans.toLocaleString(),
      icon: DocumentTextIcon,
      change: '+12%',
      changeType: 'positive',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Amount',
      value: `₹${stats.totalAmount.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+8%',
      changeType: 'positive',
      color: 'bg-green-500'
    },
    {
      name: 'Pending Loans',
      value: stats.pendingLoans.toString(),
      icon: ClockIcon,
      change: '-5%',
      changeType: 'negative',
      color: 'bg-yellow-500'
    },
    {
      name: 'Approved Loans',
      value: stats.approvedLoans.toString(),
      icon: CheckCircleIcon,
      change: '+15%',
      changeType: 'positive',
      color: 'bg-purple-500'
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
      default:
        return <span className="status-pending">{status}</span>;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
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
                <p className={`text-sm mt-1 ${
                  stat.changeType === 'positive' ? 'text-success' : 'text-destructive'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Loan ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applicant</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gold Weight</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLoans.map((loan) => (
                <tr key={loan._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-medium text-foreground">{loan.loanId}</td>
                  <td className="py-4 px-4 text-foreground">{loan.applicantName}</td>
                  <td className="py-4 px-4 font-medium text-foreground">₹{loan.loanAmount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-muted-foreground">{loan.goldWeight}g</td>
                  <td className="py-4 px-4">{getStatusBadge(loan.status)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{new Date(loan.applicationDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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