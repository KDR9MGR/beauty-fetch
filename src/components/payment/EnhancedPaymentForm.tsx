import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Smartphone,
  Wallet,
  Building2
} from 'lucide-react';
import { createPaymentIntent, formatCurrency } from '@/lib/stripe-api';

interface EnhancedPaymentFormProps {
  amount: number; // Amount in cents
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  customerEmail: string;
  loading?: boolean;
  orderDetails?: {
    orderNumber: string;
    items: any[];
    shippingAddress: any;
  };
}

export const EnhancedPaymentForm: React.FC<EnhancedPaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
  customerEmail,
  loading = false,
  orderDetails
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Create payment intent when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      try {
        console.log('Initializing payment for amount:', amount);
        const paymentIntent = await createPaymentIntent({
          amount,
          customerEmail,
          metadata: {
            orderNumber: orderDetails?.orderNumber || '',
            customerEmail
          }
        });
        
        setClientSecret(paymentIntent.client_secret);
        
        // Extract available payment methods
        const availableMethods = paymentIntent.automatic_payment_methods?.enabled 
          ? ['card', 'link', 'apple_pay', 'google_pay']
          : ['card'];
        setPaymentMethods(availableMethods);
        
        console.log('Payment intent initialized with client secret');
      } catch (err: any) {
        console.error('Failed to initialize payment:', err);
        setError(err.message || 'Failed to initialize payment');
        onError(err.message || 'Failed to initialize payment');
      }
    };

    if (amount > 0) {
      initializePayment();
    }
  }, [amount, customerEmail, orderDetails?.orderNumber, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please wait...');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log('Confirming payment...');
      
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          receipt_email: customerEmail,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        setError(confirmError.message || 'Payment failed');
        onError(confirmError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        setSucceeded(true);
        onSuccess(paymentIntent);
      } else {
        console.log('Payment status:', paymentIntent?.status);
        setError('Payment was not completed');
        onError('Payment was not completed');
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError('Payment processing failed. Please try again.');
      onError('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Payment method icons
  const getPaymentMethodIcons = () => {
    const icons = [];
    if (paymentMethods.includes('card')) {
      icons.push(<CreditCard key="card" className="h-5 w-5" />);
    }
    if (paymentMethods.includes('apple_pay')) {
      icons.push(<Smartphone key="apple" className="h-5 w-5" />);
    }
    if (paymentMethods.includes('google_pay')) {
      icons.push(<Wallet key="google" className="h-5 w-5" />);
    }
    if (paymentMethods.includes('link')) {
      icons.push(<Building2 key="link" className="h-5 w-5" />);
    }
    return icons;
  };

  if (succeeded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Payment Successful!</h3>
            <p className="text-green-700">
              Your payment of {formatCurrency(amount)} has been processed successfully.
            </p>
            <p className="text-sm text-green-600 mt-2">
              You should see this transaction in your Stripe test dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Initializing secure payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Choose Payment Method
        </CardTitle>
        <CardDescription>
          Select your preferred payment method. Your information is secure and encrypted.
        </CardDescription>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">Accepted methods:</span>
          <div className="flex gap-1">
            {getPaymentMethodIcons()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Element - This will show all available payment methods */}
          <div className="space-y-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'link']
              }}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Amount to charge:</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            {orderDetails && (
              <div className="text-xs text-gray-600">
                Order #{orderDetails.orderNumber}
              </div>
            )}
            <div className="text-xs text-green-600">
              ✓ Real Stripe transaction - will appear in your dashboard
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || processing || loading}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pay {formatCurrency(amount)}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500">
            <Lock className="h-3 w-3 inline mr-1" />
            Payment processed securely by Stripe
          </div>
        </form>

        {/* Real Payment Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Real Payment Processing</p>
              <p>This will create an actual transaction in your Stripe test account. Check your Stripe dashboard to see the payment record.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 