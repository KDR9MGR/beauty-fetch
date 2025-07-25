import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DriverRoute } from '@/components/ProtectedRoute';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { ActiveDeliveries } from '@/components/driver/ActiveDeliveries';
import { DeliveryHistory } from '@/components/driver/DeliveryHistory';
import { EarningsReport } from '@/components/driver/EarningsReport';
import { RouteMap } from '@/components/driver/RouteMap';

const DriverDashboard = () => {
  return (
    <DriverRoute>
      <div className="min-h-screen bg-gray-50">
        <DriverHeader />
        
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active Deliveries</TabsTrigger>
              <TabsTrigger value="map">Route Map</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <ActiveDeliveries />
            </TabsContent>

            <TabsContent value="map">
              <RouteMap />
            </TabsContent>

            <TabsContent value="history">
              <DeliveryHistory />
            </TabsContent>

            <TabsContent value="earnings">
              <EarningsReport />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DriverRoute>
  );
};

export default DriverDashboard; 