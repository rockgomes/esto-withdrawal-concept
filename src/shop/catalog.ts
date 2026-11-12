import type { Cents } from '../lib/money';

/** 'now' means in stock. '2-4d' means 2 to 4 working days. '' means the store did not say. */
export type Stock = string;

export interface Store {
  id: string;
  name: string;
  site: string;
}

export interface Offer {
  store: Store;
  price: Cents;
  stock: Stock;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  /** Sorted by price, lowest first. Never empty. */
  offers: Offer[];
  /** Lower-case text the search runs on. */
  haystack: string;
  nameLower: string;
}

export interface SourceReport {
  store: string;
  rowsInFeed?: number;
  usableRows?: number;
  error?: string;
}

export interface Catalog {
  generated: string;
  stores: Store[];
  products: Product[];
  byId: Map<string, Product>;
  sources: SourceReport[];
}

type PackedOffer = [storeIndex: number, price: number, stock: string, url: string];
type PackedProduct = [
  id: string,
  name: string,
  brand: string,
  category: string,
  image: string,
  offers: PackedOffer[],
];

export interface PackedCatalog {
  generated: string;
  stores: Store[];
  products: PackedProduct[];
  sources?: SourceReport[];
}

/** { productId: { storeId: [[isoDate, cents], ...] } }. Holds only offers whose price changed. */
export type PriceHistory = Record<string, Record<string, [string, number][]>>;

export function unpack(packed: PackedCatalog): Catalog {
  const products: Product[] = packed.products.map(([id, name, brand, category, image, offers]) => ({
    id,
    name,
    brand,
    category,
    image,
    offers: offers.map(([s, price, stock, url]) => ({ store: packed.stores[s], price, stock, url })),
    nameLower: name.toLowerCase(),
    haystack: `${name} ${brand} ${category}`.toLowerCase(),
  }));
  return {
    generated: packed.generated,
    stores: packed.stores,
    products,
    byId: new Map(products.map((p) => [p.id, p])),
    sources: packed.sources ?? [],
  };
}

export async function loadCatalog(): Promise<{ catalog: Catalog; history: PriceHistory }> {
  const [catalogResponse, historyResponse] = await Promise.all([
    fetch('/data/catalog.json'),
    fetch('/data/history.json'),
  ]);
  if (!catalogResponse.ok) throw new Error(`Catalog request failed (${catalogResponse.status})`);
  const packed = (await catalogResponse.json()) as PackedCatalog;
  const history = historyResponse.ok ? ((await historyResponse.json()) as PriceHistory) : {};
  return { catalog: unpack(packed), history };
}

export function lowestPrice(product: Product): Cents {
  return product.offers[0].price;
}

export function stockLabel(stock: Stock): string {
  if (stock === 'now') return 'In stock';
  const range = stock.match(/^(\d+)-(\d+)d$/);
  if (range) return `${range[1]} to ${range[2]} working days`;
  const single = stock.match(/^(\d+)d$/);
  if (single) return `${single[1]} working days`;
  return 'Delivery time not stated';
}
