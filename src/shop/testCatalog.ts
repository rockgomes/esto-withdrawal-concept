import { unpack, type Catalog, type PackedCatalog } from './catalog';

/** A tiny catalog in the real packed format, for tests. */
export const PACKED: PackedCatalog = {
  generated: '2026-11-12T03:15:00.000Z',
  stores: [
    { id: 'onoff', name: 'ONOFF', site: 'https://onoff.ee' },
    { id: 'photopoint', name: 'Photopoint', site: 'https://www.photopoint.ee' },
  ],
  products: [
    [
      '1',
      'Apple iPhone 17 256GB, must',
      'Apple',
      'Nutitelefonid',
      '',
      [
        [0, 107900, 'now', 'https://onoff.ee/iphone-17'],
        [1, 120900, '2-4d', 'https://www.photopoint.ee/iphone-17'],
      ],
    ],
    [
      '2',
      'Swissten iPhone 17 ekraanikaitseklaas',
      'Swissten',
      'Kaitseklaasid',
      '',
      [[0, 3500, 'now', 'https://onoff.ee/glass']],
    ],
    [
      '3',
      'Samsung QLED 55"',
      'Samsung',
      'Televiisorid',
      '',
      [[1, 249900, '7-10d', 'https://www.photopoint.ee/tv']],
    ],
  ],
  sources: [
    { store: 'onoff', rowsInFeed: 15386, usableRows: 15386 },
    { store: 'photopoint', rowsInFeed: 995714, usableRows: 975454 },
  ],
};

export function testCatalog(): Catalog {
  return unpack(PACKED);
}
