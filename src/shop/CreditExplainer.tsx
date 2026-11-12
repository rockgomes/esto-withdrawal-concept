import { useMemo, useState } from 'react';
import { formatMoney, formatWhole } from '../lib/format';
import { buildSchedule, type Cents } from '../lib/money';
import {
  MAX_MONTHS,
  MINIMUM_MONTHS,
  MIN_MONTHS,
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
/** One bar for every third month, from month 1 to month 118. */
const BAR_MONTHS = Array.from({ length: 40 }, (_, i) => 1 + i * 3);
const AXIS_LABELS = new Map([
  [1, '1'],
  [31, '30'],
  [61, '60'],
  [91, '90'],
  [118, '120'],
]);

type Way = 'lowest' | 'faster';

/**
 * How a credit line works, as a small sandbox. The three boxes are one
 * model: the amount in use (box 1), how the person pays (box 3), and the
 * month they look at (box 2). A change in one box redraws the other two.
 * Nothing here changes the account.
 */
export default function CreditExplainer({ account, onShop }: { account: Account; onShop: () => void }) {
  const [used, setUsed] = useState(account.used);
  const [way, setWay] = useState<Way>('lowest');
  const [months, setMonths] = useState(12);
  const [at, setAt] = useState(0);

  const schedule = useMemo(() => buildSchedule(used, account.rate, months), [used, account.rate, months]);
  const lastMonth = way === 'lowest' ? MINIMUM_MONTHS : months;
  const month = Math.min(at, MINIMUM_MONTHS);

  /** What the person pays in one month, split in two parts. */
  const paymentIn = (m: number) => {
    if (way === 'lowest') return lowestPaymentParts(used, account.rate, m);
    const row = schedule[m - 1];
    return row
      ? { fixed: row.principal, interest: row.interest, total: row.payment }
      : { fixed: 0, interest: 0, total: 0 };
  };
  /** What is still in use after a month. */
  const stillInUse = (m: number) => {
    if (m <= 0) return used;
    if (way === 'lowest') return Math.round((used * Math.max(0, MINIMUM_MONTHS - m)) / MINIMUM_MONTHS);
    return schedule[m - 1]?.balance ?? 0;
  };

  const inUse = stillInUse(month);
  const free = Math.max(0, account.limit - inUse);
  const slow = lowestPaymentParts(used, account.rate, 1);
  const fast = plan(used, { ...account, used }, months);
  const tallest = Math.max(slow.total, way === 'faster' ? fast.monthly : 0, 1);
  const slowInterest = minimumPathInterest(used, account.rate);
  const first = paymentIn(1);

  const changeUsed = (next: Cents) => {
    setUsed(next);
    setAt(0);
  };
  const choose = (next: Way) => {
    setWay(next);
    setAt(0);
  };

  return (
    <section className="explain" aria-labelledby="explain-title">
      <h2 id="explain-title" className="page-title">
        How a credit line works
      </h2>
      <p className="explain-note">
        Try it. The three boxes are connected. This is a sandbox, so nothing here changes your account. The
        interest rate is an example.
      </p>
      <div className="explain-grid">
        <article className="explain-step">
          <p className="explain-n">1</p>
          <h3>You use any part of your limit</h3>
          <p className="muted small">
            You pay only for the part in use. The money you pay back is free to use again.
          </p>
          <div className={`mini${isHighUse({ ...account, used: inUse }) ? ' is-high-use' : ''}`}>
            <p className="mini-when" aria-live="polite">
              {month === 0 ? 'Today' : `After month ${month}`}
            </p>
            <div className="bar" aria-hidden="true">
              <i className="seg-used" style={{ flexGrow: inUse }} />
              <i className="seg-free" style={{ flexGrow: free }} />
            </div>
            <p className="mini-ends" aria-live="polite">
              <span>
                <i className="dot seg-used" /> In use <strong>{whole(inUse)}</strong>
              </span>
              <span>
                <i className="dot seg-free" /> Free <strong>{whole(free)}</strong>
              </span>
            </p>
          </div>
          <div className="explain-btns">
            <button
              className="btn ghost"
              disabled={account.limit - used < USE_STEP}
              onClick={() => changeUsed(used + USE_STEP)}
            >
              Use {whole(USE_STEP)}
            </button>
            <button
              className="btn ghost"
              disabled={used === 0}
              onClick={() => changeUsed(Math.max(0, used - PAY_STEP))}
            >
              Pay back {whole(PAY_STEP)}
            </button>
          </div>
        </article>

        <article className="explain-step">
          <p className="explain-n">2</p>
          <h3>ESTO sends one invoice a month</h3>
          <p className="muted small">
            Each invoice pays back a part of what you used, plus interest on what you still owe.
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
                aria-label={
                  way === 'lowest'
                    ? `Lowest payment each month. Month 1: ${money(first.total)}. Month 60: ${money(paymentIn(60).total)}. Month 120: ${money(paymentIn(120).total)}.`
                    : `Payment each month when you finish in ${months} months: ${money(fast.monthly)}. After month ${months} there is no invoice. The lowest payment in month 1 is ${money(slow.total)}.`
                }
              >
                {BAR_MONTHS.map((m, i) => {
                  const parts = paymentIn(m);
                  const ghost = way === 'faster' ? lowestPaymentParts(used, account.rate, m).total : 0;
                  const next = BAR_MONTHS[i + 1] ?? MINIMUM_MONTHS + 1;
                  const isAt = month > 0 && month >= m && month < next;
                  return (
                    <div className={`chart-col${isAt ? ' is-at' : ''}`} key={m}>
                      {ghost > 0 && (
                        <i className="chart-ghost" style={{ height: `${(ghost / tallest) * 100}%` }} />
                      )}
                      {parts.total > 0 && (
                        <div className="chart-bar" style={{ height: `${(parts.total / tallest) * 100}%` }}>
                          <i className="part-interest" style={{ flexGrow: parts.interest }} />
                          <i className="part-fixed" style={{ flexGrow: parts.fixed }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="chart-axis" aria-hidden="true">
                {BAR_MONTHS.map((m) => (
                  <span key={m}>{AXIS_LABELS.get(m) ?? ''}</span>
                ))}
              </div>
              <ul className="legend">
                <li>
                  <i className="dot part-fixed" /> Pays back what you used
                </li>
                <li>
                  <i className="dot part-interest" /> Interest
                </li>
                {way === 'faster' && (
                  <li>
                    <i className="dot chart-ghost" /> Lowest payments
                  </li>
                )}
              </ul>
              <label className="slider scrub">
                <span>
                  {month === 0 ? (
                    <>
                      Move to a month. Month 1 costs <strong>{money(first.total)}</strong>.
                    </>
                  ) : month > lastMonth ? (
                    <>
                      Month {month}: <strong>no invoice</strong>. It is all paid back.
                    </>
                  ) : (
                    <>
                      Month {month}: the invoice is <strong>{money(paymentIn(month).total)}</strong>.
                    </>
                  )}
                </span>
                <input
                  type="range"
                  aria-label="Month to look at"
                  min={0}
                  max={MINIMUM_MONTHS}
                  step={1}
                  value={month}
                  onChange={(e) => setAt(Number(e.target.value))}
                />
              </label>
            </>
          )}
        </article>

        <article className="explain-step">
          <p className="explain-n">3</p>
          <h3>You choose how much to pay</h3>
          <p className="muted small">
            Paying more costs nothing extra. You finish sooner and pay less interest.
          </p>
          {used === 0 ? (
            <p className="explain-empty">Use a part of the limit in box 1 to see the numbers.</p>
          ) : (
            <>
              <div className="way" role="group" aria-label="How you pay">
                <button className="toggle" aria-pressed={way === 'lowest'} onClick={() => choose('lowest')}>
                  Only the lowest payment
                </button>
                <button className="toggle" aria-pressed={way === 'faster'} onClick={() => choose('faster')}>
                  Pay more
                </button>
              </div>
              {way === 'faster' && (
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
                    onChange={(e) => {
                      setMonths(Number(e.target.value));
                      setAt(0);
                    }}
                  />
                </label>
              )}
              <dl className="versus">
                <div className={way === 'lowest' ? 'is-on' : undefined}>
                  <dt>Only the lowest payments, {MINIMUM_MONTHS} months</dt>
                  <dd>
                    <i style={{ width: '100%' }} className="versus-slow" />
                    <span>{whole(slowInterest)} interest</span>
                  </dd>
                </div>
                <div className={way === 'faster' ? 'is-on' : undefined}>
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
