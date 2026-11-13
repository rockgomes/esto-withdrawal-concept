import type { Cents } from '../lib/money';
import { lowestPrice, type Product } from './catalog';

export type SortKey = 'relevance' | 'price-asc' | 'price-desc';

export interface Filters {
  /** Only products that two or more stores sell. */
  compare: boolean;
  /** Only products with at least one offer in stock now. */
  inStock: boolean;
  /** Only products whose lowest price is at or under this amount. Null means no limit. */
  maxPrice: Cents | null;
}

export const NO_FILTERS: Filters = { compare: false, inStock: false, maxPrice: null };

export function tokens(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * How well a product answers the words a person typed. Zero means no match.
 * Every word must be found. A word in the product name counts more than a
 * word that is only in the brand or category, and a name that starts with
 * the query counts most.
 */
export function score(product: Product, words: string[]): number {
  if (words.length === 0) return 1;
  let total = 0;
  for (const word of words) {
    if (!product.haystack.includes(word)) return 0;
    total += product.nameLower.includes(word) ? 2 : 1;
  }
  if (product.nameLower.startsWith(words.join(' '))) total += 2;
  return total;
}

function passes(product: Product, filters: Filters): boolean {
  if (filters.compare && product.offers.length < 2) return false;
  if (filters.inStock && !product.offers.some((o) => o.stock === 'now')) return false;
  if (filters.maxPrice !== null && lowestPrice(product) > filters.maxPrice) return false;
  return true;
}

/**
 * Relevance order: best word match first, then products that more stores
 * sell, then the more expensive product. The last rule keeps a phone above
 * its cases and cables, which share its name.
 */
export function search(
  products: Product[],
  query: string,
  filters: Filters = NO_FILTERS,
  sort: SortKey = 'relevance',
): Product[] {
  const words = tokens(query);
  const hits: { product: Product; score: number }[] = [];
  for (const product of products) {
    if (!passes(product, filters)) continue;
    const s = score(product, words);
    if (s > 0) hits.push({ product, score: s });
  }

  if (sort === 'price-asc') hits.sort((a, b) => lowestPrice(a.product) - lowestPrice(b.product));
  else if (sort === 'price-desc') hits.sort((a, b) => lowestPrice(b.product) - lowestPrice(a.product));
  else
    hits.sort(
      (a, b) =>
        b.score - a.score ||
        b.product.offers.length - a.product.offers.length ||
        lowestPrice(b.product) - lowestPrice(a.product),
    );

  return hits.map((h) => h.product);
}
