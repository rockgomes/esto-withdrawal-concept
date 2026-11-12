import { useMemo, useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import { lowestPrice, type Catalog } from './catalog';
import { freeLimit, plan, type Account } from './credit';
import { PHASES, type Phase } from './phase';
import { rulerPicks } from './picks';
import { NO_FILTERS, search } from './search';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

/**
 * The page before the prototype. The credit limit is drawn as a price ruler,
 * and real products stand on it at their price. Then the two phases.
 */
export default function Start({
  catalog,
  account,
  onOpen,
}: {
  catalog: Catalog | null;
  account: Account;
  onOpen: (phase: Phase, productId?: string) => void;
}) {
  const free = freeLimit(account);
  const picks = useMemo(
    () => (catalog ? rulerPicks(catalog.products, account.limit) : []),
    [catalog, account.limit],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = picks.find((p) => p.id === activeId) ?? picks.filter((p) => lowestPrice(p) <= free).at(-1);
  const ticks = [0, 50_000, 100_000, 150_000].filter((t) => t <= account.limit);

  return (
    <main className="start">
      <header className="start-head">
        <p className="start-by">A concept for ESTO by Rock Gomes, for the Product Builder test.</p>
        <h1>Shop with your credit line</h1>
        <p className="start-lead">
          An ESTO customer already has an approved limit. This shows what it can buy today, at which store,
          and for how much a month.
        </p>
      </header>

      <section className="ruler-wrap" aria-labelledby="ruler-title">
        <h2 id="ruler-title" className="visually-hidden">
          What fits the limit today
        </h2>
        <ol className={`ruler${catalog ? '' : ' is-loading'}`} aria-busy={!catalog}>
          {picks.map((p, i) => {
            const price = lowestPrice(p);
            const fitsLimit = price <= free;
            const firstOver = !fitsLimit && (i === 0 || lowestPrice(picks[i - 1]) <= free);
            return (
              <li
                key={p.id}
                className={`stand${fitsLimit ? '' : ' is-over'}${i % 2 ? ' is-high' : ''}${firstOver ? ' is-first-over' : ''}`}
                style={{ '--x': (price / account.limit) * 100, '--i': i } as React.CSSProperties}
              >
                {firstOver && <p className="ruler-cut">Your free limit ends here: {whole(free)}</p>}
                <button
                  className="stand-btn"
                  aria-pressed={active?.id === p.id}
                  onMouseEnter={() => setActiveId(p.id)}
                  onFocus={() => setActiveId(p.id)}
                  onClick={() => onOpen(2, p.id)}
                >
                  <span className="stand-pic">
                    <img src={p.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  </span>
                  <span className="stand-name">{p.name}</span>
                  <span className="stand-price">{money(price)}</span>
                  <span className="visually-hidden">
                    {fitsLimit ? ', fits the limit.' : ', above the free limit.'} Open in the prototype.
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="band" aria-hidden="true">
          <div className="band-free" style={{ flexGrow: free }}>
            <strong>{whole(free)} free</strong>
          </div>
          <div className="band-used" style={{ flexGrow: account.used }}>
            {whole(account.used)} in use
          </div>
        </div>
        <ul className="ticks" aria-hidden="true">
          {ticks.map((t) => (
            <li key={t} style={{ left: `${(t / account.limit) * 100}%` }}>
              {whole(t)}
            </li>
          ))}
        </ul>
        <p className="ruler-now" aria-live="polite">
          {active ? (
            <>
              <strong>{active.name}.</strong> {money(lowestPrice(active))} at {active.offers[0].store.name},{' '}
              {active.offers.length} stores sell it. {money(plan(lowestPrice(active), account).monthly)} a
              month for this customer over 12 months.{' '}
              {lowestPrice(active) <= free ? 'It fits the limit.' : 'It is above the free limit.'}
            </>
          ) : catalog ? (
            'No product to show today.'
          ) : (
            'Loading the store feeds…'
          )}
        </p>
        <p className="ruler-note">
          {catalog
            ? `Real products and prices, from the open feeds of ${catalog.stores.length} ESTO partner stores. ${catalog.products.length.toLocaleString('en-GB')} products, read once a day. `
            : ''}
          The customer is an example: a {whole(account.limit)} limit with {whole(account.used)} in use. Choose
          a product to open it in the prototype.
        </p>
      </section>

      <section className="phases" aria-labelledby="phases-title">
        <h2 id="phases-title">It ships in two phases</h2>
        <p className="phases-today">
          Today a credit line has one action: a withdrawal to a bank account. It takes 1 to 3 days, or it
          costs 19,90 € to get it at once.
        </p>

        <article className="phase" aria-labelledby="phase-1">
          <div className="phase-what">
            <p className="phase-n">Phase 1</p>
            <h3 id="phase-1">{PHASES[0].name}</h3>
            <PhaseFacts phase={1} />
            <button className="btn" onClick={() => onOpen(1)}>
              Open the Phase 1 prototype
            </button>
          </div>
          <LiveSearch catalog={catalog} account={account} onOpen={(id) => onOpen(1, id)} />
        </article>

        <article className="phase" aria-labelledby="phase-2">
          <div className="phase-what">
            <p className="phase-n">Phase 2</p>
            <h3 id="phase-2">{PHASES[1].name}</h3>
            <PhaseFacts phase={2} />
            <button className="btn" onClick={() => onOpen(2)}>
              Open the Phase 2 prototype
            </button>
          </div>
          <div className="demo" aria-label="Steps at the store checkout">
            <p className="demo-title">An ESTO purchase at a store checkout</p>
            <p className="demo-row-name">Today</p>
            <ol className="steps-row">
              <li>Choose</li>
              <li>Apply</li>
              <li>Sign a new contract</li>
              <li>Done</li>
            </ol>
            <p className="demo-row-name">With the credit line as a method</p>
            <ol className="steps-row">
              <li>Choose</li>
              <li className="is-cut">
                <s>Apply</s>
              </li>
              <li className="is-cut">
                <s>Sign a new contract</s>
              </li>
              <li className="is-pay">Pay from the limit</li>
            </ol>
            <p className="muted small">
              The customer already has a credit line contract. So there is nothing to apply for and nothing
              new to sign.
            </p>
          </div>
        </article>
      </section>

      <p className="legal">
        Unofficial concept. Not made by ESTO AS. Product data belongs to each store. The Phase 2 payment in
        the prototype is simulated.
      </p>
    </main>
  );
}

function PhaseFacts({ phase }: { phase: Phase }) {
  const info = PHASES[phase - 1];
  return (
    <dl className="phase-facts">
      <div>
        <dt>The customer gets</dt>
        <dd>{info.customer}</dd>
      </div>
      <div>
        <dt>ESTO builds</dt>
        <dd>{info.esto}</dd>
      </div>
      <div>
        <dt>Stores do</dt>
        <dd>{info.stores}</dd>
      </div>
    </dl>
  );
}

/** Phase 1 in small: the real search, with the customer's own monthly price. */
function LiveSearch({
  catalog,
  account,
  onOpen,
}: {
  catalog: Catalog | null;
  account: Account;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState('iphone 17');
  const results = useMemo(
    () => (catalog ? search(catalog.products, query, NO_FILTERS, 'relevance').slice(0, 3) : []),
    [catalog, query],
  );
  return (
    <div className="demo">
      <label className="demo-title" htmlFor="start-search">
        Try the search. These are today's real prices.
      </label>
      <input
        id="start-search"
        className="demo-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try garmin, dyson, or macbook"
        autoComplete="off"
      />
      <ul className="demo-results" aria-live="polite">
        {results.map((p) => (
          <li key={p.id}>
            <button onClick={() => onOpen(p.id)}>
              <span className="demo-name">{p.name}</span>
              <span className="demo-side">
                <strong>{money(plan(lowestPrice(p), account).monthly)} / month</strong>
                <span className="muted small">
                  {money(lowestPrice(p))} at {p.offers[0].store.name}
                  {p.offers.length > 1 ? `, ${p.offers.length} stores` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
        {catalog && results.length === 0 && (
          <li className="muted">No product matches. Try a shorter word.</li>
        )}
        {!catalog && <li className="muted">Loading the store feeds…</li>}
      </ul>
    </div>
  );
}
