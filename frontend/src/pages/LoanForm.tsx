import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';
import {
  UserIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LoanItem {
  id: string;
  name: string;
  description: string;
  netWeight: string;
  grossWeight: string;
  estimatedValue: string;
  pictures: File[];
}

interface LoanFormData {
  // Applicant Information
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Loan Details
  loanAmount: string;
  netWeight: string;
  grossWeight: string;
  goldPurity: '18K' | '22K' | '24K';
  interestRate: string;
  loanTerm: string;
  account: 'account1' | 'account2' | 'account3';
  
  // Loan Items
  items: LoanItem[];
}

const LoanForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<File[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signedDocuments, setSignedDocuments] = useState<File[]>([]);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  const sigPadRef = useRef<SignatureCanvas>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LoanFormData>({
    applicantName: '',
    applicantPhone: '',
    applicantEmail: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    loanAmount: '',
    netWeight: '',
    grossWeight: '',
    goldPurity: '22K',
    interestRate: '12',
    loanTerm: '12',
    account: 'account1',
    items: []
  });

  const [errors, setErrors] = useState<Partial<LoanFormData>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<LoanFormData> = {};
    
    if (step === 1) {
      if (!formData.applicantName) newErrors.applicantName = 'Name is required';
      if (!formData.applicantPhone) newErrors.applicantPhone = 'Phone is required';
      // Email and address fields are now optional - no validation required
    }
    
    if (step === 2) {
      if (!formData.loanAmount) newErrors.loanAmount = 'Loan amount is required';
      if (!formData.netWeight) newErrors.netWeight = 'Net weight is required';
      if (!formData.grossWeight) newErrors.grossWeight = 'Gross weight is required';
      if (!formData.interestRate) newErrors.interestRate = 'Interest rate is required';
      if (!formData.loanTerm) newErrors.loanTerm = 'Loan term is required';
      if (!formData.account) newErrors.account = 'Account selection is required';
    }
    
    if (step === 3) {
      // Signature is now optional - no validation required
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const addItem = () => {
    const newItem: LoanItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      netWeight: '',
      grossWeight: '',
      estimatedValue: '',
      pictures: []
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, field: keyof LoanItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleItemPictureUpload = (itemId: string, files: FileList | null) => {
    if (!files) return;
    
    const newPictures = Array.from(files);
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId 
          ? { ...item, pictures: [...item.pictures, ...newPictures] }
          : item
      )
    }));
  };

  const removeItemPicture = (itemId: string, pictureIndex: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, pictures: item.pictures.filter((_, i) => i !== pictureIndex) }
          : item
      )
    }));
  };

  const downloadBlankForm = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text('Gold Loan Application Form', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text('Applicant Name: ____________________________', 20, 60);
    pdf.text('Phone Number: ____________________________', 20, 80);
    pdf.text('Email: ____________________________', 20, 100);
    pdf.text('Address: ____________________________', 20, 120);
    pdf.text('Loan Amount: ____________________________', 20, 160);
    pdf.text('Gold Weight: ____________________________', 20, 180);
    pdf.text('Gold Purity: ____________________________', 20, 200);
    
    pdf.text('Signature: ____________________________', 20, 250);
    pdf.text('Date: ____________________________', 20, 270);
    
    pdf.save('gold-loan-application-form.pdf');
  };

  const handleSignedDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSignedDocuments(prev => [...prev, ...files]);
      toast({
        title: 'Signed Document Uploaded',
        description: `${files.length} signed document(s) uploaded successfully.`,
      });
    }
  };

  const removeSignedDocument = (index: number) => {
    setSignedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const captureFromCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setSignature(null);
    }
  };

  const saveSignature = () => {
    if (sigPadRef.current) {
      const signatureData = sigPadRef.current.getTrimmedCanvas().toDataURL();
      setSignature(signatureData);
      setShowSignature(false);
      toast({
        title: 'Signature Saved',
        description: 'Your signature has been saved successfully. Proceeding to review step.',
      });
      // Advance to review step after signature
      setCurrentStep(4);
    }
  };

  const generatePDF = async () => {
    // Wait a bit for the form to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to find the form element if ref is not available
    let formElement = formRef.current;
    if (!formElement) {
      formElement = document.querySelector('[data-form-preview]') as HTMLElement;
    }
    
    if (!formElement) {
      toast({
        title: 'Download Failed',
        description: 'Form element not found. Please ensure you are on the review step.',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Starting PDF generation...');
      
      const canvas = await html2canvas(formElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      console.log('Canvas created:', canvas.width, 'x', canvas.height);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `loan-application-${formData.applicantName?.replace(/\s+/g, '-') || 'form'}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF saved:', fileName);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Loan application form has been downloaded as PDF.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Download Failed',
        description: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const printForm = () => {
    window.print();
    toast({
      title: 'Print Dialog Opened',
      description: 'Print dialog has been opened for the loan application form.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      // Prepare loan data for submission
      const loanData = {
        applicantName: formData.applicantName,
        applicantPhone: formData.applicantPhone,
        applicantEmail: formData.applicantEmail,
        applicantAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        loanAmount: formData.loanAmount,
        netWeight: formData.netWeight,
        grossWeight: formData.grossWeight,
        goldPurity: formData.goldPurity,
        interestRate: formData.interestRate,
        loanTerm: formData.loanTerm,
        account: formData.account,
        items: formData.items,
        digitalSignature: signature
      };

      // Submit to backend
      const response = await axios.post('http://localhost:5002/api/loans', loanData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        toast({
          title: 'Loan Approved & Created',
          description: 'Your loan application has been submitted and automatically approved. The loan is now active.',
        });
        
        // Navigate to loans page
        navigate('/loans');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit loan application';
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Applicant Information', icon: UserIcon },
    { number: 2, title: 'Loan Details', icon: CurrencyDollarIcon },
    { number: 3, title: 'Documents', icon: DocumentArrowUpIcon },
    { number: 4, title: 'Review & Submit', icon: CheckCircleIcon }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">New Loan Application</h1>
        <p className="mt-2 text-muted-foreground">
          Fill out the form below to submit a new gold loan application
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
              ${currentStep >= step.number 
                ? 'bg-gradient-primary text-white' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {currentStep > step.number ? (
                <CheckCircleIcon className="h-6 w-6" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <span className={`
              ml-2 text-sm font-medium hidden sm:block
              ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}
            `}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`
                w-8 h-px mx-4 transition-colors duration-200
                ${currentStep > step.number ? 'bg-primary' : 'bg-border'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-6">Applicant Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleInputChange}
                    className={`form-input ${errors.applicantName ? 'border-destructive' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.applicantName && (
                    <p className="text-sm text-destructive mt-1">{errors.applicantName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="applicantPhone"
                    value={formData.applicantPhone}
                    onChange={handleInputChange}
                    className={`form-input ${errors.applicantPhone ? 'border-destructive' : ''}`}
                    placeholder="+91 9876543210"
                  />
                  {errors.applicantPhone && (
                    <p className="text-sm text-destructive mt-1">{errors.applicantPhone}</p>
                  )}
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    name="applicantEmail"
                    value={formData.applicantEmail}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Street Address (Optional)</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter street address"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City (Optional)</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter city"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State (Optional)</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter state"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ZIP Code (Optional)</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="India">India</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-6">Loan Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Loan Amount (₹) *</label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className={`form-input ${errors.loanAmount ? 'border-destructive' : ''}`}
                    placeholder="50000"
                    min="1000"
                    max="10000000"
                  />
                  {errors.loanAmount && (
                    <p className="text-sm text-destructive mt-1">{errors.loanAmount}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Net Weight (grams) *</label>
                    <input
                      type="number"
                      name="netWeight"
                      value={formData.netWeight}
                      onChange={handleInputChange}
                      className={`form-input ${errors.netWeight ? 'border-destructive' : ''}`}
                      placeholder="25"
                      min="1"
                      step="0.1"
                    />
                    {errors.netWeight && (
                      <p className="text-sm text-destructive mt-1">{errors.netWeight}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gross Weight (grams) *</label>
                    <input
                      type="number"
                      name="grossWeight"
                      value={formData.grossWeight}
                      onChange={handleInputChange}
                      className={`form-input ${errors.grossWeight ? 'border-destructive' : ''}`}
                      placeholder="26"
                      min="1"
                      step="0.1"
                    />
                    {errors.grossWeight && (
                      <p className="text-sm text-destructive mt-1">{errors.grossWeight}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gold Purity</label>
                  <select
                    name="goldPurity"
                    value={formData.goldPurity}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="18K">18K</option>
                    <option value="22K">22K</option>
                    <option value="24K">24K</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Interest Rate (% per annum)</label>
                  <input
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="12"
                    min="1"
                    max="30"
                    step="0.1"
                  />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Loan Term (months) *</label>
                  <select
                    name="loanTerm"
                    value={formData.loanTerm}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Account Type *</label>
                  <select
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    className={`form-input ${errors.account ? 'border-destructive' : ''}`}
                  >
                    <option value="account1">No1 Account (Tax Filing)</option>
                    <option value="account2">No2 Account (Internal)</option>
                    <option value="account3">No3 Account (Outsource)</option>
                  </select>
                  {errors.account && (
                    <p className="text-sm text-destructive mt-1">{errors.account}</p>
                  )}
                </div>
              </div>

              {/* Items Under Loan */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">Items Under Loan</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-outline-gradient text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={item.id} className="border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Item {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive-foreground text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Item Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="form-input"
                        placeholder="e.g., Gold Chain, Ring, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label">Net Weight (grams)</label>
                        <input
                          type="number"
                          value={item.netWeight}
                          onChange={(e) => updateItem(item.id, 'netWeight', e.target.value)}
                          className="form-input"
                          placeholder="25"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Gross Weight (grams)</label>
                        <input
                          type="number"
                          value={item.grossWeight}
                          onChange={(e) => updateItem(item.id, 'grossWeight', e.target.value)}
                          className="form-input"
                          placeholder="26"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Estimated Value (₹)</label>
                        <input
                          type="number"
                          value={item.estimatedValue}
                          onChange={(e) => updateItem(item.id, 'estimatedValue', e.target.value)}
                          className="form-input"
                          placeholder="Estimated value"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="form-input min-h-[80px]"
                        placeholder="Detailed description of the item"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="form-label">Item Pictures</label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleItemPictureUpload(item.id, e.target.files)}
                          className="hidden"
                          id={`item-pictures-${item.id}`}
                        />
                        <label
                          htmlFor={`item-pictures-${item.id}`}
                          className="btn-outline-gradient cursor-pointer text-sm"
                        >
                          Upload Pictures
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Upload multiple pictures of this item
                        </p>
                      </div>
                      
                      {item.pictures.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {item.pictures.map((picture, pictureIndex) => (
                            <div key={pictureIndex} className="relative">
                              <img
                                src={URL.createObjectURL(picture)}
                                alt={`Item ${index + 1} picture ${pictureIndex + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeItemPicture(item.id, pictureIndex)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Loan Summary */}
              <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-6 mt-8">
                <h3 className="font-medium text-foreground mb-4">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monthly EMI:</span>
                    <span className="float-right font-medium text-foreground">
                      ₹{formData.loanAmount && formData.loanTerm ? 
                        Math.round((parseFloat(formData.loanAmount) * (1 + parseFloat(formData.interestRate)/100)) / parseFloat(formData.loanTerm))
                        : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Interest:</span>
                    <span className="float-right font-medium text-foreground">
                      ₹{formData.loanAmount && formData.interestRate && formData.loanTerm ? 
                        Math.round((parseFloat(formData.loanAmount) * parseFloat(formData.interestRate) * parseFloat(formData.loanTerm)) / (12 * 100))
                        : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-6">Upload Documents & Signature</h2>
              
              {/* Regular Document Upload */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Supporting Documents</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <DocumentArrowUpIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
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
                    className="btn-outline-gradient cursor-pointer"
                  >
                    Select Files
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Uploaded Documents</h4>
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-foreground">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-destructive hover:text-destructive-foreground text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Application Form Signature Section */}
              <div className="border-t pt-6 space-y-6">
                <h3 className="font-medium text-foreground">Application Form Signature</h3>
                <p className="text-sm text-muted-foreground">
                  Choose one of the following options to complete your application signature:
                </p>
                
                {/* Signature Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Online Signing */}
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-foreground">Option 1: Sign Online</h4>
                    <p className="text-sm text-muted-foreground">
                      Sign digitally using your device (recommended for mobile/tablet)
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSignature(true)}
                      className="w-full btn-gradient flex items-center justify-center space-x-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Sign Online</span>
                    </button>
                    {signature && (
                      <div className="text-center">
                        <p className="text-sm text-success">✓ Signed digitally</p>
                        <img src={signature} alt="Digital Signature" className="max-h-16 mx-auto mt-2 border rounded" />
                      </div>
                    )}
                  </div>

                  {/* Download & Upload */}
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-foreground">Option 2: Download & Upload</h4>
                    <p className="text-sm text-muted-foreground">
                      Download form, print, sign manually, then upload
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowDownloadOptions(true)}
                        className="w-full btn-outline-gradient flex items-center justify-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Download Form</span>
                      </button>
                      
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleSignedDocumentUpload}
                        className="hidden"
                        id="signed-upload"
                      />
                      <label 
                        htmlFor="signed-upload"
                        className="w-full btn-outline-gradient flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <DocumentArrowUpIcon className="h-4 w-4" />
                        <span>Upload Signed Form</span>
                      </label>
                    </div>
                    
                    {signedDocuments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-success">✓ {signedDocuments.length} signed document(s) uploaded</p>
                        {signedDocuments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                            <span className="text-foreground truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSignedDocument(index)}
                              className="text-destructive hover:text-destructive-foreground ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Signature is optional. You can sign online, upload a signed form, or proceed without signing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-foreground mb-6">Review & Submit</h2>
              
              {/* Auto-approval notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Auto-Approval</h3>
                    <p className="text-sm text-green-700 mt-1">
                      This loan will be automatically approved upon submission. No manual approval required.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Form Preview for PDF/Print */}
              <div ref={formRef} data-form-preview className="card-elevated p-8 space-y-6 print:shadow-none print:border-none">
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-foreground">Gold Loan Application Form</h1>
                  <p className="text-muted-foreground">Application Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground border-b pb-2">Applicant Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground font-medium">Name:</span> {formData.applicantName}</div>
                      <div><span className="text-muted-foreground font-medium">Phone:</span> {formData.applicantPhone}</div>
                      <div><span className="text-muted-foreground font-medium">Email:</span> {formData.applicantEmail || 'Not provided'}</div>
                      <div><span className="text-muted-foreground font-medium">Address:</span> {
                        [formData.street, formData.city, formData.state, formData.zipCode].filter(Boolean).join(', ') || 'Not provided'
                      }</div>
                      <div><span className="text-muted-foreground font-medium">Country:</span> {formData.country}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground border-b pb-2">Loan Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground font-medium">Amount:</span> ₹{Number(formData.loanAmount).toLocaleString()}</div>
                      <div><span className="text-muted-foreground font-medium">Net Weight:</span> {formData.netWeight}g</div>
                      <div><span className="text-muted-foreground font-medium">Gross Weight:</span> {formData.grossWeight}g</div>
                      <div><span className="text-muted-foreground font-medium">Purity:</span> {formData.goldPurity}</div>
                      <div><span className="text-muted-foreground font-medium">Interest Rate:</span> {formData.interestRate}% per annum</div>
                      <div><span className="text-muted-foreground font-medium">Term:</span> {formData.loanTerm} months</div>
                      <div><span className="text-muted-foreground font-medium">Account:</span> {
                        formData.account === 'account1' ? 'No1 Account (Tax Filing)' :
                        formData.account === 'account2' ? 'No2 Account (Internal)' :
                        formData.account === 'account3' ? 'No3 Account (Outsource)' :
                        'Unknown'
                      }</div>
                      <div><span className="text-muted-foreground font-medium">Monthly EMI:</span> ₹{formData.loanAmount && formData.loanTerm ? 
                        Math.round((parseFloat(formData.loanAmount) * (1 + parseFloat(formData.interestRate)/100)) / parseFloat(formData.loanTerm)).toLocaleString()
                        : '0'}</div>
                      <div><span className="text-muted-foreground font-medium">Documents:</span> {documents.length} files uploaded</div>
                      <div><span className="text-muted-foreground font-medium">Items:</span> {formData.items.length} items listed</div>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-medium text-foreground">Signature</h3>
                  {signature ? (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <img src={signature} alt="Signature" className="max-h-20" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Signed on: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <p className="text-muted-foreground">No signature provided</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                {/* Download & Print Options */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Download & Print</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowDownloadOptions(true)}
                      className="w-full btn-outline-gradient flex items-center justify-center space-x-2"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>Download Options</span>
                    </button>
                    <button
                      type="button"
                      onClick={printForm}
                      className="w-full btn-outline-gradient flex items-center justify-center space-x-2"
                    >
                      <PrinterIcon className="h-4 w-4" />
                      <span>Print Form</span>
                    </button>
                  </div>
                </div>

                {/* Online Signing */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Online Signing</h4>
                  <button
                    type="button"
                    onClick={() => setShowSignature(true)}
                    className="w-full btn-outline-gradient flex items-center justify-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Sign Online</span>
                  </button>
                  {signature && (
                    <p className="text-sm text-success text-center">✓ Form signed digitally</p>
                  )}
                </div>

                {/* Upload Signed Document */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Upload Signed Form</h4>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleSignedDocumentUpload}
                      className="hidden"
                      id="signed-upload"
                    />
                    <label 
                      htmlFor="signed-upload"
                      className="w-full btn-outline-gradient flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4" />
                      <span>Upload Signed</span>
                    </label>
                    <button
                      type="button"
                      onClick={captureFromCamera}
                      className="w-full btn-outline-gradient flex items-center justify-center space-x-2"
                    >
                      <CameraIcon className="h-4 w-4" />
                      <span>Scan with Camera</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Signed Documents */}
              {signedDocuments.length > 0 && (
                <div className="space-y-3 print:hidden">
                  <h4 className="font-medium text-foreground">Uploaded Signed Documents</h4>
                  {signedDocuments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-foreground">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSignedDocument(index)}
                        className="text-destructive hover:text-destructive-foreground text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Hidden camera input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSignedDocumentUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Download Options Modal */}
          {showDownloadOptions && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium text-foreground mb-4">Download Options</h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      downloadBlankForm();
                      setShowDownloadOptions(false);
                    }}
                    className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <ArrowDownTrayIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Download Blank Form</p>
                        <p className="text-sm text-muted-foreground">Download empty form to print and sign manually</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      generatePDF();
                      setShowDownloadOptions(false);
                    }}
                    className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentArrowUpIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Download Filled Form</p>
                        <p className="text-sm text-muted-foreground">Download form with your information pre-filled</p>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    After signing the downloaded form, you can upload it back using the "Upload Signed" option.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDownloadOptions(false)}
                    className="w-full px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted/50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Signature Modal */}
          {showSignature && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium text-foreground mb-4">Sign Here</h3>
                <div className="border border-border rounded-lg">
                  <SignatureCanvas
                    ref={sigPadRef}
                    canvasProps={{
                      width: 400,
                      height: 200,
                      className: 'w-full h-48 rounded-lg'
                    }}
                    backgroundColor="rgb(255, 255, 255)"
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowSignature(false)}
                      className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveSignature}
                      className="btn-gradient"
                    >
                      Save Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={handlePrevious}
              className={`px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors ${
                currentStep === 1 ? 'invisible' : ''
              }`}
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-gradient"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanForm;