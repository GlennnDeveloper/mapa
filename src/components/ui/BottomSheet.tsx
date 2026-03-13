'use client';

import { useEffect, useState } from 'react';
import { X, Navigation, Apple as AppleIcon, Plane as WazeIcon, MapPin, Trash2, Loader2, Search, Plus } from 'lucide-react';
import { Location, LocationStatus } from '@/types/location';

interface BottomSheetProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: LocationStatus) => void;
  onSearchNearby: (lat: number, lng: number) => void;
  isSearchingNearby: boolean;
  onAddSuggestion?: (suggestion: Partial<Location>) => void;
  isDeleting: boolean;
  isUpdating: string | null;
  searchError: string | null;
}

export default function BottomSheet({
  location,
  isOpen,
  onClose,
  onDelete,
  onUpdateStatus,
  onSearchNearby,
  isSearchingNearby,
  onAddSuggestion,
  isDeleting,
  isUpdating,
  searchError
}: BottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;
  if (!location) return null;

  const directionsUrl = {
    google: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
    apple: `https://maps.apple.com/?daddr=${location.lat},${location.lng}`,
    waze: `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`,
  };

  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    'nuevo': { label: 'Nuevo', color: 'bg-blue-600', icon: '✨' },
    'proceso': { label: 'En Proceso', color: 'bg-amber-600', icon: '🚀' },
    'terminado': { label: 'Listo', color: 'bg-emerald-600', icon: '✅' },
    'active': { label: 'Activo', color: 'bg-blue-600', icon: '✨' },
    'inactive': { label: 'Finalizado', color: 'bg-slate-600', icon: '📁' },
  };

  const currentStatus = statusMap[location.status.toLowerCase()] || { label: location.status, color: 'bg-slate-500', icon: '📍' };

  return (
    <div className={`fixed inset-0 z-[3000] flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Sheet */}
      <div 
        className={`relative w-full max-w-lg bg-card rounded-t-[32px] shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div className="w-12 h-1.5 bg-muted rounded-full opacity-40" />
        </div>

        {/* Content */}
        <div className="px-6 pb-10 pt-2 max-h-[85vh] overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-md mb-2 inline-block">
                {location.type === 'project' ? 'PROYECTO' : location.type === 'storage' ? 'ALMACÉN' : 'SUGERENCIA'}
              </span>
              <h2 className="text-2xl font-black text-foreground tracking-tight">{location.name}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
             {/* Address Section */}
             <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-2xl border border-border">
                <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-snug">{location.address}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">Ubicación exacta</p>
                </div>
             </div>

             {/* Status Section for Projects */}
             {location.type === 'project' && (
               <div className="bg-secondary/30 rounded-2xl p-5 border border-border">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ESTADO ACTUAL</span>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg ${currentStatus.color}`}>
                      {currentStatus.label.toUpperCase()}
                    </span>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-3">
                    {(['nuevo', 'proceso', 'terminado'] as LocationStatus[]).map((st) => {
                      const isCurrent = location.status.toLowerCase() === st || (location.status.toLowerCase() === 'active' && st === 'nuevo');
                      const loading = isUpdating === st;
                      const info = statusMap[st];

                      return (
                        <button
                          key={st}
                          disabled={isCurrent || isUpdating !== null}
                          onClick={() => onUpdateStatus(location.id, st)}
                          className={`
                            relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300
                            ${isCurrent
                              ? `border-${st === 'nuevo' ? 'blue' : st === 'proceso' ? 'amber' : 'emerald'}-500 bg-card shadow-md`
                              : 'border-transparent bg-card/40 text-muted-foreground hover:border-border'}
                          `}
                        >
                          <span className={`text-xl ${isCurrent ? '' : 'grayscale opacity-40'}`}>{info.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tighter">{st === 'terminado' ? 'Listo' : st === 'proceso' ? 'Proceso' : 'Nuevo'}</span>
                          {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl">
                              <Loader2 size={16} className="animate-spin text-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                 </div>
               </div>
             )}

             {/* Directions Actions */}
             <div className="grid grid-cols-3 gap-4">
                <a href={directionsUrl.google} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-secondary rounded-2xl border border-border transition-all active:scale-95 group">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Navigation size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Google</span>
                </a>
                <a href={directionsUrl.apple} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-secondary rounded-2xl border border-border transition-all active:scale-95 group">
                  <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-2xl text-foreground group-hover:bg-foreground group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                    <AppleIcon size={20} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apple</span>
                </a>
                <a href={directionsUrl.waze} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-secondary rounded-2xl border border-border transition-all active:scale-95 group">
                  <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    <WazeIcon size={20} className="rotate-45" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Waze</span>
                </a>
             </div>

             <div className="flex flex-col gap-3">
               {location.type === 'storage' && (
                 <div className="flex flex-col gap-2">
                   {searchError && (
                     <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center animate-pulse">
                       {searchError}
                     </p>
                   )}
                   <button
                     onClick={() => onSearchNearby(location.lat, location.lng)}
                     disabled={isSearchingNearby}
                     className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                   >
                     {isSearchingNearby ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                     {isSearchingNearby ? 'Buscando...' : 'Buscar Almacenes Cercanos'}
                   </button>
                 </div>
               )}

               {location.type === 'suggestion' && onAddSuggestion && (
                 <button
                   onClick={() => onAddSuggestion(location)}
                   className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                 >
                   <Plus size={16} />
                   Agregar a mis ubicaciones
                 </button>
               )}

               {location.type !== 'suggestion' && (
                 <button
                   onClick={() => onDelete(location.id)}
                   disabled={isDeleting}
                   className="w-full py-4 bg-red-500/10 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-red-500/20"
                 >
                   {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                   Eliminar Ubicación
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
