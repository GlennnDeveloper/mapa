import { supabase } from './supabase';
import { Location, NewLocation, LocationStatus } from '../types/location';

export const locationService = {
  async getAllLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
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
      .select('*')
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

  // Real geocoding using OpenStreetMap (Nominatim)
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const fetchWithUA = async (query: string) => {
      console.log(`Geocoding attempt for: "${query}"`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'LogisticaMudanzaApp/1.0',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        }
      );
      if (!response.ok) return null;
      return await response.json();
    };

    try {
      // Attempt 1: Full address
      let data = await fetchWithUA(address);

      // Attempt 2: If fail, try simplifying (remove country and extra spaces)
      if (!data || data.length === 0) {
        const simplified = address.replace(/United States|USA/gi, '').trim();
        if (simplified !== address) {
          data = await fetchWithUA(simplified);
        }
      }

      // Attempt 3: If still fail, try without ZIP
      if (!data || data.length === 0) {
        const noZip = address.replace(/\d{5}(-\d{4})?/, '').trim();
        if (noZip !== address) {
          data = await fetchWithUA(noZip);
        }
      }

      if (data && data.length > 0) {
        console.log('Geocoding success:', data[0].lat, data[0].lon);
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }

      console.warn('Geocoding found no results for:', address);
      return null;
    } catch (error) {
      console.error('Geocoding service error:', error);
      return null;
    }
  },

  async getAddressSuggestions(query: string): Promise<{ display_name: string; lat: string; lon: string }[]> {
    if (!query || query.length < 1) return [];

    try {
      // Bounding box for Georgia, USA (approx)
      const viewbox = '-85.6,35.0,-80.84,30.35';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us&viewbox=${viewbox}&addressdetails=1`,
        {
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
