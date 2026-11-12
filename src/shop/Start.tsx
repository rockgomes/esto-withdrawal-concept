import { PHASES, type Phase } from './phase';

/**
 * The page before the prototype. It says what the concept is and shows the
 * two phases. Each phase opens the prototype.
 */
export default function Start({
  products,
  stores,
  onOpen,
}: {
  products: number | null;
  stores: number | null;
  onOpen: (phase: Phase) => void;
}) {
  return (
    <main className="start">
      <p className="start-kicker">Concept for ESTO, by Rock Gomes. Product Builder test.</p>
      <h1>Shop with your credit line</h1>
      <p className="start-lead">
        A new Shop section in the ESTO app. A credit line customer searches real products from ESTO partner
        stores, sees their own monthly price, and pays from the limit they already have.
      </p>

      <section className="start-today" aria-labelledby="today-title">
        <h2 id="today-title">Today</h2>
        <ul>
          <li>
            A credit line has one action: a withdrawal to a bank account. It takes 1 to 3 days, or it costs
            19,90 € to get it at once.
          </li>
          <li>
            At a store checkout, an ESTO purchase has 4 steps: choose, apply, sign a new contract, and done. A
            customer with a free limit goes through all 4.
          </li>
        </ul>
      </section>

      <h2 className="start-h">Two phases</h2>
      <div className="phase-cards">
        {PHASES.map((p) => (
          <section className="phase-card" key={p.id} aria-labelledby={`phase-${p.id}`}>
            <p className="phase-n">Phase {p.id}</p>
            <h3 id={`phase-${p.id}`}>{p.name}</h3>
            <ol className="flow" aria-label="The customer's path">
              {p.flow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <dl className="phase-facts">
              <div>
                <dt>The customer gets</dt>
                <dd>{p.customer}</dd>
              </div>
              <div>
                <dt>ESTO builds</dt>
                <dd>{p.esto}</dd>
              </div>
              <div>
                <dt>Stores do</dt>
                <dd>{p.stores}</dd>
              </div>
            </dl>
            <button className="btn" onClick={() => onOpen(p.id)}>
              Open the Phase {p.id} prototype
            </button>
          </section>
        ))}
      </div>

      <p className="start-note">
        {products && stores
          ? `The prototype runs on real data: ${products.toLocaleString('en-GB')} products from the open feeds of ${stores} ESTO partner stores, read once a day. `
          : 'The prototype runs on real product data from the open feeds of ESTO partner stores. '}
        The customer account is an example, and the Phase 2 payment is simulated.
      </p>
      <p className="legal">Unofficial concept. Not made by ESTO AS. Product data belongs to each store.</p>
    </main>
  );
}
