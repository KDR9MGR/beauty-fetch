import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { MapPin, Navigation, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Delivery {
  id: string;
  order_id: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  pickup_address: string;
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  assigned_at: string;
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  store_name: string;
  store_phone: string;
  items: {
    name: string;
    quantity: number;
  }[];
}

export const ActiveDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveDeliveries();
      // Subscribe to real-time updates
      const deliveriesSubscription = supabase
        .channel('active_deliveries')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deliveries',
            filter: `driver_id=eq.${user.id}`
          },
          () => {
            fetchActiveDeliveries();
          }
        )
        .subscribe();

      return () => {
        deliveriesSubscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchActiveDeliveries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            id,
            customer:profiles!orders_customer_id_fkey (
              first_name,
              last_name,
              phone
            ),
            store:stores (
              name,
              phone,
              address
            ),
            order_items (
              quantity,
              products (
                name
              )
            )
          )
        `)
        .eq('driver_id', user.id)
        .not('status', 'eq', 'delivered')
        .not('status', 'eq', 'failed')
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      // Format the data
      const formattedDeliveries: Delivery[] = data.map(delivery => ({
        id: delivery.id,
        order_id: delivery.orders.id,
        status: delivery.status,
        pickup_address: delivery.orders.store.address,
        delivery_address: delivery.delivery_address,
        customer_name: `${delivery.orders.customer.first_name} ${delivery.orders.customer.last_name}`,
        customer_phone: delivery.orders.customer.phone,
        assigned_at: delivery.assigned_at,
        estimated_delivery_time: delivery.estimated_delivery_time,
        actual_delivery_time: delivery.actual_delivery_time,
        store_name: delivery.orders.store.name,
        store_phone: delivery.orders.store.phone,
        items: delivery.orders.order_items.map(item => ({
          name: item.products.name,
          quantity: item.quantity
        }))
      }));

      setDeliveries(formattedDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: Delivery['status']) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          status: newStatus,
          ...(newStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {})
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success(`Delivery ${newStatus} successfully`);
      fetchActiveDeliveries();
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const getStatusBadgeColor = (status: Delivery['status']) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: Delivery['status']) => {
    switch (currentStatus) {
      case 'assigned': return 'picked_up';
      case 'picked_up': return 'in_transit';
      case 'in_transit': return 'delivered';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">No Active Deliveries</p>
          <p className="text-sm text-gray-500">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((delivery) => (
        <Card key={delivery.id} className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${
            delivery.status === 'assigned' ? 'bg-yellow-500' :
            delivery.status === 'picked_up' ? 'bg-blue-500' :
            delivery.status === 'in_transit' ? 'bg-purple-500' :
            'bg-green-500'
          }`} />
          
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Order #{delivery.order_id}</CardTitle>
                <CardDescription>
                  Assigned {new Date(delivery.assigned_at).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(delivery.status)}>
                {delivery.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Store Info */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <p className="font-medium text-gray-900">{delivery.store_name}</p>
                <p className="text-sm text-gray-600">{delivery.pickup_address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${delivery.store_phone}`} className="text-sm text-blue-600 hover:underline">
                    {delivery.store_phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Navigation className="h-5 w-5 text-gray-500 mt-1" />
              <div>
                <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                <p className="text-sm text-gray-600">{delivery.delivery_address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${delivery.customer_phone}`} className="text-sm text-blue-600 hover:underline">
                    {delivery.customer_phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mt-4">
              <p className="font-medium text-sm text-gray-700 mb-2">Order Items:</p>
              <ul className="space-y-1">
                {delivery.items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Estimated delivery by {new Date(delivery.estimated_delivery_time).toLocaleTimeString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  // Open in Google Maps
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.delivery_address)}`,
                    '_blank'
                  );
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </Button>

              {getNextStatus(delivery.status) && (
                <Button
                  onClick={() => updateDeliveryStatus(delivery.id, getNextStatus(delivery.status)!)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as {getNextStatus(delivery.status)?.replace('_', ' ')}
                </Button>
              )}

              {delivery.status !== 'failed' && (
                <Button
                  variant="destructive"
                  onClick={() => updateDeliveryStatus(delivery.id, 'failed')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Failed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 