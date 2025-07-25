import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StripeProvider } from '@/components/payment/StripeProvider';
import { EnhancedPaymentForm } from '@/components/payment/EnhancedPaymentForm';
import { toast } from '@/components/ui/sonner';

const TestPayment = () => {
  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    toast.success(`Payment successful! ID: ${paymentIntent.id}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    toast.error(`Payment failed: ${error}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Stripe Payment</h1>
            <p className="text-lg text-gray-600">
              Test the Stripe payment integration with test card numbers.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Test Card Numbers:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Visa:</strong> 4242 4242 4242 4242</p>
              <p><strong>Visa (debit):</strong> 4000 0566 5566 5556</p>
              <p><strong>Mastercard:</strong> 5555 5555 5555 4444</p>
              <p><strong>American Express:</strong> 3782 822463 10005</p>
              <p><strong>Declined:</strong> 4000 0000 0000 0002</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Use any future expiry date, any 3-digit CVC, and any ZIP code.
            </p>
          </div>

          <StripeProvider amount={2500}>
            <EnhancedPaymentForm
              amount={2500} // $25.00
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              customerEmail="test@example.com"
              orderDetails={{
                orderNumber: "TEST123",
                items: [
                  {
                    product: { name: "Test Product" },
                    quantity: 1
                  }
                ],
                shippingAddress: {
                  address_line_1: "123 Test St",
                  city: "Test City",
                  state: "CA",
                  postal_code: "90210"
                }
              }}
            />
          </StripeProvider>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestPayment; 