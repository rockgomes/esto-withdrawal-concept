import { useEffect, useRef, useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import type { Offer, Product } from './catalog';
import { freeLimit, minimumPayment, plan, type Account } from './credit';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

type Step = 'store' | 'esto' | 'done';
type Method = 'credit-line' | 'hire-purchase' | 'esto-3' | 'pay-later';

/** ESTO's checkout methods today, plus the new one. */
const METHODS: { id: Method; name: string; isNew?: boolean }[] = [
  { id: 'credit-line', name: 'Credit line', isNew: true },
  { id: 'hire-purchase', name: 'Hire purchase' },
  { id: 'esto-3', name: 'ESTO 3' },
  { id: 'pay-later', name: 'Pay Later' },
];

/**
 * Phase 2: the purchase, from the store checkout to ESTO's checkout page and
 * back. The store page is a stand-in. The ESTO page is the part ESTO builds:
 * its checkout as it is today, with "Credit line" added as a method.
 */
export default function Checkout({
  product,
  offer,
  months,
  account,
  onClose,
  onPaid,
}: {
  product: Product;
  offer: Offer;
  months: number;
  account: Account;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [step, setStep] = useState<Step>('store');
  const [method, setMethod] = useState<Method>('credit-line');
  const box = useRef<HTMLDivElement>(null);
  const p = plan(offer.price, account, months);
  // Fixed when the flow opens, so the numbers do not move after the payment.
  const [freeBefore] = useState(() => freeLimit(account));
  const freeAfter = freeBefore - offer.price;
  const store = offer.store.name;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => box.current?.focus(), [step]);

  const pay = () => {
    onPaid();
    setStep('done');
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`sheet checkout is-${step}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        ref={box}
      >
        <ol className="steps" aria-label="Steps">
          {(['store', 'esto', 'done'] as const).map((s, i) => (
            <li key={s} aria-current={s === step ? 'step' : undefined}>
              <span className="step-n">{i + 1}</span>
              {s === 'store' ? store : s === 'esto' ? 'ESTO' : 'Done'}
            </li>
          ))}
        </ol>

        {step === 'store' && (
          <>
            <p className="demo-note">
              Stand-in for the {store} checkout. The real page belongs to the store.
            </p>
            <h2 id="checkout-title">{store} checkout</h2>
            <dl className="lines">
              <div>
                <dt>{product.name}</dt>
                <dd>{money(offer.price)}</dd>
              </div>
            </dl>
            <h3>Payment method</h3>
            <ul className="pay-list">
              <li>Bank link</li>
              <li>Card</li>
              <li className="is-picked">
                <span>
                  <strong>ESTO</strong>
                  <span className="muted small">Pay in parts</span>
                </span>
                <span className="badge ok">Selected</span>
              </li>
            </ul>
            <div className="btns">
              <button className="btn" onClick={() => setStep('esto')}>
                Continue to ESTO
              </button>
              <button className="btn ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'esto' && (
          <>
            <div className="esto-head">
              <span className="wordmark">esto</span>
              <span className="muted small">Order from {store}</span>
            </div>
            <h2 id="checkout-title" className="visually-hidden">
              ESTO checkout
            </h2>
            <div className="methods" role="radiogroup" aria-label="How do you want to pay?">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  role="radio"
                  aria-checked={m.id === method}
                  className="method"
                  onClick={() => setMethod(m.id)}
                >
                  {m.name}
                  {m.isNew && <span className="nav-badge">NEW</span>}
                </button>
              ))}
            </div>

            {method === 'credit-line' ? (
              <div className="esto-card">
                <p className="esto-price">{money(offer.price)}</p>
                <p className="muted small">{product.name}</p>
                <dl className="lines">
                  <div>
                    <dt>Free limit now</dt>
                    <dd>{whole(freeBefore)}</dd>
                  </div>
                  <div>
                    <dt>Free limit after</dt>
                    <dd>{whole(freeAfter)}</dd>
                  </div>
                  <div>
                    <dt>Lowest payment each month</dt>
                    <dd>{money(minimumPayment(offer.price, account.rate))}</dd>
                  </div>
                  <div>
                    <dt>Your plan</dt>
                    <dd>
                      {months} × {money(p.monthly)}
                    </dd>
                  </div>
                </dl>
                <p className="esto-ok">
                  No application and no new contract. You already have a credit line contract.
                </p>
                <button className="btn buy" onClick={pay}>
                  Pay {money(offer.price)} from my credit line
                </button>
                <p className="muted small steps-note">
                  Today an ESTO purchase has 4 steps: choose, apply, sign, and done. This one has 2: choose
                  and pay.
                </p>
              </div>
            ) : (
              <div className="esto-card">
                <p className="esto-price">{money(offer.price)}</p>
                <p className="muted">
                  {METHODS.find((m) => m.id === method)?.name} works as it does today: an application, then a
                  new contract to sign. It is not part of this concept.
                </p>
                <button className="btn buy" onClick={() => setMethod('credit-line')}>
                  Use my credit line
                </button>
              </div>
            )}
            <button className="link" onClick={() => setStep('store')}>
              Back to {store}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="center">
            <div className="tick" aria-hidden="true">
              ✓
            </div>
            <h2 id="checkout-title">Paid from your credit line</h2>
            <p className="muted">
              ESTO pays {store}. {store} sends your order as usual.
            </p>
            <dl className="lines">
              <div>
                <dt>Paid</dt>
                <dd>{money(offer.price)}</dd>
              </div>
              <div>
                <dt>Free limit now</dt>
                <dd>{whole(freeAfter)}</dd>
              </div>
              <div>
                <dt>Your plan</dt>
                <dd>
                  {months} × {money(p.monthly)}
                </dd>
              </div>
            </dl>
            <p className="demo-note">Simulated. No order is made, and no money moves.</p>
            <div className="btns">
              <button className="btn" onClick={onClose}>
                Back to the product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
