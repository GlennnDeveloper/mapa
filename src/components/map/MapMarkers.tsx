'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useState } from 'react';
import { Location, LocationStatus } from '@/types/location';
import { Home, Warehouse, MapPin, Navigation, Trash2, Loader2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { locationService } from '@/services/locationService';

interface MapMarkersProps {
  locations: Location[];
  type: 'project' | 'storage';
}

const getStatusColorHex = (status: string, type: 'project' | 'storage') => {
  if (type === 'storage') return '#ea580c'; // orange-600
  
  const s = status.toLowerCase();
  if (s === 'nuevo' || s === 'active') return '#2563eb'; // blue-600
  if (s === 'proceso') return '#d97706'; // amber-600
  if (s === 'terminado' || s === 'inactive') return '#059669'; // emerald-600
  return '#475569'; // slate-600
};

const createCustomIcon = (type: 'project' | 'storage', status: string) => {
  const color = getStatusColorHex(status, type);
  
  // Icon paths for house and warehouse
  const housePaths = `
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  `;
  
  const warehousePaths = `
    <path d="M3 21V8l9-4 9 4v13" />
    <path d="M13 13h4" />
    <path d="M13 17h4" />
    <path d="M13 9h4" />
    <path d="M21 21H3" />
    <path d="M9 11v10" />
  `;

  const innerIconPaths = type === 'project' ? housePaths : warehousePaths;

  // Single SVG for the entire marker - most robust way
  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 24 30" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.2))">
      <!-- Pin Back Shadow (Optional if filter is enough) -->
      <path 
        d="M12 28.5C17.3 22 21 16 21 11.5C21 6.1 16.4 1.5 12 1.5C7.6 1.5 3 6.1 3 11.5C3 16 6.7 22 12 28.5Z" 
        fill="white" 
      />
      
      <!-- Pin Border -->
      <path 
        d="M12 28.5C17.3 22 21 16 21 11.5C21 6.1 16.4 1.5 12 1.5C7.6 1.5 3 6.1 3 11.5C3 16 6.7 22 12 28.5Z" 
        fill="none" 
        stroke="${color}" 
        stroke-width="1"
        stroke-linejoin="round"
      />
      
      <!-- Icon Container (Ensures it's centered in the head) -->
      <g transform="translate(5.7, 4.5) scale(0.54)" stroke="${color}" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        ${innerIconPaths}
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svgMarkup,
    className: 'custom-div-icon',
    iconSize: [48, 60],
    iconAnchor: [24, 60],
    popupAnchor: [0, -50],
  });
};

export default function MapMarkers({ locations, type, onDeleteSuccess }: MapMarkersProps & { onDeleteSuccess?: () => void }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, LocationStatus>>({});

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) return;
    
    setIsDeleting(id);
    try {
      await locationService.deleteLocation(id);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      alert('Error: ' + (error as any).message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: LocationStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update
    setOptimisticStatuses(prev => ({ ...prev, [id]: status }));
    setIsUpdating(`${id}-${status}`);
    
    try {
      await locationService.updateLocationStatus(id, status);
      // Wait a bit to ensure the DB has settled before refreshing
      setTimeout(() => {
        if (onDeleteSuccess) onDeleteSuccess();
      }, 500);
    } catch (error: any) {
      console.error('Update status error:', error);
      // Revert optimistic update on error
      setOptimisticStatuses(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      
      const details = error.message || '';
      if (details.includes('invalid input value for enum')) {
        alert('👉 Error de Base de Datos: Necesitas habilitar los nuevos estados en Supabase.\n\nPor favor, ejecuta el comando SQL que te envié en el chat.');
      } else {
        alert('Error: ' + details);
      }
    } finally {
      setIsUpdating(null);
    }
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

  return (
    <>
      {locations.map((location) => {
        const directionsUrl = {
          google: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`,
          apple: `https://maps.apple.com/?daddr=${encodeURIComponent(location.address)}`,
          waze: `https://waze.com/ul?q=${encodeURIComponent(location.address)}&navigate=yes`,
        };

        const currentStatusStr = optimisticStatuses[location.id] || location.status;
        const currentStatus = getStatusInfo(currentStatusStr);
        
        // Generate dynamic icon based on status and type
        const icon = createCustomIcon(type, currentStatusStr);

        return (
          <Marker 
            key={location.id} 
            position={[location.lat, location.lng]} 
            icon={icon}
          >
            <Popup className="custom-popup">
              <div className="flex flex-col w-[280px] sm:w-[300px] bg-white overflow-hidden rounded-2xl shadow-2xl border border-slate-100 mx-auto">
                {/* Premium Header */}
                <div className="relative h-28 bg-slate-950 overflow-hidden">
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-blue-600 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[50px]"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-600 rounded-full translate-x-1/3 translate-y-1/3 blur-[40px]"></div>
                  </div>

                  <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30">
                          {type === 'project' ? 'PROYECTO' : 'ALMACÉN'}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(location.id, e)}
                        disabled={isDeleting === location.id}
                        className="p-2 bg-white/5 hover:bg-red-500/90 text-white rounded-xl transition-all active:scale-90 disabled:opacity-50 border border-white/5 hover:border-red-500/50"
                        title="Eliminar"
                      >
                         {isDeleting === location.id ? <Loader2 size={14} className="animate-spin text-white" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                    <h3 className="font-bold text-2xl text-white line-clamp-1 leading-none drop-shadow-sm text-left">{location.name}</h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-5 py-5 bg-white border-b border-slate-100">
                  {type === 'project' ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                          ESTADO DEL PROYECTO
                        </span>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-white shadow-lg shadow-black/5 ${currentStatus.color} animate-in zoom-in duration-300`}>
                          <span>{currentStatus.icon}</span>
                          {currentStatus.label.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {(['nuevo', 'proceso', 'terminado'] as LocationStatus[]).map((st) => {
                          const info = getStatusInfo(st);
                          const isCurrent = currentStatusStr.toLowerCase() === st || 
                                          (currentStatusStr.toLowerCase() === 'active' && st === 'nuevo');
                          const loading = isUpdating === `${location.id}-${st}`;
                          
                          return (
                            <button
                              key={st}
                              disabled={isCurrent || isUpdating !== null}
                              onClick={(e) => handleUpdateStatus(location.id, st, e)}
                              className={`
                                relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-300
                                ${isCurrent 
                                  ? `border-${st === 'nuevo' ? 'blue' : st === 'proceso' ? 'orange' : 'emerald'}-500 bg-${st === 'nuevo' ? 'blue' : st === 'proceso' ? 'orange' : 'emerald'}-50/50 shadow-sm` 
                                  : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200 text-slate-400 group'}
                                ${loading ? 'ring-2 ring-slate-200' : ''}
                              `}
                            >
                              <span className={`text-lg transition-transform duration-300 ${isCurrent ? 'scale-110' : 'grayscale opacity-40 group-hover:opacity-60 group-hover:grayscale-0'}`}>
                                {info.icon}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                                {st === 'terminado' ? 'Listo' : st === 'proceso' ? 'En Proceso' : 'Nuevo'}
                              </span>
                              
                              {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-[14px] z-20">
                                  <Loader2 size={16} className="animate-spin text-slate-900" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2">
                       <div className="p-3 bg-orange-50 rounded-2xl mb-3">
                         <Warehouse className="text-orange-600" size={24} />
                       </div>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ALMACÉN DE LOGÍSTICA</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <MapPin size={16} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-snug">
                        {location.address}
                      </p>
                    </div>

                    {location.description && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                        <p className="text-xs text-slate-500 leading-relaxed text-center">
                          "{location.description}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Tools */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation size={12} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ABRIR EN GPS
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <a 
                        href={directionsUrl.google} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center"
                      >
                        <span className="text-[10px] font-black text-slate-900 uppercase">Google</span>
                      </a>
                      <a 
                        href={directionsUrl.apple} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center"
                      >
                        <span className="text-[10px] font-black text-slate-900 uppercase">Apple</span>
                      </a>
                      <a 
                        href={directionsUrl.waze} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-[#f3f6f9] hover:bg-[#eceff3] border border-transparent rounded-xl transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center"
                      >
                        <span className="text-[10px] font-black text-[#33a6cc] uppercase">Waze</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
