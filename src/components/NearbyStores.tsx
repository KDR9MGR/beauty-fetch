import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Truck, Star, Clock, Store } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { calculateDeliveryFee, getLocationServiceStatus } from '@/lib/hybridLocationService';

export const NearbyStores: React.FC = () => {
  const { 
    userLocation, 
    nearbyStores, 
    setShowLocationModal, 
    getDeliveryFee,
    getDistanceToStore 
  } = useLocation();

  const serviceStatus = getLocationServiceStatus();

  if (!userLocation) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Find Stores Near You</h2>
          <p className="text-gray-600 mb-6">
            Set your location to discover nearby beauty stores and get accurate delivery estimates.
          </p>
          <Button onClick={() => setShowLocationModal(true)}>
            <MapPin className="h-4 w-4 mr-2" />
            Set Your Location
          </Button>
        </div>
      </div>
    );
  }

  if (nearbyStores.length === 0) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Stores Found</h2>
            <p className="text-gray-600 mb-6">
              Sorry, we don't have any stores within 25 miles of your location yet.
            </p>
            <div className="space-x-4">
              <Button onClick={() => setShowLocationModal(true)} variant="outline">
                Change Location
              </Button>
              <Link to="/stores">
                <Button>View All Stores</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-6 w-6 text-beauty-purple" />
            <h2 className="text-3xl font-bold">Stores Near You</h2>
            {serviceStatus.currentMode === 'demo' && (
              <Badge variant="outline" className="ml-2">Demo Data</Badge>
            )}
          </div>
          <p className="text-gray-600">
            {userLocation.address ? (
              <>Found {nearbyStores.length} stores near {userLocation.address}</>
            ) : (
              <>Found {nearbyStores.length} stores within 25 miles</>
            )}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowLocationModal(true)}
              className="text-beauty-purple hover:text-beauty-purple/80"
            >
              <Navigation className="h-4 w-4 mr-1" />
              Change location
            </Button>
            {serviceStatus.currentMode === 'demo' && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Using demo data - real GPS unavailable
              </div>
            )}
          </div>
        </div>

        {/* Stores Grid */}
        {nearbyStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyStores.map((store, index) => {
              const distance = getDistanceToStore(store.id);
              const deliveryFee = getDeliveryFee(distance || 0);
              const isClosest = index === 0;
              
              return (
                <Card key={store.id} className={`transition-all hover:shadow-lg ${isClosest ? 'ring-2 ring-beauty-purple' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-beauty-purple" />
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                      </div>
                      {isClosest && (
                        <Badge className="bg-beauty-purple text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Closest
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span>{store.address}</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Distance and Delivery Info */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Navigation className="h-4 w-4" />
                        <span>{distance?.toFixed(1)} miles away</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-beauty-purple">
                          ${deliveryFee.toFixed(2)} delivery
                        </div>
                        <div className="text-xs text-gray-500">
                          Est. 30-45 min
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Store className="h-4 w-4 mr-1" />
                        View Store
                      </Button>
                      <Button size="sm" className="flex-1 bg-beauty-purple hover:bg-beauty-purple/90">
                        <MapPin className="h-4 w-4 mr-1" />
                        Shop Now
                      </Button>
                    </div>

                    {/* Store Features */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      <Badge variant="secondary" className="text-xs">Same-day delivery</Badge>
                      <Badge variant="secondary" className="text-xs">In-store pickup</Badge>
                      {serviceStatus.features.realDistanceMatrix && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Real-time distance
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No stores found nearby</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any stores within 25 miles of your location.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowLocationModal(true)}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Try Different Location
            </Button>
          </div>
        )}

        {/* Service Status Info */}
        {serviceStatus.currentMode === 'demo' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Demo Mode Active</h4>
            </div>
            <p className="text-blue-700 text-sm">
              Currently showing demo stores and estimated distances. 
              {!serviceStatus.hasApiKey && " Google Maps API key needed for real location data."}
              {serviceStatus.hasApiKey && " Google Maps temporarily unavailable."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 