import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import {
  UserIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoanFormData {
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  loanAmount: string;
  goldWeight: string;
  goldPurity: string;
  interestRate: string;
  loanTerm: string;
  notes: string;
}

const steps = [
  { number: 1, title: 'Applicant Information', icon: UserIcon },
  { number: 2, title: 'Loan Details', icon: CurrencyDollarIcon },
  { number: 3, title: 'Review & Submit', icon: CheckIcon }
];

const LoanForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);

  const [formData, setFormData] = useState<LoanFormData>({
    applicantName: '',
    applicantPhone: '',
    applicantEmail: '',
    applicantAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    loanAmount: '',
    goldWeight: '',
    goldPurity: '22K',
    interestRate: '12',
    loanTerm: '12',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<LoanFormData>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<LoanFormData> = {};
    
    if (step === 1) {
      if (!formData.applicantName) newErrors.applicantName = 'Name is required';
      if (!formData.applicantPhone) newErrors.applicantPhone = 'Phone is required';
      if (!formData.applicantEmail) newErrors.applicantEmail = 'Email is required';
      
      const addressErrors: any = {};
      if (!formData.applicantAddress.street) addressErrors.street = 'Street address is required';
      if (!formData.applicantAddress.city) addressErrors.city = 'City is required';
      if (!formData.applicantAddress.state) addressErrors.state = 'State is required';
      if (!formData.applicantAddress.zipCode) addressErrors.zipCode = 'ZIP code is required';
      
      if (Object.keys(addressErrors).length > 0) {
        newErrors.applicantAddress = addressErrors;
      }
    }
    
    if (step === 2) {
      if (!formData.loanAmount) newErrors.loanAmount = 'Loan amount is required';
      if (!formData.goldWeight) newErrors.goldWeight = 'Gold weight is required';
      if (!formData.interestRate) newErrors.interestRate = 'Interest rate is required';
      if (!formData.loanTerm) newErrors.loanTerm = 'Loan term is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof LoanFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof LoanFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...files]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;
    
    setLoading(true);
    try {
      // Prepare loan data for backend
      const loanData = {
        applicantName: formData.applicantName,
        applicantPhone: formData.applicantPhone,
        applicantEmail: formData.applicantEmail,
        applicantAddress: formData.applicantAddress,
        loanAmount: parseFloat(formData.loanAmount),
        goldWeight: parseFloat(formData.goldWeight),
        goldPurity: formData.goldPurity,
        interestRate: parseFloat(formData.interestRate),
        loanTerm: parseInt(formData.loanTerm),
        notes: formData.notes || `Gold loan application submitted by ${user?.firstName} ${user?.lastName}`
      };

      // Create loan via API
      const response = await axios.post('/api/loans', loanData);
      
      const loanId = response.data.loan._id;

      // Upload documents if any
      if (documents.length > 0) {
        const formData = new FormData();
        documents.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('loanId', loanId);
        formData.append('documentType', 'loan_document');
        formData.append('description', 'Loan application documents');

        await axios.post('/api/documents/upload-multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      toast.success('Loan application submitted successfully!');
      navigate('/loans');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit loan application. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicantName">Applicant Name *</Label>
                <Input
                  id="applicantName"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={errors.applicantName ? 'border-red-500' : ''}
                />
                {errors.applicantName && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="applicantPhone">Phone Number *</Label>
                <Input
                  id="applicantPhone"
                  name="applicantPhone"
                  value={formData.applicantPhone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className={errors.applicantPhone ? 'border-red-500' : ''}
                />
                {errors.applicantPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantPhone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="applicantEmail">Email Address *</Label>
                <Input
                  id="applicantEmail"
                  name="applicantEmail"
                  type="email"
                  value={formData.applicantEmail}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className={errors.applicantEmail ? 'border-red-500' : ''}
                />
                {errors.applicantEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  name="applicantAddress.street"
                  value={formData.applicantAddress.street}
                  onChange={handleInputChange}
                  placeholder="Enter street address"
                  className={errors.applicantAddress?.street ? 'border-red-500' : ''}
                />
                {errors.applicantAddress?.street && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantAddress.street}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="applicantAddress.city"
                  value={formData.applicantAddress.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  className={errors.applicantAddress?.city ? 'border-red-500' : ''}
                />
                {errors.applicantAddress?.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantAddress.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="applicantAddress.state"
                  value={formData.applicantAddress.state}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                  className={errors.applicantAddress?.state ? 'border-red-500' : ''}
                />
                {errors.applicantAddress?.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantAddress.state}</p>
                )}
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  name="applicantAddress.zipCode"
                  value={formData.applicantAddress.zipCode}
                  onChange={handleInputChange}
                  placeholder="Enter ZIP code"
                  className={errors.applicantAddress?.zipCode ? 'border-red-500' : ''}
                />
                {errors.applicantAddress?.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicantAddress.zipCode}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={formData.applicantAddress.country} onValueChange={(value) => setFormData(prev => ({ ...prev, applicantAddress: { ...prev.applicantAddress, country: value } }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
                <Input
                  id="loanAmount"
                  name="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  placeholder="Enter loan amount"
                  min="1000"
                  className={errors.loanAmount ? 'border-red-500' : ''}
                />
                {errors.loanAmount && (
                  <p className="text-red-500 text-sm mt-1">{errors.loanAmount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="goldWeight">Gold Weight (grams) *</Label>
                <Input
                  id="goldWeight"
                  name="goldWeight"
                  type="number"
                  value={formData.goldWeight}
                  onChange={handleInputChange}
                  placeholder="Enter gold weight"
                  min="0.1"
                  step="0.1"
                  className={errors.goldWeight ? 'border-red-500' : ''}
                />
                {errors.goldWeight && (
                  <p className="text-red-500 text-sm mt-1">{errors.goldWeight}</p>
                )}
              </div>

              <div>
                <Label htmlFor="goldPurity">Gold Purity</Label>
                <Select value={formData.goldPurity} onValueChange={(value) => setFormData(prev => ({ ...prev, goldPurity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18K">18K</SelectItem>
                    <SelectItem value="22K">22K</SelectItem>
                    <SelectItem value="24K">24K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  name="interestRate"
                  type="number"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  placeholder="Enter interest rate"
                  min="0.1"
                  max="36"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="loanTerm">Loan Term (months) *</Label>
                <Select value={formData.loanTerm} onValueChange={(value) => setFormData(prev => ({ ...prev, loanTerm: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-4">
              <Label>Upload Documents (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Upload supporting documents (PDF, JPG, PNG, DOC)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label 
                  htmlFor="document-upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Select Files
                </label>
              </div>

              {documents.length > 0 && (
                <div className="space-y-3">
                  <Label>Selected Documents ({documents.length})</Label>
                  {documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Applicant Information</h4>
                    <p><strong>Name:</strong> {formData.applicantName}</p>
                    <p><strong>Phone:</strong> {formData.applicantPhone}</p>
                    <p><strong>Email:</strong> {formData.applicantEmail}</p>
                    <p><strong>Address:</strong> {formData.applicantAddress.street}, {formData.applicantAddress.city}, {formData.applicantAddress.state}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Loan Details</h4>
                    <p><strong>Amount:</strong> ₹{formData.loanAmount}</p>
                    <p><strong>Gold Weight:</strong> {formData.goldWeight} grams</p>
                    <p><strong>Purity:</strong> {formData.goldPurity}</p>
                    <p><strong>Interest Rate:</strong> {formData.interestRate}%</p>
                    <p><strong>Term:</strong> {formData.loanTerm} months</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Documents</h4>
                  <p><strong>Documents:</strong> {documents.length} file(s) selected</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Loan Application</h1>
          <p className="text-gray-600">Fill out the form below to submit a new gold loan application</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <CheckIcon className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <span
                key={step.number}
                className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanForm;