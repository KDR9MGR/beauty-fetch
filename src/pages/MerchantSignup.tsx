import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ArrowRight, ArrowLeft, Store, FileText, DollarSign, MapPin } from 'lucide-react';

interface MerchantFormData {
  // Business Information
  businessName: string;
  businessType: string;
  contactPersonFirstName: string;
  contactPersonLastName: string;
  email: string;
  phone: string;
  businessDescription: string;
  
  // Business Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Business Details
  estimatedMonthlyRevenue: string;
  previousExperience: string;
  businessLicenseNumber: string;
  taxId: string;
}

const BUSINESS_TYPES = [
  'Beauty Salon',
  'Barbershop',
  'Spa',
  'Nail Salon',
  'Makeup Studio',
  'Beauty Supply Store',
  'Wellness Center',
  'Medical Spa',
  'Other'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const MerchantSignup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState<MerchantFormData>({
    businessName: '',
    businessType: '',
    contactPersonFirstName: '',
    contactPersonLastName: '',
    email: '',
    phone: '',
    businessDescription: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    estimatedMonthlyRevenue: '',
    previousExperience: '',
    businessLicenseNumber: '',
    taxId: ''
  });

  const handleInputChange = (field: keyof MerchantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.businessType && formData.contactPersonFirstName && 
                 formData.contactPersonLastName && formData.email && formData.phone);
      case 2:
        return !!(formData.street && formData.city && formData.state && formData.zipCode);
      case 3:
        return !!(formData.businessDescription && formData.estimatedMonthlyRevenue && formData.previousExperience);
      case 4:
        return true; // Optional fields
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitApplication = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create auth user with random password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            role: 'store_owner'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      const businessAddress = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      };

      const { error: applicationError } = await supabase
        .from('merchant_applications')
        .insert({
          user_id: authData.user.id,
          business_name: formData.businessName,
          business_type: formData.businessType,
          contact_person_first_name: formData.contactPersonFirstName,
          contact_person_last_name: formData.contactPersonLastName,
          email: formData.email,
          phone: formData.phone,
          business_address: businessAddress,
          business_description: formData.businessDescription,
          estimated_monthly_revenue: parseFloat(formData.estimatedMonthlyRevenue) || null,
          previous_experience: formData.previousExperience,
          business_license_number: formData.businessLicenseNumber || null,
          tax_id: formData.taxId || null,
          status: 'pending'
        });

      if (applicationError) throw applicationError;

      // Send password reset email
      await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      toast.success('Application submitted successfully! Please check your email to set your password.');
      navigate('/');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Store className="h-12 w-12 text-beauty-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Business Information</h3>
              <p className="text-gray-600">Tell us about your business</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="contactFirstName">Contact First Name *</Label>
                <Input
                  id="contactFirstName"
                  value={formData.contactPersonFirstName}
                  onChange={(e) => handleInputChange('contactPersonFirstName', e.target.value)}
                  placeholder="First name"
                />
              </div>
              
              <div>
                <Label htmlFor="contactLastName">Contact Last Name *</Label>
                <Input
                  id="contactLastName"
                  value={formData.contactPersonLastName}
                  onChange={(e) => handleInputChange('contactPersonLastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-beauty-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Business Address</h3>
              <p className="text-gray-600">Where is your business located?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  disabled
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="h-12 w-12 text-beauty-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Business Details</h3>
              <p className="text-gray-600">Help us understand your business better</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessDescription">Business Description *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Describe your business, services offered, target customers, etc."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="estimatedRevenue">Estimated Monthly Revenue *</Label>
                <Select value={formData.estimatedMonthlyRevenue} onValueChange={(value) => handleInputChange('estimatedMonthlyRevenue', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-5000">$0 - $5,000</SelectItem>
                    <SelectItem value="5000-15000">$5,000 - $15,000</SelectItem>
                    <SelectItem value="15000-30000">$15,000 - $30,000</SelectItem>
                    <SelectItem value="30000-50000">$30,000 - $50,000</SelectItem>
                    <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                    <SelectItem value="100000+">$100,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="previousExperience">Previous Experience *</Label>
                <Textarea
                  id="previousExperience"
                  value={formData.previousExperience}
                  onChange={(e) => handleInputChange('previousExperience', e.target.value)}
                  placeholder="Tell us about your experience in the beauty industry, previous business ownership, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="h-12 w-12 text-beauty-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Legal Information</h3>
              <p className="text-gray-600">Optional but recommended</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessLicense">Business License Number</Label>
                <Input
                  id="businessLicense"
                  value={formData.businessLicenseNumber}
                  onChange={(e) => handleInputChange('businessLicenseNumber', e.target.value)}
                  placeholder="Enter your business license number"
                />
              </div>
              
              <div>
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="Enter your Tax ID or EIN"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• We'll review your application within 2-3 business days</li>
                  <li>• Our team may contact you for additional information</li>
                  <li>• Once approved, you'll receive access to your merchant dashboard</li>
                  <li>• You can start adding products and managing your store</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Become a BeautyFetch Partner</h1>
            <p className="text-lg text-gray-600">Join our platform and reach more customers</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? 'bg-beauty-purple text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < totalSteps && (
                    <div
                      className={`w-16 h-1 ${
                        step < currentStep ? 'bg-beauty-purple' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Business Info</span>
              <span className="text-xs text-gray-500">Address</span>
              <span className="text-xs text-gray-500">Details</span>
              <span className="text-xs text-gray-500">Legal</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Step {currentStep} of {totalSteps}</CardTitle>
              <CardDescription>
                Please fill out all required fields to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}
              
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep === totalSteps ? (
                  <Button
                    onClick={submitApplication}
                    disabled={loading}
                    className="bg-beauty-purple hover:bg-beauty-purple/90"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="bg-beauty-purple hover:bg-beauty-purple/90"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MerchantSignup; 