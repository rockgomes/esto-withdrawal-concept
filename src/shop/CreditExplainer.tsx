import { useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import {
  MINIMUM_MONTHS,
  MIN_MONTHS,
  freeLimit,
  isHighUse,
  paybackInterest,
  paybackParts,
  type Account,
} from './credit';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

const USE_STEP = 40_000;
const PAY_STEP = 20_000;

/**
 * How a credit line works, as a small sandbox. Box 1 sets the amount in use.
 * Box 3 sets in how many months it is paid back, up to the 120 months of the
 * lowest payments. Box 2 shows three invoices for those two choices: the
 * first, the middle one, and the last. Nothing here changes the account.
 */
export default function CreditExplainer({ account, onShop }: { account: Account; onShop: () => void }) {
  const [used, setUsed] = useState(account.used);
  const [months, setMonths] = useState(MINIMUM_MONTHS);
  const sandbox: Account = { ...account, used };
  const free = freeLimit(sandbox);
  const middle = Math.max(1, Math.round(months / 2));
  const invoices = [
    { label: 'First invoice', month: 1 },
    { label: 'Middle invoice', month: middle },
    { label: 'Last invoice', month: months },
  ].map((row) => ({ ...row, parts: paybackParts(used, account.rate, months, row.month) }));
  const widest = Math.max(invoices[0].parts.total, 1);
  const interest = paybackInterest(used, account.rate, months);
  const longest = paybackInterest(used, account.rate, MINIMUM_MONTHS);
  const isLongest = months === MINIMUM_MONTHS;

  return (
    <section className="explain" aria-labelledby="explain-title">
      <h2 id="explain-title" className="page-title">
        How a credit line works
      </h2>
      <p className="explain-note">
        Try it. This is a sandbox, so nothing here changes your account. The interest rate is an example.
      </p>
      <div className="explain-grid">
        <article className="explain-step">
          <p className="explain-n">1</p>
          <h3>You use any part of your limit</h3>
          <p className="muted small">
            You pay only for the part in use. The money you pay back is free to use again.
          </p>
          <div className={`mini${isHighUse(sandbox) ? ' is-high-use' : ''}`}>
            <div className="bar" aria-hidden="true">
              <i className="seg-used" style={{ flexGrow: used }} />
              <i className="seg-free" style={{ flexGrow: free }} />
            </div>
            <p className="mini-ends" aria-live="polite">
              <span>
                <i className="dot seg-used" /> In use <strong>{whole(used)}</strong>
              </span>
              <span>
                <i className="dot seg-free" /> Free <strong>{whole(free)}</strong>
              </span>
            </p>
          </div>
          <div className="explain-btns">
            <button
              className="btn ghost"
              disabled={free < USE_STEP}
              onClick={() => setUsed((u) => u + USE_STEP)}
            >
              Use {whole(USE_STEP)}
            </button>
            <button
              className="btn ghost"
              disabled={used === 0}
              onClick={() => setUsed((u) => Math.max(0, u - PAY_STEP))}
            >
              Pay back {whole(PAY_STEP)}
            </button>
          </div>
        </article>

        <article className="explain-step">
          <p className="explain-n">2</p>
          <h3>ESTO sends one invoice a month</h3>
          <p className="muted small">
            An invoice has two parts. One part pays back what you used. The other part is interest on what you
            still owe, so it gets smaller.
          </p>
          {used === 0 ? (
            <p className="explain-empty">
              Nothing is in use. So there is no invoice, and the limit costs nothing.
            </p>
          ) : (
            <>
              <ol className="invoices">
                {invoices.map((row) => (
                  <li key={row.label}>
                    <p className="invoice-top">
                      <span>
                        {row.label}, month {row.month}
                      </span>
                      <strong>{money(row.parts.total)}</strong>
                    </p>
                    <div
                      className="invoice-bar"
                      style={{ width: `${Math.max(4, (row.parts.total / widest) * 100)}%` }}
                      aria-hidden="true"
                    >
                      <i className="part-fixed" style={{ flexGrow: row.parts.fixed }} />
                      <i className="part-interest" style={{ flexGrow: row.parts.interest }} />
                    </div>
                    <p className="invoice-parts">
                      {money(row.parts.fixed)} pays back, {money(row.parts.interest)} is interest
                    </p>
                  </li>
                ))}
              </ol>
              <ul className="legend">
                <li>
                  <i className="dot part-fixed" /> Pays back what you used
                </li>
                <li>
                  <i className="dot part-interest" /> Interest
                </li>
              </ul>
            </>
          )}
        </article>

        <article className="explain-step">
          <p className="explain-n">3</p>
          <h3>You choose how fast you pay it back</h3>
          <p className="muted small">
            The slowest way is 120 months. Paying faster costs nothing extra, and you pay less interest.
          </p>
          {used === 0 ? (
            <p className="explain-empty">Use a part of the limit in box 1 to see the numbers.</p>
          ) : (
            <>
              <label className="slider">
                <span className="pace">
                  <span>
                    Pay it back in <strong>{months} months</strong>
                  </span>
                  <span className="muted small">
                    {isLongest
                      ? 'This is the slowest way: only the lowest payments.'
                      : 'Faster than the lowest payments.'}
                  </span>
                </span>
                <input
                  type="range"
                  min={MIN_MONTHS}
                  max={MINIMUM_MONTHS}
                  step={1}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                />
                <span className="pace-ends" aria-hidden="true">
                  <span>{MIN_MONTHS} months</span>
                  <span>{MINIMUM_MONTHS} months</span>
                </span>
              </label>
              <p className="invoice-top total">
                <span>Interest you pay in total</span>
                <strong>{whole(interest)}</strong>
              </p>
              <div className="total-track" aria-hidden="true">
                <i style={{ width: `${Math.max(2, (interest / Math.max(longest, 1)) * 100)}%` }} />
              </div>
              <p className="invoice-parts wrap">
                A full bar is {whole(longest)}, the interest over 120 months.
              </p>
            </>
          )}
        </article>
      </div>
      <p className="explain-new">
        <span className="nav-badge">NEW</span> In this concept you can also pay at a store from your limit.
        Today you can only move money from the limit to a bank account.{' '}
        <button className="link" onClick={onShop}>
          Find a product
        </button>
      </p>
    </section>
  );
}
