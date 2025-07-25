import { loadStripe } from '@stripe/stripe-js';
import { env } from '@/utils/env';

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  currency: 'usd',
  country: 'US',
};

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

// Stripe API base URL
export const STRIPE_API_URL = 'https://api.stripe.com/v1'; 