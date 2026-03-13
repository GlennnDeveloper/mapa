import { supabase } from './supabase';
import { Location, NewLocation, LocationStatus } from '../types/location';

// In-memory cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();
let suggestionsAbortController: AbortController | null = null;

export const locationService = {
  async getAllLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, address, lat, lng, type, status, description, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    return data as Location[];
  },

  async getLocationById(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, address, lat, lng, type, status, description, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching location with id ${id}:`, error);
      throw error;
    }

    return data as Location;
  },
  
  async createLocation(location: NewLocation): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      throw error;
    }

    return data as Location;
  },

  // Enhanced geocoding with structured fallbacks and caching
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address) return null;
    
    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    if (geocodeCache.has(cacheKey)) {
      console.log(`Geocoding cache hit for: ${cacheKey}`);
      return geocodeCache.get(cacheKey)!;
    }

    const fetchNominatim = async (params: Record<string, string>) => {
      const queryString = new URLSearchParams({
        format: 'jsonv2',
        limit: '1',
        ...params
      }).toString();

      console.log(`Geocoding attempt: ${queryString}`);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${queryString}`,
          {
            headers: {
              'Accept-Language': 'en-US,en;q=0.5'
            }
          }
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data && data.length > 0 ? data[0] : null;
      } catch (e) {
        console.error('Fetch error:', e);
        return null;
      }
    };

    // Helper to extract components from unstructured address
    const extractComponents = (addr: string) => {
      const zip = addr.match(/\b\d{5}\b/)?.[0] || '';
      const state = addr.match(/\b([A-Z]{2})\b/)?.[1] || '';
      
      // Remove country, state, zip to get street/city
      let clean = addr
        .replace(/\b(United States|USA)\b/i, '')
        .replace(/\b[A-Z]{2}\b/, '')
        .replace(/\b\d{5}\b/, '')
        .replace(/[,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      return { streetAndCity: clean, zip, state };
    };

    const performGeocode = async (): Promise<{ lat: number; lng: number } | null> => {
      try {
        // Strategy 1: Standard Search (q parameter)
        let result = await fetchNominatim({ q: address });
        if (result) return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };

        // Strategy 2: Structured Search (Full)
        const { streetAndCity, zip, state } = extractComponents(address);
        if (streetAndCity) {
          result = await fetchNominatim({ 
            street: streetAndCity, 
            postalcode: zip, 
            state: state,
            country: 'United States'
          });
          if (result) return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        }

        // Strategy 3: "Magic Bullet" - Street + ZIP only (Ignores city administrative boundary errors)
        if (streetAndCity && zip) {
          const parts = streetAndCity.split(' ');
          if (parts.length > 1) {
            const streetOnly = parts.slice(0, -1).join(' '); 
            result = await fetchNominatim({ street: streetOnly, postalcode: zip });
            if (result) return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
            
            result = await fetchNominatim({ street: streetAndCity, postalcode: zip });
            if (result) return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
          }
        }

        // Strategy 4: Fallback to just the string before the first comma
        const simpleStreet = address.split(',')[0].trim();
        if (simpleStreet !== address) {
          result = await fetchNominatim({ q: simpleStreet });
          if (result) return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        }

        console.warn('All geocoding strategies failed for:', address);
        return null;
      } catch (error) {
        console.error('Geocoding service error:', error);
        return null;
      }
    };

    const finalResult = await performGeocode();
    geocodeCache.set(cacheKey, finalResult);
    return finalResult;
  },

  async getAddressSuggestions(query: string): Promise<{ display_name: string; lat: string; lon: string }[]> {
    if (!query || query.length < 1) return [];

    // Abort previous request if still pending
    if (suggestionsAbortController) {
      suggestionsAbortController.abort();
    }
    suggestionsAbortController = new AbortController();

    try {
      // Bounding box for Georgia, USA (approx)
      const viewbox = '-85.6,35.0,-80.84,30.35';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&countrycodes=us&viewbox=${viewbox}&addressdetails=1&email=adriaanvzzn@gmail.com`,
        {
          signal: suggestionsAbortController.signal,
          headers: {
            'Accept-Language': 'en-US,en;q=0.5'
          }
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.map((item: any) => {
        const addr = item.address;
        // Format: Number Street, City, State Zip, Country
        const street = addr.road || '';
        const number = addr.house_number || '';
        const city = addr.city || addr.town || addr.village || '';
        const state = addr.state || '';
        const zip = addr.postcode || '';
        const country = addr.country || '';
        
        let formatted = `${number} ${street}`.trim();
        if (city) formatted += (formatted ? `, ${city}` : city);
        if (state) formatted += (formatted ? `, ${state}` : state);
        if (zip) formatted += (formatted ? ` ${zip}` : zip);
        if (country) formatted += (formatted ? `, ${country}` : country);

        return {
          display_name: formatted || item.display_name,
          lat: item.lat,
          lon: item.lon
        };
      });
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  },

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  },

  async updateLocationStatus(id: string, status: LocationStatus): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  async searchNearbyStorages(lat: number, lng: number): Promise<Partial<Location>[]> {
    // 5 miles in meters is strictly 8046.72
    const radius = 8046;
    
    const query = `
      [out:json][timeout:25];
      (
        node["shop"="storage_rental"](around:${radius},${lat},${lng});
        way["shop"="storage_rental"](around:${radius},${lat},${lng});
        node["amenity"="storage_rental"](around:${radius},${lat},${lng});
        way["amenity"="storage_rental"](around:${radius},${lat},${lng});
        node["service"="self_storage"](around:${radius},${lat},${lng});
        way["service"="self_storage"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    try {
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch from Overpass API');
      const data = await response.json();
      
      const rawElements = data.elements || [];
      const suggestions: Partial<Location>[] = [];

      // Deduplication logic: Keep only one marker per facility (within ~300m radius)
      const MIN_DISTANCE_METERS = 300;
      
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // in metres
      };

      for (const element of rawElements) {
        const eLat = element.lat || (element.center && element.center.lat);
        const eLng = element.lon || (element.center && element.center.lon);
        
        if (!eLat || !eLng) continue;

        // Strict radius check: (In case Overpass center vs around is slightly off or for ways)
        const distanceToCenter = getDistance(lat, lng, eLat, eLng);
        if (distanceToCenter > radius) continue;

        // Check if we already have a suggestion nearby (Deduplication)
        const isDuplicate = suggestions.some(s => 
          getDistance(eLat, eLng, s.lat!, s.lng!) < MIN_DISTANCE_METERS
        );

        if (!isDuplicate) {
          const tags = element.tags || {};
          const name = tags.name || tags.brand || tags.operator || 'Storage Facility';
          
          const street = tags['addr:street'] || '';
          const houseNumber = tags['addr:housenumber'] || '';
          const city = tags['addr:city'] || '';
          const postcode = tags['addr:postcode'] || '';
          
          let address = '';
          if (houseNumber || street) address = `${houseNumber} ${street}`.trim();
          if (city) address += (address ? `, ${city}` : city);
          if (postcode) address += (address ? ` ${postcode}` : postcode);
          if (!address) address = 'Logística cercana';

          suggestions.push({
            id: `suggestion-${element.id}`,
            name: name,
            address: address,
            lat: eLat,
            lng: eLng,
            type: 'storage' as const,
            status: 'nuevo' as const
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error searching nearby storages:', error);
      return [];
    }
  }
};
