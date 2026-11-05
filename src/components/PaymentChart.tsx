import type { Cents, ScheduleRow } from '../lib/money';
import { formatMoney, type Locale } from '../lib/format';
import { t } from '../i18n/strings';

interface Props {
  rows: ScheduleRow[];
  fee: Cents;
  locale: Locale;
}

const pct = (part: Cents, whole: Cents) => `${Math.min(100, (part / whole) * 100)}%`;

export function PaymentChart({ rows, fee, locale }: Props) {
  // The tallest bar fills the chart. The chart shows the shape of the plan, the numbers above show size.
  const scale = Math.max(1, ...rows.map((row, i) => row.payment + (i === 0 ? fee : 0)));
  const summary = `${t(locale, 'planLabel')}: ${rows.length} × ${formatMoney(rows[0]?.payment ?? 0, locale)}`;

  return (
    <figure className="chart">
      <figcaption className="chart__label">
        <span>{t(locale, 'planLabel')}</span>
        <span className="chart__legend" aria-hidden="true">
          <span>
            <i className="swatch swatch--principal" /> {t(locale, 'principal')}
          </span>
          <span>
            <i className="swatch swatch--interest" /> {t(locale, 'interest')}
          </span>
          {fee > 0 && (
            <span>
              <i className="swatch swatch--fee" /> {t(locale, 'fee')}
            </span>
          )}
        </span>
      </figcaption>
      <div className="chart__bars" role="img" aria-label={summary}>
        {rows.map((row, i) => {
          // The one-off fee is paid with the first instalment, so it sits on top of bar one.
          const barFee = i === 0 ? fee : 0;
          const total = row.payment + barFee;
          return (
            <div
              key={row.month}
              className="chart__bar"
              title={t(locale, 'planMonth', { n: row.month, amount: formatMoney(total, locale) })}
              style={{ height: pct(total, scale), transitionDelay: `${i * 12}ms` }}
            >
              {barFee > 0 && <span className="chart__fee" style={{ flexBasis: pct(barFee, total) }} />}
              <span className="chart__interest" style={{ flexBasis: pct(row.interest, total) }} />
            </div>
          );
        })}
      </div>
    </figure>
  );
}
