'use client';

import { useLocations } from '@/hooks/useLocations';
import MapLoader from '@/components/map/MapLoader';
import { LayoutGrid, Map as MapIcon, RefreshCw, Plus, X } from 'lucide-react';
import { useState } from 'react';
import AddLocationModal from '@/components/ui/AddLocationModal';

export default function Home() {
  const { locations, loading, error, refresh } = useLocations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Add Location Modal */}
      <AddLocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refresh()} 
      />

      <header className="px-4 py-4 md:px-8 md:py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <MapIcon className="text-blue-600 shrink-0" size={24} />
              <span className="truncate">Logística Mudanzas</span>
            </h1>

            {/* Mobile List Toggle */}
            <button 
              onClick={() => setIsMobileListOpen(!isMobileListOpen)}
              className="md:hidden flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 transition-all border border-slate-200 dark:border-slate-700"
            >
              {isMobileListOpen ? (
                <>
                  <MapIcon size={14} />
                  <span>Ver Mapa</span>
                </>
              ) : (
                <>
                  <LayoutGrid size={14} />
                  <span>Ver Lista</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => refresh()}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={14} />
              Nuevo
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-4 gap-0 md:gap-6 md:p-8 max-w-7xl mx-auto w-full relative">
        {/* Mobile Stats Summary - Only 1 line on mobile */}
        <div className="md:hidden flex overflow-x-auto gap-3 px-4 py-4 bg-slate-50/50 no-scrollbar">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[140px] flex-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <LayoutGrid size={16} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Proyectos</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {locations.filter(l => l.type === 'project').length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[140px] flex-1">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg">
              <LayoutGrid size={16} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Storages</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {locations.filter(l => l.type === 'storage').length}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop or Toggle on Mobile */}
        <aside className={`
          ${isMobileListOpen ? 'flex' : 'hidden'} 
          md:flex flex-col gap-6 md:col-span-1 
          fixed md:relative inset-0 md:inset-auto z-[1100] md:z-auto 
          bg-slate-50 dark:bg-slate-950 md:bg-transparent
          p-4 md:p-0 pt-20 md:pt-0 overflow-y-auto
        `}>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileListOpen(false)}
            className="md:hidden absolute top-4 right-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-slate-600 active:scale-90 transition-all z-[1200]"
          >
            <X size={20} />
          </button>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm md:flex flex-col hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resumen General</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/20">
                <div className="text-blue-700 dark:text-blue-400 text-sm font-semibold">Proyectos</div>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                  {locations.filter(l => l.type === 'project').length}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/20">
                <div className="text-violet-700 dark:text-violet-400 text-sm font-semibold">Storages</div>
                <div className="text-2xl font-black text-violet-900 dark:text-violet-100">
                  {locations.filter(l => l.type === 'storage').length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-0">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ubicaciones</h2>
            <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Projects Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <LayoutGrid size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Proyectos</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">
                        {locations.filter(l => l.type === 'project').length}
                      </span>
                    </div>
                    
                    {locations.filter(l => l.type === 'project').length === 0 ? (
                      <div className="p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-center">
                        <p className="text-[10px] font-medium text-slate-400">No hay proyectos activos</p>
                      </div>
                    ) : (
                      locations.filter(l => l.type === 'project').map(location => (
                        <div 
                          key={location.id} 
                          onClick={() => {
                            setSelectedLocationId(location.id);
                            setIsMobileListOpen(false);
                          }}
                          className={`flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                            selectedLocationId === location.id ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg shrink-0">
                            <LayoutGrid size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                              {location.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{location.address}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Storage Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                        <LayoutGrid size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Almacenes</span>
                      </div>
                      <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold rounded-full">
                        {locations.filter(l => l.type === 'storage').length}
                      </span>
                    </div>

                    {locations.filter(l => l.type === 'storage').length === 0 ? (
                      <div className="p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-center">
                        <p className="text-[10px] font-medium text-slate-400">No hay almacenes registrados</p>
                      </div>
                    ) : (
                      locations.filter(l => l.type === 'storage').map(location => (
                        <div 
                          key={location.id} 
                          onClick={() => {
                            setSelectedLocationId(location.id);
                            setIsMobileListOpen(false);
                          }}
                          className={`flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                            selectedLocationId === location.id ? 'bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500/20 border-l-4 border-violet-500' : ''
                          }`}
                        >
                          <div className="p-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg shrink-0">
                            <LayoutGrid size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-violet-600 transition-colors">
                              {location.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{location.address}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Map Area - Main focus on mobile */}
        <section className={`
          md:col-span-3 h-[calc(100vh-200px)] md:h-full 
          bg-white dark:bg-slate-900 md:rounded-2xl border-t md:border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col
          ${isMobileListOpen ? 'hidden md:flex' : 'flex'}
        `}>
          {error ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full inline-block mb-4 text-red-600">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Error al cargar datos</h3>
                <p className="text-slate-500 mb-6">No pudimos conectar con Supabase. Verifica tus variables de entorno.</p>
                <button 
                  onClick={() => refresh()}
                  className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <MapLoader 
              locations={locations} 
              onDeleteSuccess={() => refresh()} 
              selectedLocationId={selectedLocationId}
            />
          )}
        </section>
      </div>
    </main>
  );
}
