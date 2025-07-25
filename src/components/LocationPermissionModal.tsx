import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, Navigation, MapIcon, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { 
  getCurrentLocation, 
  geocodeAddress, 
  saveUserLocation, 
  LocationCoordinates 
} from '@/lib/hybridLocationService';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onLocationSet: (location: LocationCoordinates & { address?: string }) => void;
  onSkip: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onLocationSet,
  onSkip,
}) => {
  const [loading, setLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      saveUserLocation(location);
      onLocationSet(location);
      toast.success('Location set! Showing nearby stores.');
    } catch (err) {
      setError('Could not access your location. Please enter your address manually.');
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddress = async () => {
    if (!manualAddress.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const location = await geocodeAddress(manualAddress);
      saveUserLocation(location, manualAddress);
      onLocationSet({ ...location, address: manualAddress });
      toast.success('Location set! Showing nearby stores.');
    } catch (err) {
      setError('Could not find location for the entered address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    toast.info('Showing all stores. You can set your location later.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-beauty-purple" />
            Find Beauty Stores Near You
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              We'll use your location to show nearby stores and calculate accurate delivery fees.
            </p>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-beauty-purple/10 rounded-full flex items-center justify-center mx-auto mb-1">
                  <MapIcon className="h-4 w-4 text-beauty-purple" />
                </div>
                <span className="text-gray-600">Nearby Stores</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-beauty-purple/10 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Navigation className="h-4 w-4 text-beauty-purple" />
                </div>
                <span className="text-gray-600">Accurate Delivery</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-beauty-purple/10 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Loader2 className="h-4 w-4 text-beauty-purple" />
                </div>
                <span className="text-gray-600">Faster Checkout</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Primary Location Options */}
          {!showManualInput ? (
            <div className="space-y-3">
              <Button 
                onClick={handleUseCurrentLocation}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Use My Current Location
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowManualInput(true)}
                size="lg"
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Enter Address Manually
              </Button>
            </div>
          ) : (
            /* Manual Address Input */
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Enter Your Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., San Francisco, CA or New York, NY"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualAddress()}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleManualAddress}
                  disabled={loading || !manualAddress.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Set Location
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowManualInput(false)}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Demo Locations for Testing */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">Demo Locations (for testing):</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  'San Francisco, CA',
                  'Los Angeles, CA', 
                  'New York, NY',
                  'Chicago, IL'
                ].map((city) => (
                  <Button
                    key={city}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setManualAddress(city);
                      setShowManualInput(true);
                    }}
                    className="justify-start h-8 text-blue-700"
                    disabled={loading}
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skip Option */}
          <div className="text-center pt-2 border-t">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip for now - Show all stores
            </Button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center">
            We respect your privacy. Location data is only used to improve your shopping experience.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 