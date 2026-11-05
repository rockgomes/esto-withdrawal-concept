import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { BeforeSchematic } from './components/BeforeSchematic';
import { Loop } from './components/Loop';
import { Todo } from './components/Todo';
import { WithdrawalScreen } from './components/WithdrawalScreen';
import { findings, type FindingId } from './content';
import { withViewTransition } from './hooks/motion';
import { LOCALES, type Locale } from './lib/format';
import { EXAMPLE, initialState, isEmpty, withdrawalReducer } from './lib/withdrawal';
import { spec, specAsMarkdown } from './spec';

const LOCALE_NAMES: Record<Locale, string> = { en: 'EN', et: 'ET', lv: 'LV', lt: 'LT' };
const SLOW_NETWORK_MS = 2200;

export default function App() {
  const [state, dispatch] = useReducer(withdrawalReducer, initialState);
  const [locale, setLocale] = useState<Locale>('en');
  const [loading, setLoading] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [result, setResult] = useState('Pick a case. The prototype handles it live.');
  const [toast, setToast] = useState<string | null>(null);
  const [activeFinding, setActiveFinding] = useState<FindingId | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const empty = isEmpty(state);

  const cases = [
    {
      label: 'Type 2 500 €',
      run: () => dispatch({ type: 'setAmount', amount: 250000 }),
      result: 'Over the limit. Corrected to the limit, and the screen says why.',
    },
    {
      label: 'Type 5 €',
      run: () => dispatch({ type: 'setAmount', amount: 500 }),
      result: 'Under the minimum. Raised to the minimum, with a message.',
    },
    {
      label: empty ? 'Give the limit back' : 'Limit fully used',
      run: () => withViewTransition(() => dispatch({ type: 'setLimit', limit: empty ? EXAMPLE.limit : 0 })),
      result: empty
        ? 'Limit restored. The amount comes back to a sensible default.'
        : 'Empty state. It explains why, and nothing can be submitted.',
    },
    {
      label: 'Slow network',
      run: () => {
        withViewTransition(() => setLoading(true));
        later(() => withViewTransition(() => setLoading(false)), SLOW_NETWORK_MS);
      },
      result: 'Skeleton while loading. No toggle that says two things at once.',
    },
    {
      label: 'Longest copy (LT)',
      run: () => withViewTransition(() => setLocale('lt')),
      result: 'Lithuanian runs longest. Nothing wraps badly or overflows.',
    },
    {
      label: narrow ? 'Normal phone' : 'Small phone, 320px',
      run: () => withViewTransition(() => setNarrow((n) => !n)),
      result: narrow ? 'Back to 375px.' : '320px wide. Same layout, still readable.',
    },
  ];

  const reset = () =>
    withViewTransition(() => {
      dispatch({ type: 'reset' });
      setLocale('en');
      setNarrow(false);
      setLoading(false);
      setResult('Reset to the defaults.');
    });

  const submit = () => {
    setToast('Prototype only. No money moved.');
    later(() => setToast(null), 2600);
  };

  return (
    <>
      <a className="skip" href="#prototype">
        Skip to the prototype
      </a>

      <header className="hero">
        <div className="hero__text">
          <p className="eyebrow">
            Application · Product Builder · <span className="eyebrow__flag">Unofficial concept</span>
          </p>
          <h1 className="hero__title">
            One loop,{' '}
            <span className="hero__shipped">
              shipped.
              <svg viewBox="0 0 220 24" aria-hidden="true" preserveAspectRatio="none">
                <path d="M4 16 C 60 6, 140 6, 216 14" pathLength={1} />
              </svg>
            </span>
          </h1>
          <p className="hero__lede">
            ESTO’s withdrawal screen starts at the full limit, with a paid instant payout already switched on,
            and shows only next month’s payment. I rebuilt it so the customer sees the real cost, chooses
            speed on purpose, and reads the same numbers in all three markets.
          </p>
          <p className="hero__byline">
            Rock Gomes · <Todo>your role in one line, e.g. product designer, ex-Inbank</Todo>
          </p>
        </div>
        <Loop />
      </header>

      <main>
        <section id="problem" className="section" aria-labelledby="problem-title">
          <SectionHead index="01" id="problem-title" title="Problem">
            I opened the withdrawal screen in my own account, on mobile and desktop. Six things stood out.
          </SectionHead>
          <BeforeSchematic active={activeFinding} onActivate={setActiveFinding} />
        </section>

        <section id="prototype" className="section" aria-labelledby="prototype-title">
          <SectionHead index="02" id="prototype-title" title="Prototype">
            Live and clickable. Drag the amount, switch the speed and the term, change the market. Then try to
            break it.
          </SectionHead>

          <div className="proto">
            <div className={`phone ${narrow ? 'phone--narrow' : ''}`}>
              <div className="phone__bar" aria-hidden="true">
                <span>Withdraw</span>
                <span className="phone__close">×</span>
              </div>
              <div className="phone__screen">
                <WithdrawalScreen
                  state={state}
                  dispatch={dispatch}
                  locale={locale}
                  loading={loading}
                  onSubmit={submit}
                />
              </div>
              <p className="toast" role="status" data-visible={toast !== null}>
                {toast}
              </p>
            </div>

            <aside className="lab" aria-label="Prototype controls">
              <fieldset className="lab__group">
                <legend>Market</legend>
                <div className="pills">
                  {LOCALES.map((code) => (
                    <label key={code} className="pill">
                      <input
                        type="radio"
                        name="locale"
                        checked={locale === code}
                        onChange={() => withViewTransition(() => setLocale(code))}
                      />
                      <span>{LOCALE_NAMES[code]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="lab__group">
                <h3 className="lab__title">Try to break it</h3>
                <div className="lab__cases">
                  {cases.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      className="button button--ghost"
                      disabled={loading}
                      onClick={() => {
                        c.run();
                        setResult(c.result);
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                  <button type="button" className="button button--quiet" onClick={reset}>
                    Reset
                  </button>
                </div>
                <p className="lab__result" role="status">
                  <span aria-hidden="true">→ </span>
                  {loading ? 'Loading…' : result}
                </p>
              </div>
            </aside>
          </div>

          <h3 className="subhead">What changed</h3>
          <ol className="changes">
            {findings.map((finding, i) => (
              <li key={finding.id} className="change">
                <span className="change__num">{i + 1}</span>
                <p className="change__was">{finding.issue}</p>
                <p className="change__now">{finding.fix}</p>
              </li>
            ))}
          </ol>

          <aside className="inbank" aria-labelledby="inbank-title">
            <h3 id="inbank-title" className="subhead">
              Why I made these calls
            </h3>
            <p>I have designed loan flows for the same customers in the same markets, at Inbank.</p>
            <ul>
              <li>
                <Todo>A lesson about defaults, e.g. what happened when an option was pre-selected.</Todo>
              </li>
              <li>
                <Todo>A lesson about showing the total cost, and how it affected trust or completion.</Todo>
              </li>
              <li>
                <Todo>A lesson about the three markets: copy length, formats, or regulation.</Todo>
              </li>
            </ul>
            <p className="inbank__note">Lessons only. No Inbank screens, numbers or internal data.</p>
          </aside>
        </section>

        <section id="spec" className="section" aria-labelledby="spec-title">
          <SectionHead index="03" id="spec-title" title="Spec">
            What an engineer needs to build the real thing. Short on purpose.
          </SectionHead>
          <div className="spec">
            {spec.map((group) => (
              <div key={group.title} className="spec__group">
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <CopyButton text={specAsMarkdown()} />
        </section>

        <section id="numbers" className="section" aria-labelledby="numbers-title">
          <SectionHead index="04" id="numbers-title" title="Numbers">
            Success defined before building. I don’t have ESTO’s baselines, so there are no made-up targets
            here.
          </SectionHead>
          <div className="metrics">
            <article className="metric metric--primary">
              <h3>Primary</h3>
              <p className="metric__name">Withdrawal completion</p>
              <p>
                Share of people who open the screen and finish a withdrawal. Clear cost should not scare them
                off.
              </p>
            </article>
            <article className="metric">
              <h3>Guardrail</h3>
              <p className="metric__name">Repayment on time</p>
              <p>
                First three instalments paid on time. People who saw the full plan should repay better, not
                worse.
              </p>
            </article>
            <article className="metric">
              <h3>Guardrail</h3>
              <p className="metric__name">Support contacts about fees</p>
              <p>Per 1 000 withdrawals. Fewer “why was I charged?” tickets is the trust signal.</p>
            </article>
            <article className="metric metric--trade">
              <h3>The honest trade</h3>
              <p className="metric__name">Instant payout revenue will likely drop</p>
              <p>
                Free as the default means fewer paid payouts. I would measure by how much, per market, before
                arguing it is worth it.
              </p>
            </article>
          </div>
          <p className="experiment">
            <strong>Test:</strong> 50/50 split on new withdrawals, per market, with the decision rule written
            down before launch. Ship to one market first if the risk is too high for all three at once.
          </p>
        </section>

        <section id="built" className="section section--built" aria-labelledby="built-title">
          <SectionHead index="05" id="built-title" title="How it was built">
            With Claude Code, as a real codebase: React, TypeScript and Vite. Unit tests cover the credit
            math, the number formats, the amount rules and every translation. CI runs them on every push.
          </SectionHead>
          <ul className="built">
            <li>
              Time: <Todo>hours from idea to this page</Todo>
            </li>
            <li>
              Code: <Todo>GitHub link</Todo>
            </li>
            <li>LV and LT copy are first drafts. They need a native speaker before anything ships.</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>
          Rock Gomes · <Todo>email or LinkedIn</Todo>
        </p>
        <p className="footer__legal">
          Unofficial concept for a job application. Not affiliated with or endorsed by ESTO. All rates and
          fees in the prototype are examples.
        </p>
      </footer>
    </>
  );
}

function SectionHead({
  index,
  id,
  title,
  children,
}: {
  index: string;
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="section__head">
      <span className="section__index" aria-hidden="true">
        {index}
      </span>
      <h2 id={id}>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 2000);
  };

  return (
    <button type="button" className="button button--ghost copy" onClick={copy}>
      {state === 'copied'
        ? 'Copied as Markdown'
        : state === 'failed'
          ? 'Copy failed'
          : 'Copy spec as Markdown'}
    </button>
  );
}
