import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';

interface Payment {
  _id: string;
  loanId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  monthlyEMI: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
}

const Payments: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock payment data
  const [payments, setPayments] = useState<Payment[]>([
    {
      _id: '1',
      loanId: 'GL001',
      applicantName: 'Rajesh Kumar',
      applicantPhone: '+91 9876543210',
      applicantEmail: 'rajesh@example.com',
      monthlyEMI: 4500,
      dueDate: '2024-02-15',
      isPaid: false
    },
    {
      _id: '2',
      loanId: 'GL002',
      applicantName: 'Priya Sharma',
      applicantPhone: '+91 9876543211',
      applicantEmail: 'priya@example.com',
      monthlyEMI: 6800,
      dueDate: '2024-02-14',
      isPaid: true,
      paidDate: '2024-02-14',
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN123456'
    },
    {
      _id: '3',
      loanId: 'GL003',
      applicantName: 'Amit Patel',
      applicantPhone: '+91 9876543212',
      applicantEmail: 'amit@example.com',
      monthlyEMI: 9200,
      dueDate: '2024-02-13',
      isPaid: false
    },
    {
      _id: '4',
      loanId: 'GL004',
      applicantName: 'Sunita Reddy',
      applicantPhone: '+91 9876543213',
      applicantEmail: 'sunita@example.com',
      monthlyEMI: 2300,
      dueDate: '2024-02-12',
      isPaid: true,
      paidDate: '2024-02-12',
      paymentMethod: 'Cash',
      transactionId: 'CASH001'
    },
    {
      _id: '5',
      loanId: 'GL005',
      applicantName: 'Mohammad Ali',
      applicantPhone: '+91 9876543214',
      applicantEmail: 'ali@example.com',
      monthlyEMI: 7400,
      dueDate: '2024-02-11',
      isPaid: false
    },
    {
      _id: '6',
      loanId: 'GL006',
      applicantName: 'Kavitha Iyer',
      applicantPhone: '+91 9876543215',
      applicantEmail: 'kavitha@example.com',
      monthlyEMI: 5500,
      dueDate: '2024-02-10',
      isPaid: true,
      paidDate: '2024-02-09',
      paymentMethod: 'UPI',
      transactionId: 'UPI789012'
    }
  ]);

  const handlePaymentToggle = (paymentId: string, isPaid: boolean) => {
    setPayments(prev => prev.map(payment => 
      payment._id === paymentId 
        ? { 
            ...payment, 
            isPaid,
            paidDate: isPaid ? new Date().toISOString().split('T')[0] : undefined,
            paymentMethod: isPaid ? 'Manual Entry' : undefined,
            transactionId: isPaid ? `MAN${Date.now()}` : undefined
          }
        : payment
    ));

    toast({
      title: isPaid ? 'Payment Marked as Paid' : 'Payment Marked as Unpaid',
      description: `Payment has been ${isPaid ? 'marked as paid' : 'marked as unpaid'} successfully.`,
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.applicantPhone.includes(searchTerm);
    
    return matchesSearch;
  });

  const unpaidPayments = filteredPayments.filter(p => !p.isPaid);
  const paidPayments = filteredPayments.filter(p => p.isPaid);

  const getCurrentMonthData = (data: Payment[]) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
    return { totalPages, startIndex, paginatedData };
  };

  const renderPaymentTable = (paymentsData: Payment[], showActions = true) => {
    const { totalPages, startIndex, paginatedData } = getCurrentMonthData(paymentsData);

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Loan ID</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Applicant</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Phone</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">EMI Amount</th>
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Due Date</th>
                {!showActions && <th className="text-left py-4 px-6 font-medium text-muted-foreground">Paid Date</th>}
                {!showActions && <th className="text-left py-4 px-6 font-medium text-muted-foreground">Method</th>}
                <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((payment) => (
                <tr key={payment._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6 font-medium text-foreground">{payment.loanId}</td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-foreground">{payment.applicantName}</div>
                      <div className="text-sm text-muted-foreground">{payment.applicantEmail}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-foreground">{payment.applicantPhone}</td>
                  <td className="py-4 px-6 font-medium text-foreground">₹{payment.monthlyEMI.toLocaleString()}</td>
                  <td className="py-4 px-6 text-muted-foreground">{payment.dueDate}</td>
                  {!showActions && (
                    <td className="py-4 px-6 text-muted-foreground">{payment.paidDate || '-'}</td>
                  )}
                  {!showActions && (
                    <td className="py-4 px-6 text-muted-foreground">{payment.paymentMethod || '-'}</td>
                  )}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {showActions ? (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={payment.isPaid}
                            onChange={(e) => handlePaymentToggle(payment._id, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-muted-foreground">Paid</span>
                        </label>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handlePaymentToggle(payment._id, false)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Mark as unpaid"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
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
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, paymentsData.length)} of {paymentsData.length} results
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
      </>
    );
  };

  const totalDue = unpaidPayments.reduce((sum, payment) => sum + payment.monthlyEMI, 0);
  const totalCollected = paidPayments.reduce((sum, payment) => sum + payment.monthlyEMI, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage monthly EMI payments
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
          <div className="text-2xl font-bold text-foreground">{unpaidPayments.length}</div>
          <div className="text-sm text-muted-foreground">Due This Month</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-destructive">₹{totalDue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Due Amount</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">{paidPayments.length}</div>
          <div className="text-sm text-muted-foreground">Paid This Month</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-success">₹{totalCollected.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Collected</div>
        </div>
      </div>

      {/* Search */}
      <div className="card-elevated p-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by loan ID, name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Payment Tabs */}
      <div className="card-elevated overflow-hidden">
        <Tabs defaultValue="due" className="w-full">
          <div className="border-b border-border px-6 py-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="due" className="flex items-center space-x-2">
                <span>Due This Month</span>
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                  {unpaidPayments.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center space-x-2">
                <span>Paid</span>
                <span className="bg-success text-success-foreground text-xs px-2 py-1 rounded-full">
                  {paidPayments.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="due" className="m-0">
            {unpaidPayments.length > 0 ? (
              renderPaymentTable(unpaidPayments, true)
            ) : (
              <div className="p-8 text-center">
                <CheckIcon className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">All Payments Collected!</h3>
                <p className="text-muted-foreground">No pending payments for this month.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="paid" className="m-0">
            {paidPayments.length > 0 ? (
              renderPaymentTable(paidPayments, false)
            ) : (
              <div className="p-8 text-center">
                <XMarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No Payments Received</h3>
                <p className="text-muted-foreground">No payments have been collected this month.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Payments;