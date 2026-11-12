/**
 * Pure logic for the product catalog: read store feeds in the Hinnavaatlus
 * "Pricelist" XML format, match the same product across stores by barcode
 * (GTIN), and keep a small, honest record of price changes.
 *
 * No network and no file access here, so every rule can be tested.
 */

/** Stores that publish an open feed and offer ESTO at checkout (checked 2026-11-12). */
export const STORES = [
  { id: 'onoff', name: 'ONOFF', site: 'https://onoff.ee', feed: 'https://onoff.ee/hinnavaatlus.xml' },
  {
    id: 'photopoint',
    name: 'Photopoint',
    site: 'https://www.photopoint.ee',
    feed: 'https://www.photopoint.ee/xml/hinnavaatlus.xml',
  },
  {
    id: 'digioutlet',
    name: 'Digioutlet',
    site: 'https://digioutlet.ee',
    feed: 'https://digioutlet.ee/export/hv.xml',
  },
  {
    id: 'apotheka',
    name: 'Apotheka',
    site: 'https://www.apotheka.ee',
    feed: 'https://www.apotheka.ee/media/feed/hinnavaatlus.xml',
  },
  { id: 'laureen', name: 'Laureen', site: 'https://laureen.ee', feed: 'https://laureen.ee/hinnakiri.xml' },
  { id: 'laptopid', name: 'Laptopid', site: 'https://laptopid.ee', feed: 'https://laptopid.ee/hinnavaatlus' },
];

/** A single-store product must cost at least this much to be listed. */
export const MIN_SINGLE_PRICE_CENTS = 3000;
/** Photopoint is a marketplace with about a million rows. Only its shared products are listed. */
export const SHARED_ONLY = new Set(['photopoint']);
/** If one store asks more than this many times another store's price, the barcode match is not trusted. */
export const MAX_PRICE_SPREAD = 3;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXml(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(x?)([0-9a-fA-F]+);/g, (_, hex, code) => String.fromCodePoint(parseInt(code, hex ? 16 : 10)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => ENTITIES[name])
    .replace(/\s+/g, ' ')
    .trim();
}

function field(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1]) : '';
}

/** "839,90" or "839.9" to 83990. Returns 0 when the text is not a price. */
export function priceToCents(text) {
  const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
}

/** Barcodes are compared without leading zeros, so EAN-13 and UPC-A forms of one code match. */
export function normaliseGtin(text) {
  const digits = text.trim();
  if (!/^\d{8,14}$/.test(digits)) return '';
  return digits.replace(/^0+/, '');
}

/** Stores write stock in their own words. Reduce it to "in stock" or a short delivery text. */
export function normaliseStock(text) {
  const t = text.trim().toLowerCase();
  if (!t) return '';
  if (/^(otsas|out of stock|läbi müüdud|pole saadaval)/.test(t)) return 'out';
  if (/^(kohal|laos|in stock|olemas|saadaval)/.test(t)) return 'now';
  const days = t.match(/(\d+)\s*-\s*(\d+)\s*(tööpäeva|tp|päeva|p\b)/);
  if (days) return `${days[1]}-${days[2]}d`;
  const one = t.match(/^(\d+)\s*(tööpäev|tp|päev)/);
  if (one) return `${one[1]}d`;
  return '';
}

function httpsUrl(url) {
  return url.replace(/^http:\/\//, 'https://');
}

/** Store categories that mean "no longer sold". ONOFF keeps such rows in its feed. */
const DELISTED_CATEGORY = /^eemaldatud tooted$/i;

/** A short, stable id for a product that has no barcode and no product code. */
export function hashText(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

/** One <Product> block to one offer row, or null when the row cannot be sold or matched. */
export function parseProduct(block, storeId) {
  const price = priceToCents(field(block, 'Price'));
  const url = field(block, 'URL') || field(block, 'ProductURL');
  const name = field(block, 'Name');
  if (!price || !url || !name) return null;

  const stock = normaliseStock(field(block, 'InStore'));
  const rawCategory = field(block, 'Category');
  if (stock === 'out' || DELISTED_CATEGORY.test(rawCategory)) return null;

  const gtin = normaliseGtin(field(block, 'GTIN'));
  const code = field(block, 'Code');
  // Without a barcode the product can still be listed, but only for its own store.
  const id = gtin || `${storeId}-${code || hashText(url)}`;

  return {
    id,
    matched: Boolean(gtin),
    store: storeId,
    name,
    brand: field(block, 'Vendor'),
    category:
      rawCategory
        .split(/\s*(?:->|>|\/)\s*/)
        .filter(Boolean)
        .pop() || '',
    image: httpsUrl(field(block, 'Picture')),
    price,
    stock,
    url: httpsUrl(url),
  };
}

/** Pulls complete <Product> blocks out of a growing text buffer. Returns the blocks and the unread rest. */
export function takeProducts(buffer) {
  const blocks = [];
  let from = 0;
  for (;;) {
    const end = buffer.indexOf('</Product>', from);
    if (end === -1) break;
    const start = buffer.indexOf('<Product>', from);
    if (start !== -1 && start < end) blocks.push(buffer.slice(start, end + 10));
    from = end + 10;
  }
  return { blocks, rest: buffer.slice(from) };
}

/**
 * Groups offer rows into products.
 * - One offer per store per product: the cheapest.
 * - A product is listed when two or more stores sell it, or when one store
 *   sells it for MIN_SINGLE_PRICE_CENTS or more (never for SHARED_ONLY stores).
 * - A product is dropped when store prices differ too much to be the same item.
 */
export function buildProducts(rows, storeOrder = STORES.map((s) => s.id)) {
  const rank = new Map(storeOrder.map((id, index) => [id, index]));
  const byId = new Map();

  for (const row of rows) {
    let product = byId.get(row.id);
    if (!product) {
      product = { id: row.id, offers: new Map(), rows: [] };
      byId.set(row.id, product);
    }
    const current = product.offers.get(row.store);
    if (!current || row.price < current.price) product.offers.set(row.store, row);
  }

  const products = [];
  for (const product of byId.values()) {
    const offers = [...product.offers.values()].sort(
      (a, b) => a.price - b.price || rank.get(a.store) - rank.get(b.store),
    );
    const min = offers[0].price;
    const max = offers[offers.length - 1].price;

    if (offers.length === 1) {
      if (SHARED_ONLY.has(offers[0].store) || min < MIN_SINGLE_PRICE_CENTS) continue;
    } else if (max / min > MAX_PRICE_SPREAD) {
      continue;
    }

    // Take the name, brand, and picture from the first store in storeOrder that has them.
    const byRank = [...offers].sort((a, b) => rank.get(a.store) - rank.get(b.store));
    const pick = (key) => byRank.find((o) => o[key])?.[key] ?? '';

    products.push({
      id: product.id,
      name: pick('name'),
      brand: pick('brand'),
      category: pick('category'),
      image: pick('image'),
      offers: offers.map((o) => ({ store: o.store, price: o.price, stock: o.stock, url: o.url })),
    });
  }

  // Most stores first, then cheapest first: a stable order for small diffs between days.
  return products.sort(
    (a, b) =>
      b.offers.length - a.offers.length || a.offers[0].price - b.offers[0].price || (a.id < b.id ? -1 : 1),
  );
}

/**
 * Compares yesterday's catalog with today's and appends real price changes.
 * history: { [productId]: { [storeId]: [[isoDate, cents], ...] } }
 * The first entry for an offer is the old price with the old date, so a
 * change always shows "from" and "to".
 */
export function updateHistory(history, previous, next, today) {
  const result = structuredClone(history ?? {});
  if (!previous) return result;

  const oldPrices = new Map();
  for (const product of previous.products) {
    for (const offer of product.offers) oldPrices.set(`${product.id}|${offer.store}`, offer.price);
  }
  const oldDate = previous.generated.slice(0, 10);

  for (const product of next.products) {
    for (const offer of product.offers) {
      const before = oldPrices.get(`${product.id}|${offer.store}`);
      if (before === undefined || before === offer.price) continue;
      const perStore = (result[product.id] ??= {});
      const points = (perStore[offer.store] ??= [[oldDate, before]]);
      const last = points[points.length - 1];
      if (last[0] === today) last[1] = offer.price;
      else points.push([today, offer.price]);
    }
  }
  return result;
}

/** Compact form for the browser: arrays instead of objects, store index instead of store id. */
export function packCatalog(products, generated, stores = STORES) {
  const index = new Map(stores.map((s, i) => [s.id, i]));
  return {
    generated,
    stores: stores.map(({ id, name, site }) => ({ id, name, site })),
    products: products.map((p) => [
      p.id,
      p.name,
      p.brand,
      p.category,
      p.image,
      p.offers.map((o) => [index.get(o.store), o.price, o.stock, o.url]),
    ]),
  };
}

export function unpackCatalog(packed) {
  return {
    generated: packed.generated,
    products: packed.products.map(([id, name, brand, category, image, offers]) => ({
      id,
      name,
      brand,
      category,
      image,
      offers: offers.map(([s, price, stock, url]) => ({ store: packed.stores[s].id, price, stock, url })),
    })),
  };
}
