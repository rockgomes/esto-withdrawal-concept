import { describe, expect, it } from 'vitest';
import { lowestPrice } from './catalog';
import { testCatalog } from './testCatalog';
import { priceDrops, toggleWatch, withSimulatedDrop } from './watch';

describe('price watch', () => {
  const catalog = testCatalog();
  const phone = catalog.byId.get('1')!;

  it('starts and stops watching a product at its lowest price', () => {
    const on = toggleWatch([], phone, '2026-11-12');
    expect(on).toEqual([{ id: '1', price: 107_900, since: '2026-11-12' }]);
    expect(toggleWatch(on, phone, '2026-11-13')).toEqual([]);
  });

  it('reports no alert while the price is the same or higher', () => {
    expect(priceDrops([{ id: '1', price: 107_900, since: '2026-11-12' }], catalog)).toEqual([]);
    expect(priceDrops([{ id: '1', price: 100_000, since: '2026-11-12' }], catalog)).toEqual([]);
  });

  it('reports an alert when any store goes under the watched price', () => {
    const [drop] = priceDrops([{ id: '1', price: 115_000, since: '2026-11-01' }], catalog);
    expect(drop).toMatchObject({ was: 115_000, now: 107_900, saved: 7_100 });
  });

  it('ignores a watched product that left the feeds', () => {
    expect(priceDrops([{ id: 'gone', price: 1, since: '2026-11-01' }], catalog)).toEqual([]);
  });

  it('simulates a lower price without changing the real catalog', () => {
    const lower = withSimulatedDrop(catalog, '1', 8);
    expect(lowestPrice(lower.byId.get('1')!)).toBeLessThan(107_900);
    expect(lowestPrice(catalog.byId.get('1')!)).toBe(107_900);
    expect(lower.byId.get('2')).toBe(catalog.byId.get('2'));
  });
});
