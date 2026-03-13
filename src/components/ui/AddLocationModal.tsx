'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Home, Warehouse, Search } from 'lucide-react';
import { locationService } from '@/services/locationService';
import { LocationType, LocationStatus } from '@/types/location';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onProjectCreated?: (lat: number, lng: number) => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddLocationModal({ isOpen, onClose, onSuccess, onProjectCreated }: AddLocationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'project' as LocationType,
    status: 'nuevo' as LocationStatus,
    description: '',
    lat: null as number | null,
    lng: null as number | null
  });

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle address search with debounce
  useEffect(() => {
    if (!formData.address || formData.address.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const results = await locationService.getAddressSuggestions(formData.address);
      setSuggestions(results as Suggestion[]);
      setShowSuggestions(results.length > 0);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.address]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setFormData({
      ...formData,
      address: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalLat = formData.lat;
      let finalLng = formData.lng;

      // If no lat/lng were selected from autocomplete, try geocoding now
      if (!finalLat || !finalLng) {
        const coords = await locationService.geocodeAddress(formData.address);
        if (!coords) {
          throw new Error('No pudimos encontrar esa dirección. Intenta usar las sugerencias o ser más específico.');
        }
        finalLat = coords.lat;
        finalLng = coords.lng;
      }

      let finalName = formData.name;
      if (formData.type === 'storage' && !finalName) {
        // Use first part of address or just "Storage"
        finalName = formData.address.split(',')[0] || 'Storage';
      }

      await locationService.createLocation({
        name: finalName,
        address: formData.address,
        type: formData.type,
        status: formData.type === 'storage' ? 'nuevo' : formData.status,
        description: formData.description,
        lat: finalLat,
        lng: finalLng
      });

      onSuccess();
      
      // If it was a project, trigger the nearby search
      if (formData.type === 'project' && onProjectCreated && finalLat && finalLng) {
        onProjectCreated(finalLat, finalLng);
      }
      
      onClose();
      // Reset form
      setFormData({ name: '', address: '', type: 'project', status: 'nuevo', description: '', lat: null, lng: null });
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('invalid input value for enum')) {
        setError('👉 ERROR DE BASE DE DATOS: Necesitas activar los nuevos estados.\n\nPor favor, copia y pega el comando SQL que te envié en el chat dentro del "SQL Editor" de tu Dashboard de Supabase.');
      } else {
        setError(errorMessage || 'Error al guardar la ubicación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 flex flex-col max-h-[92vh] border border-border">
        {/* Handle for mobile */}
        <div className="sm:hidden flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-secondary rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-between px-8 py-4 border-b border-border">
          <h2 className="text-xl font-black text-foreground tracking-tight">Nuevo Punto</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-full transition-colors group"
          >
            <X size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Tipo de Ubicación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'project' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  formData.type === 'project' 
                    ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-900/20' 
                    : 'border-border bg-secondary/50 text-muted-foreground'
                }`}
              >
                <Home size={18} />
                <span className="font-bold text-sm">Proyecto</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'storage' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  formData.type === 'storage' 
                    ? 'border-orange-600 bg-orange-50/50 text-orange-600 dark:bg-orange-900/20' 
                    : 'border-border bg-secondary/50 text-muted-foreground'
                }`}
              >
                <Warehouse size={18} />
                <span className="font-bold text-sm">Storage</span>
              </button>
            </div>
          </div>

          {formData.type === 'project' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Estado Inicial</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'nuevo' })}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    formData.status === 'nuevo' 
                      ? 'border-blue-500 bg-blue-50/50 text-blue-600 dark:bg-blue-900/20' 
                      : 'border-border bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  Nuevo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'proceso' })}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    formData.status === 'proceso' 
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 dark:bg-orange-900/20' 
                      : 'border-border bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  En Proceso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'terminado' })}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    formData.status === 'terminado' 
                      ? 'border-green-500 bg-green-50/50 text-green-600 dark:bg-green-900/20' 
                      : 'border-border bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  Terminado
                </button>
              </div>
            </div>
          )}

          {formData.type === 'project' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Nombre del Proyecto</label>
            <input
                id="name"
                required={formData.type === 'project'}
                placeholder="Ej: Mudanza Familia Smith"
                className="w-full p-4 bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-card transition-all font-bold text-foreground shadow-sm outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2 relative" ref={suggestionsRef}>
            <label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Dirección Exacta</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="address"
                required
                autoComplete="off"
                placeholder="Busca una dirección..."
                className="w-full p-4 pl-12 bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-card transition-all font-bold text-sm shadow-sm outline-none text-foreground"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value, lat: null, lng: null })}
              />
              {searchLoading && (
                <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[10001] left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-100">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-secondary border-b border-border last:border-0 transition-colors flex items-start gap-3"
                  >
                    <Search size={14} className="mt-1 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground line-clamp-2 leading-tight">
                      {s.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="desc" className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas (Opcional)</label>
            <textarea
              id="desc"
              rows={2}
              placeholder="Detalles adicionales..."
              className="w-full p-4 bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-card transition-all font-bold text-sm shadow-sm outline-none text-foreground"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-foreground text-background rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Ubicación</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
