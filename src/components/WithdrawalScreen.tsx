import { useId, useRef, useState, type CSSProperties, type Dispatch } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { PaymentChart } from './PaymentChart';
import { costOf } from '../lib/money';
import {
  currencyFirst,
  formatMoney,
  formatNumber,
  formatWhole,
  parseAmount,
  type Locale,
} from '../lib/format';
import {
  EXAMPLE,
  TERMS,
  isEmpty,
  type Speed,
  type WithdrawalAction,
  type WithdrawalState,
} from '../lib/withdrawal';
import { t } from '../i18n/strings';

interface Props {
  state: WithdrawalState;
  dispatch: Dispatch<WithdrawalAction>;
  locale: Locale;
  loading?: boolean;
  onSubmit: () => void;
  /** Called once per deliberate change to the amount, so we can see how people set it. */
  onAmountInput?: (source: AmountSource) => void;
}

export type AmountSource = 'stepper' | 'slider' | 'typed';

/** Slider events closer together than this are one drag, not separate adjustments. */
const SLIDER_GESTURE_MS = 400;

export function WithdrawalScreen({
  state,
  dispatch,
  locale,
  loading = false,
  onSubmit,
  onAmountInput,
}: Props) {
  const id = useId();

  if (loading) return <LoadingScreen locale={locale} />;
  if (isEmpty(state)) return <EmptyScreen locale={locale} />;

  const money = (cents: number) => formatMoney(cents, locale);
  const whole = (cents: number) => formatWhole(cents, locale);
  const fee = state.speed === 'instant' ? EXAMPLE.instantFee : 0;
  const cost = costOf(state.amount, EXAMPLE.aprPercent, state.term, fee);

  return (
    <form
      className="screen"
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h3 id={`${id}-title`} className="screen__title">
        {t(locale, 'title')}
      </h3>
      <p className="screen__available">{t(locale, 'available', { limit: whole(state.limit) })}</p>

      <AmountField state={state} dispatch={dispatch} locale={locale} onAmountInput={onAmountInput} />

      <p className="screen__notice" role="status">
        {state.notice?.kind === 'overLimit' && t(locale, 'overLimit', { limit: whole(state.limit) })}
        {state.notice?.kind === 'belowMin' && t(locale, 'belowMin', { min: whole(EXAMPLE.minAmount) })}
      </p>

      <fieldset className="choice">
        <legend className="screen__label">{t(locale, 'speedLabel')}</legend>
        <div className="choice__grid">
          <SpeedOption
            name={`${id}-speed`}
            value="free"
            current={state.speed}
            title={t(locale, 'speedFree')}
            price={t(locale, 'speedFreePrice')}
            dispatch={dispatch}
          />
          <SpeedOption
            name={`${id}-speed`}
            value="instant"
            current={state.speed}
            title={t(locale, 'speedInstant')}
            price={t(locale, 'speedInstantPrice', { fee: money(EXAMPLE.instantFee) })}
            dispatch={dispatch}
          />
        </div>
      </fieldset>

      <fieldset className="segmented">
        <legend className="screen__label">{t(locale, 'termLabel')}</legend>
        <div className="segmented__track">
          {TERMS.map((term) => (
            <label key={term} className="segmented__item">
              <input
                type="radio"
                name={`${id}-term`}
                value={term}
                checked={state.term === term}
                onChange={() => dispatch({ type: 'setTerm', term })}
              />
              <span>{t(locale, 'termMonths', { n: term })}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="summary" aria-label={t(locale, 'totalCost')}>
        <div className="summary__main">
          <span className="screen__label">{t(locale, 'monthly')}</span>
          <strong className="summary__payment">
            <AnimatedNumber value={cost.monthlyPayment} format={money} />
          </strong>
          <span className="summary__term">{t(locale, 'months', { n: state.term })}</span>
        </div>
        <dl className="summary__rows">
          <div>
            <dt>{t(locale, 'interest')}</dt>
            <dd>
              <AnimatedNumber value={cost.interest} format={money} />
            </dd>
          </div>
          {fee > 0 && (
            <div className="summary__fee">
              <dt>{t(locale, 'fee')}</dt>
              <dd>{money(fee)}</dd>
            </div>
          )}
          <div className="summary__strong">
            <dt>{t(locale, 'totalCost')}</dt>
            <dd>
              <AnimatedNumber value={cost.interest + cost.fee} format={money} />
            </dd>
          </div>
          <div>
            <dt>{t(locale, 'totalBack')}</dt>
            <dd>
              <AnimatedNumber value={cost.totalRepaid} format={money} />
            </dd>
          </div>
        </dl>
        <PaymentChart rows={cost.schedule} fee={fee} locale={locale} />
      </section>

      <button type="submit" className="button button--primary">
        {t(locale, 'cta', { amount: whole(state.amount) })}
      </button>
      <p className="screen__example">{t(locale, 'example', { apr: EXAMPLE.aprPercent })}</p>
    </form>
  );
}

function AmountField({ state, dispatch, locale, onAmountInput }: Omit<Props, 'onSubmit' | 'loading'>) {
  const lastSliderEvent = useRef(0);
  const id = useId();
  // While the field has focus, the customer's own text wins. It is parsed on blur or Enter.
  const [draft, setDraft] = useState<string | null>(null);
  const step = formatWhole(EXAMPLE.step, locale);
  const shown = draft ?? formatNumber(state.amount, locale);
  const symbol = (
    <span className="amount__currency" aria-hidden="true">
      €
    </span>
  );
  const fill = ((state.amount - EXAMPLE.minAmount) / Math.max(1, state.limit - EXAMPLE.minAmount)) * 100;

  const commit = () => {
    if (draft === null) return;
    const parsed = parseAmount(draft);
    if (parsed !== null && parsed !== state.amount) {
      dispatch({ type: 'setAmount', amount: parsed });
      onAmountInput?.('typed');
    }
    setDraft(null);
  };

  return (
    <div className="amount">
      <div className="amount__row">
        <button
          type="button"
          className="amount__step"
          aria-label={t(locale, 'decrease', { step })}
          disabled={state.amount <= EXAMPLE.minAmount}
          onClick={() => {
            dispatch({ type: 'step', direction: -1 });
            onAmountInput?.('stepper');
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <label className="amount__field" htmlFor={id}>
          <span className="sr-only">{t(locale, 'amountLabel')}</span>
          {currencyFirst(locale) && symbol}
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={shown}
            onFocus={(event) => {
              setDraft(String(state.amount / 100));
              event.currentTarget.select();
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
            }}
            style={{ width: `${Math.max(2, shown.length)}ch` }}
          />
          {!currencyFirst(locale) && symbol}
        </label>
        <button
          type="button"
          className="amount__step"
          aria-label={t(locale, 'increase', { step })}
          disabled={state.amount >= state.limit}
          onClick={() => {
            dispatch({ type: 'step', direction: 1 });
            onAmountInput?.('stepper');
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>
      <input
        type="range"
        className="amount__slider"
        aria-label={t(locale, 'slider')}
        aria-valuetext={formatWhole(state.amount, locale)}
        min={EXAMPLE.minAmount / 100}
        max={state.limit / 100}
        step={EXAMPLE.step / 100}
        value={state.amount / 100}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(event) => {
          dispatch({ type: 'setAmount', amount: Number(event.target.value) * 100 });
          const now = event.timeStamp;
          if (now - lastSliderEvent.current > SLIDER_GESTURE_MS) onAmountInput?.('slider');
          lastSliderEvent.current = now;
        }}
      />
    </div>
  );
}

interface SpeedOptionProps {
  name: string;
  value: Speed;
  current: Speed;
  title: string;
  price: string;
  dispatch: Dispatch<WithdrawalAction>;
}

function SpeedOption({ name, value, current, title, price, dispatch }: SpeedOptionProps) {
  return (
    <label className="choice__card">
      <input
        type="radio"
        name={name}
        value={value}
        checked={current === value}
        onChange={() => dispatch({ type: 'setSpeed', speed: value })}
      />
      <span className="choice__title">{title}</span>
      <span className="choice__price">{price}</span>
    </label>
  );
}

function LoadingScreen({ locale }: { locale: Locale }) {
  return (
    <div className="screen screen--loading" aria-busy="true">
      <p className="sr-only" role="status">
        {t(locale, 'loading')}
      </p>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--amount" />
      <div className="skeleton skeleton--slider" />
      <div className="skeleton skeleton--cards" />
      <div className="skeleton skeleton--summary" />
      <div className="skeleton skeleton--button" />
    </div>
  );
}

function EmptyScreen({ locale }: { locale: Locale }) {
  return (
    <div className="screen screen--empty">
      <svg className="empty__mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="26" />
        <path d="M22 32h20" />
      </svg>
      <h3 className="screen__title">{t(locale, 'emptyTitle')}</h3>
      <p className="screen__available">{t(locale, 'emptyBody')}</p>
      <button type="button" className="button button--primary" disabled>
        {t(locale, 'cta', { amount: formatWhole(0, locale) })}
      </button>
    </div>
  );
}
