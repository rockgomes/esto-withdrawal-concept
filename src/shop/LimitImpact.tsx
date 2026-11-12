import { formatWhole } from '../lib/format';
import type { Cents } from '../lib/money';
import { freeLimit, isHighUse, type Account } from './credit';

const whole = (cents: Cents) => formatWhole(cents, 'et');

/** What one purchase does to the limit. Shown next to the buy button. */
export default function LimitImpact({ account, price }: { account: Account; price: Cents }) {
  const free = freeLimit(account);
  if (price > free) {
    return (
      <p className="impact impact-over">
        This costs {whole(price - free)} more than your free limit of {whole(free)}. You can still buy it with
        another ESTO method at the store, or watch the price.
      </p>
    );
  }
  return (
    <div className={`impact${isHighUse(account) ? ' is-high-use' : ''}`}>
      <p className="impact-title">
        Your limit after this purchase: <strong>{whole(free - price)} free</strong>
      </p>
      <div className="bar" aria-hidden="true">
        <i className="seg-used" style={{ flexGrow: account.used }} />
        <i className="seg-buy" style={{ flexGrow: price }} />
        <i className="seg-free" style={{ flexGrow: free - price }} />
      </div>
      <ul className="legend">
        <li>
          <i className="dot seg-used" /> In use {whole(account.used)}
        </li>
        <li>
          <i className="dot seg-buy" /> This purchase {whole(price)}
        </li>
        <li>
          <i className="dot seg-free" /> Free after {whole(free - price)}
        </li>
      </ul>
    </div>
  );
}
