import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Storage can be blocked (private mode, strict settings). The system theme still works.
    return null;
  }
}

/**
 * Follows the system theme until the person picks one, then remembers it.
 * index.html applies the stored choice before first paint, so there is no flash.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => storedTheme() ?? systemTheme());

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved, but the switch still applies for this visit.
    }
    setThemeState(next);
  }, []);

  return [theme, setTheme] as const;
}
