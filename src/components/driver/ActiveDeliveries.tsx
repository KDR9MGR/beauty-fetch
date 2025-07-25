import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock, Package } from 'lucide-react';

export const ActiveDeliveries = () => {

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Deliveries
          </CardTitle>
          <CardDescription>
            Manage your current delivery assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deliveries</h3>
            <p className="text-gray-600">Your active deliveries will appear here when assigned</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 