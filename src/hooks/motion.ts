import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/**
 * Runs a state update inside a View Transition when the browser supports it,
 * so big state changes (locale, loading, empty) morph instead of jumping.
 */
export function withViewTransition(update: () => void): void {
  if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
