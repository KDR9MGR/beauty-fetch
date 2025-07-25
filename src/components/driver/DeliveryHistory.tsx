import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, MapPin, Star } from 'lucide-react';

export const DeliveryHistory = () => {

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delivery History
          </CardTitle>
          <CardDescription>
            View your past delivery history and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No delivery history</h3>
            <p className="text-gray-600">Your completed deliveries will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 