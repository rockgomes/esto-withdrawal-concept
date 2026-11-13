import type { Cents } from '../lib/money';
import { lowestPrice, type Catalog, type Product } from './catalog';

/** A product the customer asked to be told about when its price goes down. */
export interface Watch {
  id: string;
  /** Lowest price across stores at the moment the customer started watching. */
  price: Cents;
  since: string;
}

export interface PriceDrop {
  product: Product;
  was: Cents;
  now: Cents;
  saved: Cents;
}

export function toggleWatch(watches: Watch[], product: Product, today: string): Watch[] {
  if (watches.some((w) => w.id === product.id)) return watches.filter((w) => w.id !== product.id);
  return [...watches, { id: product.id, price: lowestPrice(product), since: today }];
}

/** Watched products whose lowest price is now under the price at the time of watching. Biggest saving first. */
export function priceDrops(watches: Watch[], catalog: Catalog): PriceDrop[] {
  const drops: PriceDrop[] = [];
  for (const watch of watches) {
    const product = catalog.byId.get(watch.id);
    if (!product) continue;
    const now = lowestPrice(product);
    if (now < watch.price) drops.push({ product, was: watch.price, now, saved: watch.price - now });
  }
  return drops.sort((a, b) => b.saved - a.saved);
}

const KEY = 'shop.watches.v1';

export function readWatches(): Watch[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is Watch =>
        typeof w === 'object' &&
        w !== null &&
        typeof (w as Watch).id === 'string' &&
        typeof (w as Watch).price === 'number' &&
        typeof (w as Watch).since === 'string',
    );
  } catch {
    return [];
  }
}

export function saveWatches(watches: Watch[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(watches));
  } catch {
    // Storage blocked: the watch list lives for this visit only.
  }
}

/**
 * Demo only: a copy of the catalog where one product's offers cost less, as
 * if tomorrow's feed had a lower price. The real catalog is not changed.
 */
export function withSimulatedDrop(catalog: Catalog, productId: string, percent: number): Catalog {
  const target = catalog.byId.get(productId);
  if (!target) return catalog;
  const cheaper: Product = {
    ...target,
    offers: target.offers.map((o, i) =>
      i === 0 ? { ...o, price: Math.round((o.price * (100 - percent)) / 100 / 100) * 100 - 1 } : o,
    ),
  };
  cheaper.offers.sort((a, b) => a.price - b.price);
  const products = catalog.products.map((p) => (p.id === productId ? cheaper : p));
  return { ...catalog, products, byId: new Map(products.map((p) => [p.id, p])) };
}
