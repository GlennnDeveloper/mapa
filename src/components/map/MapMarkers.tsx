'use client';

import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef, memo, useMemo } from 'react';
import { type Location, type LocationStatus } from '@/types/location';

interface MapMarkersProps {
  locations: Location[];
  type: 'project' | 'storage' | 'suggestion';
  selectedLocationId?: string | null;
  onLocationSelect?: (id: string) => void;
  // These are passed by MapComponent but not needed for marker interaction
  onDeleteSuccess?: () => void;
  onSearchNearby?: (lat: number, lng: number) => void;
  isSearchingNearby?: boolean;
  onAddSuggestion?: (suggestion: Partial<Location>) => void;
}

const getStatusColorHex = (status: string, type: 'project' | 'storage' | 'suggestion') => {
  if (type === 'storage') return '#7c3aed'; // violet-600
  if (type === 'suggestion') return '#8b5cf6'; // violet-500
  
  const s = status.toLowerCase();
  if (s === 'nuevo' || s === 'active') return '#2563eb'; // blue-600
  if (s === 'proceso') return '#d97706'; // amber-600
  if (s === 'terminado' || s === 'inactive') return '#059669'; // emerald-600
  return '#475569'; // slate-600
};

const createCustomIcon = (type: 'project' | 'storage' | 'suggestion', status: string, labelText: string) => {
  const color = getStatusColorHex(status, type);
  const housePaths = `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />`;
  const warehousePaths = `<path d="M3 21V8l9-4 9 4v13" /><path d="M13 13h4" /><path d="M13 17h4" /><path d="M13 9h4" /><path d="M21 21H3" /><path d="M9 11v10" />`;
  const plusPaths = `<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`;
  const innerIconPaths = type === 'project' ? housePaths : type === 'suggestion' ? plusPaths : warehousePaths;

  return L.divIcon({
    html: `
      <div class="marker-container" style="--marker-color: ${color}">
        <div class="marker-label">
          ${labelText}
          <div class="marker-label-tail"></div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 24 30" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.2))">
          <path d="M12 28.5C17.3 22 21 16 21 11.5C21 6.1 16.4 1.5 12 1.5C7.6 1.5 3 6.1 3 11.5C3 16 6.7 22 12 28.5Z" fill="white" />
          <path d="M12 28.5C17.3 22 21 16 21 11.5C21 6.1 16.4 1.5 12 1.5C7.6 1.5 3 6.1 3 11.5C3 16 6.7 22 12 28.5Z" fill="none" stroke="${color}" stroke-width="1" stroke-linejoin="round" />
          <g transform="translate(5.7, 4.5) scale(0.54)" stroke="${color}" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            ${innerIconPaths}
          </g>
        </svg>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [48, 60],
    iconAnchor: [24, 60],
    popupAnchor: [175, 250],
  });
};

const MemoizedMarker = memo(({ 
  location, 
  type, 
  optimisticStatus,
  setMarkerRef,
  onLocationSelect,
  selectedLocationId
}: { 
  location: Location; 
  type: 'project' | 'storage' | 'suggestion';
  optimisticStatus?: LocationStatus;
  setMarkerRef: (el: L.Marker | null) => void;
  onLocationSelect?: (id: string) => void;
  selectedLocationId?: string | null;
}) => {
  const currentStatusStr = optimisticStatus || location.status;
  
  const icon = useMemo(() => {
    let labelText = location.name || (type === 'storage' ? 'STORAGE' : '');
    if (type === 'suggestion') labelText = 'SUGERENCIA';
    return createCustomIcon(type, currentStatusStr, labelText);
  }, [type, currentStatusStr, location.name]);

  return (
    <Marker 
      position={[location.lat, location.lng]} 
      icon={icon}
      ref={setMarkerRef}
      zIndexOffset={selectedLocationId === location.id ? 1000 : 0}
      eventHandlers={{
        click: () => {
          if (onLocationSelect) onLocationSelect(location.id);
        }
      }}
    />
  );
});

MemoizedMarker.displayName = 'MemoizedMarker';

export default function MapMarkers({ 
  locations, 
  type, 
  selectedLocationId,
  onLocationSelect
}: MapMarkersProps) {
  const map = useMap();
  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (selectedLocationId && markerRefs.current[selectedLocationId]) {
      const location = locations.find(loc => loc.id === selectedLocationId);
      
      if (location) {
        // Offset to keep marker visible above the bottom sheet
        const offsetLat = location.lat + (window.innerWidth < 768 ? 0.008 : 0.003); 
        map.flyTo([offsetLat, location.lng], 14, {
          animate: true,
          duration: 1,
        });
      }
    }
  }, [selectedLocationId, locations, map]);

  return (
    <>
      {locations.map((location) => (
        <MemoizedMarker
          key={location.id}
          location={location}
          type={type}
          setMarkerRef={(el) => {
            if (el) markerRefs.current[location.id] = el;
          }}
          onLocationSelect={onLocationSelect}
          selectedLocationId={selectedLocationId}
        />
      ))}
    </>
  );
}
