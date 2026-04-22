'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-500/50 hover:text-slate-900 dark:border-slate-600/50 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-white sm:px-4"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" strokeWidth={2} />
      )}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
