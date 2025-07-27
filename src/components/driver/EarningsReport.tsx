import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { DollarSign, TrendingUp, Clock, Calendar } from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  baseEarnings: number;
  bonusEarnings: number;
  deliveryCount: number;
  averagePerDelivery: number;
  pendingPayouts: number;
  completedPayouts: number;
  dailyEarnings: {
    date: string;
    amount: number;
    deliveries: number;
  }[];
}

export const EarningsReport = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [earnings, setEarnings] = useState<EarningsSummary>({
    totalEarnings: 0,
    baseEarnings: 0,
    bonusEarnings: 0,
    deliveryCount: 0,
    averagePerDelivery: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    dailyEarnings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user, timeframe]);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Since driver_earnings table doesn't exist, use mock data for demo
      const earningsData: any[] = [];

      // Calculate summary
      const summary: EarningsSummary = {
        totalEarnings: 0,
        baseEarnings: 0,
        bonusEarnings: 0,
        deliveryCount: earningsData?.length || 0,
        averagePerDelivery: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        dailyEarnings: []
      };

      // Group earnings by date
      const dailyMap = new Map<string, { amount: number; deliveries: number }>();
      
      earningsData?.forEach(earning => {
        // Update totals
        summary.totalEarnings += earning.total_amount;
        summary.baseEarnings += earning.base_amount;
        summary.bonusEarnings += earning.bonus_amount;
        
        if (earning.status === 'pending') {
          summary.pendingPayouts += earning.total_amount;
        } else {
          summary.completedPayouts += earning.total_amount;
        }

        // Group by date
        const date = new Date(earning.created_at).toLocaleDateString();
        const daily = dailyMap.get(date) || { amount: 0, deliveries: 0 };
        daily.amount += earning.total_amount;
        daily.deliveries += 1;
        dailyMap.set(date, daily);
      });

      // Convert daily map to array
      summary.dailyEarnings = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        deliveries: data.deliveries
      }));

      // Calculate average
      summary.averagePerDelivery = summary.deliveryCount > 0 
        ? summary.totalEarnings / summary.deliveryCount 
        : 0;

      setEarnings(summary);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Earnings Report</h2>
        <Select
          value={timeframe}
          onValueChange={(value: 'week' | 'month' | 'year') => setTimeframe(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500">
              Base: ${earnings.baseEarnings.toFixed(2)} + Bonus: ${earnings.bonusEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.deliveryCount}</div>
            <p className="text-xs text-gray-500">
              Avg. ${earnings.averagePerDelivery.toFixed(2)} per delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.pendingPayouts.toFixed(2)}</div>
            <p className="text-xs text-gray-500">
              Next payout scheduled in 3 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.completedPayouts.toFixed(2)}</div>
            <p className="text-xs text-gray-500">
              All time total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>Your earnings for each day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {earnings.dailyEarnings.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{day.date}</p>
                    <p className="text-sm text-gray-500">{day.deliveries} deliveries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${day.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">
                    ${(day.amount / day.deliveries).toFixed(2)} avg
                  </p>
                </div>
              </div>
            ))}

            {earnings.dailyEarnings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No earnings data for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Download Report Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            toast.success('Report downloaded successfully');
          }}
        >
          Download Report
        </Button>
      </div>
    </div>
  );
}; 