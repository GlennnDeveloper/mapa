'use client';

import { useMap, Marker, Circle } from 'react-leaflet';
import { Navigation, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import L from 'leaflet';

export default function MapGPSButton() {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);

  useEffect(() => {
    const onLocationFound = (e: L.LocationEvent) => {
      setLoading(false);
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
    };

    const onLocationError = (e: L.ErrorEvent) => {
      setLoading(false);
      alert('No pudimos encontrar tu ubicación: ' + e.message);
    };

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    return () => {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
    };
  }, [map]);

  const handleLocate = () => {
    setLoading(true);
    map.locate({ setView: true, maxZoom: 16 });
  };

  const blueDotIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="gps-dot-container">
        <div class="gps-pulse"></div>
        <div class="gps-dot"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  return (
    <>
      {position && (
        <>
          <Circle 
            center={position} 
            radius={accuracy} 
            pathOptions={{ 
              fillColor: '#3b82f6', 
              color: 'transparent', 
              fillOpacity: 0.15 
            }} 
          />
          <Marker position={position} icon={blueDotIcon} zIndexOffset={1000} />
        </>
      )}
      
      <div className="leaflet-top leaflet-left mt-20 ml-3">
        <div className="leaflet-control leaflet-bar border-none shadow-none bg-transparent">
          <button
            onClick={handleLocate}
            disabled={loading}
            className="w-12 h-12 bg-card rounded-2xl shadow-xl flex items-center justify-center text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-border active:scale-95 disabled:opacity-50 group pointer-events-auto"
            title="Mi ubicación"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin text-blue-500" />
            ) : (
              <Navigation size={20} className="group-hover:rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
