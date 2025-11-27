import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';

interface OutsourceEntity {
  _id: string;
  name: string;
  type: 'organization' | 'individual';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  interestRate: number;
  maxLoanAmount: number;
  status: 'active' | 'inactive';
  createdDate: string;
}

interface OutsourcedLoan {
  _id: string;
  loanId: string;
  originalLoanId: string;
  applicantName: string;
  loanAmount: number;
  originalInterestRate: number;
  outsourceInterestRate: number;
  profitMargin: number;
  entityId: string;
  entityName: string;
  outsourceDate: string;
  status: 'active' | 'completed' | 'defaulted';
  monthlyEMI: number;
}

interface AvailableLoan {
  _id: string;
  loanId: string;
  applicantName: string;
  loanAmount: number;
  status: 'approved' | 'disbursed';
  applicationDate: string;
  monthlyEMI: number;
  canOutsource: boolean;
}

const Outsource: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<AvailableLoan | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<OutsourceEntity | null>(null);
  const [newEntity, setNewEntity] = useState({
    name: '',
    type: 'organization' as 'organization' | 'individual',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    interestRate: 12.0,
    maxLoanAmount: 1000000
  });
  const [outsourceData, setOutsourceData] = useState({
    customAmount: 0,
    customInterestRate: 0
  });

  const [entities, setEntities] = useState<OutsourceEntity[]>([]);
  const [availableLoans, setAvailableLoans] = useState<AvailableLoan[]>([]);
  const [outsourcedLoans, setOutsourcedLoans] = useState<OutsourcedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingEntity, setCreatingEntity] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available loans using the new endpoint
      const availableLoansResponse = await axios.get('http://localhost:5002/api/outsource/available-loans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const availableLoansData = availableLoansResponse.data.availableLoans || [];
      
      // Transform backend data to match frontend interface
      const available = availableLoansData.map(loan => ({
        _id: loan._id,
        loanId: loan.loanId,
        applicantName: loan.applicantName,
        loanAmount: loan.loanAmount,
        status: loan.status,
        applicationDate: new Date(loan.applicationDate).toLocaleDateString(),
        monthlyEMI: loan.monthlyEMI || 0,
        canOutsource: true
      }));
      
      setAvailableLoans(available);
      
      // Fetch outsource entities from backend
      try {
        const entitiesResponse = await axios.get('http://localhost:5002/api/outsource/entities?limit=100', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const fetchedEntities = entitiesResponse.data.entities || [];
        setEntities(fetchedEntities);
        
        if (fetchedEntities.length > 0) {
          console.log(`Loaded ${fetchedEntities.length} outsource entities`);
        }
      } catch (error) {
        console.error('Error fetching outsource entities:', error);
        // Set empty entities if API call fails
        setEntities([]);
      }
      
      // Fetch outsourced loans from backend
      try {
        const outsourcedResponse = await axios.get('http://localhost:5002/api/outsource/loans', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const fetchedOutsourcedLoans = outsourcedResponse.data.outsourcedLoans || [];
        
        // Transform backend data to match frontend interface
        const transformedLoans = fetchedOutsourcedLoans.map((loan: any) => ({
          _id: loan._id,
          loanId: loan.loanId, // Use original loan ID instead of appending -OUT
          originalLoanId: loan.loanId,
          applicantName: loan.applicantName,
          loanAmount: loan.outsourceAmount || loan.loanAmount,
          originalInterestRate: loan.interestRate || 12.0,
          outsourceInterestRate: loan.outsourceInterestRate || 12.0,
          profitMargin: loan.profitMargin || 0,
          entityId: loan.outsourcedTo,
          entityName: loan.outsourceEntity || 'Unknown Entity',
          outsourceDate: loan.outsourceDate ? new Date(loan.outsourceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: 'active',
          monthlyEMI: loan.monthlyEMI || 0
        }));
        
        setOutsourcedLoans(transformedLoans);
      } catch (error) {
        console.error('Error fetching outsourced loans:', error);
        setOutsourcedLoans([]);
      }
      
    } catch (error) {
      console.error('Error fetching outsource data:', error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEntity = async () => {
    try {
      setCreatingEntity(true);
      
      // Validate required fields
      if (!newEntity.name || !newEntity.contactPerson || !newEntity.phone || !newEntity.email || !newEntity.address) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive'
        });
        return;
      }

      // Validate interest rate
      if (newEntity.interestRate <= 0 || newEntity.interestRate > 36) {
        toast({
          title: 'Validation Error',
          description: 'Interest rate must be between 0.1% and 36%.',
          variant: 'destructive'
        });
        return;
      }

      // Validate max loan amount
      if (newEntity.maxLoanAmount <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Maximum loan amount must be greater than 0.',
          variant: 'destructive'
        });
        return;
      }

      // Create entity via API
      const response = await axios.post('http://localhost:5002/api/outsource/entities', {
        name: newEntity.name,
        type: newEntity.type,
        contactPerson: newEntity.contactPerson,
        phone: newEntity.phone,
        email: newEntity.email,
        address: newEntity.address,
        interestRate: newEntity.interestRate,
        maxLoanAmount: newEntity.maxLoanAmount
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        // Add the new entity to the list
        const createdEntity = response.data.entity;
        setEntities([...entities, createdEntity]);
        
        // Reset form
        setNewEntity({
          name: '',
          type: 'organization',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          interestRate: 12.0,
          maxLoanAmount: 1000000
        });
        
        setIsEntityModalOpen(false);
        
        toast({
          title: 'Entity Created',
          description: 'Outsource entity has been created successfully.',
        });
      }
    } catch (error: any) {
      console.error('Error creating entity:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create entity. Please try again.';
      toast({
        title: 'Creation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setCreatingEntity(false);
    }
  };

  const handleAssignLoan = async () => {
    if (!selectedLoan || !selectedEntity) return;

    try {
      // Call backend API to assign loan
      const response = await axios.post('http://localhost:5002/api/outsource/loans', {
        loanId: selectedLoan._id,
        entityId: selectedEntity._id,
        customAmount: outsourceData.customAmount || selectedLoan.loanAmount,
        customInterestRate: outsourceData.customInterestRate || selectedEntity.interestRate,
        notes: `Loan outsourced to ${selectedEntity.name}`
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Refresh data to get updated lists
        await fetchData();
        
        toast({
          title: 'Loan Assigned',
          description: `Loan successfully assigned to ${selectedEntity.name}`,
        });
      }
    } catch (error: any) {
      console.error('Error assigning loan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign loan. Please try again.';
      toast({
        title: 'Assignment Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }

    setIsAssignModalOpen(false);
    setSelectedLoan(null);
    setSelectedEntity(null);
    setOutsourceData({ customAmount: 0, customInterestRate: 0 });
  };

  const handleOpenAssignModal = (loan: AvailableLoan) => {
    setSelectedLoan(loan);
    setOutsourceData({ 
      customAmount: loan.loanAmount, 
      customInterestRate: 0 
    });
    setIsAssignModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-approved">Active</span>;
      case 'inactive':
        return <span className="status-rejected">Inactive</span>;
      case 'completed':
        return <span className="bg-muted text-muted-foreground border border-border px-3 py-1 rounded-full text-sm font-medium">Completed</span>;
      case 'defaulted':
        return <span className="status-rejected">Defaulted</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = 
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || entity.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredLoans = outsourcedLoans.filter(loan => {
    const matchesSearch = 
      loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredAvailableLoans = availableLoans.filter(loan => {
    const matchesSearch = 
      loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalOutsourcedAmount = outsourcedLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalProfitMargin = outsourcedLoans.reduce((sum, loan) => sum + (loan.loanAmount * loan.profitMargin / 100), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outsource Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage loans outsourced to other entities and track profit margins
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={fetchData}
            className="btn-outline-gradient inline-flex items-center"
          >
            <ArrowPathIcon className="mr-2 h-5 w-5" />
            Refresh
          </button>
          <button
            onClick={() => setIsEntityModalOpen(true)}
            className="btn-gradient inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Entity
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">{availableLoans.length}</div>
          <div className="text-sm text-muted-foreground">Available Loans</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">₹{availableLoans.reduce((sum, loan) => sum + loan.loanAmount, 0).toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Available Amount</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">{outsourcedLoans.length}</div>
          <div className="text-sm text-muted-foreground">Outsourced Loans</div>
        </div>
        <div className="card-stats p-4">
          <div className="text-2xl font-bold text-foreground">{entities.filter(e => e.status === 'active').length}</div>
          <div className="text-sm text-muted-foreground">Active Entities</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Loans</TabsTrigger>
          <TabsTrigger value="outsourced">Outsourced Loans</TabsTrigger>
          <TabsTrigger value="entities">Outsource Entities</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="card-elevated p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === 'available' ? "Search available loans..." : activeTab === 'outsourced' ? "Search outsourced loans..." : "Search entities..."}
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
                <option value="active">Active</option>
                {activeTab !== 'available' && <option value="inactive">Inactive</option>}
                {activeTab === 'outsourced' && (
                  <>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </>
                )}
                {activeTab === 'available' && (
                  <>
                    <option value="approved">Approved</option>
                    <option value="disbursed">Disbursed</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <TabsContent value="available" className="space-y-6">
          {/* Available Loans Table */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Loan ID</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Applicant</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">EMI</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Loading loans...</p>
                      </td>
                    </tr>
                  ) : filteredAvailableLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No available loans found</p>
                        <p className="text-sm text-muted-foreground mt-1">Approved loans will appear here for outsourcing</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAvailableLoans.map((loan) => (
                    <tr key={loan._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6 font-medium text-foreground">{loan.loanId}</td>
                      <td className="py-4 px-6 text-foreground">{loan.applicantName}</td>
                      <td className="py-4 px-6 font-medium text-foreground">₹{loan.loanAmount.toLocaleString()}</td>
                      <td className="py-4 px-6">{getStatusBadge(loan.status)}</td>
                      <td className="py-4 px-6 text-muted-foreground">{loan.applicationDate}</td>
                      <td className="py-4 px-6 text-foreground">₹{loan.monthlyEMI.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleOpenAssignModal(loan)}
                            className="btn-gradient text-sm px-3 py-1"
                            disabled={!loan.canOutsource}
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outsourced" className="space-y-6">
          {/* Outsourced Loans Table */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Loan ID</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Applicant</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Entity</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Interest Rate</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Profit Margin</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6 font-medium text-foreground">{loan.loanId}</td>
                      <td className="py-4 px-6 text-foreground">{loan.applicantName}</td>
                      <td className="py-4 px-6 font-medium text-foreground">₹{loan.loanAmount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-foreground">{loan.entityName}</td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {loan.originalInterestRate}% → {loan.outsourceInterestRate}%
                      </td>
                      <td className="py-4 px-6 font-medium text-primary">{loan.profitMargin}%</td>
                      <td className="py-4 px-6 text-muted-foreground">{loan.outsourceDate}</td>
                      <td className="py-4 px-6">{getStatusBadge(loan.status)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="entities" className="space-y-6">
          {/* Entities Table */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Entity Name</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Contact Person</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Interest Rate</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Max Amount</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntities.map((entity) => (
                    <tr key={entity._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6 font-medium text-foreground">{entity.name}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entity.type === 'organization' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {entity.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-foreground">{entity.contactPerson}</td>
                      <td className="py-4 px-6 text-foreground">{entity.phone}</td>
                      <td className="py-4 px-6 text-foreground">{entity.interestRate}%</td>
                      <td className="py-4 px-6 text-foreground">₹{entity.maxLoanAmount.toLocaleString()}</td>
                      <td className="py-4 px-6">{getStatusBadge(entity.status)}</td>
                      <td className="py-4 px-6 text-muted-foreground">{entity.createdDate}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Entity Modal */}
      <Dialog open={isEntityModalOpen} onOpenChange={setIsEntityModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Add New Outsource Entity
              <button
                onClick={() => setIsEntityModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Entity Name</label>
                <input
                  type="text"
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                  className="form-input mt-1"
                  placeholder="Enter entity/person name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <select
                  value={newEntity.type}
                  onChange={(e) => setNewEntity({...newEntity, type: e.target.value as 'organization' | 'individual'})}
                  className="form-input mt-1"
                >
                  <option value="organization">Organization</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Contact Person</label>
                <input
                  type="text"
                  value={newEntity.contactPerson}
                  onChange={(e) => setNewEntity({...newEntity, contactPerson: e.target.value})}
                  className="form-input mt-1"
                  placeholder="Enter contact person"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="tel"
                  value={newEntity.phone}
                  onChange={(e) => setNewEntity({...newEntity, phone: e.target.value})}
                  className="form-input mt-1"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={newEntity.email}
                  onChange={(e) => setNewEntity({...newEntity, email: e.target.value})}
                  className="form-input mt-1"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntity.interestRate}
                  onChange={(e) => setNewEntity({...newEntity, interestRate: parseFloat(e.target.value)})}
                  className="form-input mt-1"
                  placeholder="8.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Max Loan Amount</label>
                <input
                  type="number"
                  value={newEntity.maxLoanAmount}
                  onChange={(e) => setNewEntity({...newEntity, maxLoanAmount: parseInt(e.target.value)})}
                  className="form-input mt-1"
                  placeholder="5000000"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Address</label>
              <textarea
                value={newEntity.address}
                onChange={(e) => setNewEntity({...newEntity, address: e.target.value})}
                className="form-input mt-1"
                rows={3}
                placeholder="Enter full address"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleCreateEntity} 
                className="btn-gradient flex-1"
                disabled={creatingEntity}
              >
                {creatingEntity ? 'Creating...' : 'Create Entity'}
              </Button>
              <Button 
                onClick={() => setIsEntityModalOpen(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Loan Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Assign Loan to Outsource Entity
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-6">
              {/* Loan Details */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Loan ID:</span>
                    <p className="font-medium">{selectedLoan.loanId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Applicant:</span>
                    <p className="font-medium">{selectedLoan.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Original Amount:</span>
                    <p className="font-medium">₹{selectedLoan.loanAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly EMI:</span>
                    <p className="font-medium">₹{selectedLoan.monthlyEMI.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Entity Selection */}
              <div>
                <label className="text-sm font-medium text-foreground">Select Outsource Entity</label>
                <select
                  value={selectedEntity?._id || ''}
                  onChange={(e) => {
                    const entity = entities.find(ent => ent._id === e.target.value);
                    setSelectedEntity(entity || null);
                    if (entity) {
                      setOutsourceData(prev => ({
                        ...prev,
                        customInterestRate: entity.interestRate
                      }));
                    }
                  }}
                  className="form-input mt-1"
                >
                  <option value="">Select an entity</option>
                  {entities.filter(e => e.status === 'active').map(entity => (
                    <option key={entity._id} value={entity._id}>
                      {entity.name} ({entity.type}) - {entity.interestRate}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Outsource Amount</label>
                  <input
                    type="number"
                    value={outsourceData.customAmount}
                    onChange={(e) => setOutsourceData({...outsourceData, customAmount: parseInt(e.target.value)})}
                    className="form-input mt-1"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={outsourceData.customInterestRate}
                    onChange={(e) => setOutsourceData({...outsourceData, customInterestRate: parseFloat(e.target.value)})}
                    className="form-input mt-1"
                    placeholder="Enter interest rate"
                  />
                </div>
              </div>

              {/* Profit Calculation */}
              {outsourceData.customInterestRate > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800">Profit Margin</h4>
                  <p className="text-green-700">
                    {(12.0 - outsourceData.customInterestRate).toFixed(1)}% 
                    (₹{((outsourceData.customAmount || selectedLoan.loanAmount) * (12.0 - outsourceData.customInterestRate) / 100).toLocaleString()} annually)
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={handleAssignLoan} 
                  className="btn-gradient flex-1"
                  disabled={!selectedEntity}
                >
                  Assign Loan
                </Button>
                <Button 
                  onClick={() => setIsAssignModalOpen(false)} 
                  variant="outline" 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Outsource;