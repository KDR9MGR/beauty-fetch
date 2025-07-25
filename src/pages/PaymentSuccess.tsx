import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Package, 
  MapPin, 
  CreditCard, 
  Clock,
  ArrowRight,
  Home,
  Download
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

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
  paymentIntentId?: string;
  timestamp: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order data from session storage
    const savedOrder = sessionStorage.getItem('currentOrder');
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        setOrderData(order);
      } catch (error) {
        console.error('Error parsing order data:', error);
        toast.error('Order data not found');
        navigate('/');
      }
    } else {
      toast.error('No order data found');
      navigate('/');
    }
    setLoading(false);
  }, [navigate]);

  const handleContinueShopping = () => {
    // Clear the order data and navigate to home
    sessionStorage.removeItem('currentOrder');
    navigate('/');
  };

  const handleTrackOrder = () => {
    if (orderData) {
      navigate(`/track-order?orderNumber=${orderData.orderNumber}`);
    }
  };

  const downloadReceipt = () => {
    if (!orderData) return;
    
    // Create a simple text receipt
    const receiptText = `
BEAUTYFETCH RECEIPT
==================

Order #: ${orderData.orderNumber}
Date: ${new Date(orderData.timestamp).toLocaleDateString()}
Email: ${orderData.email}

ITEMS ORDERED:
${orderData.items.map(item => 
  `${item.product.name} x${item.quantity} - $${((item.variant?.price || item.product.price) * item.quantity).toFixed(2)}`
).join('\n')}

DELIVERY ADDRESS:
${orderData.address.first_name} ${orderData.address.last_name}
${orderData.address.address_line_1}
${orderData.address.address_line_2 ? orderData.address.address_line_2 + '\n' : ''}${orderData.address.city}, ${orderData.address.state} ${orderData.address.postal_code}

PAYMENT SUMMARY:
Subtotal: $${orderData.subtotal.toFixed(2)}
Tax: $${orderData.tax.toFixed(2)}
Shipping: $${orderData.shipping.toFixed(2)}
Tip: $${orderData.tip.toFixed(2)}
Total: $${orderData.total.toFixed(2)}

Payment ID: ${orderData.paymentIntentId || 'N/A'}

Thank you for your order!
    `;

    // Create and download the file
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beautyfetch-receipt-${orderData.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Receipt downloaded!');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Order not found</h2>
            <p className="text-gray-600 mb-6">We couldn't find your order details.</p>
            <Button onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-lg text-gray-600">
              Your order has been confirmed and will be processed shortly.
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Order #{orderData.orderNumber}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {orderData.items.map((item, index) => {
                    const price = item.variant?.price || item.product.price;
                    return (
                      <div key={index} className="flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.product.store.name} • Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">${(price * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${orderData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${orderData.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${orderData.shipping.toFixed(2)}</span>
                  </div>
                  {orderData.tip > 0 && (
                    <div className="flex justify-between">
                      <span>Tip:</span>
                      <span>${orderData.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total:</span>
                    <span>${orderData.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery & Payment Info */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="font-medium">
                      {orderData.address.first_name} {orderData.address.last_name}
                    </p>
                    <p>{orderData.address.address_line_1}</p>
                    {orderData.address.address_line_2 && (
                      <p>{orderData.address.address_line_2}</p>
                    )}
                    <p>
                      {orderData.address.city}, {orderData.address.state} {orderData.address.postal_code}
                    </p>
                    {orderData.address.phone && (
                      <p>{orderData.address.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span>Credit Card</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary" className="text-green-600">Paid</Badge>
                    </div>
                    {orderData.paymentIntentId && (
                      <div className="flex justify-between">
                        <span>Transaction ID:</span>
                        <span className="font-mono text-xs">{orderData.paymentIntentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(orderData.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    What's Next?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Order Confirmation</p>
                        <p className="text-gray-600">You'll receive an email confirmation shortly</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Order Processing</p>
                        <p className="text-gray-600">We'll prepare your items for delivery</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Out for Delivery</p>
                        <p className="text-gray-600">Track your order in real-time</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleTrackOrder} className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Track Your Order
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={downloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" onClick={handleContinueShopping}>
              <Home className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>

          {/* Customer Support */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Need help? Contact our customer support at{' '}
              <a href="mailto:support@beautyfetch.com" className="text-purple-600 hover:underline">
                support@beautyfetch.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess; 