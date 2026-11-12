import type { Phase } from './phase';

/**
 * "How it works" on the Credit Line page. The four tiles follow the real
 * ESTO page: a small picture, a short title, and one or two sentences. The
 * titles and texts of those four are ESTO's own. The fifth tile is new in
 * this concept. It shows only in Phase 2, where paying at a store exists.
 */
export default function CreditInfo({ onShop, phase }: { onShop: () => void; phase: Phase }) {
  return (
    <section aria-labelledby="info-title">
      <h2 id="info-title" className="page-title">
        How it works
      </h2>
      <div className="tiles">
        <article className="tile">
          <div className="tile-pic pic-sign" aria-hidden="true">
            <span>0 €</span>
          </div>
          <h3>Apply and sign for free</h3>
          <p>
            To use the credit line, you must sign a contract. Monthly payments only start when you withdraw
            funds.
          </p>
        </article>

        <article className="tile">
          <div className="tile-pic pic-use" aria-hidden="true">
            <i />
          </div>
          <h3>Pay only for what you use</h3>
          <p>
            With a credit line you’ll always have the funds you need at hand, without the monthly payment of a
            lump-sum loan.
          </p>
        </article>

        <article className="tile">
          <div className="tile-pic pic-months" aria-hidden="true">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month, i) => (
              <span key={month}>
                <i style={{ height: `calc((100% - 22px) * ${(1 - i * 0.09).toFixed(2)})` }} />
                {month}
              </span>
            ))}
          </div>
          <h3>Monthly payments decrease</h3>
          <p>Your monthly payment decreases each month</p>
        </article>

        <article className="tile">
          <div className="tile-pic pic-back" aria-hidden="true">
            <p>
              <strong>1 465 €</strong> <span>+35 €</span>
            </p>
            <i />
          </div>
          <h3>Payments replenish balance</h3>
          <p>Monthly repayments replenish your withdrawable credit amount</p>
        </article>

        {phase === 2 && (
          <article className="tile is-new">
            <div className="tile-pic pic-store" aria-hidden="true">
              <span>Hire purchase</span>
              <span className="is-on">Credit line</span>
              <span>ESTO 3</span>
            </div>
            <h3>
              Pay at a store from your limit <span className="nav-badge">NEW</span>
            </h3>
            <p>
              At a store checkout, choose ESTO and pay from your credit line. There is no application and no
              new contract.
            </p>
            <button className="link" onClick={onShop}>
              Find a product
            </button>
          </article>
        )}
      </div>
    </section>
  );
}
