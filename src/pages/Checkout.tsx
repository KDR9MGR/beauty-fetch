import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart, Address } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, CreditCard, Truck, Star, ArrowLeft, User } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { StripeProvider } from '@/components/payment/StripeProvider';
import { EnhancedPaymentForm } from '@/components/payment/EnhancedPaymentForm';

const Checkout = () => {
  const navigate = useNavigate();
  const { state, selectedAddress, setSelectedAddress, setTip, clearCart } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');
  const [addressForm, setAddressForm] = useState<Address>({
    first_name: '',
    last_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [selectedTipType, setSelectedTipType] = useState<'percentage' | 'custom'>('percentage');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Auto-fill user information when logged in
  useEffect(() => {
    if (user && profile) {
      console.log('Auto-filling user information:', { user, profile });
      setEmail(user.email || '');
      
      // Pre-fill address form with profile data if available
      if (profile.first_name || profile.last_name) {
        setAddressForm(prev => ({
          ...prev,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || ''
        }));
      }
    }
  }, [user, profile]);

  // Tip percentages
  const tipPercentages = [10, 15, 18, 20];

  const handleTipSelection = (percentage: number) => {
    const tip = (state.subtotal * percentage) / 100;
    setTipAmount(tip);
    setTip(tip);
    setSelectedTipType('percentage');
  };

  const handleCustomTip = (amount: number) => {
    setTipAmount(amount);
    setTip(amount);
    setSelectedTipType('custom');
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    setPaymentCompleted(true);
    setPaymentIntentId(paymentIntent.id);
    toast.success('Payment processed successfully!');
    setCurrentStep('review');
    // Auto-proceed to place order after payment success
    setTimeout(() => {
      handlePlaceOrder();
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    toast.error(`Payment failed: ${error}`);
  };

  const validateAddress = (): boolean => {
    const required = ['first_name', 'last_name', 'address_line_1', 'city', 'state', 'postal_code'];
    for (const field of required) {
      if (!addressForm[field as keyof Address]) {
        toast.error(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }
    
    // Email validation (only for guest users)
    if (!user) {
      if (!email) {
        toast.error('Please enter your email address');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      
      // Password validation if creating account
      if (createAccount && (!password || password.length < 6)) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }
    }
    
    // Basic postal code validation for US
    const postalCodeRegex = /^\d{5}(-\d{4})?$/;
    if (!postalCodeRegex.test(addressForm.postal_code)) {
      toast.error('Please enter a valid ZIP code');
      return false;
    }

    // Basic phone validation
    if (addressForm.phone && !/^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(addressForm.phone)) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleAddressSubmit = () => {
    if (validateAddress()) {
      setSelectedAddress(addressForm);
      setCurrentStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      // Generate order details
      const orderNumber = `BF${Date.now().toString().slice(-6)}`;
      const orderData = {
        orderNumber,
        email: user?.email || email, // Use logged-in user's email or guest email
        userId: user?.id || null, // Include user ID if logged in
        items: state.items,
        address: addressForm,
        subtotal: state.subtotal,
        tax: state.tax,
        shipping: state.shipping,
        tip: state.tip,
        total: state.total,
        createAccount: user ? false : createAccount, // No account creation for logged-in users
        timestamp: new Date().toISOString(),
        paymentStatus: paymentCompleted ? 'paid' : 'pending',
        paymentIntentId: paymentIntentId,
        paymentMethod: 'stripe'
      };

      // Save order to localStorage for guest tracking (still useful for logged-in users as backup)
      const existingOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('guestOrders', JSON.stringify(existingOrders));

      // Save current order for order confirmation page
      sessionStorage.setItem('currentOrder', JSON.stringify(orderData));

      // TODO: Save order to database if user is logged in
      if (user) {
        console.log('Saving order for logged-in user:', user.id);
        // Here you would typically save to the orders table in Supabase
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart and show success
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/payment-success');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <Button onClick={() => navigate('/stores')}>Continue Shopping</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/cart')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {profile?.first_name || user.email}!
                </p>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[
                { key: 'address', label: 'Address', icon: MapPin },
                { key: 'payment', label: 'Payment', icon: CreditCard },
                { key: 'review', label: 'Review', icon: Star },
              ].map(({ key, label, icon: Icon }, index) => (
                <div key={key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === key || (index === 0 && currentStep === 'address') || 
                    (index === 1 && ['payment', 'review'].includes(currentStep)) || 
                    (index === 2 && currentStep === 'review')
                      ? 'bg-beauty-purple border-beauty-purple text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 ${
                    currentStep === key ? 'text-beauty-purple font-semibold' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                  {index < 2 && <div className="w-16 h-px bg-gray-300 ml-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address Step */}
              {currentStep === 'address' && (
                <>
                  {/* Contact Information - Only show for guest users */}
                  {!user && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="createAccount" 
                            checked={createAccount}
                            onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                          />
                          <Label htmlFor="createAccount" className="text-sm">
                            Create an account for faster checkout next time
                          </Label>
                        </div>
                        
                        {createAccount && (
                          <div>
                            <Label htmlFor="password">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Minimum 6 characters"
                              required
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Address Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Delivery Address
                        {user && (
                          <Badge variant="secondary" className="ml-2">
                            {user.email}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First Name *</Label>
                          <Input
                            id="first_name"
                            value={addressForm.first_name}
                            onChange={(e) => setAddressForm({...addressForm, first_name: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name *</Label>
                          <Input
                            id="last_name"
                            value={addressForm.last_name}
                            onChange={(e) => setAddressForm({...addressForm, last_name: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="address_line_1">Street Address *</Label>
                        <Input
                          id="address_line_1"
                          value={addressForm.address_line_1}
                          onChange={(e) => setAddressForm({...addressForm, address_line_1: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="address_line_2">Apartment, Suite, etc. (Optional)</Label>
                        <Input
                          id="address_line_2"
                          value={addressForm.address_line_2}
                          onChange={(e) => setAddressForm({...addressForm, address_line_2: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            placeholder="CA"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="postal_code">ZIP Code *</Label>
                          <Input
                            id="postal_code"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})}
                            placeholder="12345"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      
                      <Button onClick={handleAddressSubmit} className="w-full" size="lg">
                        Continue to Payment
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Payment Step */}
              {currentStep === 'payment' && (
                <div className="space-y-6">
                  {/* Tip Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Add a Tip (Optional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {tipPercentages.map((percentage) => (
                          <Button
                            key={percentage}
                            variant={selectedTipType === 'percentage' && tipAmount === (state.subtotal * percentage) / 100 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTipSelection(percentage)}
                          >
                            {percentage}%
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Custom amount"
                          step="0.01"
                          min="0"
                          onChange={(e) => {
                            const amount = parseFloat(e.target.value) || 0;
                            handleCustomTip(amount);
                          }}
                        />
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setTipAmount(0);
                            setTip(0);
                          }}
                        >
                          No Tip
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Stripe Payment Form */}
                  <StripeProvider amount={Math.round(state.total * 100)}>
                    <EnhancedPaymentForm
                      amount={Math.round(state.total * 100)}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      customerEmail={user?.email || email}
                      loading={isLoading}
                      orderDetails={{
                        orderNumber: `BF${Date.now().toString().slice(-6)}`,
                        items: state.items,
                        shippingAddress: addressForm
                      }}
                    />
                  </StripeProvider>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact & Address Summary */}
                    <div>
                      <h3 className="font-semibold mb-2">Contact & Delivery Information</h3>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <p className="font-medium">
                          {user?.email || email}
                          {user && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Logged In
                            </Badge>
                          )}
                        </p>
                        <Separator className="my-2" />
                        <p>{selectedAddress?.first_name} {selectedAddress?.last_name}</p>
                        <p>{selectedAddress?.address_line_1}</p>
                        {selectedAddress?.address_line_2 && <p>{selectedAddress?.address_line_2}</p>}
                        <p>{selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postal_code}</p>
                        {selectedAddress?.phone && <p>{selectedAddress?.phone}</p>}
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div>
                      <h3 className="font-semibold mb-2">Order Items</h3>
                      <div className="space-y-2">
                        {state.items.map((item) => {
                          const price = item.variant?.price || item.product.price;
                          return (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product.name} x{item.quantity}</span>
                              <span>${(price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment Status */}
                    {paymentCompleted && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CreditCard className="h-5 w-5" />
                          <span className="font-medium">Payment Successful</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Payment ID: {paymentIntentId}
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handlePlaceOrder} 
                      className="w-full" 
                      size="lg"
                      disabled={isLoading || !paymentCompleted}
                    >
                      {isLoading ? 'Placing Order...' : paymentCompleted ? `Complete Order - $${state.total.toFixed(2)}` : 'Complete Payment First'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {state.items.map((item) => {
                      const price = item.variant?.price || item.product.price;
                      const imageSrc = Array.isArray(item.product.images) && item.product.images.length > 0 
                        ? item.product.images[0] 
                        : "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80";
                      
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative">
                            <img
                              src={typeof imageSrc === 'string' ? imageSrc : '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {item.quantity}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">{item.product.store.name}</p>
                            <p className="text-sm font-medium">${(price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${state.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${state.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>
                        {state.shipping === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `$${state.shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {state.tip > 0 && (
                      <div className="flex justify-between">
                        <span>Tip:</span>
                        <span>${state.tip.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total:</span>
                      <span>${state.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout; 