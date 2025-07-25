import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Clock, 
  Settings, 
  RefreshCw,
  Star,
  Store
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { DeliveryFeeDisplay } from '@/components/DeliveryFeeDisplay';
import { calculateDeliveryFee } from '@/lib/hybridLocationService';

export const LocationDemoPage: React.FC = () => {
  const { 
    userLocation, 
    nearbyStores, 
    setShowLocationModal, 
    clearLocation, 
    refreshNearbyStores,
    getServiceStatus
  } = useLocation();

  const [mockCartTotal, setMockCartTotal] = useState(25.99);
  const serviceStatus = getServiceStatus();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🌍 Location Features Demo</h1>
        <p className="text-gray-600">
          Test all location-based features with mock data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Location Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLocation ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Address:</span>
                  <Badge variant="outline">
                    {userLocation.address || 'GPS Location'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coordinates:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowLocationModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={refreshNearbyStores}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={clearLocation}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No location set</p>
                <Button onClick={() => setShowLocationModal(true)}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Set Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Fee Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Fee Calculator
            </CardTitle>
            <CardDescription>
              Test delivery fees with different cart totals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mock Cart Total:</label>
              <div className="flex gap-2">
                {[15.99, 25.99, 35.99, 55.99].map(amount => (
                  <Button
                    key={amount}
                    size="sm"
                    variant={mockCartTotal === amount ? "default" : "outline"}
                    onClick={() => setMockCartTotal(amount)}
                    className="text-xs"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <DeliveryFeeDisplay 
              cartTotal={mockCartTotal}
              className="bg-gray-50 p-3 rounded-lg"
            />
          </CardContent>
        </Card>

        {/* Nearby Stores */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Nearby Stores ({nearbyStores.length})
            </CardTitle>
            <CardDescription>
              Stores within 25 miles of your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nearbyStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearbyStores.slice(0, 4).map((store, index) => {
                  const deliveryFee = calculateDeliveryFee(store.distance!);
                  const isClosest = index === 0;
                  
                  return (
                    <div 
                      key={store.id}
                      className={`p-4 border rounded-lg ${isClosest ? 'border-beauty-purple bg-purple-50' : 'border-gray-200'}`}
                    >
                      {isClosest && (
                        <Badge className="mb-2 bg-beauty-purple">
                          Closest Store
                        </Badge>
                      )}
                      
                      <h4 className="font-semibold mb-1">{store.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{store.address}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Navigation className="h-3 w-3 text-beauty-purple" />
                            <span>Distance:</span>
                          </div>
                          <span className="font-medium">{store.distance} miles</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-green-600" />
                            <span>Delivery:</span>
                          </div>
                          <span className="font-medium text-green-700">
                            ${deliveryFee.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>Est. Time:</span>
                          </div>
                          <span className="font-medium">
                            {store.distance! <= 5 ? '20-30 min' : 
                             store.distance! <= 15 ? '30-45 min' : '45-60 min'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {userLocation ? 
                    'No stores found within 25 miles' : 
                    'Set your location to find nearby stores'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>🚀 Production Location Service Status</CardTitle>
            <CardDescription>
              Current status of Google Maps integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-3 border rounded-lg ${serviceStatus.hasApiKey ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${serviceStatus.hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium text-sm">API Key</span>
                </div>
                <p className="text-xs">{serviceStatus.hasApiKey ? '✅ Configured' : '❌ Missing'}</p>
              </div>

              <div className={`p-3 border rounded-lg ${serviceStatus.isGoogleMapsConfigured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${serviceStatus.isGoogleMapsConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="font-medium text-sm">Configuration</span>
                </div>
                <p className="text-xs">{serviceStatus.isGoogleMapsConfigured ? '✅ Production' : '🧪 Development'}</p>
              </div>

              <div className={`p-3 border rounded-lg ${serviceStatus.usingRealGPS ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${serviceStatus.usingRealGPS ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <span className="font-medium text-sm">GPS</span>
                </div>
                <p className="text-xs">{serviceStatus.usingRealGPS ? '✅ Real GPS' : '🧪 Mock GPS'}</p>
              </div>

              <div className={`p-3 border rounded-lg ${serviceStatus.usingMockData ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${serviceStatus.usingMockData ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                  <span className="font-medium text-sm">Data Source</span>
                </div>
                <p className="text-xs">{serviceStatus.usingMockData ? '🧪 Demo Data' : '✅ Real Data'}</p>
              </div>
            </div>

            {serviceStatus.usingRealGPS ? (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">🎉 Production Ready!</h4>
                <p className="text-sm text-green-800">
                  Google Maps is active and working. Your users will get real GPS location and accurate delivery calculations.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🧪 Demo Mode Active</h4>
                <p className="text-sm text-blue-800">
                  Using demo data for testing. {serviceStatus.hasApiKey ? 'Google Maps API is configured but may need billing enabled.' : 'Add your Google Maps API key to enable production features.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 