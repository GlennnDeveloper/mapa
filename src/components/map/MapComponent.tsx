'use client';

import { MapContainer, TileLayer, LayersControl, ZoomControl, LayerGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Location } from '@/types/location';
import MapMarkers from './MapMarkers';
import MapGPSButton from './MapGPSButton';

interface MapComponentProps {
  locations: Location[];
  suggestions?: Partial<Location>[];
  onDeleteSuccess?: () => void;
  selectedLocationId?: string | null;
  onSearchNearby?: (lat: number, lng: number) => void;
  isSearchingNearby?: boolean;
  onAddSuggestion?: (suggestion: Partial<Location>) => void;
  onLocationSelect?: (id: string) => void;
}

const GEORGIA_CENTER: [number, number] = [33.98, -84.1];
const INITIAL_ZOOM = 9;

// Internal component to handle map bounds when suggestions change
function MapBoundsUpdater({ suggestions }: { suggestions: Partial<Location>[] }) {
  const map = useMap();

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      const bounds = L.latLngBounds(suggestions.map(s => [s.lat!, s.lng!]));
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
        animate: true,
        duration: 1.5
      });
    }
  }, [suggestions, map]);

  return null;
}

export default function MapComponent({ 
  locations, 
  suggestions = [], 
  onDeleteSuccess, 
  selectedLocationId,
  onSearchNearby,
  isSearchingNearby,
  onAddSuggestion,
  onLocationSelect
}: MapComponentProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <MapContainer
        center={GEORGIA_CENTER}
        zoom={INITIAL_ZOOM}
        scrollWheelZoom={true}
        closePopupOnClick={true}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapBoundsUpdater suggestions={suggestions} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          detectRetina={true}
          maxZoom={20}
        />
        
        <ZoomControl position="bottomright" />
        <MapGPSButton />

        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Proyectos Activos">
            <LayerGroup>
              <MapMarkers 
                locations={locations.filter(loc => loc.type === 'project')} 
                type="project" 
                onDeleteSuccess={onDeleteSuccess}
                selectedLocationId={selectedLocationId}
                onSearchNearby={onSearchNearby}
                isSearchingNearby={isSearchingNearby}
                onLocationSelect={onLocationSelect}
              />
            </LayerGroup>
          </LayersControl.Overlay>
          
          <LayersControl.Overlay checked name="Storages">
            <LayerGroup>
              <MapMarkers 
                locations={locations.filter(loc => loc.type === 'storage')} 
                type="storage" 
                onDeleteSuccess={onDeleteSuccess}
                selectedLocationId={selectedLocationId}
                onLocationSelect={onLocationSelect}
              />
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Sugerencias Cercanas">
            <LayerGroup>
              <MapMarkers 
                locations={suggestions as Location[]} 
                type="suggestion" 
                onAddSuggestion={onAddSuggestion}
                onLocationSelect={onLocationSelect}
              />
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}
