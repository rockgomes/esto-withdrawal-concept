import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import {
  loadCatalog,
  lowestPrice,
  stockLabel,
  type Catalog,
  type Offer,
  type PriceHistory,
  type Product,
} from './catalog';
import {
  DEFAULT_MONTHS,
  DEMO_ACCOUNT,
  LIMIT_CHOICES,
  MAX_MONTHS,
  MIN_MONTHS,
  fits,
  freeLimit,
  minimumPayment,
  plan,
  type Account,
} from './credit';
import Checkout from './Checkout';
import LimitImpact from './LimitImpact';
import { PHASES, readPhase, writePhase, type Phase } from './phase';
import Start from './Start';
import { NO_FILTERS, search, type Filters, type SortKey } from './search';
import {
  priceDrops,
  readWatches,
  saveWatches,
  toggleWatch,
  withSimulatedDrop,
  type PriceDrop,
  type Watch,
} from './watch';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');
const QUICK_SEARCHES = [
  'iPhone',
  'Galaxy S',
  'MacBook',
  'PlayStation',
  'Garmin',
  'Dyson',
  'AirPods',
  'Televiisor',
];
const PAGE_SIZE = 24;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface Purchase {
  product: Product;
  offer: Offer;
  months: number;
  monthly: Cents;
  /** ISO date and time of the payment. */
  date: string;
  /** What the next monthly payment went up by. */
  raise: Cents;
}

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; catalog: Catalog; history: PriceHistory };

type Page = 'dashboard' | 'shop' | 'transactions';

const PAGE_HASH: Record<Page, string> = {
  dashboard: '#/dashboard',
  shop: '#/',
  transactions: '#/transactions',
};

interface Route {
  page: Page;
  productId: string | null;
}

function readRoute(): Route {
  const hash = window.location.hash;
  const product = hash.match(/^#\/p\/(.+)$/);
  if (product) return { page: 'shop', productId: decodeURIComponent(product[1]) };
  const page: Page =
    hash === '#/dashboard' ? 'dashboard' : hash === '#/transactions' ? 'transactions' : 'shop';
  return { page, productId: null };
}

function useRoute(): [Route, (hash: string) => void] {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = (hash: string) => {
    window.location.hash = hash;
    window.scrollTo({ top: 0 });
  };
  return [route, navigate];
}

export default function ShopApp() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [route, navigate] = useRoute();
  const [notice, setNotice] = useState('');
  const [phase, setPhase] = useState<Phase | null>(readPhase);
  const pickPhase = (next: Phase | null, productId?: string) => {
    setPhase(next);
    writePhase(next, productId);
    // The route listens to the hash, so tell it the address changed.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onPop = () => setPhase(readPhase());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    loadCatalog().then(
      (data) => !cancelled && setLoad({ status: 'ready', ...data }),
      (error: unknown) =>
        !cancelled &&
        setLoad({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const notBuilt = (name: string) =>
    setNotice(`"${name}" is not part of this concept. Dashboard, Find products, and Transactions are.`);

  if (phase === null) {
    return (
      <Start
        catalog={load.status === 'ready' ? load.catalog : null}
        account={DEMO_ACCOUNT}
        onOpen={pickPhase}
      />
    );
  }

  return (
    <>
      <div className="app">
        <Sidebar page={route.page} onNavigate={navigate} onOther={notBuilt} />
        <div className="app-main">
          <ProtoTag phase={phase} onPick={pickPhase} />
          {load.status === 'loading' && (
            <main className="page" aria-busy="true">
              <p className="status" role="status">
                Loading the store feeds…
              </p>
              <div className="grid" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <div className="card skeleton" key={i} />
                ))}
              </div>
            </main>
          )}
          {load.status === 'error' && (
            <main className="page">
              <div className="panel" role="alert">
                <h1>The product data did not load</h1>
                <p className="muted">{load.message}</p>
                <button className="btn" onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </button>
              </div>
            </main>
          )}
          {load.status === 'ready' && (
            <Shop
              catalog={load.catalog}
              history={load.history}
              route={route}
              navigate={navigate}
              onOther={notBuilt}
              phase={phase}
            />
          )}
          <p className="legal">
            Concept by Rock Gomes for the ESTO Product Builder test. Not made by ESTO AS. Product data belongs
            to each store.
          </p>
        </div>
        <p className={`notice${notice ? ' is-on' : ''}`} role="status">
          {notice}
        </p>
      </div>
    </>
  );
}

/** One small line that says this is a prototype, and which phase it shows. */
function ProtoTag({ phase, onPick }: { phase: Phase; onPick: (phase: Phase | null) => void }) {
  const info = PHASES.find((p) => p.id === phase) ?? PHASES[0];
  const other: Phase = phase === 1 ? 2 : 1;
  return (
    <p className="proto-tag">
      <span>
        Prototype, Phase {phase}: {info.name}
      </span>
      <button className="link" onClick={() => onPick(other)}>
        Switch to Phase {other}
      </button>
      <button className="link" onClick={() => onPick(null)}>
        About the concept
      </button>
    </p>
  );
}

const NAV: { label: string; icon: IconName; page?: Page; badge?: string; gapBefore?: boolean }[] = [
  { label: 'Dashboard', icon: 'grid', page: 'dashboard' },
  { label: 'Find products', icon: 'find', page: 'shop', badge: 'NEW' },
  { label: 'Credit line', icon: 'card' },
  { label: 'Invoices', icon: 'doc' },
  { label: 'Transactions', icon: 'swap', page: 'transactions' },
  { label: 'Agreements', icon: 'file' },
  { label: 'Insurance', icon: 'shield', gapBefore: true },
  { label: 'Premium', icon: 'gem' },
  { label: 'Customer support', icon: 'chat', gapBefore: true },
  { label: 'Profile', icon: 'user' },
];

function Sidebar({
  page,
  onNavigate,
  onOther,
}: {
  page: Page;
  onNavigate: (hash: string) => void;
  onOther: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pick = (item: (typeof NAV)[number]) => {
    setOpen(false);
    if (item.page) onNavigate(PAGE_HASH[item.page]);
    else onOther(item.label);
  };
  return (
    <header className={`side${open ? ' is-open' : ''}`}>
      <div className="side-top">
        <a className="wordmark" href="#/dashboard" aria-label="esto, dashboard">
          esto
        </a>
        <button
          className="burger"
          aria-expanded={open}
          aria-controls="side-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <nav id="side-nav" aria-label="Main">
        <ul>
          {NAV.map((item) => (
            <li key={item.label} className={item.gapBefore ? 'gap' : undefined}>
              <button
                className="nav-item"
                aria-current={item.page === page ? 'page' : undefined}
                onClick={() => pick(item)}
              >
                <Icon name={item.icon} />
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="side-note">Unofficial concept. Not an ESTO product.</p>
      </nav>
    </header>
  );
}

function Shop({
  catalog: realCatalog,
  history,
  route,
  navigate,
  onOther,
  phase,
}: {
  catalog: Catalog;
  history: PriceHistory;
  route: Route;
  navigate: (hash: string) => void;
  onOther: (name: string) => void;
  phase: Phase;
}) {
  const [account, setAccount] = useState<Account>(DEMO_ACCOUNT);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [fitsOnly, setFitsOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [watches, setWatches] = useState<Watch[]>(readWatches);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [simulated, setSimulated] = useState<string | null>(null);
  const { productId, page } = route;
  const go = (id: string | null) => navigate(id ? `#/p/${encodeURIComponent(id)}` : '#/');

  const catalog = useMemo(
    () => (simulated ? withSimulatedDrop(realCatalog, simulated, 8) : realCatalog),
    [realCatalog, simulated],
  );
  const free = freeLimit(account);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => saveWatches(watches), [watches]);

  const results = useMemo(
    () => search(catalog.products, query, { ...filters, maxPrice: fitsOnly ? free : null }, sort),
    [catalog, query, filters, fitsOnly, free, sort],
  );
  const drops = useMemo(() => priceDrops(watches, catalog), [watches, catalog]);
  const product = productId ? catalog.byId.get(productId) : undefined;

  const onWatch = (p: Product) => setWatches((w) => toggleWatch(w, p, today));
  const isWatched = (p: Product) => watches.some((w) => w.id === p.id);
  const onBought = (purchase: Purchase) => {
    setPurchases((list) => [purchase, ...list]);
    setAccount((a) => ({ ...a, used: a.used + purchase.offer.price }));
  };
  const changeQuery = (next: string) => {
    setQuery(next);
    setShown(PAGE_SIZE);
  };

  return (
    <>
      <main className="page">
        {page === 'dashboard' ? (
          <Dashboard
            account={account}
            catalog={catalog}
            drops={drops}
            onShop={() => go(null)}
            onOpen={go}
            onOther={onOther}
            purchases={purchases}
            onTransactions={() => navigate('#/transactions')}
          />
        ) : page === 'transactions' ? (
          <>
            <Balance account={account} compact />
            <Transactions purchases={purchases} onShop={() => go(null)} />
          </>
        ) : (
          <Balance account={account} compact />
        )}
        {productId && !product && (
          <div className="panel">
            <h1>This product is not in today's feeds</h1>
            <p className="muted">A store may have removed it or sold the last one.</p>
            <button className="btn" onClick={() => go(null)}>
              Back to search
            </button>
          </div>
        )}
        {product && (
          <ProductView
            key={product.id}
            product={product}
            account={account}
            history={history}
            watch={watches.find((w) => w.id === product.id)}
            onWatch={() => onWatch(product)}
            onBack={() => go(null)}
            onBought={onBought}
            onSeePurchase={() => navigate('#/dashboard')}
            phase={phase}
          />
        )}
        {!productId && page === 'shop' && (
          <>
            <DropList drops={drops} account={account} onOpen={go} />
            <section className="panel search-panel" aria-labelledby="search-title">
              <h1 id="search-title">What do you want to buy?</h1>
              <p className="muted">
                {catalog.products.length.toLocaleString('en-GB')} real products from {catalog.stores.length}{' '}
                ESTO partner stores. Each price below is your own monthly price.
              </p>
              <label className="searchbox">
                <span className="visually-hidden">Search products</span>
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => changeQuery(e.target.value)}
                  placeholder="Try iPhone 17, Garmin, or pesumasin"
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </label>
              <div className="chips" aria-label="Quick searches">
                {QUICK_SEARCHES.map((q) => (
                  <button key={q} className="chip" onClick={() => changeQuery(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <div className="toolbar">
                <Toggle on={fitsOnly} onChange={setFitsOnly}>
                  Fits my limit
                </Toggle>
                <Toggle on={filters.compare} onChange={(compare) => setFilters((f) => ({ ...f, compare }))}>
                  Sold by 2+ stores
                </Toggle>
                <Toggle on={filters.inStock} onChange={(inStock) => setFilters((f) => ({ ...f, inStock }))}>
                  In stock now
                </Toggle>
                <label className="sort">
                  <span className="muted">Sort</span>
                  <span className="select">
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                      <option value="relevance">Best match</option>
                      <option value="price-asc">Lowest price</option>
                      <option value="price-desc">Highest price</option>
                    </select>
                    <ChevronIcon />
                  </span>
                </label>
              </div>
            </section>

            <p className="status" role="status" aria-live="polite">
              {results.length === 0
                ? 'No product matches. Try a shorter search, or turn a filter off.'
                : `${results.length.toLocaleString('en-GB')} ${results.length === 1 ? 'product' : 'products'}${query ? ` for “${query}”` : ''}`}
            </p>
            <div className="grid">
              {results.slice(0, shown).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  account={account}
                  watched={isWatched(p)}
                  onOpen={() => go(p.id)}
                />
              ))}
            </div>
            {results.length > shown && (
              <div className="more">
                <button className="btn ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                  Show more
                </button>
              </div>
            )}

            <WatchList watches={watches} catalog={catalog} account={account} onOpen={go} />
          </>
        )}
        <About
          catalog={realCatalog}
          account={account}
          onLimit={(limit) => setAccount((a) => ({ ...a, limit }))}
          watches={watches}
          simulated={simulated}
          drops={drops}
          onSimulate={setSimulated}
        />
      </main>
    </>
  );
}

/**
 * The balance card, as on the ESTO dashboard: the free amount, a bar, the
 * used limit on the left, and the total limit on the right.
 */
function Balance({
  account,
  compact,
  children,
}: {
  account: Account;
  compact?: boolean;
  children?: ReactNode;
}) {
  const free = freeLimit(account);
  return (
    <section className={`balance${compact ? ' is-compact' : ''}`} aria-label="Your credit limit">
      <div className="balance-top">
        <p>
          <span className="balance-label">
            <i className="dot seg-free" /> Balance
          </span>
          <strong className="balance-value">{whole(free)}</strong>
        </p>
        <span className="tag">Credit line</span>
      </div>
      <div className="bar" aria-hidden="true">
        <i className="seg-used" style={{ flexGrow: account.used }} />
        <i className="seg-free" style={{ flexGrow: free }} />
      </div>
      <dl className="balance-ends">
        <div>
          <dt>
            <i className="dot seg-used" /> Used limit
          </dt>
          <dd>{whole(account.used)}</dd>
        </div>
        <div>
          <dt>Total limit</dt>
          <dd>{whole(account.limit)}</dd>
        </div>
      </dl>
      {children && <div className="balance-actions">{children}</div>}
    </section>
  );
}

function Dashboard({
  account,
  catalog,
  drops,
  onShop,
  onOpen,
  onOther,
  purchases,
  onTransactions,
}: {
  account: Account;
  catalog: Catalog;
  drops: PriceDrop[];
  onShop: () => void;
  onOpen: (id: string) => void;
  onOther: (name: string) => void;
  purchases: Purchase[];
  onTransactions: () => void;
}) {
  const picks = useMemo(
    () =>
      search(catalog.products, '', { compare: true, inStock: true, maxPrice: freeLimit(account) }).slice(
        0,
        4,
      ),
    [catalog, account],
  );
  return (
    <>
      <Balance account={account}>
        <button className="btn green" onClick={() => onOther('Higher limit')}>
          Higher limit available
        </button>
        <button className="btn" onClick={() => onOther('Withdrawal')}>
          Make a withdrawal
        </button>
        <button className="btn outline" onClick={onShop}>
          Shop with your limit
        </button>
      </Balance>
      {purchases.length > 0 && (
        <section className="panel" aria-labelledby="latest-title">
          <div className="panel-head">
            <h2 id="latest-title">Latest purchase</h2>
            <button className="link" onClick={onTransactions}>
              All transactions
            </button>
          </div>
          <PurchaseRows purchases={purchases.slice(0, 1)} />
        </section>
      )}
      <DropList drops={drops} account={account} onOpen={onOpen} />
      <section className="panel" aria-labelledby="picks-title">
        <div className="panel-head">
          <h2 id="picks-title">Fits your limit today</h2>
          <button className="link" onClick={onShop}>
            See all products
          </button>
        </div>
        <div className="grid">
          {picks.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              account={account}
              watched={false}
              onOpen={() => onOpen(p.id)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function Toggle({
  on,
  onChange,
  children,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button className="toggle" aria-pressed={on} onClick={() => onChange(!on)}>
      {children}
    </button>
  );
}

function ProductImage({ product, size }: { product: Product; size: 'card' | 'hero' }) {
  const [failed, setFailed] = useState(false);
  if (!product.image || failed) {
    return (
      <div className={`pic pic-${size} pic-empty`} aria-hidden="true">
        {(product.brand || product.name).slice(0, 1)}
      </div>
    );
  }
  return (
    <div className={`pic pic-${size}`}>
      <img
        src={product.image}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function FitBadge({ price, account }: { price: Cents; account: Account }) {
  return fits(price, account) ? (
    <span className="badge ok">Fits your limit</span>
  ) : (
    <span className="badge no">Above your free limit</span>
  );
}

function ProductCard({
  product,
  account,
  watched,
  onOpen,
}: {
  product: Product;
  account: Account;
  watched: boolean;
  onOpen: () => void;
}) {
  const price = lowestPrice(product);
  const stores = product.offers.length;
  return (
    <button className="card product" onClick={onOpen}>
      <ProductImage product={product} size="card" />
      <span className="product-body">
        <span className="product-name">{product.name}</span>
        <span className="monthly">
          {money(plan(price, account).monthly)}
          <small> / month for you</small>
        </span>
        <span className="muted small">
          {money(price)} at {product.offers[0].store.name}
          {stores > 1 ? `, ${stores} stores` : ''}
        </span>
        <span className="badges">
          <FitBadge price={price} account={account} />
          {watched && <span className="badge watch">Watching</span>}
        </span>
      </span>
    </button>
  );
}

function ProductView({
  product,
  account,
  history,
  watch,
  onWatch,
  onBack,
  onBought,
  onSeePurchase,
  phase,
}: {
  product: Product;
  account: Account;
  history: PriceHistory;
  watch: Watch | undefined;
  onWatch: () => void;
  onBack: () => void;
  onBought: (purchase: Purchase) => void;
  onSeePurchase: () => void;
  phase: Phase;
}) {
  const [offerIndex, setOfferIndex] = useState(0);
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const offer = product.offers[Math.min(offerIndex, product.offers.length - 1)];
  const p = plan(offer.price, account, months);
  const ok = bought || fits(offer.price, account);
  const changes = history[product.id];

  useEffect(() => heading.current?.focus(), []);

  return (
    <article className="detail">
      <button className="back" onClick={onBack}>
        ← Back to search
      </button>
      <div className="detail-grid">
        <section className="panel">
          <ProductImage product={product} size="hero" />
          <p className="muted small">{[product.brand, product.category].filter(Boolean).join(' · ')}</p>
          <h1 ref={heading} tabIndex={-1}>
            {product.name}
          </h1>
          <div className="badges">
            {bought ? (
              <span className="badge ok">Paid (simulated)</span>
            ) : (
              <FitBadge price={offer.price} account={account} />
            )}
          </div>
          <button className="btn ghost watch-btn" aria-pressed={Boolean(watch)} onClick={onWatch}>
            <BellIcon /> {watch ? 'Watching the price' : 'Tell me when the price goes down'}
          </button>
          {watch && (
            <p className="muted small">
              Watching since {formatDate(watch.since)}, from {money(watch.price)}. When any store goes lower,
              ESTO sends an email to the address in your profile. The alert also shows on your dashboard.
            </p>
          )}
        </section>

        <div>
          <section className="panel" aria-labelledby="offers-title">
            <h2 id="offers-title">
              {product.offers.length === 1
                ? 'One store sells this'
                : `${product.offers.length} stores sell this`}
            </h2>
            <div role="radiogroup" aria-labelledby="offers-title">
              {product.offers.map((o, i) => (
                <button
                  key={o.store.id}
                  role="radio"
                  aria-checked={i === offerIndex}
                  className="offer"
                  onClick={() => setOfferIndex(i)}
                >
                  <span>
                    <strong>{o.store.name}</strong>
                    {i === 0 && product.offers.length > 1 && <span className="badge ok">Lowest</span>}
                    <span className="muted small offer-stock">{stockLabel(o.stock)}</span>
                  </span>
                  <span className="offer-price">
                    <strong>{money(o.price)}</strong>
                    <span className="muted small">
                      {money(plan(o.price, account, months).monthly)} / month
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <a className="store-link" href={offer.url} target="_blank" rel="noopener noreferrer">
              See it at {offer.store.name} (opens the store) ↗
            </a>
          </section>

          <section className="panel" aria-labelledby="plan-title">
            <h2 id="plan-title">Your payment plan</h2>
            <label className="slider">
              <span>
                Pay it off in <strong>{months} months</strong>
              </span>
              <input
                type="range"
                min={MIN_MONTHS}
                max={MAX_MONTHS}
                step={1}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
            </label>
            <dl className="calc">
              <div>
                <dt>Each month</dt>
                <dd>{money(p.monthly)}</dd>
              </div>
              <div>
                <dt>Cost of credit</dt>
                <dd>{money(p.cost)}</dd>
              </div>
              <div>
                <dt>You pay in total</dt>
                <dd>{money(p.total)}</dd>
              </div>
            </dl>
            <p className="muted small">
              The lowest payment your credit line allows for this amount is{' '}
              {money(minimumPayment(offer.price, account.rate))} a month. A fixed plan costs less interest.
            </p>
            {phase === 1 ? (
              <>
                <a className="btn buy" href={offer.url} target="_blank" rel="noopener noreferrer">
                  Go to {offer.store.name} to buy ↗
                </a>
                <p className="muted small pay-today">
                  You pay at the {offer.store.name} checkout, as today. If you choose ESTO there, you apply
                  and sign a new contract. Phase 2 removes both steps.
                </p>
              </>
            ) : (
              <>
                {!bought && <LimitImpact account={account} price={offer.price} />}
                <button className="btn buy" disabled={bought} onClick={() => setBuying(true)}>
                  {bought
                    ? 'Paid (simulated)'
                    : ok
                      ? `Buy at ${offer.store.name} with your credit line`
                      : `Buy at ${offer.store.name}`}
                </button>
              </>
            )}
          </section>

          <section className="panel" aria-labelledby="history-title">
            <h2 id="history-title">Price changes</h2>
            {changes ? (
              <ul className="history">
                {Object.entries(changes).map(([storeId, points]) => (
                  <li key={storeId}>
                    <strong>
                      {product.offers.find((o) => o.store.id === storeId)?.store.name ?? storeId}
                    </strong>
                    {points.map(([date, cents]) => (
                      <span key={date} className="history-point">
                        {formatDate(date)}: {money(cents)}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">
                No price change recorded yet. The feeds are read once a day, and every change is saved from
                then on.
              </p>
            )}
          </section>
        </div>
      </div>
      {buying && (
        <Checkout
          product={product}
          offer={offer}
          months={months}
          account={account}
          onClose={() => setBuying(false)}
          onPaid={() => {
            setBought(true);
            onBought({
              product,
              offer,
              months,
              monthly: p.monthly,
              date: new Date().toISOString(),
              raise: minimumPayment(offer.price, account.rate),
            });
          }}
          onOpenApp={() => {
            setBuying(false);
            onSeePurchase();
          }}
        />
      )}
    </article>
  );
}

function DropList({
  drops,
  account,
  onOpen,
}: {
  drops: PriceDrop[];
  account: Account;
  onOpen: (id: string) => void;
}) {
  if (drops.length === 0) return null;
  return (
    <section className="drops" aria-label="Price alerts">
      {drops.map((d) => (
        <button key={d.product.id} className="drop" onClick={() => onOpen(d.product.id)}>
          <BellIcon />
          <span>
            <strong>Price went down {money(d.saved)}</strong>
            <span className="drop-name">{d.product.name}</span>
            <span className="small">
              Now {money(d.now)} at {d.product.offers[0].store.name}, was {money(d.was)}.{' '}
              {money(plan(d.now, account).monthly)} a month for you.{' '}
              {fits(d.now, account) ? 'It fits your limit.' : ''}
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}

function WatchList({
  watches,
  catalog,
  account,
  onOpen,
}: {
  watches: Watch[];
  catalog: Catalog;
  account: Account;
  onOpen: (id: string) => void;
}) {
  if (watches.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="watch-title">
      <h2 id="watch-title">Prices you watch</h2>
      <ul className="rows">
        {watches.map((w) => {
          const product = catalog.byId.get(w.id);
          if (!product) {
            return (
              <li key={w.id} className="muted small">
                A watched product is not in today's feeds.
              </li>
            );
          }
          const now = lowestPrice(product);
          return (
            <li key={w.id}>
              <button className="row-link" onClick={() => onOpen(w.id)}>
                <span>{product.name}</span>
                <span className="row-side">
                  <strong>{money(now)}</strong>
                  <span className="muted small">
                    {now < w.price
                      ? `down from ${money(w.price)}`
                      : now > w.price
                        ? `up from ${money(w.price)}`
                        : `same since ${formatDate(w.since)}`}
                    {', '}
                    {money(plan(now, account).monthly)} / month
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PurchaseRows({ purchases }: { purchases: Purchase[] }) {
  return (
    <ul className="rows">
      {purchases.map((b) => (
        <li key={b.date + b.product.id} className="row-static">
          <span>
            <strong>{b.offer.store.name}</strong>
            <span className="tx-name">{b.product.name}</span>
            <span className="muted small">
              {formatDateTime(b.date)}. Paid from your credit line. Your next monthly payment went up by{' '}
              {money(b.raise)}.
            </span>
          </span>
          <span className="row-side">
            <strong>−{money(b.offer.price)}</strong>
            <span className="badge ok">Paid</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Transactions({ purchases, onShop }: { purchases: Purchase[]; onShop: () => void }) {
  return (
    <section className="panel" aria-labelledby="tx-title">
      <h1 id="tx-title">Transactions</h1>
      {purchases.length === 0 ? (
        <>
          <p className="muted">
            Nothing here yet. A store purchase that you pay from your credit line shows on this page.
          </p>
          <button className="btn" onClick={onShop}>
            Find a product
          </button>
        </>
      ) : (
        <PurchaseRows purchases={purchases} />
      )}
      <p className="muted small tx-note">
        Prototype: this page lists only the purchases you make in this demo. I have not seen the real
        Transactions page, so its other content is not rebuilt here.
      </p>
    </section>
  );
}

function About({
  catalog,
  account,
  onLimit,
  watches,
  simulated,
  onSimulate,
  drops,
}: {
  catalog: Catalog;
  account: Account;
  onLimit: (limit: Cents) => void;
  watches: Watch[];
  simulated: string | null;
  onSimulate: (id: string | null) => void;
  drops: PriceDrop[];
}) {
  const watchedProducts = watches.map((w) => catalog.byId.get(w.id)).filter((p): p is Product => Boolean(p));
  return (
    <details className="panel about">
      <summary>About this concept: what is real, and the demo controls</summary>
      <div className="about-grid">
        <div>
          <h3>Real</h3>
          <ul>
            <li>
              Every product, price, picture, stock text, and link. They come from the product feeds that the
              stores publish in the Hinnavaatlus price list format.
            </li>
            <li>The same product is matched across stores by its barcode (GTIN). No AI is used.</li>
            <li>
              The feeds were last read on {formatDateTime(catalog.generated)}. A job reads them once a day.
            </li>
            <li>The payment math: a standard fixed-payment loan calculation.</li>
          </ul>
          <h3>Example or simulated</h3>
          <ul>
            <li>The customer: the limit and the amount in use.</li>
            <li>
              The {account.rate.toLocaleString('et-EE')}% yearly rate. It is the highest interest rate in
              ESTO's own credit line example (APR 44,84% on a 500 € limit). Fees are not in the math here.
            </li>
            <li>
              Phase 2. ESTO has no credit line method at checkout today. The store checkout page is a
              stand-in, and no order is made.
            </li>
          </ul>
          <h3>One change to the balance card</h3>
          <ul>
            <li>
              In the real app the bar is one colour, and the label under its left end says "Used limit". The
              colour means free money. So a reader can take the coloured part for the used part.
            </li>
            <li>
              Here the used part is grey and sits above "Used limit". The free part is green, and "Balance"
              has the same green dot. Each number has the colour of its part. With nothing in use, the bar
              looks the same as the real one.
            </li>
          </ul>
          <p className="muted small">
            This is an unofficial concept. It is not made by ESTO or by the stores. Product data belongs to
            each store.
          </p>
        </div>
        <div>
          <h3>Store feeds in today's catalog</h3>
          <table className="sources">
            <thead>
              <tr>
                <th scope="col">Store</th>
                <th scope="col">Rows in feed</th>
              </tr>
            </thead>
            <tbody>
              {catalog.stores.map((s) => {
                const report = catalog.sources.find((r) => r.store === s.id);
                return (
                  <tr key={s.id}>
                    <th scope="row">
                      <a href={s.site} target="_blank" rel="noopener noreferrer">
                        {s.name}
                      </a>
                    </th>
                    <td>
                      {report?.error
                        ? 'Feed did not answer today'
                        : (report?.rowsInFeed?.toLocaleString('en-GB') ?? 'not recorded')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <h3>Demo controls</h3>
          <fieldset className="control">
            <legend>Credit limit of the example customer</legend>
            {LIMIT_CHOICES.map((limit) => (
              <button
                key={limit}
                className="toggle"
                aria-pressed={account.limit === limit}
                disabled={limit < account.used}
                onClick={() => onLimit(limit)}
              >
                {whole(limit)}
              </button>
            ))}
          </fieldset>
          <fieldset className="control">
            <legend>Simulate a lower price in tomorrow's feed (8% less)</legend>
            {watchedProducts.length === 0 && (
              <p className="muted small">Watch a product first. Then you can test its price alert here.</p>
            )}
            {watchedProducts.map((p) => (
              <button
                key={p.id}
                className="toggle"
                aria-pressed={simulated === p.id}
                onClick={() => onSimulate(simulated === p.id ? null : p.id)}
              >
                {p.name}
              </button>
            ))}
          </fieldset>
          {drops.map((d) => (
            <div className="mail" key={d.product.id} role="group" aria-label="The email the customer gets">
              <p className="mail-meta">From ESTO. To the email in the customer's profile.</p>
              <p className="mail-subject">
                Price went down {money(d.saved)}: {d.product.name}
              </p>
              <p>
                It is now {money(d.now)} at {d.product.offers[0].store.name}. It was {money(d.was)} when you
                started to watch it. For you that is {money(plan(d.now, account).monthly)} a month over 12
                months. {fits(d.now, account) ? 'It fits your free limit.' : 'It is above your free limit.'}
              </p>
              <p className="mail-link">See the product in ESTO</p>
              <p className="muted small">Prototype: no email is sent. This is the email the customer gets.</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

type IconName = 'grid' | 'find' | 'card' | 'doc' | 'swap' | 'file' | 'shield' | 'gem' | 'chat' | 'user';

const ICON_PATHS: Record<IconName, string[]> = {
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  find: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14', 'm20 20-3.5-3.5'],
  card: ['M3 7h18v11H3z', 'M3 11h18', 'M7 15h3'],
  doc: ['M6 3h12v18H6z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
  swap: ['M4 8h14', 'm15 5 3 3-3 3', 'M20 16H6', 'm9 13-3 3 3 3'],
  file: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'm10 14 2 2 3-4'],
  shield: ['M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z'],
  gem: ['M6 4h12l3 5-9 11L3 9z', 'M3 9h18'],
  chat: ['M4 5h16v11H9l-5 4z'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M5 20a7 7 0 0 1 14 0'],
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="icon">
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="icon">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="icon select-chevron">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="icon">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
