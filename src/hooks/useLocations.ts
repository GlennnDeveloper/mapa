import useSWR from 'swr';
import { Location } from '../types/location';
import { locationService } from '../services/locationService';

export function useLocations() {
  const { data, error, isLoading, mutate } = useSWR<Location[]>(
    'locations',
    () => locationService.getAllLocations(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Dedup requests within 5s
    }
  );

  return { 
    locations: data || [], 
    loading: isLoading, 
    error: error instanceof Error ? error : error ? new Error('Failed to fetch locations') : null, 
    refresh: () => mutate(),
    mutate
  };
}
