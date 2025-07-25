import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Truck, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface ProfileOrdersProps {
  user: User;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  itemCount: number;
  items: Array<{
    name: string;
    image: string;
    quantity: number;
    price: number;
  }>;
}

export const ProfileOrders: React.FC<ProfileOrdersProps> = ({ user }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      // Load orders from localStorage (guest orders) and future database integration
      const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
      const userOrders = guestOrders.filter((order: any) => 
        order.userId === user.id || order.email === user.email
      );

      // Transform guest orders to match our interface
      const transformedOrders: OrderItem[] = userOrders.map((order: any) => ({
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        date: order.timestamp,
        status: getOrderStatus(order.timestamp),
        total: order.total,
        itemCount: order.items.length,
        items: order.items.map((item: any) => ({
          name: item.product.name,
          image: item.product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100',
          quantity: item.quantity,
          price: item.variant?.price || item.product.price
        }))
      }));

      // Add some mock orders for demonstration
      const mockOrders: OrderItem[] = [
        {
          id: 'BF001234',
          orderNumber: 'BF001234',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'delivered',
          total: 89.99,
          itemCount: 3,
          items: [
            { name: 'Luxury Face Cream', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100', quantity: 1, price: 45.99 },
            { name: 'Vitamin C Serum', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=100', quantity: 2, price: 22.00 }
          ]
        },
        {
          id: 'BF001235',
          orderNumber: 'BF001235',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'shipped',
          total: 156.50,
          itemCount: 5,
          items: [
            { name: 'Makeup Palette', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=100', quantity: 1, price: 89.99 },
            { name: 'Lip Gloss Set', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100', quantity: 4, price: 16.63 }
          ]
        }
      ];

      const allOrders = [...transformedOrders, ...mockOrders];
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = (timestamp: string): OrderItem['status'] => {
    const orderDate = new Date(timestamp);
    const now = new Date();
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder < 1) return 'processing';
    if (daysSinceOrder < 3) return 'shipped';
    return 'delivered';
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and track your orders</CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start shopping to see your orders here'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/stores">
                <Button>Start Shopping</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                      <Badge className={`${getStatusColor(order.status)} capitalize`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Placed on {formatDate(order.date)}</p>
                      <p>{order.itemCount} item{order.itemCount > 1 ? 's' : ''} • ${order.total.toFixed(2)}</p>
                    </div>

                    {/* Order Items Preview */}
                    <div className="flex gap-2 mt-3">
                      {order.items.slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs font-medium text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/track-order?order=${order.orderNumber}&email=${user.email}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                    </Link>
                    
                    {order.status === 'delivered' && (
                      <Button size="sm">
                        Reorder
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination would go here for real data */}
      {filteredOrders.length > 0 && (
        <Card>
          <CardContent className="p-4 text-center text-gray-600">
            Showing {filteredOrders.length} order{filteredOrders.length > 1 ? 's' : ''}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 