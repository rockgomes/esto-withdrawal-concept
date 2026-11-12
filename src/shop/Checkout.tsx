import { useEffect, useRef, useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import type { Offer, Product } from './catalog';
import { freeLimit, minimumPayment, plan, type Account } from './credit';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

type Step = 'store' | 'esto' | 'confirmed';
type Method = 'credit-line' | 'hire-purchase' | 'esto-3' | 'pay-later';
type StorePay = 'bank' | 'card' | 'esto';

/** ESTO's checkout methods today, plus the new one. */
const METHODS: { id: Method; name: string; isNew?: boolean }[] = [
  { id: 'credit-line', name: 'Credit line', isNew: true },
  { id: 'hire-purchase', name: 'Hire purchase' },
  { id: 'esto-3', name: 'ESTO 3' },
  { id: 'pay-later', name: 'Pay Later' },
];

const STORE_PAY: { id: StorePay; name: string; note: string }[] = [
  { id: 'bank', name: 'Bank link', note: 'Pay from your bank' },
  { id: 'card', name: 'Card', note: 'Visa or Mastercard' },
  { id: 'esto', name: 'ESTO', note: 'Pay in parts' },
];

function hostOf(url: string, fallback: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

/**
 * Phase 2: the purchase, as three full pages in three places.
 *
 * 1. The store's checkout. A stand-in: the real page belongs to the store.
 * 2. ESTO's payment page, where the store sends the customer today. The new
 *    part is one more method on it: "Credit line".
 * 3. The store again, with the order confirmed.
 *
 * The bar at the top works like a browser address bar. It says which site
 * the customer is on.
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
  const [storePay, setStorePay] = useState<StorePay>('esto');
  const [method, setMethod] = useState<Method>('credit-line');
  const heading = useRef<HTMLHeadingElement>(null);
  const p = plan(offer.price, account, months);
  // Fixed when the flow opens, so the numbers do not move after the payment.
  const [freeBefore] = useState(() => freeLimit(account));
  const freeAfter = freeBefore - offer.price;
  const store = offer.store.name;
  const storeHost = hostOf(offer.store.site || offer.url, store);
  const onStore = step !== 'esto';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = before;
    };
  }, [onClose]);

  useEffect(() => heading.current?.focus(), [step]);

  const pay = () => {
    onPaid();
    setStep('confirmed');
  };

  const order = (
    <div className="st-order">
      {product.image && (
        <img src={product.image} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
      )}
      <p className="st-order-name">{product.name}</p>
      <p className="st-order-price">{money(offer.price)}</p>
    </div>
  );

  return (
    <div
      className={`flow-page ${onStore ? 'is-store' : 'is-esto'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="flow-title"
    >
      <div className="addr">
        <p className="addr-url">
          <LockIcon />
          <span>{onStore ? storeHost : 'esto.ee'}</span>
        </p>
        <p className="addr-what">
          Step {step === 'store' ? 1 : step === 'esto' ? 2 : 3} of 3.{' '}
          {onStore
            ? `You are on the ${store} site. This page is a stand-in.`
            : "You are on ESTO's payment page. The new part is the Credit line option."}
        </p>
        <button className="addr-close" onClick={onClose}>
          Leave the demo
        </button>
      </div>

      {step === 'store' && (
        <div className="st">
          <header className="st-head">
            <span className="st-logo">{store}</span>
            <span>Checkout</span>
          </header>
          <div className="st-body">
            <section>
              <h1 id="flow-title" ref={heading} tabIndex={-1}>
                Your order
              </h1>
              {order}
              <dl className="st-total">
                <dt>Total</dt>
                <dd>{money(offer.price)}</dd>
              </dl>
            </section>
            <section>
              <h2>Payment method</h2>
              <div className="st-pay" role="radiogroup" aria-label="Payment method">
                {STORE_PAY.map((m) => (
                  <label key={m.id} className={storePay === m.id ? 'is-on' : undefined}>
                    <input
                      type="radio"
                      name="store-pay"
                      checked={storePay === m.id}
                      onChange={() => setStorePay(m.id)}
                    />
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.note}</small>
                    </span>
                  </label>
                ))}
              </div>
              <button className="st-btn" disabled={storePay !== 'esto'} onClick={() => setStep('esto')}>
                Continue to ESTO
              </button>
              <p className="st-note">
                {storePay === 'esto'
                  ? `${store} sends you to ESTO's payment page. This is how it works today.`
                  : 'This demo only follows the ESTO path. Choose ESTO to go on.'}
              </p>
            </section>
          </div>
        </div>
      )}

      {step === 'esto' && (
        <div className="ep">
          <div className="esto-head">
            <span className="wordmark">esto</span>
            <span className="muted small">Order from {store}</span>
          </div>
          <h1 id="flow-title" ref={heading} tabIndex={-1} className="ep-title">
            How do you want to pay?
          </h1>
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
                No application and no new contract. You signed a credit line contract before.
              </p>
              <button className="btn buy" onClick={pay}>
                Pay {money(offer.price)} from my credit line
              </button>
            </div>
          ) : (
            <div className="esto-card">
              <p className="esto-price">{money(offer.price)}</p>
              <p className="muted">
                {METHODS.find((m) => m.id === method)?.name} works as it does today: an application, then a
                new contract to sign. This demo does not follow it.
              </p>
              <button className="btn buy" onClick={() => setMethod('credit-line')}>
                Use my credit line
              </button>
            </div>
          )}
          <button className="link" onClick={() => setStep('store')}>
            Back to {store}
          </button>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="st">
          <header className="st-head">
            <span className="st-logo">{store}</span>
            <span>Order</span>
          </header>
          <div className="st-body is-one">
            <section>
              <p className="st-tick" aria-hidden="true">
                ✓
              </p>
              <h1 id="flow-title" ref={heading} tabIndex={-1}>
                Order confirmed
              </h1>
              <p>
                ESTO paid {store} for this order. {store} sends it as usual.
              </p>
              {order}
              <dl className="st-total">
                <dt>Paid with ESTO</dt>
                <dd>{money(offer.price)}</dd>
              </dl>
              <p className="st-note">
                Simulated. No order is made, and no money moves. In the ESTO app, the free limit is now{' '}
                {whole(freeAfter)}.
              </p>
              <button className="st-btn" onClick={onClose}>
                Open the ESTO app
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="icon">
      <path d="M6 11h12v9H6z" />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" />
    </svg>
  );
}
