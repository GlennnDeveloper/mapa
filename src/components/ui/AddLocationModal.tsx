'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Home, Warehouse, Search } from 'lucide-react';
import { locationService } from '@/services/locationService';
import { LocationType, LocationStatus } from '@/types/location';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddLocationModal({ isOpen, onClose, onSuccess }: AddLocationModalProps) {
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Punto Logístico</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Ubicación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'project' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  formData.type === 'project' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50'
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
                    ? 'border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-900/20' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50'
                }`}
              >
                <Warehouse size={18} />
                <span className="font-bold text-sm">Storage</span>
              </button>
            </div>
          </div>

          {formData.type === 'project' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Estado Inicial</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'nuevo' })}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    formData.status === 'nuevo' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20' 
                      : 'border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50'
                  }`}
                >
                  Nuevo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'proceso' })}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    formData.status === 'proceso' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20' 
                      : 'border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50'
                  }`}
                >
                  En Proceso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'terminado' })}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition-all ${
                    formData.status === 'terminado' 
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20' 
                      : 'border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50'
                  }`}
                >
                  Terminado
                </button>
              </div>
            </div>
          )}

          {formData.type === 'project' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre del Proyecto</label>
              <input
                id="name"
                required={formData.type === 'project'}
                placeholder="Ej: Mudanza Familia Smith"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 dark:text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2 relative" ref={suggestionsRef}>
            <label htmlFor="address" className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección Exacta</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="address"
                required
                autoComplete="off"
                placeholder="Busca una dirección..."
                className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value, lat: null, lng: null })}
              />
              {searchLoading && (
                <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[10001] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-100">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors flex items-start gap-3"
                  >
                    <Search size={14} className="mt-1 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 leading-tight">
                      {s.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="desc" className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Notas (Opcional)</label>
            <textarea
              id="desc"
              rows={2}
              placeholder="Detalles adicionales..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
