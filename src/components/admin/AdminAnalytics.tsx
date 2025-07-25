import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Store, 
  ShoppingCart, 
  DollarSign,
  Package,
  Truck,
  Star,
  Calendar
} from 'lucide-react';
import { addDays, format, subDays } from 'date-fns';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalStores: number;
  revenueGrowth: number;
  ordersGrowth: number;
  usersGrowth: number;
  storesGrowth: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface ChartData {
  name: string;
  revenue: number;
  orders: number;
  users: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export const AdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalStores: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    usersGrowth: 0,
    storesGrowth: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch real data from Supabase
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*');

      const { data: allStores } = await supabase
        .from('stores')
        .select('*');

      const { data: allOrders } = await supabase
        .from('orders')
        .select('*');

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalUsers = allUsers?.length || 0;
      const totalStores = allStores?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth (comparing to previous period)
      const previousPeriodStart = subDays(dateRange.from, 
        Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      );
      
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', dateRange.from.toISOString());

      const { data: previousUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', dateRange.from.toISOString());

      const { data: previousStores } = await supabase
        .from('stores')
        .select('*')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', dateRange.from.toISOString());

      const previousRevenue = previousOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const previousOrderCount = previousOrders?.length || 0;
      const previousUserCount = previousUsers?.length || 0;
      const previousStoreCount = previousStores?.length || 0;

      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const ordersGrowth = previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0;
      const usersGrowth = previousUserCount > 0 ? ((users?.length || 0) / previousUserCount) * 100 : 0;
      const storesGrowth = previousStoreCount > 0 ? ((stores?.length || 0) / previousStoreCount) * 100 : 0;

      // Generate chart data
      const days = [];
      const dayDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < dayDiff; i++) {
        const date = addDays(dateRange.from, i);
        const dayOrders = orders?.filter(order => 
          new Date(order.created_at!).toDateString() === date.toDateString()
        ) || [];
        const dayUsers = users?.filter(user => 
          new Date(user.created_at!).toDateString() === date.toDateString()
        ) || [];
        
        days.push({
          name: format(date, 'MMM dd'),
          revenue: dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          orders: dayOrders.length,
          users: dayUsers.length,
        });
      }

      // Generate category data (mock for now)
      const categories = [
        { name: 'Skincare', value: 35, color: '#8884d8' },
        { name: 'Makeup', value: 30, color: '#82ca9d' },
        { name: 'Haircare', value: 20, color: '#ffc658' },
        { name: 'Fragrance', value: 15, color: '#ff7c7c' },
      ];

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalStores,
        revenueGrowth,
        ordersGrowth,
        usersGrowth,
        storesGrowth,
        averageOrderValue,
        conversionRate: 3.2, // This would need to be calculated based on visitor data
      });

      setChartData(days);
      setCategoryData(categories);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, growth, formatter = (v: number) => v.toLocaleString() }: {
    title: string;
    value: number;
    icon: any;
    growth?: number;
    formatter?: (value: number) => string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{formatter(value)}</p>
            {growth !== undefined && (
              <div className="flex items-center mt-1">
                {growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(growth).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-100 rounded-full">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time business performance metrics</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={analyticsData.totalRevenue}
          icon={DollarSign}
          growth={analyticsData.revenueGrowth}
          formatter={(v) => `$${v.toLocaleString()}`}
        />
        <StatCard
          title="Total Orders"
          value={analyticsData.totalOrders}
          icon={ShoppingCart}
          growth={analyticsData.ordersGrowth}
        />
        <StatCard
          title="Total Users"
          value={analyticsData.totalUsers}
          icon={Users}
          growth={analyticsData.usersGrowth}
        />
        <StatCard
          title="Active Stores"
          value={analyticsData.totalStores}
          icon={Store}
          growth={analyticsData.storesGrowth}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Average Order Value"
          value={analyticsData.averageOrderValue}
          icon={Package}
          formatter={(v) => `$${v.toFixed(2)}`}
        />
        <StatCard
          title="Conversion Rate"
          value={analyticsData.conversionRate}
          icon={TrendingUp}
          formatter={(v) => `${v.toFixed(1)}%`}
        />
        <StatCard
          title="Customer Satisfaction"
          value={4.8}
          icon={Star}
          formatter={(v) => `${v.toFixed(1)}/5`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${value}` : value, 
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'New Users']} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#ffc658"
                strokeWidth={2}
                dot={{ fill: '#ffc658' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">New order placed</p>
                <p className="text-sm text-gray-600">Order #12345 - $89.99</p>
              </div>
              <span className="text-sm text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Store className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">New store registered</p>
                <p className="text-sm text-gray-600">Beauty Essentials Store</p>
              </div>
              <span className="text-sm text-gray-500">15 minutes ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium">New user registration</p>
                <p className="text-sm text-gray-600">sarah.johnson@email.com</p>
              </div>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 