import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';

interface ProfilePaymentProps {
  user: User;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardBrand?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  holderName?: string;
  email?: string;
  isDefault: boolean;
}

export const ProfilePayment: React.FC<ProfilePaymentProps> = ({ user }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      cardBrand: 'Visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '25',
      holderName: 'John Doe',
      isDefault: true
    },
    {
      id: '2',
      type: 'paypal',
      email: 'john.doe@example.com',
      isDefault: false
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    isDefault: false
  });

  const handleAdd = () => {
    setFormData({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      holderName: '',
      isDefault: false
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.cvv || !formData.holderName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // In a real app, you'd send this to a secure payment processor
    const newPaymentMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      cardBrand: getCardBrand(formData.cardNumber),
      last4: formData.cardNumber.slice(-4),
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
      holderName: formData.holderName,
      isDefault: formData.isDefault
    };

    if (formData.isDefault) {
      setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: false })));
    }

    setPaymentMethods(prev => [...prev, newPaymentMethod]);
    toast.success('Payment method added successfully');
    setIsDialogOpen(false);
  };

  const handleDelete = (paymentId: string) => {
    const paymentToDelete = paymentMethods.find(pm => pm.id === paymentId);
    if (paymentToDelete?.isDefault) {
      toast.error('Cannot delete default payment method');
      return;
    }

    setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentId));
    toast.success('Payment method deleted successfully');
  };

  const handleSetDefault = (paymentId: string) => {
    setPaymentMethods(prev => prev.map(pm => ({
      ...pm,
      isDefault: pm.id === paymentId
    })));
    toast.success('Default payment method updated');
  };

  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    return 'Card';
  };

  const getCardIcon = (brand: string) => {
    // In a real app, you'd use actual card brand icons
    return <CreditCard className="h-6 w-6" />;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a new card for secure payments
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        cardNumber: formatCardNumber(e.target.value) 
                      }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryMonth">Month *</Label>
                      <Input
                        id="expiryMonth"
                        value={formData.expiryMonth}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                        placeholder="MM"
                        maxLength={2}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="expiryYear">Year *</Label>
                      <Input
                        id="expiryYear"
                        value={formData.expiryYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryYear: e.target.value }))}
                        placeholder="YY"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      type="password"
                      value={formData.cvv}
                      onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value }))}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="holderName">Cardholder Name *</Label>
                    <Input
                      id="holderName"
                      value={formData.holderName}
                      onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault" className="text-sm">
                      Set as default payment method
                    </Label>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Your payment information is encrypted and securely stored. We never store your CVV.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Add Card
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className={`relative ${method.isDefault ? 'ring-2 ring-beauty-purple' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                    {getCardIcon(method.cardBrand || '')}
                  </div>
                  
                  <div>
                    {method.type === 'card' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{method.cardBrand}</h3>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-beauty-purple">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          •••• •••• •••• {method.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {method.expiryMonth}/{method.expiryYear} • {method.holderName}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold capitalize">{method.type.replace('_', ' ')}</h3>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-beauty-purple">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{method.email}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {!method.isDefault && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set Default
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment methods saved</h3>
            <p className="text-gray-600 mb-6">Add a payment method for faster checkout</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Payments</h3>
              <p className="text-sm text-gray-600">
                Your payment information is protected with bank-level encryption. We partner with trusted payment processors to ensure your data is always secure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 