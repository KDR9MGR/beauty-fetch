import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { MapPin, Clock, DollarSign, Star } from 'lucide-react';

interface DeliveryHistoryItem {
  id: string;
  order_id: string;
  status: 'delivered' | 'failed';
  pickup_address: any;
  delivery_address: any;
  assigned_at: string;
  actual_delivery_time: string;
  store_name: string;
  customer_name: string;
  earnings: {
    base_amount: number;
    bonus_amount: number;
    total_amount: number;
  };
  rating?: {
    rating: number;
    feedback: string | null;
  };
}

export const DeliveryHistory = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDeliveryHistory();
    }
  }, [user]);

  const fetchDeliveryHistory = async () => {
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
              last_name
            ),
            store:stores (
              name
            )
          ),
          driver_earnings (
            base_amount,
            bonus_amount,
            total_amount
          ),
          delivery_ratings (
            rating,
            feedback
          )
        `)
        .eq('driver_id', user.id)
        .in('status', ['delivered', 'failed'])
        .order('actual_delivery_time', { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedDeliveries: DeliveryHistoryItem[] = data.map(delivery => ({
        id: delivery.id,
        order_id: delivery.orders.id,
        status: delivery.status,
        pickup_address: delivery.pickup_address,
        delivery_address: delivery.delivery_address,
        assigned_at: delivery.assigned_at,
        actual_delivery_time: delivery.actual_delivery_time,
        store_name: delivery.orders.store.name,
        customer_name: `${delivery.orders.customer.first_name} ${delivery.orders.customer.last_name}`,
        earnings: delivery.driver_earnings?.[0] || { base_amount: 0, bonus_amount: 0, total_amount: 0 },
        rating: delivery.delivery_ratings?.[0]
      }));

      setDeliveries(formattedDeliveries);

      // Calculate total earnings
      const total = formattedDeliveries.reduce((sum, delivery) => 
        sum + (delivery.earnings?.total_amount || 0), 0);
      setTotalEarnings(total);

      // Calculate average rating
      const ratings = formattedDeliveries
        .filter(d => d.rating?.rating)
        .map(d => d.rating!.rating);
      const avg = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
      setAverageRating(avg);

    } catch (error) {
      console.error('Error fetching delivery history:', error);
      toast.error('Failed to fetch delivery history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: 'delivered' | 'failed') => {
    return status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">No Delivery History</p>
          <p className="text-sm text-gray-500">Your completed deliveries will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
            <p className="text-xs text-gray-500">
              {deliveries.filter(d => d.status === 'delivered').length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500">
              Average ${(totalEarnings / deliveries.length).toFixed(2)} per delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex items-center text-xs text-gray-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery History List */}
      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{delivery.order_id}</CardTitle>
                  <CardDescription>
                    {new Date(delivery.actual_delivery_time).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge className={getStatusBadgeColor(delivery.status)}>
                  {delivery.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Locations */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium">{delivery.store_name}</p>
                      <p className="text-xs text-gray-500">{delivery.pickup_address.formatted_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium">{delivery.customer_name}</p>
                      <p className="text-xs text-gray-500">{delivery.delivery_address.formatted_address}</p>
                    </div>
                  </div>
                </div>

                {/* Earnings & Rating */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        ${delivery.earnings.total_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Base: ${delivery.earnings.base_amount.toFixed(2)} + 
                        Bonus: ${delivery.earnings.bonus_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {delivery.rating && (
                    <div className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < delivery.rating!.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {delivery.rating.feedback && (
                          <p className="text-xs text-gray-500 mt-1">
                            "{delivery.rating.feedback}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 