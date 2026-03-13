'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-2 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  const themes = [
    { name: 'light', icon: Sun, label: 'Claro' },
    { name: 'dark', icon: Moon, label: 'Oscuro' },
    { name: 'system', icon: Monitor, label: 'Sistema' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-2xl border border-border shadow-inner">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.name;
        
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`
              flex items-center justify-center p-2 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-card text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/5' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-secondary/50'}
            `}
            title={t.label}
          >
            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
}
