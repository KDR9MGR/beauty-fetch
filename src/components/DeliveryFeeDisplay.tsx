import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, MapPin, Info, Clock } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { calculateDeliveryFee } from '@/lib/hybridLocationService';

interface DeliveryFeeDisplayProps {
  storeId?: string; // Optional: calculate fee for a specific store
  cartTotal: number;
  className?: string;
}

export const DeliveryFeeDisplay: React.FC<DeliveryFeeDisplayProps> = ({ 
  storeId, 
  cartTotal, 
  className = '' 
}) => {
  const { 
    userLocation, 
    nearbyStores, 
    getDeliveryFee, 
    getDistanceToStore, 
    setShowLocationModal 
  } = useLocation();

  // If no location is set
  if (!userLocation) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">Delivery Fee</span>
          </div>
          <span className="text-sm text-gray-600">Not calculated</span>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <div className="flex items-center justify-between">
              <span>Set your location to see delivery fees and nearby stores</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowLocationModal(true)}
                className="ml-2 text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Set Location
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate delivery fee
  const distance = storeId ? getDistanceToStore(storeId) : (nearbyStores[0]?.distance || null);
  const deliveryFee = distance ? calculateDeliveryFee(distance) : 3.99;
  const estimatedTime = distance ? 
    (distance <= 5 ? '20-30 min' : distance <= 15 ? '30-45 min' : '45-60 min') :
    '30-45 min';

  // Check for free delivery
  const freeDeliveryThreshold = 35.00;
  const isFreeDelivery = cartTotal >= freeDeliveryThreshold;
  const needsMoreForFree = freeDeliveryThreshold - cartTotal;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Delivery Fee Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Delivery Fee</span>
          {distance && (
            <Badge variant="outline" className="text-xs">
              {distance} mi
            </Badge>
          )}
        </div>
        <div className="text-right">
          {isFreeDelivery ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 line-through">
                ${deliveryFee.toFixed(2)}
              </span>
              <Badge className="bg-green-100 text-green-800 text-xs">
                FREE
              </Badge>
            </div>
          ) : (
            <span className="text-sm font-semibold">${deliveryFee.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Location & Timing Info */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{userLocation.address || 'Your location'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Est. {estimatedTime}</span>
        </div>
      </div>

      {/* Free Delivery Promotion */}
      {!isFreeDelivery && needsMoreForFree > 0 && needsMoreForFree <= 20 && (
        <Alert className="bg-green-50 border-green-200">
          <Truck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            Add <strong>${needsMoreForFree.toFixed(2)}</strong> more for free delivery!
          </AlertDescription>
        </Alert>
      )}

      {/* Store-specific info if available */}
      {storeId && nearbyStores.find(s => s.id === storeId) && (
        <div className="text-xs text-gray-500">
          Delivering from {nearbyStores.find(s => s.id === storeId)?.name}
        </div>
      )}

      {/* Distance-based delivery info */}
      {distance && (
        <div className="text-xs text-gray-500">
          {distance <= 5 && "⚡ Express delivery available"}
          {distance > 5 && distance <= 15 && "🚚 Standard delivery"}
          {distance > 15 && "📦 Extended delivery area"}
        </div>
      )}
    </div>
  );
}; 