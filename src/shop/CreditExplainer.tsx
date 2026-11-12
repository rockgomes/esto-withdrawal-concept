import { useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import {
  MAX_MONTHS,
  MINIMUM_MONTHS,
  MIN_MONTHS,
  freeLimit,
  isHighUse,
  lowestPaymentParts,
  minimumPathInterest,
  plan,
  type Account,
} from './credit';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

const USE_STEP = 40_000;
const PAY_STEP = 20_000;
/** The months the chart shows, from the first invoice to the last. */
const CHART_MONTHS = [1, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120];

/**
 * How a credit line works, as a small sandbox. The person uses a part of the
 * limit and pays a part back, and the three pictures follow: the limit, the
 * monthly invoice, and what paying more saves. Nothing here changes the account.
 */
export default function CreditExplainer({ account, onShop }: { account: Account; onShop: () => void }) {
  const [used, setUsed] = useState(account.used);
  const [months, setMonths] = useState(12);
  const sandbox: Account = { ...account, used };
  const free = freeLimit(sandbox);
  const first = lowestPaymentParts(used, account.rate, 1);
  const tallest = Math.max(first.total, 1);
  const slowInterest = minimumPathInterest(used, account.rate);
  const fast = plan(used, sandbox, months);

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
            The lowest payment is a fixed part of what you used, plus interest on what you still owe. So it
            gets smaller every month.
          </p>
          {used === 0 ? (
            <p className="explain-empty">
              Nothing is in use. So there is no invoice, and the limit costs nothing.
            </p>
          ) : (
            <>
              <div
                className="chart"
                role="img"
                aria-label={`Lowest payment each month. Month 1: ${money(first.total)}. Month 60: ${money(lowestPaymentParts(used, account.rate, 60).total)}. Month 120: ${money(lowestPaymentParts(used, account.rate, 120).total)}.`}
              >
                {CHART_MONTHS.map((m) => {
                  const parts = lowestPaymentParts(used, account.rate, m);
                  return (
                    <div className="chart-col" key={m}>
                      <div className="chart-bar" style={{ height: `${(parts.total / tallest) * 100}%` }}>
                        <i className="part-interest" style={{ flexGrow: parts.interest }} />
                        <i className="part-fixed" style={{ flexGrow: parts.fixed }} />
                      </div>
                      <span>{m}</span>
                    </div>
                  );
                })}
              </div>
              <p className="chart-axis">Month</p>
              <ul className="legend">
                <li>
                  <i className="dot part-fixed" /> Fixed part {money(first.fixed)}
                </li>
                <li>
                  <i className="dot part-interest" /> Interest, {money(first.interest)} in month 1
                </li>
              </ul>
              <p className="explain-fact">
                Month 1: <strong>{money(first.total)}</strong>. Month 120:{' '}
                <strong>{money(lowestPaymentParts(used, account.rate, 120).total)}</strong>.
              </p>
            </>
          )}
        </article>

        <article className="explain-step">
          <p className="explain-n">3</p>
          <h3>You can pay more in any month</h3>
          <p className="muted small">
            Paying more costs nothing extra. You finish sooner and pay less interest.
          </p>
          {used === 0 ? (
            <p className="explain-empty">Use a part of the limit in step 1 to see the numbers.</p>
          ) : (
            <>
              <label className="slider">
                <span>
                  Finish in <strong>{months} months</strong>, with {money(fast.monthly)} a month
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
              <dl className="versus">
                <div>
                  <dt>Only the lowest payments, {MINIMUM_MONTHS} months</dt>
                  <dd>
                    <i style={{ width: '100%' }} className="versus-slow" />
                    <span>{whole(slowInterest)} interest</span>
                  </dd>
                </div>
                <div>
                  <dt>Paid off in {months} months</dt>
                  <dd>
                    <i
                      style={{ width: `${Math.max(2, (fast.cost / Math.max(slowInterest, 1)) * 100)}%` }}
                      className="versus-fast"
                    />
                    <span>{whole(fast.cost)} interest</span>
                  </dd>
                </div>
              </dl>
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
