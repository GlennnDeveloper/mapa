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
              'User-Agent': 'LogisticaMudanzaApp/2.0',
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us&viewbox=${viewbox}&addressdetails=1`,
        {
          signal: suggestionsAbortController.signal,
          headers: {
            'User-Agent': 'LogisticaMudanzaApp/1.0',
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
  }
};
