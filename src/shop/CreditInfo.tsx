import { formatMoney, formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import { lowestPaymentParts, type Account } from './credit';
import type { Phase } from './phase';

const money = (cents: Cents) => formatMoney(cents, 'et');
const whole = (cents: Cents) => formatWhole(cents, 'et');

const EXAMPLE: Cents = 100_000;
const EXAMPLE_MONTHS = [1, 12, 60, 120];

/**
 * The "How it works" tab of the Credit Line page. First the short blocks, as
 * on the real ESTO page: a small picture, a title, and one or two sentences.
 * Then the same thing in numbers, for a person who wants the full picture.
 */
export function CreditHow({
  account,
  phase,
  onShop,
}: {
  account: Account;
  phase: Phase;
  onShop: () => void;
}) {
  return (
    <>
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
              With a credit line you’ll always have the funds you need at hand, without the monthly payment of
              a lump-sum loan.
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
                <span>Bank link</span>
                <span>Card</span>
                <span className="is-on">ESTO</span>
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

      <section aria-labelledby="numbers-title">
        <h2 id="numbers-title" className="page-title">
          The credit line in numbers
        </h2>
        <dl className="details">
          <div>
            <dt>Your limit</dt>
            <dd>{whole(account.limit)}</dd>
          </div>
          <div>
            <dt>Highest limit ESTO gives</dt>
            <dd>10 000 €</dd>
          </div>
          <div>
            <dt>Interest</dt>
            <dd>From 19% a year</dd>
          </div>
          <div>
            <dt>Monthly fee, contract fee, and fee for a limit you do not use</dt>
            <dd>0 €</dd>
          </div>
          <div>
            <dt>Lowest monthly payment</dt>
            <dd>1/120 of the amount in use, plus the interest</dd>
          </div>
          <div>
            <dt>Paying back early</dt>
            <dd>At any time, at no extra cost</dd>
          </div>
          <div>
            <dt>Withdrawal to your bank account</dt>
            <dd>1 to 3 working days, or at once for 19,90 €</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="example-title">
        <h2 id="example-title" className="page-title">
          An example: you use {whole(EXAMPLE)}
        </h2>
        <div className="table-wrap">
          <table className="tx">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col" className="num">
                  Pays back what you used
                </th>
                <th scope="col" className="num">
                  Interest
                </th>
                <th scope="col" className="num">
                  You pay
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_MONTHS.map((month) => {
                const parts = lowestPaymentParts(EXAMPLE, account.rate, month);
                return (
                  <tr key={month}>
                    <th scope="row">Month {month}</th>
                    <td className="num">{money(parts.fixed)}</td>
                    <td className="num">{money(parts.interest)}</td>
                    <td className="num">
                      <strong>{money(parts.total)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small tx-note">
          These are the lowest payments, at the example rate of {account.rate.toLocaleString('et-EE')}% a
          year. Your own rate can be lower. You can pay more in any month. Then you finish sooner and pay less
          interest.
        </p>
      </section>
    </>
  );
}

/**
 * The FAQ tab. The first five questions are the ones on ESTO's public credit
 * line page. The answers are short versions of ESTO's answers. The last
 * question is new in this concept.
 */
export function CreditFaq({ phase }: { phase: Phase }) {
  const faq = [
    {
      q: 'What does the credit line cost if I don’t use it?',
      a: 'Nothing. There is no monthly fee, no contract fee, and no charge for a limit you do not use. You pay interest only on the amount in use.',
    },
    {
      q: 'How does the renewing limit work?',
      a: 'A part of every monthly payment pays back what you used. That part is free to use again at once. You do not apply again.',
    },
    {
      q: 'Why do the monthly payments decrease?',
      a: 'Each month you pay back the same part of what you used. The interest is on what you still owe. So when you owe less, you pay less.',
    },
    {
      q: 'How fast is the money on my account?',
      a: 'A withdrawal takes 1 to 3 working days. With the instant payment, for 19,90 €, the money arrives at once.',
    },
    {
      q: 'Can I repay everything early?',
      a: 'Yes, at any time and at no extra cost. Interest on the amount you pay back stops the same day.',
    },
  ];
  if (phase === 2) {
    faq.unshift({
      q: 'Can I pay at a store from my credit line?',
      a: 'Yes. At the store checkout, choose ESTO. On the ESTO page, choose Credit line. There is no application and no new contract. The purchase shows on your next monthly invoice.',
    });
  }
  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="page-title">
        Frequently asked questions
      </h2>
      <div className="faq">
        {faq.map((item, i) => (
          <details key={item.q}>
            <summary>
              {item.q}
              {phase === 2 && i === 0 && <span className="nav-badge">NEW</span>}
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
