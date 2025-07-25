import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Tables } from '@/integrations/supabase/types';

// Types
export interface CartItem {
  id: string;
  product: Tables<'products'> & {
    store: Tables<'stores'>;
    images: Tables<'product_images'>[];
  };
  quantity: number;
  variant?: Tables<'product_variants'>;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  tip: number;
  total: number;
  isLoading: boolean;
}

export interface Address {
  id?: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface CartContextType {
  state: CartState;
  addToCart: (product: Tables<'products'> & { store: Tables<'stores'>; images: Tables<'product_images'>[] }, quantity?: number, variant?: Tables<'product_variants'>) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  setTip: (tip: number) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  getTotalItemCount: () => number;
  getItemByProduct: (productId: string, variantId?: string) => CartItem | undefined;
}

// Actions
type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Tables<'products'> & { store: Tables<'stores'>; images: Tables<'product_images'>[] }, quantity: number, variant?: Tables<'product_variants'> } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string; variantId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variantId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_TIP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean };

// Tax rate (8.5% for example)
const TAX_RATE = 0.085;
// Shipping rate (free over $50, otherwise $5.99)
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5.99;

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity, variant } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === product.id && 
        item.variant?.id === variant?.id
      );

      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${product.id}_${variant?.id || 'default'}`,
          product,
          quantity,
          variant,
        };
        newItems = [...state.items, newItem];
      }

      const subtotal = newItems.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const tax = subtotal * TAX_RATE;
      const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      const total = subtotal + tax + shipping + state.tip;

      return {
        ...state,
        items: newItems,
        subtotal,
        tax,
        shipping,
        total,
      };
    }

    case 'REMOVE_FROM_CART': {
      const { productId, variantId } = action.payload;
      const newItems = state.items.filter(
        item => !(item.product.id === productId && item.variant?.id === variantId)
      );

      const subtotal = newItems.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const tax = subtotal * TAX_RATE;
      const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      const total = subtotal + tax + shipping + state.tip;

      return {
        ...state,
        items: newItems,
        subtotal,
        tax,
        shipping,
        total,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity, variantId } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: { productId, variantId } });
      }

      const newItems = state.items.map(item =>
        item.product.id === productId && item.variant?.id === variantId
          ? { ...item, quantity }
          : item
      );

      const subtotal = newItems.reduce((sum, item) => {
        const price = item.variant?.price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const tax = subtotal * TAX_RATE;
      const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      const total = subtotal + tax + shipping + state.tip;

      return {
        ...state,
        items: newItems,
        subtotal,
        tax,
        shipping,
        total,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: state.tip,
      };

    case 'SET_TIP': {
      const tip = action.payload;
      const total = state.subtotal + state.tax + state.shipping + tip;
      return {
        ...state,
        tip,
        total,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

// Initial state
const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  tip: 0,
  total: 0,
  isLoading: false,
};

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [selectedAddress, setSelectedAddress] = React.useState<Address | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('beautyfetch_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        cartData.items.forEach((item: CartItem) => {
          dispatch({
            type: 'ADD_TO_CART',
            payload: {
              product: item.product,
              quantity: item.quantity,
              variant: item.variant,
            },
          });
        });
        if (cartData.tip) {
          dispatch({ type: 'SET_TIP', payload: cartData.tip });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('beautyfetch_cart', JSON.stringify({
      items: state.items,
      tip: state.tip,
    }));
  }, [state.items, state.tip]);

  const addToCart = (product: Tables<'products'> & { store: Tables<'stores'>; images: Tables<'product_images'>[] }, quantity = 1, variant?: Tables<'product_variants'>) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, quantity, variant },
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: { productId, variantId },
    });
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity, variantId },
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setTip = (tip: number) => {
    dispatch({ type: 'SET_TIP', payload: tip });
  };

  const getTotalItemCount = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemByProduct = (productId: string, variantId?: string): CartItem | undefined => {
    return state.items.find(
      item => item.product.id === productId && item.variant?.id === variantId
    );
  };

  const contextValue: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setTip,
    selectedAddress,
    setSelectedAddress,
    getTotalItemCount,
    getItemByProduct,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 