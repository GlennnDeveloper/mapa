'use client';

import { useLocations } from '@/hooks/useLocations';
import MapLoader from '@/components/map/MapLoader';
import { LayoutGrid, Map as MapIcon, RefreshCw, Plus, X } from 'lucide-react';
import { useState } from 'react';
import AddLocationModal from '@/components/ui/AddLocationModal';

import BottomNav from '@/components/ui/BottomNav';
import { Search, Filter, Trash2 } from 'lucide-react';

export default function Home() {
  const { locations, loading, error, refresh } = useLocations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'project' | 'storage'>('all');

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          loc.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || loc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Add Location Modal */}
      <AddLocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refresh()} 
      />

      {/* Header - Compact on mobile */}
      <header className="px-5 py-4 md:px-8 md:py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-[1000] backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <MapIcon className="text-white shrink-0" size={18} />
            </div>
            <span className="truncate hidden sm:inline">Logística Mudanzas</span>
            <span className="truncate sm:hidden">Logística</span>
          </h1>

          <div className="flex items-center gap-3">
             {/* Desktop Stats Summary */}
            <div className="hidden md:flex items-center gap-4 mr-4 border-r border-slate-200 dark:border-slate-800 pr-6">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proyectos</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{locations.filter(l => l.type === 'project').length}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storages</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{locations.filter(l => l.type === 'storage').length}</div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => refresh()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus size={14} />
                Nuevo
              </button>
            </div>

            {/* Mobile Status Pill */}
            <div className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-full border border-blue-100/50 dark:border-blue-800/30">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
               <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-tighter">En Línea</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-4 gap-0 md:gap-8 md:p-8 max-w-[1600px] mx-auto w-full relative">
        
        {/* Sidebar - Desktop or Toggle on Mobile */}
        <aside className={`
          ${activeMobileView === 'list' ? 'flex' : 'hidden'} 
          md:flex flex-col gap-6 md:col-span-1 
          h-[calc(100vh-80px)] md:h-auto
          bg-slate-50 dark:bg-slate-950 md:bg-transparent
          p-5 md:p-0 overflow-hidden
        `}>
          {/* Dashboard Stats (Desktop only) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:flex flex-col hidden overflow-hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dashboard</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="text-blue-600 dark:text-blue-400 mb-1">
                    <LayoutGrid size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                  {locations.filter(l => l.type === 'project').length}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Proyectos</div>
              </div>
              <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="text-violet-600 dark:text-violet-400 mb-1">
                    <LayoutGrid size={18} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">
                  {locations.filter(l => l.type === 'storage').length}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Storages</div>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ubicaciones</h2>
                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">{filteredLocations.length}</span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4 group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o dirección..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold transition-all focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 no-scrollbar">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border ${
                  filterType === 'all' 
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' 
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterType('project')}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border ${
                  filterType === 'project' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-blue-200'
                }`}
              >
                Proyectos
              </button>
              <button 
                onClick={() => setFilterType('storage')}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border ${
                  filterType === 'storage' 
                    ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20' 
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-violet-200'
                }`}
              >
                Storages
              </button>
            </div>
            
            <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : filteredLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 mb-4">
                    <Search size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin resultados</p>
                  <p className="text-[10px] text-slate-400 mt-1">Prueba con otra búsqueda</p>
                </div>
              ) : (
                <>
                  {/* Projects Section */}
                  {(filterType === 'all' || filterType === 'project') && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3 pl-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                           <span className="text-[10px] font-black uppercase tracking-widest">PROYECTOS</span>
                      </div>
                      
                      {filteredLocations.filter(l => l.type === 'project').length === 0 ? (
                        <p className="text-[10px] text-slate-300 font-bold uppercase pl-1">No hay proyectos</p>
                      ) : (
                        filteredLocations.filter(l => l.type === 'project').map(location => (
                          <div 
                            key={location.id} 
                            onClick={() => {
                              setSelectedLocationId(location.id);
                              if (window.innerWidth < 768) setActiveMobileView('map');
                            }}
                            className={`flex gap-3 items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group border ${
                              selectedLocationId === location.id 
                                  ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-sm' 
                                  : 'border-transparent'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                                selectedLocationId === location.id ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            }`}>
                              <LayoutGrid size={16} />
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate transition-colors group-hover:text-blue-600">
                                {location.name}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-500 truncate leading-relaxed">{location.address}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Storage Section */}
                  {(filterType === 'all' || filterType === 'storage') && (
                    <div className={`space-y-2 ${filterType === 'all' ? 'mt-8' : ''}`}>
                       <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-3 pl-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                           <span className="text-[10px] font-black uppercase tracking-widest">ALMACENES</span>
                      </div>

                      {filteredLocations.filter(l => l.type === 'storage').length === 0 ? (
                        <p className="text-[10px] text-slate-300 font-bold uppercase pl-1">No hay almacenes</p>
                      ) : (
                        filteredLocations.filter(l => l.type === 'storage').map(location => (
                          <div 
                            key={location.id} 
                            onClick={() => {
                              setSelectedLocationId(location.id);
                              if (window.innerWidth < 768) setActiveMobileView('map');
                            }}
                            className={`flex gap-3 items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group border ${
                              selectedLocationId === location.id 
                                  ? 'bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/50 shadow-sm' 
                                  : 'border-transparent'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                                selectedLocationId === location.id ? 'bg-violet-600 text-white' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600'
                            }`}>
                              <LayoutGrid size={16} />
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate transition-colors group-hover:text-violet-600">
                                {location.name}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-500 truncate leading-relaxed">{location.address}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Map Area - Main focus on mobile */}
        <section className={`
          md:col-span-3 h-[calc(100vh-140px)] md:h-[calc(100vh-140px)]
          bg-white dark:bg-slate-900 md:rounded-3xl border-t md:border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col
          ${activeMobileView === 'list' ? 'hidden md:flex' : 'flex'}
        `}>
          {error ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center bg-red-50/10">
              <div className="max-w-md">
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-full inline-block mb-4 text-red-600">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Error de Conexión</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">No pudimos conectar con la base de datos de Supabase. Revisa tu conexión.</p>
                <button 
                  onClick={() => refresh()}
                  className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold shadow-xl shadow-black/10 transition-all active:scale-95"
                >
                  Reintentar Ahora
                </button>
              </div>
            </div>
          ) : (
            <MapLoader 
              locations={filteredLocations} 
              onDeleteSuccess={() => refresh()} 
              selectedLocationId={selectedLocationId}
            />
          )}
        </section>
      </div>

      {/* Mobile Navigation */}
      <BottomNav 
        activeView={activeMobileView} 
        onViewChange={(view) => setActiveMobileView(view)} 
        onAddClick={() => setIsModalOpen(true)}
        onRefreshClick={() => refresh()}
        isRefreshing={loading}
      />
    </main>
  );
}
