'use client';

import { MapContainer, TileLayer, LayersControl, ZoomControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/types/location';
import MapMarkers from './MapMarkers';

interface MapComponentProps {
  locations: Location[];
  onDeleteSuccess?: () => void;
  selectedLocationId?: string | null;
}

const GEORGIA_CENTER: [number, number] = [33.98, -84.1];
const INITIAL_ZOOM = 9;

export default function MapComponent({ locations, onDeleteSuccess, selectedLocationId }: MapComponentProps) {
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />

        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Proyectos Activos">
            <LayerGroup>
              <MapMarkers 
                locations={locations.filter(loc => loc.type === 'project')} 
                type="project" 
                onDeleteSuccess={onDeleteSuccess}
                selectedLocationId={selectedLocationId}
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
              />
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}
