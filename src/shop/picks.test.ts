import { describe, expect, it } from 'vitest';
import type { Product } from './catalog';
import { rulerPicks } from './picks';

function product(id: string, price: number, stores = 2, image = 'x.jpg'): Product {
  const offers = Array.from({ length: stores }, (_, i) => ({
    store: { id: `s${i}`, name: `S${i}`, site: '' },
    price: price + i,
    stock: 'now',
    url: '',
  }));
  return { id, name: id, brand: '', category: '', image, offers, haystack: id, nameLower: id };
}

describe('rulerPicks', () => {
  it('takes one product for each price step, lowest first', () => {
    const picks = rulerPicks([product('c', 120_000), product('a', 20_000), product('b', 70_000)], 150_000, 3);
    expect(picks.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('prefers the product that more stores sell, and skips products it cannot show', () => {
    const picks = rulerPicks(
      [
        product('two', 20_000, 2),
        product('three', 21_000, 3),
        product('no-image', 22_000, 5, ''),
        product('one-store', 23_000, 1),
      ],
      150_000,
      3,
    );
    expect(picks.map((p) => p.id)).toEqual(['three']);
  });
});
