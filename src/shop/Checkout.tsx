import { useEffect, useRef, useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import type { Offer, Product } from './catalog';
import { freeLimit, minimumPayment, type Account } from './credit';
import LimitImpact from './LimitImpact';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

type Step = 'store' | 'login' | 'esto' | 'today' | 'confirmed';
type Method = 'credit-line' | 'hire-purchase' | 'esto-3' | 'pay-later';
type StorePay = 'bank' | 'card' | 'esto';

/** ESTO's checkout methods today. "Credit line" is the new one. */
const TODAY_METHODS: { id: Method; name: string }[] = [
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
 * Phase 2: the purchase, as full pages in three places.
 *
 * 1. The store's checkout. A stand-in: the real page belongs to the store.
 *    The store does not know if the customer has a credit line.
 * 2. ESTO's payment page, where the store sends the customer today. ESTO
 *    has to know who the customer is. Only then can it offer "Credit line",
 *    and only when the free limit covers the order.
 * 3. The store again, with the order confirmed.
 *
 * The bar at the top works like a browser address bar. It says which site
 * the customer is on. It also holds the demo's own controls.
 */
export default function Checkout({
  product,
  offer,
  account,
  onClose,
  onPaid,
  onOpenApp,
}: {
  product: Product;
  offer: Offer;
  account: Account;
  onClose: () => void;
  onPaid: () => void;
  /** After the order is confirmed: go and see the purchase in the ESTO app. */
  onOpenApp: () => void;
}) {
  const [step, setStep] = useState<Step>('store');
  const [storePay, setStorePay] = useState<StorePay>('esto');
  // Fixed when the flow opens, so the numbers do not move after the payment.
  const [freeBefore] = useState(() => freeLimit(account));
  const usedBefore = account.limit - freeBefore;
  const payNow = minimumPayment(usedBefore, account.rate);
  const payAfter = minimumPayment(usedBefore + offer.price, account.rate);
  const enough = offer.price <= freeBefore;
  const [method, setMethod] = useState<Method>(enough ? 'credit-line' : 'hire-purchase');
  const heading = useRef<HTMLHeadingElement>(null);
  const store = offer.store.name;
  const storeHost = hostOf(offer.store.site || offer.url, store);
  const onStore = step === 'store' || step === 'confirmed';
  const methodName = TODAY_METHODS.find((m) => m.id === method)?.name ?? 'Credit line';

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

  const where: Record<Step, string> = {
    store: `You are on the ${store} site. This page is a stand-in. The store does not know if you have a credit line.`,
    login:
      'You are on ESTO. It has to know who you are before it can check your limit. ESTO identifies customers in its purchase flow today.',
    esto: "You are on ESTO's payment page. The new part is the Credit line option.",
    today: "You are on ESTO's payment page. From here it is the flow of today.",
    confirmed: `ESTO sent you back to ${store}, as it does today. This page is a stand-in.`,
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
        <p className="addr-what">{where[step]}</p>
        {step === 'confirmed' ? (
          <button className="addr-close is-main" onClick={onOpenApp}>
            See the purchase in the ESTO app
          </button>
        ) : (
          <button className="addr-close" onClick={onClose}>
            Leave the demo
          </button>
        )}
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
              <button className="st-btn" disabled={storePay !== 'esto'} onClick={() => setStep('login')}>
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

      {step === 'login' && (
        <div className="ep">
          <div className="esto-head">
            <span className="wordmark">esto</span>
            <span className="muted small">Order from {store}</span>
          </div>
          <h1 id="flow-title" ref={heading} tabIndex={-1} className="ep-title">
            Confirm who you are
          </h1>
          <div className="esto-card">
            <p className="esto-price">{money(offer.price)}</p>
            <p className="muted small">{product.name}</p>
            <div className="id-list">
              {['Smart-ID', 'Mobile-ID', 'ID card'].map((way) => (
                <button key={way} className="btn outline" onClick={() => setStep('esto')}>
                  {way}
                </button>
              ))}
            </div>
            <p className="demo-note">Stand-in. No real login happens. Choose any of the three to go on.</p>
          </div>
          <button className="link" onClick={() => setStep('store')}>
            Back to {store}
          </button>
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
            <button
              role="radio"
              aria-checked={method === 'credit-line'}
              className="method"
              onClick={() => setMethod('credit-line')}
            >
              Credit line
              {enough ? (
                <span className="nav-badge">NEW</span>
              ) : (
                <span className="badge no">Limit too low</span>
              )}
            </button>
            {TODAY_METHODS.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={m.id === method}
                className="method"
                onClick={() => setMethod(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>

          {method === 'credit-line' && enough && (
            <div className="esto-card">
              <p className="esto-price">{money(offer.price)}</p>
              <p className="muted small">{product.name}</p>
              <LimitImpact account={{ ...account, used: usedBefore }} price={offer.price} />
              <dl className="lines">
                <div>
                  <dt>Lowest monthly payment now</dt>
                  <dd>{money(payNow)}</dd>
                </div>
                <div>
                  <dt>Lowest monthly payment after this purchase</dt>
                  <dd>{money(payAfter)}</dd>
                </div>
              </dl>
              <p className="muted small pay-how">
                You get one invoice a month. This is the lowest amount on it, and it goes down each month. You
                can pay more in any month at no extra cost.
              </p>
              <p className="esto-ok">
                No application and no new contract. You signed a credit line contract before.
              </p>
              <button className="btn buy" onClick={pay}>
                Pay {money(offer.price)} from my credit line
              </button>
            </div>
          )}

          {method === 'credit-line' && !enough && (
            <div className="esto-card">
              <p className="esto-price">{money(offer.price)}</p>
              <p className="muted small">{product.name}</p>
              <p className="esto-short">
                Your free limit is {whole(freeBefore)}. This order needs {whole(offer.price - freeBefore)}{' '}
                more.
              </p>
              <p className="muted">
                Choose another method above to buy it now. You can also ask for a higher limit in the ESTO app
                and come back.
              </p>
            </div>
          )}

          {method !== 'credit-line' && (
            <div className="esto-card">
              <p className="esto-price">{money(offer.price)}</p>
              <p className="muted small">{product.name}</p>
              <p className="muted">
                Next: an application, then a contract to sign. This is how it works today.
              </p>
              <button className="btn buy" onClick={() => setStep('today')}>
                Continue with {methodName}
              </button>
            </div>
          )}
          <button className="link" onClick={() => setStep('store')}>
            Back to {store}
          </button>
        </div>
      )}

      {step === 'today' && (
        <div className="ep">
          <div className="esto-head">
            <span className="wordmark">esto</span>
            <span className="muted small">Order from {store}</span>
          </div>
          <div className="esto-card">
            <h1 id="flow-title" ref={heading} tabIndex={-1} className="ep-title">
              The demo stops here
            </h1>
            <p className="muted">
              {methodName} goes on as it does today: ESTO's application, a contract to sign, and then back to{' '}
              {store}. This concept does not change these steps, so the demo does not rebuild them.
            </p>
            <button className="btn buy" onClick={() => setStep('esto')}>
              Back to the payment methods
            </button>
          </div>
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
              <p>Thank you. We send your order as usual.</p>
              {order}
              <dl className="st-total">
                <dt>Paid with ESTO</dt>
                <dd>{money(offer.price)}</dd>
              </dl>
              <p className="st-note">Simulated. No order is made, and no money moves.</p>
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
