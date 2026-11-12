import { describe, expect, it } from 'vitest';
import {
  buildProducts,
  decodeXml,
  normaliseGtin,
  normaliseStock,
  packCatalog,
  parseProduct,
  priceToCents,
  takeProducts,
  unpackCatalog,
  updateHistory,
} from './catalog-lib.mjs';

const block = (fields) =>
  `<Product>${Object.entries(fields)
    .map(([tag, value]) => `<${tag}>${value}</${tag}>`)
    .join('')}</Product>`;

const phone = {
  Category: 'Telefonid -> Nutitelefonid',
  Vendor: 'Apple',
  Name: 'Apple iPhone 15 128GB, must',
  Code: 'MTP03',
  GTIN: '0195949035982',
  Price: '839.9',
  InStore: '3-5 tööpäeva',
  URL: 'http://shop.example/iphone-15',
  Picture: 'http://shop.example/iphone-15.jpg',
};

describe('reading a feed', () => {
  it('reads one product row', () => {
    expect(parseProduct(block(phone), 'onoff')).toEqual({
      id: '195949035982',
      matched: true,
      store: 'onoff',
      name: 'Apple iPhone 15 128GB, must',
      brand: 'Apple',
      category: 'Nutitelefonid',
      image: 'https://shop.example/iphone-15.jpg',
      price: 83990,
      stock: '3-5d',
      url: 'https://shop.example/iphone-15',
    });
  });

  it('reads CDATA and XML entities', () => {
    expect(decodeXml('<![CDATA[Bang &amp; Olufsen]]>')).toBe('Bang & Olufsen');
    expect(decodeXml('a&#13;\n  b')).toBe('a b');
  });

  it('skips rows that cannot be sold', () => {
    expect(parseProduct(block({ ...phone, Price: '0' }), 'onoff')).toBeNull();
    expect(parseProduct(block({ ...phone, URL: '' }), 'onoff')).toBeNull();
    expect(parseProduct(block({ ...phone, InStore: 'Otsas' }), 'onoff')).toBeNull();
    expect(parseProduct(block({ ...phone, Category: 'Eemaldatud tooted' }), 'onoff')).toBeNull();
  });

  it('gives a product without a barcode an id that stays inside its store', () => {
    const row = parseProduct(block({ ...phone, GTIN: '', Code: '' }), 'laptopid');
    expect(row.matched).toBe(false);
    expect(row.id).toMatch(/^laptopid-/);
    expect(parseProduct(block({ ...phone, GTIN: '', Code: '' }), 'laptopid').id).toBe(row.id);
  });

  it('reads prices, barcodes, and stock texts in the forms stores use', () => {
    expect(priceToCents('1 079,00')).toBe(107900);
    expect(priceToCents('free')).toBe(0);
    expect(normaliseGtin('0195949035982')).toBe(normaliseGtin('195949035982'));
    expect(normaliseGtin('MYE73')).toBe('');
    expect(normaliseStock('Kohal')).toBe('now');
    expect(normaliseStock('Laos')).toBe('now');
    expect(normaliseStock('7-10 tp')).toBe('7-10d');
    expect(normaliseStock('Küsi müüjalt')).toBe('');
  });

  it('takes complete product blocks from a stream and keeps the unfinished rest', () => {
    const { blocks, rest } = takeProducts(`<Pricelist>${block(phone)}${block(phone)}<Product><Name>half`);
    expect(blocks).toHaveLength(2);
    expect(rest).toBe('<Product><Name>half');
  });
});

describe('building the catalog', () => {
  const row = (store, price, extra = {}) => ({
    ...parseProduct(block({ ...phone, Price: String(price) }), store),
    ...extra,
  });

  it('matches one product across stores by barcode, cheapest offer first', () => {
    const [product, ...others] = buildProducts([row('onoff', 839.9), row('photopoint', 839)]);
    expect(others).toHaveLength(0);
    expect(product.offers.map((o) => [o.store, o.price])).toEqual([
      ['photopoint', 83900],
      ['onoff', 83990],
    ]);
  });

  it('keeps the cheapest row when one store lists a product twice', () => {
    const [product] = buildProducts([row('photopoint', 900), row('photopoint', 850), row('onoff', 870)]);
    expect(product.offers.find((o) => o.store === 'photopoint').price).toBe(85000);
  });

  it('lists a single-store product only when it costs enough, and never from a marketplace', () => {
    expect(buildProducts([row('onoff', 29)])).toHaveLength(0);
    expect(buildProducts([row('onoff', 30)])).toHaveLength(1);
    expect(buildProducts([row('photopoint', 500)])).toHaveLength(0);
  });

  it('drops a match when the prices cannot be the same item', () => {
    expect(buildProducts([row('onoff', 839), row('photopoint', 19)])).toHaveLength(0);
  });

  it('packs and unpacks without losing data', () => {
    const products = buildProducts([row('onoff', 839.9), row('photopoint', 839)]);
    const round = unpackCatalog(packCatalog(products, '2026-11-12T03:00:00.000Z'));
    expect(round.products).toEqual(products);
  });
});

describe('price history', () => {
  const catalog = (generated, price) => ({
    generated,
    products: [{ id: 'a', offers: [{ store: 'onoff', price }] }],
  });

  it('records nothing on the first day or when the price is the same', () => {
    expect(updateHistory({}, null, catalog('', 100), '2026-11-13')).toEqual({});
    expect(updateHistory({}, catalog('2026-11-12T03:00:00Z', 100), catalog('', 100), '2026-11-13')).toEqual(
      {},
    );
  });

  it('records the old and the new price when a price changes', () => {
    const day2 = updateHistory({}, catalog('2026-11-12T03:00:00Z', 100), catalog('', 90), '2026-11-13');
    expect(day2).toEqual({
      a: {
        onoff: [
          ['2026-11-12', 100],
          ['2026-11-13', 90],
        ],
      },
    });
    const day3 = updateHistory(day2, catalog('2026-11-13T03:00:00Z', 90), catalog('', 95), '2026-11-14');
    expect(day3.a.onoff).toHaveLength(3);
    expect(day2.a.onoff).toHaveLength(2);
  });
});
