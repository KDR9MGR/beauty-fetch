import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MerchantRoute } from '@/components/ProtectedRoute';
import { MerchantHeader } from '@/components/merchant/MerchantHeader';
import { MerchantStoreSettings } from '@/components/merchant/MerchantStoreSettings';
import { MerchantProducts } from '@/components/merchant/MerchantProducts';
import { MerchantOrders } from '@/components/merchant/MerchantOrders';
import { MerchantInventory } from '@/components/merchant/MerchantInventory';
import { MerchantMessages } from '@/components/merchant/MerchantMessages';
import { MerchantAnalytics } from '@/components/merchant/MerchantAnalytics';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  MessageCircle, 
  BarChart3, 
  Settings,
  Clock,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';

const MerchantDashboard = () => {
  const { user, userStore, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalOrders: 0,
    unreadMessages: 0,
    pendingUpdates: 0,
    monthlyRevenue: 0,
    monthlyOrders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !userStore) {
      navigate('/merchant/setup');
    } else if (userStore) {
      fetchDashboardStats();
    }
  }, [loading, userStore, navigate]);

  const fetchDashboardStats = async () => {
    if (!userStore) return;
    
    try {
      setLoadingStats(true);
      
      // Fetch products stats
      const { data: productsData } = await supabase
        .from('products')
        .select('id, status')
        .eq('store_id', userStore.id);
      
      // Fetch orders stats
      const { data: ordersData } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          orders!inner(status, created_at, total_amount)
        `)
        .eq('store_id', userStore.id);
      
      // Fetch unread messages
      const { data: messagesData } = await supabase
        .from('merchant_messages')
        .select('id')
        .eq('recipient_id', user?.id)
        .eq('is_read', false);
      
      // Fetch pending updates
      const { data: updatesData } = await supabase
        .from('merchant_store_updates')
        .select('id')
        .eq('store_id', userStore.id)
        .eq('status', 'pending');

      // Calculate stats
      const totalProducts = productsData?.length || 0;
      const activeProducts = productsData?.filter(p => p.status === 'active').length || 0;
      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(o => o.orders.status === 'pending').length || 0;
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrdersData = ordersData?.filter(o => {
        const orderDate = new Date(o.orders.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }) || [];
      
      const monthlyRevenue = monthlyOrdersData.reduce((sum, order) => sum + order.orders.total_amount, 0);
      
      setStats({
        totalProducts,
        activeProducts,
        pendingOrders,
        totalOrders,
        unreadMessages: messagesData?.length || 0,
        pendingUpdates: updatesData?.length || 0,
        monthlyRevenue,
        monthlyOrders: monthlyOrdersData.length
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !userStore) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  return (
    <MerchantRoute>
      <div className="flex flex-col min-h-screen">
        <MerchantHeader />
        
        <main className="flex-grow bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {userStore.name}!
              </h1>
              <p className="text-gray-600">Manage your store and track your business performance</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="store">Store Settings</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loadingStats ? '-' : stats.totalProducts}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.activeProducts} active
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loadingStats ? '-' : stats.pendingOrders}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalOrders} total orders
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${loadingStats ? '-' : stats.monthlyRevenue.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.monthlyOrders} orders this month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loadingStats ? '-' : stats.unreadMessages}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingUpdates} pending updates
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks to manage your store</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Package className="h-6 w-6" />
                        Add Product
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Settings className="h-6 w-6" />
                        Update Store Info
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Clock className="h-6 w-6" />
                        Manage Hours
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates and notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.pendingOrders > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-900">
                              {stats.pendingOrders} pending orders need attention
                            </p>
                            <p className="text-sm text-orange-700">
                              Review and process new orders
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {stats.unreadMessages > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">
                              {stats.unreadMessages} unread messages
                            </p>
                            <p className="text-sm text-blue-700">
                              Check your messages from admin
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {stats.pendingUpdates > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-900">
                              {stats.pendingUpdates} updates pending approval
                            </p>
                            <p className="text-sm text-yellow-700">
                              Your store updates are being reviewed
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {stats.pendingOrders === 0 && stats.unreadMessages === 0 && stats.pendingUpdates === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          All caught up! No pending items.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="store">
                <MerchantStoreSettings />
              </TabsContent>

              <TabsContent value="products">
                <MerchantProducts />
              </TabsContent>

              <TabsContent value="inventory">
                <MerchantInventory />
              </TabsContent>

              <TabsContent value="orders">
                <MerchantOrders />
              </TabsContent>

              <TabsContent value="messages">
                <MerchantMessages />
              </TabsContent>

              <TabsContent value="analytics">
                <MerchantAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </MerchantRoute>
  );
};

export default MerchantDashboard; 