// Hybrid Location Service - Production Ready with Fallbacks
// Intelligently switches between Google Maps API and Mock data

import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Google Maps Service
import {
  getCurrentLocation as googleGetCurrentLocation,
  geocodeAddress as googleGeocodeAddress,
  getNearbyStores as googleGetNearbyStores,
  checkGoogleMapsHealth,
  isGoogleMapsError,
  type RealStore,
  calculateDeliveryFee,
  saveUserLocation,
  getUserLocation,
  clearUserLocation,
  type LocationCoordinates
} from '@/lib/googleMapsService';

// Mock Service (fallback)
import {
  mockGetCurrentLocation,
  mockGeocodeAddress,
  getNearbyStores as mockGetNearbyStores,
  MOCK_STORES,
  type MockStore
} from '@/lib/mockLocationService';

// Unified Store Type
export type UnifiedStore = RealStore | MockStore;

// Re-export commonly used functions
export { 
  calculateDeliveryFee, 
  saveUserLocation, 
  getUserLocation, 
  clearUserLocation,
  type LocationCoordinates 
};

// Service status tracking
let googleMapsAvailable: boolean | null = null;

async function checkGoogleMapsAvailability(): Promise<boolean> {
  if (googleMapsAvailable !== null) {
    return googleMapsAvailable;
  }

  try {
    await checkGoogleMapsHealth();
    googleMapsAvailable = true;
    return true;
  } catch (error) {
    console.warn('Google Maps not available, using fallback:', error);
    googleMapsAvailable = false;
    return false;
  }
}

// Hybrid function to get current location
export async function getCurrentLocation(): Promise<LocationCoordinates & { address?: string }> {
  const useGoogle = await checkGoogleMapsAvailability();
  
  if (useGoogle) {
    try {
      const location = await googleGetCurrentLocation();
      console.log('✅ Got real GPS location:', location);
      return location;
    } catch (error) {
      if (isGoogleMapsError(error)) {
        console.warn('Real GPS failed, using mock location:', error);
        toast.warning('Location access unavailable, using demo location');
      }
      // Fallback to mock
      return mockGetCurrentLocation();
    }
  } else {
    console.log('🧪 Using mock GPS location');
    return mockGetCurrentLocation();
  }
}

// Hybrid function to geocode addresses
export async function geocodeAddress(address: string): Promise<LocationCoordinates> {
  const useGoogle = await checkGoogleMapsAvailability();
  
  if (useGoogle) {
    try {
      const coordinates = await googleGeocodeAddress(address);
      console.log('✅ Got real geocoding for:', address, coordinates);
      return coordinates;
    } catch (error) {
      if (isGoogleMapsError(error)) {
        console.warn('Real geocoding failed, using mock:', error);
        toast.warning('Address lookup unavailable, using approximate location');
      }
      // Fallback to mock
      return mockGeocodeAddress(address);
    }
  } else {
    console.log('🧪 Using mock geocoding for:', address);
    return mockGeocodeAddress(address);
  }
}

// Interface for store address from database
interface StoreAddress {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

// Get stores from your database
async function getStoresFromDatabase(): Promise<UnifiedStore[]> {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, address, status')
      .eq('status', 'active');

    if (error) {
      console.error('Failed to fetch stores from database:', error);
      return MOCK_STORES; // Fallback to mock data
    }

    // Transform database stores to unified format
    const transformedStores: UnifiedStore[] = stores
      .filter(store => {
        const address = store.address as unknown as StoreAddress;
        return address && 
               typeof address === 'object' && 
               address.latitude && 
               address.longitude &&
               address.street &&
               address.city &&
               address.state;
      })
      .map(store => {
        const address = store.address as unknown as StoreAddress;
        return {
          id: store.id,
          name: store.name,
          address: `${address.street}, ${address.city}, ${address.state}`,
          latitude: address.latitude,
          longitude: address.longitude,
        };
      });

    // If no stores have location data, use mock stores as fallback
    if (transformedStores.length === 0) {
      console.warn('No stores with location data found, using mock stores');
      return MOCK_STORES;
    }

    console.log(`✅ Loaded ${transformedStores.length} real stores with location data`);
    return transformedStores;
  } catch (error) {
    console.error('Failed to fetch stores from database:', error);
    return MOCK_STORES; // Fallback to mock data
  }
}

// Hybrid function to get nearby stores
export async function getNearbyStores(
  userLocation: LocationCoordinates,
  maxDistance: number = 25
): Promise<UnifiedStore[]> {
  const useGoogle = await checkGoogleMapsAvailability();
  const stores = await getStoresFromDatabase();
  
  if (useGoogle && stores.length > 0 && stores !== MOCK_STORES) {
    try {
      const nearbyStores = await googleGetNearbyStores(userLocation, stores as RealStore[], maxDistance);
      console.log('✅ Got real distances from Google Maps:', nearbyStores.length, 'stores');
      return nearbyStores;
    } catch (error) {
      if (isGoogleMapsError(error)) {
        console.warn('Google Distance Matrix failed, using mock calculation:', error);
        toast.warning('Distance calculation unavailable, using estimates');
      }
      // Fallback to mock calculation
      return mockGetNearbyStores(userLocation, maxDistance);
    }
  } else {
    console.log('🧪 Using mock distance calculation');
    return mockGetNearbyStores(userLocation, maxDistance);
  }
}

// Get service status for debugging/monitoring
export function getLocationServiceStatus() {
  return {
    googleMapsAvailable,
    hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    currentMode: googleMapsAvailable ? 'production' : 'demo',
    features: {
      realGPS: googleMapsAvailable,
      realGeocoding: googleMapsAvailable,
      realDistanceMatrix: googleMapsAvailable,
      mockFallback: true,
    }
  };
} 