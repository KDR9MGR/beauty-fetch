import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { MapPin, Navigation, Phone, Clock, CheckCircle, XCircle, Store } from 'lucide-react';

interface DeliveryLocation {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  address: {
    formatted_address: string;
    lat: number;
    lng: number;
  };
  phone: string;
  order_id: string;
  status: 'pending' | 'completed';
  estimated_time: string;
}

export const RouteMap = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Initialize Google Maps
    const initMap = async () => {
      if (!window.google) {
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          createMap();
        };
      } else {
        createMap();
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDeliveryLocations();
      startLocationTracking();
    }
  }, [user]);

  useEffect(() => {
    if (map && locations.length > 0 && currentLocation) {
      calculateAndDisplayRoute();
    }
  }, [map, locations, currentLocation]);

  const createMap = () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const newMap = new google.maps.Map(mapElement, {
      zoom: 12,
      center: { lat: 0, lng: 0 }, // Will be updated with current location
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const newDirectionsRenderer = new google.maps.DirectionsRenderer({
      map: newMap,
      suppressMarkers: true // We'll create custom markers
    });

    setMap(newMap);
    setDirectionsRenderer(newDirectionsRenderer);
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Watch position
    navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(newLocation);

        // Update driver status in database
        if (user) {
          updateDriverLocation(newLocation);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const updateDriverLocation = async (location: { lat: number; lng: number }) => {
    try {
      const { error } = await supabase
        .from('driver_status')
        .upsert({
          driver_id: user!.id,
          last_location: location,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  const fetchDeliveryLocations = async () => {
    if (!user) return;

    try {
      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            id,
            customer:profiles!orders_customer_id_fkey (
              first_name,
              last_name,
              phone
            ),
            store:stores (
              name,
              phone,
              address
            )
          )
        `)
        .eq('driver_id', user.id)
        .in('status', ['assigned', 'picked_up'])
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      // Format locations for both pickup and delivery points
      const formattedLocations: DeliveryLocation[] = [];
      deliveries?.forEach(delivery => {
        // Add pickup location
        formattedLocations.push({
          id: `pickup-${delivery.id}`,
          type: 'pickup',
          name: delivery.orders.store.name,
          address: delivery.pickup_address,
          phone: delivery.orders.store.phone,
          order_id: delivery.orders.id,
          status: delivery.status === 'assigned' ? 'pending' : 'completed',
          estimated_time: delivery.estimated_delivery_time
        });

        // Add delivery location
        formattedLocations.push({
          id: `delivery-${delivery.id}`,
          type: 'delivery',
          name: `${delivery.orders.customer.first_name} ${delivery.orders.customer.last_name}`,
          address: delivery.delivery_address,
          phone: delivery.orders.customer.phone,
          order_id: delivery.orders.id,
          status: delivery.status === 'picked_up' ? 'pending' : 'completed',
          estimated_time: delivery.estimated_delivery_time
        });
      });

      setLocations(formattedLocations);
    } catch (error) {
      console.error('Error fetching delivery locations:', error);
      toast.error('Failed to fetch delivery locations');
    } finally {
      setLoading(false);
    }
  };

  const calculateAndDisplayRoute = () => {
    if (!map || !directionsRenderer || !currentLocation || locations.length === 0) return;

    const directionsService = new google.maps.DirectionsService();

    // Create waypoints from locations
    const waypoints = locations
      .filter(location => location.status === 'pending')
      .map(location => ({
        location: new google.maps.LatLng(
          location.address.lat,
          location.address.lng
        ),
        stopover: true
      }));

    if (waypoints.length === 0) return;

    // Calculate route
    directionsService.route(
      {
        origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        destination: new google.maps.LatLng(
          waypoints[waypoints.length - 1].location.lat(),
          waypoints[waypoints.length - 1].location.lng()
        ),
        waypoints: waypoints.slice(0, -1),
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          
          // Create markers for each location
          locations.forEach(location => {
            new google.maps.Marker({
              position: new google.maps.LatLng(
                location.address.lat,
                location.address.lng
              ),
              map,
              icon: {
                url: location.type === 'pickup' 
                  ? '/store-marker.png' 
                  : '/delivery-marker.png',
                scaledSize: new google.maps.Size(32, 32)
              },
              title: location.name
            });
          });
        } else {
          console.error('Directions request failed:', status);
          toast.error('Failed to calculate route');
        }
      }
    );
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
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
          <CardDescription>Your delivery route and stops</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="map" className="h-[400px] rounded-lg"></div>
        </CardContent>
      </Card>

      {/* Location List */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Stops</CardTitle>
          <CardDescription>
            {locations.filter(l => l.status === 'pending').length} stops remaining
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`p-4 rounded-lg ${
                  location.status === 'completed' 
                    ? 'bg-gray-50' 
                    : 'bg-white border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {location.type === 'pickup' ? (
                      <Store className="h-5 w-5 text-blue-500 mt-1" />
                    ) : (
                      <MapPin className="h-5 w-5 text-green-500 mt-1" />
                    )}
                    <div>
                      <p className="font-medium">
                        {location.type === 'pickup' ? 'Pickup from' : 'Deliver to'}: {location.name}
                      </p>
                      <p className="text-sm text-gray-600">{location.address.formatted_address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${location.phone}`} className="text-sm text-blue-600 hover:underline">
                          {location.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      location.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {location.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    Estimated arrival: {new Date(location.estimated_time).toLocaleTimeString()}
                  </span>
                </div>

                {location.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${
                            encodeURIComponent(location.address.formatted_address)
                          }`,
                          '_blank'
                        );
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // Mark as completed logic here
                        toast.success('Location marked as completed');
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {locations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No active deliveries
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 