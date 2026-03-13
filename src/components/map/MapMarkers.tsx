'use client';

import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { type Location, type LocationStatus } from '@/types/location';
import { MapPin, Navigation, Trash2, Loader2, Warehouse, Search, Plus, Apple as AppleIcon, Plane as WazeIcon } from 'lucide-react';
import { locationService } from '@/services/locationService';

interface MapMarkersProps {
  locations: Location[];
  type: 'project' | 'storage' | 'suggestion';
  selectedLocationId?: string | null;
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

// Optimized icon creation using CSS variables and classes
const createCustomIcon = (type: 'project' | 'storage' | 'suggestion', status: string, labelText: string, isPopupOpen: boolean) => {
  const color = getStatusColorHex(status, type);
  const housePaths = `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />`;
  const warehousePaths = `<path d="M3 21V8l9-4 9 4v13" /><path d="M13 13h4" /><path d="M13 17h4" /><path d="M13 9h4" /><path d="M21 21H3" /><path d="M9 11v10" />`;
  const plusPaths = `<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`;
  const innerIconPaths = type === 'project' ? housePaths : type === 'suggestion' ? plusPaths : warehousePaths;

  return L.divIcon({
    html: `
      <div class="marker-container ${isPopupOpen ? 'marker-popup-open' : ''}" style="--marker-color: ${color}">
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

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  'nuevo': { label: 'Nuevo', color: 'bg-blue-600', icon: '✨' },
  'proceso': { label: 'En Proceso', color: 'bg-amber-600', icon: '🚀' },
  'terminado': { label: 'Listo', color: 'bg-emerald-600', icon: '✅' },
  'active': { label: 'Activo', color: 'bg-blue-600', icon: '✨' },
  'inactive': { label: 'Finalizado', color: 'bg-slate-600', icon: '📁' },
};

const getStatusInfo = (status: string) => {
  const s = status.toLowerCase();
  return statusMap[s] || { label: status, color: 'bg-slate-500', icon: '📍' };
};

// Separate Memoized Marker Component
const MemoizedMarker = memo(({ 
  location, 
  type, 
  onDelete, 
  onUpdateStatus,
  isDeleting,
  isUpdating,
  optimisticStatus,
  setMarkerRef,
  onSearchNearby,
  isSearchingNearby,
  onAddSuggestion
}: { 
  location: Location; 
  type: 'project' | 'storage' | 'suggestion';
  onDelete: (id: string, e: React.MouseEvent) => void;
  onUpdateStatus: (id: string, status: LocationStatus, e: React.MouseEvent) => void;
  isDeleting: boolean;
  isUpdating: string | null;
  optimisticStatus?: LocationStatus;
  setMarkerRef: (el: L.Marker | null) => void;
  onSearchNearby?: (lat: number, lng: number) => void;
  isSearchingNearby?: boolean;
  onAddSuggestion?: (suggestion: Partial<Location>) => void;
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const currentStatusStr = optimisticStatus || location.status;
  const currentStatus = getStatusInfo(currentStatusStr);
  
  // Icon only depends on type, status, and name. NOT isPopupOpen.
  const icon = useMemo(() => {
    let labelText = type === 'storage' ? 'STORAGE' : location.name;
    if (type === 'suggestion') labelText = 'SUGERENCIA';
    return createCustomIcon(type, currentStatusStr, labelText, false);
  }, [type, currentStatusStr, location.name]);

  const directionsUrl = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
    apple: `https://maps.apple.com/?daddr=${location.lat},${location.lng}`,
    waze: `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`,
  };

  return (
    <Marker 
      position={[location.lat, location.lng]} 
      icon={icon}
      ref={setMarkerRef}
      eventHandlers={{
        popupopen: (e) => {
          setIsPopupOpen(true);
          e.target.getElement()?.querySelector('.marker-container')?.classList.add('marker-popup-open');
        },
        popupclose: (e) => {
          setIsPopupOpen(false);
          e.target.getElement()?.querySelector('.marker-container')?.classList.remove('marker-popup-open');
        }
      }}
    >
      <Popup className="custom-popup">
        <div className="flex flex-col w-[260px] sm:w-[300px] bg-card overflow-hidden rounded-3xl shadow-2xl border border-border mx-auto">
          <div className="relative h-24 bg-slate-950 overflow-hidden">
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[40px]"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-600 rounded-full translate-x-1/3 translate-y-1/3 blur-[30px]"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            </div>

            <div className="relative z-10 p-5 flex flex-col justify-end h-full">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/10 text-white rounded-md border border-white/20 backdrop-blur-sm">
                    {type === 'project' ? 'PROYECTO' : type === 'suggestion' ? 'SUGERENCIA' : 'ALMACÉN'}
                  </span>
                </div>
                {type !== 'suggestion' && (
                  <button 
                    onClick={(e) => onDelete(location.id, e)}
                    disabled={isDeleting}
                    className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-xl transition-all active:scale-90 disabled:opacity-50 border border-white/10 hover:border-red-500/50"
                    title="Eliminar"
                  >
                    {isDeleting ? <Loader2 size={12} className="animate-spin text-white" /> : <Trash2 size={12} />}
                  </button>
                )}
              </div>
              <h3 className="font-black text-xl text-white line-clamp-1 leading-none drop-shadow-md text-left tracking-tight">{location.name}</h3>
            </div>
          </div>

          <div className="px-4 py-4 bg-card border-b border-border">
            {type === 'project' ? (
              <>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    ESTADO
                  </span>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black text-white shadow-lg ${currentStatus.color}`}>
                    {currentStatus.label.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {(['nuevo', 'proceso', 'terminado'] as LocationStatus[]).map((st) => {
                    const info = getStatusInfo(st);
                    const isCurrent = currentStatusStr.toLowerCase() === st || 
                                     (currentStatusStr.toLowerCase() === 'active' && st === 'nuevo');
                    const loading = isUpdating === st;
                    
                    return (
                      <button
                        key={st}
                        disabled={isCurrent || isUpdating !== null}
                        onClick={(e) => onUpdateStatus(location.id, st, e)}
                        className={`
                          relative flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all duration-300
                          ${isCurrent 
                            ? `border-${st === 'nuevo' ? 'blue' : st === 'proceso' ? 'orange' : 'emerald'}-500 bg-secondary shadow-sm shadow-black/5` 
                            : 'border-transparent bg-secondary/30 hover:bg-secondary/60 hover:border-border text-muted-foreground group'}
                          ${loading ? 'ring-2 ring-border' : ''}
                        `}
                      >
                        <span className={`text-base transition-transform duration-300 ${isCurrent ? 'scale-110' : 'grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0'}`}>
                          {info.icon}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${isCurrent ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/70'}`}>
                          {st === 'terminado' ? 'Listo' : st === 'proceso' ? 'Proceso' : 'Nuevo'}
                        </span>
                        
                        {loading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-[1px] rounded-[14px] z-20">
                            <Loader2 size={14} className="animate-spin text-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center py-1">
                   <div className="p-2 bg-orange-500/10 rounded-xl mb-2">
                     <Warehouse className="text-orange-600 dark:text-orange-400" size={20} />
                   </div>
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">
                    {type === 'suggestion' ? 'SUGERENCIA OSM' : 'ALMACÉN LOGÍSTICA'}
                   </span>
                </div>
                {type === 'suggestion' && onAddSuggestion && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSuggestion(location);
                    }}
                    className="w-full mt-4 py-3 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Agregar a mis Storages
                  </button>
                )}
              </>
            )}
          </div>

          <div className="px-5 py-4 space-y-4">
            {type === 'project' && onSearchNearby && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchNearby(location.lat, location.lng);
                }}
                disabled={isSearchingNearby}
                className={`
                  w-full py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 mb-4 border
                  ${isSearchingNearby 
                    ? 'bg-muted text-muted-foreground border-transparent' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700 shadow-lg shadow-blue-500/20'}
                `}
              >
                {isSearchingNearby ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                {isSearchingNearby ? 'Buscando...' : 'Buscar Storages Cercanos'}
              </button>
            )}

            <div className="flex items-center gap-3 px-1">
              <div className="p-2 bg-secondary rounded-xl text-foreground shrink-0 border border-border">
                <MapPin size={14} />
              </div>
              <p className="text-[10px] font-black text-foreground leading-tight">
                {location.address}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex gap-2">
                <a 
                  href={directionsUrl.google} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-secondary border border-border rounded-2xl transition-all hover:bg-card hover:border-blue-500/30 hover:shadow-lg active:scale-95 group"
                >
                  <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Navigation size={14} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Google</span>
                </a>
                
                <a 
                  href={directionsUrl.apple} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-secondary border border-border rounded-2xl transition-all hover:bg-card hover:shadow-lg active:scale-95 group"
                >
                  <div className="p-2 bg-muted dark:bg-slate-800 rounded-xl text-foreground dark:text-white group-hover:bg-foreground dark:group-hover:bg-white group-hover:text-background dark:group-hover:text-black transition-colors">
                    <AppleIcon size={14} strokeWidth={2.5} fill="currentColor" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Apple</span>
                </a>

                <a 
                  href={directionsUrl.waze} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-secondary border border-border rounded-2xl transition-all hover:bg-card hover:border-cyan-500/30 hover:shadow-lg active:scale-95 group"
                >
                  <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                     <WazeIcon size={14} className="rotate-45" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Waze</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

MemoizedMarker.displayName = 'MemoizedMarker';

export default function MapMarkers({ 
  locations, 
  type, 
  onDeleteSuccess,
  selectedLocationId,
  onSearchNearby,
  isSearchingNearby,
  onAddSuggestion
}: MapMarkersProps) {
  const map = useMap();
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, LocationStatus>>({});

  useEffect(() => {
    if (selectedLocationId && markerRefs.current[selectedLocationId]) {
      const marker = markerRefs.current[selectedLocationId];
      const location = locations.find(loc => loc.id === selectedLocationId);
      
      if (location) {
        const offsetLng = location.lng + 0.003; 
        map.flyTo([location.lat, offsetLng], 15, { animate: true, duration: 1 });
        marker.openPopup();
      }
    }
  }, [selectedLocationId, locations, map]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) return;
    
    setIsDeleting(id);
    try {
      await locationService.deleteLocation(id);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: LocationStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticStatuses(prev => ({ ...prev, [id]: status }));
    setIsUpdating(`${id}-${status}`);
    
    try {
      await locationService.updateLocationStatus(id, status);
      setTimeout(() => {
        if (onDeleteSuccess) onDeleteSuccess();
      }, 500);
    } catch (error: any) {
      console.error('Update status error:', error);
      setOptimisticStatuses(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      alert('Error: ' + error.message);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <>
      {locations.map((location) => (
        <MemoizedMarker
          key={location.id}
          location={location}
          type={type}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          isDeleting={isDeleting === location.id}
          isUpdating={isUpdating?.startsWith(`${location.id}-`) ? isUpdating.split('-')[1] : null}
          optimisticStatus={optimisticStatuses[location.id]}
          setMarkerRef={(el) => {
            if (el) markerRefs.current[location.id] = el;
          }}
          onSearchNearby={onSearchNearby}
          isSearchingNearby={isSearchingNearby}
          onAddSuggestion={onAddSuggestion}
        />
      ))}
    </>
  );
}
