'use client';

import dynamic from 'next/dynamic';
import { Location } from '@/types/location';

// Load MapComponent with SSR disabled
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 animate-pulse rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 font-medium">Cargando mapa interactivo...</p>
      </div>
    </div>
  ),
});

interface MapLoaderProps {
  locations: Location[];
  suggestions?: Partial<Location>[];
  onDeleteSuccess?: () => void;
  selectedLocationId?: string | null;
  onSearchNearby?: (lat: number, lng: number) => void;
  isSearchingNearby?: boolean;
  onAddSuggestion?: (suggestion: Partial<Location>) => void;
  onLocationSelect?: (id: string) => void;
}

export default function MapLoader({ 
  locations, 
  suggestions, 
  onDeleteSuccess, 
  selectedLocationId,
  onSearchNearby,
  isSearchingNearby,
  onAddSuggestion,
  onLocationSelect
}: MapLoaderProps) {
  return (
    <MapComponent 
      locations={locations} 
      suggestions={suggestions}
      onDeleteSuccess={onDeleteSuccess} 
      selectedLocationId={selectedLocationId}
      onSearchNearby={onSearchNearby}
      isSearchingNearby={isSearchingNearby}
      onAddSuggestion={onAddSuggestion}
      onLocationSelect={onLocationSelect}
    />
  );
}
