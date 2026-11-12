/**
 * The concept ships in two phases. The bar above the app switches between
 * them, so a reviewer can see what each phase gives the customer.
 */
export type Phase = 1 | 2;

export interface PhaseInfo {
  id: Phase;
  name: string;
  customer: string;
  esto: string;
  stores: string;
}

export const PHASES: PhaseInfo[] = [
  {
    id: 1,
    name: 'Shop and price alerts',
    customer:
      'Real store prices, their own monthly price, and price alerts. They pay at the store, as today.',
    esto: 'The Shop section in the app, and a daily job that reads the store feeds.',
    stores: 'Nothing new. These feeds are already public.',
  },
  {
    id: 2,
    name: 'Credit line at checkout',
    customer: 'They pay from the credit line at the store checkout. No application and no new contract.',
    esto: '"Credit line" as a new method on its own checkout page.',
    stores:
      'Not confirmed. ESTO says its payment page shows every method enabled on the store account, so it may be nothing.',
  },
];

export const DEFAULT_PHASE: Phase = 2;

export function readPhase(): Phase {
  const value = new URLSearchParams(window.location.search).get('phase');
  return value === '1' ? 1 : value === '2' ? 2 : DEFAULT_PHASE;
}

/** Keeps the phase in the address, so a link opens the same phase. */
export function writePhase(phase: Phase): void {
  const url = new URL(window.location.href);
  url.searchParams.set('phase', String(phase));
  window.history.replaceState(null, '', url);
}
