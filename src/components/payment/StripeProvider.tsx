import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
  amount?: number;
  clientSecret?: string;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ 
  children, 
  amount,
  clientSecret 
}) => {
  // Enhanced options for multiple payment methods
  const options = {
    mode: 'payment' as const,
    amount: amount || 1000, // Default to $10.00 if no amount provided
    currency: 'usd',
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#8b5cf6', // Beauty purple color
        colorBackground: '#ffffff',
        colorText: '#424770',
        colorDanger: '#df1b41',
        colorSuccess: '#059669',
        borderRadius: '8px',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        spacingUnit: '4px',
        fontSizeBase: '16px',
      },
      rules: {
        '.Tab': {
          border: '1px solid #E4E5E7',
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02)',
          borderRadius: '8px',
          padding: '12px 16px',
        },
        '.Tab:hover': {
          color: '#8b5cf6',
          borderColor: '#D1C4E9',
        },
        '.Tab--selected': {
          borderColor: '#8b5cf6',
          backgroundColor: '#F3F4F6',
          color: '#8b5cf6',
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02), 0 0 0 2px rgba(139, 92, 246, 0.2)',
        },
        '.Input': {
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #E4E5E7',
        },
        '.Input:focus': {
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02), 0 0 0 2px rgba(139, 92, 246, 0.3)',
          borderColor: '#8b5cf6',
        },
        '.Input--invalid': {
          borderColor: '#df1b41',
        },
        '.TabIcon': {
          color: '#6B7280',
        },
        '.TabIcon--selected': {
          color: '#8b5cf6',
        },
        '.Text': {
          color: '#374151',
        },
        '.Text--redirect': {
          color: '#8b5cf6',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}; 