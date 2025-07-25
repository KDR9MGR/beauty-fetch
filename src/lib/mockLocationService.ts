// Mock Location Service for prototype
// This simulates Google Maps API functionality with fake data

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MockStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // in miles
}

// Mock store locations around major cities
export const MOCK_STORES: MockStore[] = [
  // San Francisco Bay Area
  { id: '1', name: 'Beauty Bliss SF', address: '123 Union Square, San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  { id: '2', name: 'Glow Gardens', address: '456 Castro St, San Francisco, CA', latitude: 37.7609, longitude: -122.4350 },
  { id: '3', name: 'Radiant Cosmetics', address: '789 Fillmore St, San Francisco, CA', latitude: 37.7849, longitude: -122.4324 },
  
  // Los Angeles Area  
  { id: '4', name: 'Hollywood Beauty', address: '321 Hollywood Blvd, Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 },
  { id: '5', name: 'Beverly Hills Spa', address: '654 Rodeo Dr, Beverly Hills, CA', latitude: 34.0696, longitude: -118.4000 },
  
  // New York Area
  { id: '6', name: 'Manhattan Makeup', address: '987 5th Ave, New York, NY', latitude: 40.7589, longitude: -73.9851 },
  { id: '7', name: 'Brooklyn Beauty Bar', address: '147 Atlantic Ave, Brooklyn, NY', latitude: 40.6892, longitude: -73.9442 },
  
  // Chicago Area
  { id: '8', name: 'Windy City Wellness', address: '258 N Michigan Ave, Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
  
  // Seattle Area
  { id: '9', name: 'Emerald Beauty', address: '369 Pine St, Seattle, WA', latitude: 47.6062, longitude: -122.3321 },
  
  // Default fallback stores
  { id: '10', name: 'Beauty Central', address: '555 Main St, Anytown, USA', latitude: 39.8283, longitude: -98.5795 },
];

// Mock user locations for testing
export const MOCK_USER_LOCATIONS = {
  'san_francisco': { latitude: 37.7749, longitude: -122.4194, name: 'San Francisco, CA' },
  'los_angeles': { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles, CA' },
  'new_york': { latitude: 40.7128, longitude: -74.0060, name: 'New York, NY' },
  'chicago': { latitude: 41.8781, longitude: -87.6298, name: 'Chicago, IL' },
  'seattle': { latitude: 47.6062, longitude: -122.3321, name: 'Seattle, WA' },
  'default': { latitude: 39.8283, longitude: -98.5795, name: 'Central USA' },
};

// Calculate distance between two coordinates (Haversine formula)
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

// Mock GPS location request
export function mockGetCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    // Simulate loading time
    setTimeout(() => {
      // Randomly pick a location for demo
      const locations = Object.values(MOCK_USER_LOCATIONS);
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      if (Math.random() > 0.1) { // 90% success rate
        resolve({
          latitude: randomLocation.latitude,
          longitude: randomLocation.longitude,
        });
      } else {
        reject(new Error('Location access denied'));
      }
    }, 1500); // 1.5 second delay to simulate real GPS
  });
}

// Get nearby stores based on user location
export function getNearbyStores(
  userLocation: LocationCoordinates,
  maxDistance: number = 25
): MockStore[] {
  return MOCK_STORES
    .map(store => ({
      ...store,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        store.latitude,
        store.longitude
      )
    }))
    .filter(store => store.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!);
}

// Calculate delivery fee based on distance
export function calculateDeliveryFee(distance: number): number {
  const BASE_FEE = 3.99;
  const PER_MILE_RATE = 1.50;
  const FREE_DELIVERY_THRESHOLD = 35.00; // Order amount for free delivery
  
  if (distance <= 2) {
    return BASE_FEE;
  }
  
  return BASE_FEE + ((distance - 2) * PER_MILE_RATE);
}

// Mock geocoding (address to coordinates)
export function mockGeocodeAddress(address: string): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simple address matching for demo
      const lowerAddress = address.toLowerCase();
      
      if (lowerAddress.includes('san francisco') || lowerAddress.includes('sf')) {
        resolve(MOCK_USER_LOCATIONS.san_francisco);
      } else if (lowerAddress.includes('los angeles') || lowerAddress.includes('la')) {
        resolve(MOCK_USER_LOCATIONS.los_angeles);
      } else if (lowerAddress.includes('new york') || lowerAddress.includes('ny')) {
        resolve(MOCK_USER_LOCATIONS.new_york);
      } else if (lowerAddress.includes('chicago')) {
        resolve(MOCK_USER_LOCATIONS.chicago);
      } else if (lowerAddress.includes('seattle')) {
        resolve(MOCK_USER_LOCATIONS.seattle);
      } else {
        resolve(MOCK_USER_LOCATIONS.default);
      }
    }, 800);
  });
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