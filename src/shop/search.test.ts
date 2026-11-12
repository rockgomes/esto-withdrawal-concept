import { describe, expect, it } from 'vitest';
import { NO_FILTERS, search } from './search';
import { testCatalog } from './testCatalog';

const { products } = testCatalog();
const names = (query: string, filters = NO_FILTERS, sort?: Parameters<typeof search>[3]) =>
  search(products, query, filters, sort).map((p) => p.id);

describe('search', () => {
  it('needs every word, in any order and any case', () => {
    expect(names('17 IPHONE apple')).toEqual(['1']);
    expect(names('iphone nokia')).toEqual([]);
  });

  it('puts the phone above its accessories', () => {
    expect(names('iphone 17')).toEqual(['1', '2']);
  });

  it('finds a product by its category', () => {
    expect(names('televiisor')).toEqual(['3']);
  });

  it('shows everything for an empty search', () => {
    expect(names('')).toHaveLength(3);
  });

  it('filters by stores, stock, and price', () => {
    expect(names('', { ...NO_FILTERS, compare: true })).toEqual(['1']);
    expect(names('', { ...NO_FILTERS, inStock: true })).toEqual(['1', '2']);
    expect(names('', { ...NO_FILTERS, maxPrice: 118_000 })).toEqual(['1', '2']);
  });

  it('sorts by price both ways', () => {
    expect(names('', NO_FILTERS, 'price-asc')).toEqual(['2', '1', '3']);
    expect(names('', NO_FILTERS, 'price-desc')).toEqual(['3', '1', '2']);
  });
});
