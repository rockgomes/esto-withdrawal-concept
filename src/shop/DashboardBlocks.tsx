import type { Phase } from './phase';

/**
 * "How your credit line works" on the Dashboard. It shows until the person
 * has paid at a store from the limit. Three boxes follow ESTO's own Credit
 * Line page. The first box is the new thing, and the only one that opens a page.
 */
export function HowCard({ phase, onShop }: { phase: Phase; onShop: () => void }) {
  return (
    <section className="panel how4" aria-labelledby="how4-title">
      <div className="panel-head">
        <h2 id="how4-title">How your credit line works</h2>
      </div>
      <div className="how4-row">
        <button className="tile" onClick={onShop}>
          {phase === 2 ? (
            <>
              <span className="tile-pic pic-store" aria-hidden="true">
                <span>Bank link</span>
                <span>Card</span>
                <span className="is-on">ESTO</span>
              </span>
              <span className="tile-title">
                Pay at a store <span className="nav-badge">NEW</span>
              </span>
              <span className="tile-text">Choose ESTO at the checkout and pay from your limit.</span>
              <span className="tile-go">Find products</span>
            </>
          ) : (
            <>
              <span className="tile-pic pic-find" aria-hidden="true">
                <span>Search a product</span>
              </span>
              <span className="tile-title">
                See what your limit can buy <span className="nav-badge">NEW</span>
              </span>
              <span className="tile-text">Search real prices from ESTO partner stores.</span>
              <span className="tile-go">Find products</span>
            </>
          )}
        </button>
        <article className="tile">
          <div className="tile-pic pic-use" aria-hidden="true">
            <i />
          </div>
          <h3>Pay only for what you use</h3>
          <p>A limit that you do not use costs nothing.</p>
        </article>
        <article className="tile">
          <div className="tile-pic pic-months" aria-hidden="true">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, i) => (
              <span key={month}>
                <i style={{ height: `calc((100% - 18px) * ${(1 - i * 0.09).toFixed(2)})` }} />
                {month}
              </span>
            ))}
          </div>
          <h3>Monthly payments decrease</h3>
          <p>Your monthly payment gets smaller each month.</p>
        </article>
        <article className="tile">
          <div className="tile-pic pic-back" aria-hidden="true">
            <p>
              <strong>1 465 €</strong> <span>+35 €</span>
            </p>
            <i />
          </div>
          <h3>Payments replenish balance</h3>
          <p>What you pay back is free to use again.</p>
        </article>
      </div>
    </section>
  );
}

const LOANS = [
  { name: 'Small loan', text: 'Borrow up to 10 000 €. Period up to 120 months.' },
  { name: 'Fast loan', text: 'Borrow up to 1 000 €. Period up to 12 months.' },
  { name: 'Renovation loan', text: 'Borrow up to 10 000 €. Period up to 120 months.' },
  { name: 'Vehicle loan', text: 'Borrow up to 10 000 €. Period up to 120 months.' },
];

/**
 * The two blocks that the real ESTO Dashboard has under the balance: a banner
 * and the loan offers. They are here so the page stays ESTO's Dashboard and
 * is not only about the credit line. The photos of the real blocks are left out.
 */
export function EstoBlocks({ onOther }: { onOther: (name: string) => void }) {
  return (
    <>
      <section className="panel" aria-labelledby="banner-title">
        <div className="panel-head">
          <h2 id="banner-title">Don’t miss out!</h2>
          <span className="tag">In the app today</span>
        </div>
        <button className="esto-banner" onClick={() => onOther('The banner')}>
          <strong>Get exclusive offers and gifts</strong>
          <span>Only for newsletter subscribers</span>
        </button>
      </section>
      <section className="panel" aria-labelledby="loans-title">
        <div className="panel-head">
          <h2 id="loans-title">Personal finances</h2>
          <span className="tag">In the app today</span>
        </div>
        <div className="loans">
          {LOANS.map((loan) => (
            <button key={loan.name} className="loan" onClick={() => onOther(loan.name)}>
              <i aria-hidden="true" />
              <strong>{loan.name}</strong>
              <span>{loan.text}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
