import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Package, Truck, CreditCard, Search } from 'lucide-react';

interface OrderData {
  orderNumber: string;
  email: string;
  items: any[];
  address: any;
  subtotal: number;
  tax: number;
  shipping: number;
  tip: number;
  total: number;
  createAccount: boolean;
  timestamp: string;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [trackingEmail, setTrackingEmail] = useState('');

  useEffect(() => {
    // Get current order from sessionStorage
    const currentOrderData = sessionStorage.getItem('currentOrder');
    if (currentOrderData) {
      const order = JSON.parse(currentOrderData);
      setOrderData(order);
      setTrackingEmail(order.email);
    }
  }, []);

  const handleTrackOrder = () => {
    if (trackingEmail && orderData) {
      // Store the tracking email and redirect to order tracking
      sessionStorage.setItem('trackingEmail', trackingEmail);
      sessionStorage.setItem('trackingOrderNumber', orderData.orderNumber);
      navigate('/track-order');
    }
  };

  if (!orderData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Order not found</h2>
            <p className="text-gray-600 mb-6">We couldn't find your order information.</p>
            <Button onClick={() => navigate('/stores')}>Continue Shopping</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const estimatedDelivery = new Date(new Date(orderData.timestamp).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-600">
                Thank you for your purchase. Your order has been successfully placed.
              </p>
              {orderData.createAccount && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Account creation request received. You'll receive setup instructions via email.
                </p>
              )}
            </div>

            {/* Order Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Order Number</p>
                    <p className="text-gray-600">#{orderData.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Order Date</p>
                    <p className="text-gray-600">{new Date(orderData.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Package className="h-8 w-8 text-beauty-purple" />
                    <div>
                      <p className="font-semibold text-sm">Processing</p>
                      <p className="text-xs text-gray-600">Order is being prepared</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg opacity-50">
                    <Truck className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm">Shipped</p>
                      <p className="text-xs text-gray-600">On the way to you</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg opacity-50">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm">Delivered</p>
                      <p className="text-xs text-gray-600">Order completed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Estimated Delivery</p>
                  </div>
                  <p className="text-blue-800">{estimatedDelivery}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    We'll send you tracking information once your order ships.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderData.items.map((item) => {
                    const price = item.variant?.price || item.product.price;
                    const primaryImage = item.product.images?.find((img: any) => img.is_primary) || item.product.images?.[0];
                    
                    return (
                      <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                        <img
                          src={primaryImage?.image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">{item.product.store.name}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm">Quantity: {item.quantity}</span>
                            <span className="font-medium">${(price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${orderData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${orderData.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>{orderData.shipping === 0 ? 'Free' : `$${orderData.shipping.toFixed(2)}`}</span>
                  </div>
                  {orderData.tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tip:</span>
                      <span>${orderData.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total:</span>
                    <span>${orderData.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Track Your Order */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Track Your Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Use your email address and order number to track your order anytime:
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="trackingEmail">Email Address</Label>
                    <Input
                      id="trackingEmail"
                      type="email"
                      value={trackingEmail}
                      onChange={(e) => setTrackingEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <Button onClick={handleTrackOrder} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Track Order #{orderData.orderNumber}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>What happens next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-beauty-purple text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">Order Confirmation</p>
                      <p className="text-sm text-gray-600">You'll receive an email confirmation shortly.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">Order Processing</p>
                      <p className="text-sm text-gray-600">We'll prepare your items for shipment.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">Shipping Notification</p>
                      <p className="text-sm text-gray-600">Track your package with the provided tracking number.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" asChild className="w-full">
                <Link to="/stores">
                  Continue Shopping
                </Link>
              </Button>
              
              <Button onClick={handleTrackOrder} className="w-full">
                Track This Order
              </Button>
            </div>

            {/* Support */}
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Need help with your order?</p>
              <p>
                Contact our support team at{' '}
                <a href="mailto:support@beautyfetch.com" className="text-beauty-purple hover:underline">
                  support@beautyfetch.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation; 