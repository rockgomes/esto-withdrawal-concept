/**
 * The concept ships in two phases. The start page explains them, and each
 * phase opens the same prototype with a different buy step.
 */
export type Phase = 1 | 2;

export interface PhaseInfo {
  id: Phase;
  name: string;
  /** The customer's path, as short steps. */
  flow: string[];
  customer: string;
  esto: string;
  stores: string;
}

export const PHASES: PhaseInfo[] = [
  {
    id: 1,
    name: 'Product search and price alerts',
    flow: ['Search', 'Your monthly price', 'Price alert', 'Buy at the store'],
    customer:
      'Real store prices, their own monthly price, and price alerts. They buy and pay at the store, as today.',
    esto: 'A "Find products" section in the app, and a daily job that reads the store feeds.',
    stores: 'Nothing new. These feeds are already public.',
  },
  {
    id: 2,
    name: 'Credit line at checkout',
    flow: ['Store checkout', 'ESTO: Credit line', 'Paid'],
    customer: 'At the store checkout, they pay from the credit line. No application and no new contract.',
    esto: '"Credit line" as a new method on its own checkout page.',
    stores:
      'Not confirmed. ESTO says its payment page shows every method enabled on the store account, so it may be nothing.',
  },
];

/** The phase in the address. Without one, the start page shows. */
export function readPhase(): Phase | null {
  const value = new URLSearchParams(window.location.search).get('phase');
  return value === '1' ? 1 : value === '2' ? 2 : null;
}

/** Keeps the phase in the address, so a link opens the same view and Back works. */
export function writePhase(phase: Phase | null, productId?: string, hash?: string): void {
  const url = new URL(window.location.href);
  if (phase === null) {
    url.searchParams.delete('phase');
    url.hash = '';
  } else {
    url.searchParams.set('phase', String(phase));
    if (productId) url.hash = `#/p/${encodeURIComponent(productId)}`;
    else if (hash) url.hash = hash;
  }
  window.history.pushState(null, '', url);
}
