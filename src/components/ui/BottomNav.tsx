'use client';

import { Map as MapIcon, LayoutGrid, Plus, RefreshCw } from 'lucide-react';

interface BottomNavProps {
  activeView: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
  onAddClick: () => void;
  onRefreshClick: () => void;
  isRefreshing: boolean;
}

export default function BottomNav({ 
  activeView, 
  onViewChange, 
  onAddClick, 
  onRefreshClick,
  isRefreshing 
}: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-6 left-4 right-4 z-[2000] flex items-center justify-between bg-card/80 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-2xl safe-area-bottom ring-1 ring-black/5">
      <button 
        onClick={() => onViewChange('map')}
        className={`flex-1 flex flex-col items-center justify-center py-2 transition-all rounded-xl active:scale-95 ${
          activeView === 'map' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-inner' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <MapIcon size={20} className={activeView === 'map' ? 'scale-110 transition-transform' : ''} />
        <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Mapa</span>
      </button>

      <button 
        onClick={() => onViewChange('list')}
        className={`flex-1 flex flex-col items-center justify-center py-2 transition-all rounded-xl active:scale-95 ${
          activeView === 'list' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-inner' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutGrid size={20} className={activeView === 'list' ? 'scale-110 transition-transform' : ''} />
        <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Lista</span>
      </button>

      <div className="flex-none px-2">
        <button 
          onClick={onAddClick}
          className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-all hover:bg-blue-700 ring-4 ring-card"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      <button 
        onClick={onRefreshClick}
        disabled={isRefreshing}
        className="flex-1 flex flex-col items-center justify-center py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 active:scale-95 transition-all"
      >
        <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Refresh</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center py-2 text-muted-foreground pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-[8px] font-black">PRO</span>
        </div>
        <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-50">App</span>
      </div>
    </nav>
  );
}
