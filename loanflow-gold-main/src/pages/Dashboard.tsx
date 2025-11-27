import React from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: 'Total Loans',
      value: '1,247',
      icon: DocumentTextIcon,
      change: '+12%',
      changeType: 'positive',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Amount',
      value: '₹45,67,890',
      icon: CurrencyDollarIcon,
      change: '+8%',
      changeType: 'positive',
      color: 'bg-green-500'
    },
    {
      name: 'Pending Loans',
      value: '23',
      icon: ClockIcon,
      change: '-5%',
      changeType: 'negative',
      color: 'bg-yellow-500'
    },
    {
      name: 'Approved Loans',
      value: '1,156',
      icon: CheckCircleIcon,
      change: '+15%',
      changeType: 'positive',
      color: 'bg-purple-500'
    }
  ];

  const outsourceStats = [
    {
      name: 'Outsourced Loans',
      value: '24',
      color: 'bg-orange-500'
    },
    {
      name: 'Outsourced Amount',
      value: '₹15,50,000',
      color: 'bg-teal-500'
    }
  ];

  const recentLoans = [
    {
      id: 'GL001',
      applicantName: 'Rajesh Kumar',
      amount: '₹50,000',
      status: 'pending',
      date: '2024-01-15',
      goldWeight: '25g'
    },
    {
      id: 'GL002',
      applicantName: 'Priya Sharma',
      amount: '₹75,000',
      status: 'approved',
      date: '2024-01-14',
      goldWeight: '35g'
    },
    {
      id: 'GL003',
      applicantName: 'Amit Patel',
      amount: '₹1,00,000',
      status: 'under_review',
      date: '2024-01-13',
      goldWeight: '45g'
    },
    {
      id: 'GL004',
      applicantName: 'Sunita Reddy',
      amount: '₹25,000',
      status: 'approved',
      date: '2024-01-12',
      goldWeight: '15g'
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
        {stats.map((stat, index) => (
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
                <tr key={loan.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-medium text-foreground">{loan.id}</td>
                  <td className="py-4 px-4 text-foreground">{loan.applicantName}</td>
                  <td className="py-4 px-4 font-medium text-foreground">{loan.amount}</td>
                  <td className="py-4 px-4 text-muted-foreground">{loan.goldWeight}</td>
                  <td className="py-4 px-4">{getStatusBadge(loan.status)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{loan.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;