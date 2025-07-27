import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, X, ShoppingBag, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const Cart = () => {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number, variantId?: string) => {
    if (newQuantity < 1) {
      removeFromCart(productId, variantId);
      return;
    }
    updateQuantity(productId, newQuantity, variantId);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  if (state.items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
              <Button asChild>
                <Link to="/stores">Browse Stores</Link>
              </Button>
            </div>
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
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <Button 
              variant="outline" 
              onClick={handleClearCart}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Items ({state.items.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {state.items.map((item) => {
                    const price = item.variant?.price || item.product.price;
                    const imageSrc = Array.isArray(item.product.images) && item.product.images.length > 0 
                      ? item.product.images[0] 
                      : '/placeholder.svg';
                    
                    return (
                      <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={typeof imageSrc === 'string' ? imageSrc : '/placeholder.svg'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg line-clamp-1">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {item.product.store.name}
                              </p>
                              {item.variant && (
                                <p className="text-sm text-gray-500">
                                  {item.variant.title}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 border rounded-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(
                                    item.product.id, 
                                    item.quantity - 1, 
                                    item.variant?.id
                                  )}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(
                                    item.product.id,
                                    parseInt(e.target.value) || 1,
                                    item.variant?.id
                                  )}
                                  className="w-16 text-center border-0 p-0"
                                  min="1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(
                                    item.product.id,
                                    item.quantity + 1,
                                    item.variant?.id
                                  )}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${(price * item.quantity).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                ${price.toFixed(2)} each
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${state.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${state.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Shipping:
                      </span>
                      <span>
                        {state.shipping === 0 ? (
                          <span className="text-green-600 font-medium">Free</span>
                        ) : (
                          `$${state.shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {state.shipping > 0 && state.subtotal < 50 && (
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        Add ${(50 - state.subtotal).toFixed(2)} more for free shipping!
                      </div>
                    )}
                    {state.tip > 0 && (
                      <div className="flex justify-between">
                        <span>Tip:</span>
                        <span>${state.tip.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>${state.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <Button asChild className="w-full" size="lg">
                      <Link to="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/stores">
                        Continue Shopping
                      </Link>
                    </Button>
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

export default Cart; 