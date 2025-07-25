import { STRIPE_CONFIG } from './stripe';

// Interface for payment intent creation
interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

// Client-side payment intent creation (for demo purposes)
// Note: In production, this should be done on your backend for security
export const createPaymentIntent = async ({
  amount,
  currency = 'usd',
  customerEmail,
  metadata = {}
}: CreatePaymentIntentParams) => {
  try {
    console.log('Creating payment intent for amount:', amount);
    
    // Warning: This exposes the secret key on the frontend
    // In production, move this to your backend API
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_CONFIG.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency,
        receipt_email: customerEmail || '',
        'metadata[orderNumber]': metadata.orderNumber || '',
        'metadata[customerEmail]': customerEmail || '',
        'automatic_payment_methods[enabled]': 'true',
        'automatic_payment_methods[allow_redirects]': 'never',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create payment intent');
    }

    const paymentIntent = await response.json();
    console.log('Payment intent created:', paymentIntent.id);
    
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Function to retrieve payment intent
export const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRIPE_CONFIG.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to retrieve payment intent');
    }

    const paymentIntent = await response.json();
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

// Payment method types supported
export const SUPPORTED_PAYMENT_METHODS = [
  'card',
  'link',
  'apple_pay',
  'google_pay',
  'klarna',
  'afterpay_clearpay',
  'us_bank_account'
];

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}; 