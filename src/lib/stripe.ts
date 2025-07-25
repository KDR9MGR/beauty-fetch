import { loadStripe } from '@stripe/stripe-js';

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: 'pk_test_51RVhJt017qClUCQA8TYx3fegzMd3Kc4ePHOJDJpRKXrJNvo96spLbjzgZAJlggflMDJ0n1aSFQ8duvUcMxZqaInF004t3ZYCj9',
  secretKey: 'sk_test_51RVhJt017qClUCQAGjeqrzaEoA2nH07LaDGgXSlYjxR7w2vNVMzG9bJN4pDNlMeUpVtbeZDbbeCI2pM98s9kotYl00Rbs2ivQd',
  currency: 'usd',
  country: 'US',
};

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

// Stripe API base URL
export const STRIPE_API_URL = 'https://api.stripe.com/v1'; 