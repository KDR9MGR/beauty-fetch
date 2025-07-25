import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, TrendingDown, Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

export const MerchantAnalytics = () => {
  const { userStore } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    monthlyRevenue: 0,
    monthlyOrders: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userStore) {
      fetchAnalytics();
    }
  }, [userStore]);

  const fetchAnalytics = async () => {
    if (!userStore) return;

    try {
      // Fetch order items for this store
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(total_amount, created_at, status),
          products(name)
        `)
        .eq('store_id', userStore.id);

      if (error) throw error;

      // Calculate analytics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Filter completed orders only
      const completedOrders = orderItems?.filter(item => 
        item.orders.status === 'delivered'
      ) || [];

      // Current month data
      const currentMonthOrders = completedOrders.filter(item => {
        const orderDate = new Date(item.orders.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });

      // Last month data
      const lastMonthOrders = completedOrders.filter(item => {
        const orderDate = new Date(item.orders.created_at);
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
      });

      // Calculate totals
      const totalRevenue = completedOrders.reduce((sum, item) => sum + item.total, 0);
      const uniqueOrders = [...new Set(completedOrders.map(item => item.order_id))];
      const totalOrders = uniqueOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const monthlyRevenue = currentMonthOrders.reduce((sum, item) => sum + item.total, 0);
      const monthlyOrdersUnique = [...new Set(currentMonthOrders.map(item => item.order_id))];
      const monthlyOrdersCount = monthlyOrdersUnique.length;

      const lastMonthRevenue = lastMonthOrders.reduce((sum, item) => sum + item.total, 0);
      const lastMonthOrdersUnique = [...new Set(lastMonthOrders.map(item => item.order_id))];
      const lastMonthOrdersCount = lastMonthOrdersUnique.length;

      // Calculate growth
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
        : monthlyRevenue > 0 ? 100 : 0;

      const ordersGrowth = lastMonthOrdersCount > 0
        ? ((monthlyOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount * 100)
        : monthlyOrdersCount > 0 ? 100 : 0;

      // Calculate top products
      const productSales = completedOrders.reduce((acc, item) => {
        const productName = item.products?.name || 'Unknown Product';
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        acc[productName].quantity += item.quantity;
        acc[productName].revenue += item.total;
        return acc;
      }, {} as any);

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        monthlyRevenue,
        monthlyOrders: monthlyOrdersCount,
        revenueGrowth,
        ordersGrowth,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-1">
              {analytics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.revenueGrowth).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <div className="flex items-center gap-1 mt-1">
              {analytics.ordersGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${analytics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.ordersGrowth).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per completed order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{analytics.monthlyOrders} orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Performing Products
          </CardTitle>
          <CardDescription>
            Your best selling products by revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales data</h3>
              <p className="text-gray-600">Sales data will appear here once you start receiving orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.topProducts.map((product: any, index) => (
                <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-beauty-purple text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${product.revenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Revenue Trend</h4>
              <p className="text-2xl font-bold text-beauty-purple">
                ${analytics.monthlyRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">this month</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Order Volume</h4>
              <p className="text-2xl font-bold text-beauty-purple">
                {analytics.monthlyOrders}
              </p>
              <p className="text-sm text-gray-600">orders this month</p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              {analytics.revenueGrowth >= 0 && analytics.ordersGrowth >= 0 && (
                <span className="text-green-600">📈 Your store is performing well with positive growth!</span>
              )}
              {analytics.revenueGrowth < 0 && analytics.ordersGrowth < 0 && (
                <span className="text-orange-600">📊 Consider reviewing your marketing strategy to boost sales.</span>
              )}
              {analytics.totalOrders === 0 && (
                <span className="text-gray-600">🚀 Start promoting your store to get your first sales!</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 