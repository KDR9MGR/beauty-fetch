import React, { useState } from 'react';
import { 
  CardElement, 
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
  Loader2
} from 'lucide-react';

interface StripePaymentFormProps {
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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
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
  const [saveCard, setSaveCard] = useState(false);

  // Future: Apple Pay / Google Pay can be added here

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: customerEmail,
          address: orderDetails?.shippingAddress ? {
            line1: orderDetails.shippingAddress.address_line_1,
            line2: orderDetails.shippingAddress.address_line_2,
            city: orderDetails.shippingAddress.city,
            state: orderDetails.shippingAddress.state,
            postal_code: orderDetails.shippingAddress.postal_code,
            country: 'US',
          } : undefined,
        },
      });

      if (createError) {
        setError(createError.message || 'Failed to create payment method');
        setProcessing(false);
        return;
      }

      // For demo purposes, we'll simulate a successful payment
      // In a real implementation, you would:
      // 1. Send payment details to your backend
      // 2. Create a payment intent on your server
      // 3. Confirm the payment with the client secret
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      const mockPaymentIntent = {
        id: `pi_${Date.now()}`,
        amount: amount,
        currency: 'usd',
        status: 'succeeded',
        payment_method: paymentMethod.id,
        created: Math.floor(Date.now() / 1000),
        customer_email: customerEmail,
      };

      setSucceeded(true);
      onSuccess(mockPaymentIntent);

    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Payment Successful!</h3>
            <p className="text-green-700">
              Your payment of ${(amount / 100).toFixed(2)} has been processed successfully.
            </p>
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
          Payment Information
        </CardTitle>
        <CardDescription>
          Enter your payment details below. Your information is secure and encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Element */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
            <div className="border rounded-md p-3 bg-white">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          {/* Save Card Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveCard"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="saveCard" className="text-sm text-gray-700">
              Save payment method for future purchases
            </label>
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
              <span className="font-medium">${(amount / 100).toFixed(2)}</span>
            </div>
            {orderDetails && (
              <div className="text-xs text-gray-600">
                Order #{orderDetails.orderNumber}
              </div>
            )}
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
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pay ${(amount / 100).toFixed(2)}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500">
            <Lock className="h-3 w-3 inline mr-1" />
            Your payment information is encrypted and secure
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 