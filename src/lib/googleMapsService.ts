// Production Google Maps Service
// This replaces mockLocationService.ts with real Google Maps APIs

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface RealStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // in miles
}

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Cache for Google Maps script loading
let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

// Load Google Maps script dynamically
export function loadGoogleMapsScript(): Promise<void> {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (isGoogleMapsLoading && googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  isGoogleMapsLoading = true;
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      resolve();
    };

    script.onerror = () => {
      isGoogleMapsLoading = false;
      googleMapsLoadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

// Get user's current location using browser geolocation
export function getCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
}

// Geocode address to coordinates using Google Geocoding API
export async function geocodeAddress(address: string): Promise<LocationCoordinates> {
  try {
    await loadGoogleMapsScript();
    
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            latitude: location.lat(),
            longitude: location.lng(),
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to geocode address: ${error}`);
  }
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in miles
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Get distance matrix for multiple destinations using Google Distance Matrix API
export async function getDistanceMatrix(
  origin: LocationCoordinates,
  destinations: LocationCoordinates[]
): Promise<{ distance: number; duration: number }[]> {
  try {
    await loadGoogleMapsScript();
    
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.latitude, origin.longitude)],
        destinations: destinations.map(dest => 
          new google.maps.LatLng(dest.latitude, dest.longitude)
        ),
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false,
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const results = response.rows[0].elements.map(element => {
            if (element.status === 'OK') {
              return {
                distance: parseFloat(element.distance.text.replace(' mi', '')),
                duration: element.duration.value / 60, // Convert seconds to minutes
              };
            }
            return { distance: 0, duration: 0 };
          });
          resolve(results);
        } else {
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      });
    });
  } catch (error) {
    // Fallback to Haversine calculation
    console.warn('Distance Matrix API failed, using fallback calculation:', error);
    return destinations.map(dest => ({
      distance: calculateDistance(origin.latitude, origin.longitude, dest.latitude, dest.longitude),
      duration: calculateDistance(origin.latitude, origin.longitude, dest.latitude, dest.longitude) * 2.5 // Rough estimate: 2.5 min per mile
    }));
  }
}

// Calculate delivery fee based on distance
export function calculateDeliveryFee(distance: number): number {
  const BASE_FEE = 3.99;
  const PER_MILE_RATE = 1.50;
  
  if (distance <= 2) {
    return BASE_FEE;
  }
  
  return BASE_FEE + ((distance - 2) * PER_MILE_RATE);
}

// Get nearby stores from your actual store data
export async function getNearbyStores(
  userLocation: LocationCoordinates,
  stores: RealStore[],
  maxDistance: number = 25
): Promise<RealStore[]> {
  try {
    // Use Google Distance Matrix for accurate distances
    const storeCoordinates = stores.map(store => ({
      latitude: store.latitude,
      longitude: store.longitude
    }));
    
    const distances = await getDistanceMatrix(userLocation, storeCoordinates);
    
    const storesWithDistance = stores.map((store, index) => ({
      ...store,
      distance: distances[index].distance
    }));
    
    return storesWithDistance
      .filter(store => store.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
      
  } catch (error) {
    console.warn('Failed to get distance matrix, using fallback calculation:', error);
    
    // Fallback to Haversine calculation
    const storesWithDistance = stores.map(store => ({
      ...store,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        store.latitude,
        store.longitude
      )
    }));
    
    return storesWithDistance
      .filter(store => store.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
}

// Store location data in localStorage for persistence
export function saveUserLocation(location: LocationCoordinates, address?: string) {
  localStorage.setItem('userLocation', JSON.stringify({
    ...location,
    address,
    timestamp: Date.now()
  }));
}

export function getUserLocation(): (LocationCoordinates & { address?: string }) | null {
  const saved = localStorage.getItem('userLocation');
  if (!saved) return null;
  
  try {
    const data = JSON.parse(saved);
    // Check if location is less than 1 hour old
    if (Date.now() - data.timestamp < 3600000) {
      return data;
    }
  } catch {
    // Invalid data
  }
  
  localStorage.removeItem('userLocation');
  return null;
}

export function clearUserLocation() {
  localStorage.removeItem('userLocation');
}

// Error handling utility
export function isGoogleMapsError(error: any): boolean {
  return error && (
    error.message?.includes('Google Maps') ||
    error.message?.includes('Geocoding') ||
    error.message?.includes('Distance Matrix')
  );
}

// Health check for Google Maps API
export async function checkGoogleMapsHealth(): Promise<boolean> {
  try {
    await loadGoogleMapsScript();
    return !!(window.google && window.google.maps);
  } catch {
    return false;
  }
}

// Google Maps types are now available via @types/google.maps 