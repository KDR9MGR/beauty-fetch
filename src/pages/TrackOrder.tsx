import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  ArrowLeft,
  MapPin,
  Clock,
  AlertTriangle,
  Star
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { FeedbackModal } from '@/components/FeedbackModal';

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

const TrackOrder = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [foundOrder, setFoundOrder] = useState<OrderData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    // Check if we have tracking data from order confirmation
    const trackingEmail = sessionStorage.getItem('trackingEmail');
    const trackingOrderNumber = sessionStorage.getItem('trackingOrderNumber');
    
    if (trackingEmail && trackingOrderNumber) {
      setEmail(trackingEmail);
      setOrderNumber(trackingOrderNumber);
      // Auto-search for the order
      handleSearch(trackingEmail, trackingOrderNumber);
      
      // Clear the session storage
      sessionStorage.removeItem('trackingEmail');
      sessionStorage.removeItem('trackingOrderNumber');
    }
  }, []);

  const handleSearch = async (searchEmail?: string, searchOrderNumber?: string) => {
    const emailToSearch = searchEmail || email;
    const orderToSearch = searchOrderNumber || orderNumber;
    
    if (!emailToSearch || !orderToSearch) {
      toast.error('Please enter both email and order number');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Search in localStorage for guest orders
      const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
      const order = guestOrders.find((o: OrderData) => 
        o.email.toLowerCase() === emailToSearch.toLowerCase() && 
        o.orderNumber === orderToSearch
      );
      
      if (order) {
        setFoundOrder(order);
        toast.success('Order found!');
      } else {
        setFoundOrder(null);
        toast.error('Order not found. Please check your email and order number.');
      }
    } catch (error) {
      toast.error('Failed to search for order. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getOrderStatus = (timestamp: string) => {
    const orderDate = new Date(timestamp);
    const now = new Date();
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder < 1) return { status: 'processing', step: 1 };
    if (daysSinceOrder < 2) return { status: 'shipped', step: 2 };
    if (daysSinceOrder < 4) return { status: 'delivered', step: 3 };
    return { status: 'delivered', step: 3 };
  };

  const getEstimatedDelivery = (timestamp: string) => {
    const deliveryDate = new Date(new Date(timestamp).getTime() + 3 * 24 * 60 * 60 * 1000);
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Track Your Order</h1>
            </div>

            {/* Search Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter the email used for your order"
                    disabled={isSearching}
                  />
                </div>
                
                <div>
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g., BF123456"
                    disabled={isSearching}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSearch()} 
                  className="w-full" 
                  size="lg"
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Track Order'}
                </Button>
              </CardContent>
            </Card>

            {/* Order Not Found Message */}
            {hasSearched && !foundOrder && !isSearching && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Order not found. Please double-check your email address and order number. 
                  If you continue to have issues, please contact our support team.
                </AlertDescription>
              </Alert>
            )}

            {/* Order Details */}
            {foundOrder && (
              <>
                {/* Order Status */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Order Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="font-semibold">Order #{foundOrder.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(foundOrder.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${foundOrder.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{foundOrder.items.length} items</p>
                        </div>
                      </div>

                      {/* Progress Steps */}
                      <div className="space-y-4">
                        {[
                          { 
                            icon: Package, 
                            label: 'Processing', 
                            description: 'Order confirmed and being prepared',
                            step: 1
                          },
                          { 
                            icon: Truck, 
                            label: 'Shipped', 
                            description: 'Package is on its way to you',
                            step: 2
                          },
                          { 
                            icon: CheckCircle, 
                            label: 'Delivered', 
                            description: 'Package has been delivered',
                            step: 3
                          },
                        ].map(({ icon: Icon, label, description, step }) => {
                          const currentStatus = getOrderStatus(foundOrder.timestamp);
                          const isActive = step <= currentStatus.step;
                          const isCurrent = step === currentStatus.step;
                          
                          return (
                            <div key={step} className={`flex items-start gap-4 p-4 rounded-lg border ${
                              isCurrent ? 'bg-beauty-purple/5 border-beauty-purple' : 
                              isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className={`p-2 rounded-full ${
                                isCurrent ? 'bg-beauty-purple text-white' :
                                isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-semibold ${
                                  isCurrent ? 'text-beauty-purple' : 
                                  isActive ? 'text-green-700' : 'text-gray-600'
                                }`}>
                                  {label}
                                  {isCurrent && (
                                    <span className="ml-2 text-sm font-normal">
                                      (Current Status)
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">{description}</p>
                              </div>
                              {step === currentStatus.step && (
                                <div className="text-right">
                                  <Clock className="h-4 w-4 text-beauty-purple" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Estimated Delivery */}
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          <p className="font-semibold text-blue-900">
                            {getOrderStatus(foundOrder.timestamp).step >= 3 ? 'Delivered' : 'Estimated Delivery'}
                          </p>
                        </div>
                        <p className="text-blue-800">{getEstimatedDelivery(foundOrder.timestamp)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Address */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Delivery Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p className="font-medium">{foundOrder.address.first_name} {foundOrder.address.last_name}</p>
                      <p>{foundOrder.address.address_line_1}</p>
                      {foundOrder.address.address_line_2 && <p>{foundOrder.address.address_line_2}</p>}
                      <p>{foundOrder.address.city}, {foundOrder.address.state} {foundOrder.address.postal_code}</p>
                      {foundOrder.address.phone && <p>{foundOrder.address.phone}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {foundOrder.items.map((item) => {
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
                                <span className="text-sm">Qty: {item.quantity}</span>
                                <span className="font-medium">${(price * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback Section - Show only if delivered */}
                {getOrderStatus(foundOrder.timestamp).step >= 3 && (
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">How was your experience?</h3>
                        <p className="text-gray-600 mb-4">
                          Your feedback helps us improve our service and helps other customers make better choices.
                        </p>
                        <Button onClick={() => setShowFeedbackModal(true)} className="w-full sm:w-auto">
                          <Star className="h-4 w-4 mr-2" />
                          Leave Feedback & Rating
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate('/stores')} className="flex-1">
                    Continue Shopping
                  </Button>
                  <Button variant="outline" onClick={() => window.print()} className="flex-1">
                    Print Details
                  </Button>
                </div>
              </>
            )}

            {/* Help Section */}
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Having trouble finding your order?</p>
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
      
      {/* Feedback Modal */}
      {foundOrder && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          orderNumber={foundOrder.orderNumber}
          driverName="Sarah Johnson" // In real app, this would come from order data
          storeName={foundOrder.items[0]?.product?.store?.name}
        />
      )}
    </div>
  );
};

export default TrackOrder; 