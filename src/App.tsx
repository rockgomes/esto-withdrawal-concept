import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { ExternalLink } from './components/ExternalLink';
import { BeforeSchematic } from './components/BeforeSchematic';
import { Loop } from './components/Loop';
import { ThemeSwitch } from './components/ThemeSwitch';
import { Todo } from './components/Todo';
import { WithdrawalScreen, type AmountSource } from './components/WithdrawalScreen';
import { findings, type FindingId } from './content';
import { withViewTransition } from './hooks/motion';
import { LOCALES, type Locale } from './lib/format';
import { initialState, withdrawalReducer } from './lib/withdrawal';
import { spec, specAsMarkdown } from './spec';

const LOCALE_NAMES: Record<Locale, string> = { en: 'EN', et: 'ET', lv: 'LV', lt: 'LT' };
const UNCHECKED_LOCALES: Locale[] = ['lv', 'lt'];
const SLOW_NETWORK_MS = 2200;

type ScenarioId = 'overLimit' | 'underMin' | 'empty' | 'slow' | 'longCopy';

/** Each edge case is a starting state. Labels never change. */
const SCENARIOS: { id: ScenarioId; name: string; setup: string; result: string }[] = [
  {
    id: 'overLimit',
    name: 'Types more than the limit',
    setup: 'The customer types 2 500 € with a 2 000 € limit.',
    result: 'Corrected to the limit. The screen says why, in the customer’s language.',
  },
  {
    id: 'underMin',
    name: 'Types less than the minimum',
    setup: 'The customer types 5 €.',
    result: 'Raised to the minimum, with a message.',
  },
  {
    id: 'empty',
    name: 'Limit fully used',
    setup: 'There is nothing left to withdraw.',
    result: 'It explains why, and nothing can be submitted.',
  },
  {
    id: 'slow',
    name: 'Slow network',
    setup: 'The limit takes two seconds to load. Select it again to replay.',
    result: 'A skeleton while loading. No control shows a state that is not true yet.',
  },
  {
    id: 'longCopy',
    name: 'Longest language',
    setup: 'Switches to Lithuanian, which has the longest strings.',
    result: 'Nothing overflows or wraps badly.',
  },
];

type InputCounts = Record<AmountSource, number>;

export default function App() {
  const [state, dispatch] = useReducer(withdrawalReducer, initialState);
  const [locale, setLocale] = useState<Locale>('en');
  const [loading, setLoading] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [inputs, setInputs] = useState<InputCounts>({ stepper: 0, slider: 0, typed: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [activeFinding, setActiveFinding] = useState<FindingId | null>(null);
  const slowTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(slowTimer.current);
      clearTimeout(toastTimer.current);
    },
    [],
  );

  const runScenario = (id: ScenarioId | null) => {
    clearTimeout(slowTimer.current);
    setScenario(id);
    withViewTransition(() => {
      // Every edge case starts from a clean screen, so one can never leave another stuck.
      dispatch({ type: 'reset' });
      setLoading(id === 'slow');
      if (id === 'longCopy') setLocale('lt');
      if (id === 'overLimit') dispatch({ type: 'setAmount', amount: 250000 });
      if (id === 'underMin') dispatch({ type: 'setAmount', amount: 500 });
      if (id === 'empty') dispatch({ type: 'setLimit', limit: 0 });
    });
    if (id === 'slow') {
      slowTimer.current = window.setTimeout(
        () => withViewTransition(() => setLoading(false)),
        SLOW_NETWORK_MS,
      );
    }
  };

  const submit = () => {
    clearTimeout(toastTimer.current);
    setToast('Prototype only. No money moved.');
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const countInput = (source: AmountSource) =>
    setInputs((counts) => ({ ...counts, [source]: counts[source] + 1 }));
  const active = SCENARIOS.find((s) => s.id === scenario);

  return (
    <>
      <a className="skip" href="#prototype">
        Skip to the prototype
      </a>
      <ThemeSwitch />

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
            ESTO’s withdrawal screen works, but it asks people to trust numbers they cannot fully see. I
            rebuilt it so the full cost is clear, speed is an honest choice, and the numbers read the same in
            all three markets. Less doubt, fewer support tickets, more people who finish.
          </p>
          <p className="hero__byline">
            Rock Gomes · Product designer ·{' '}
            <ExternalLink href="https://www.rockgomes.com">rockgomes.com</ExternalLink>
          </p>
        </div>
        <Loop />
      </header>

      <main>
        <section id="problem" className="section" aria-labelledby="problem-title">
          <SectionHead index="01" id="problem-title" title="Problem">
            I opened the withdrawal screen in my own account, on mobile and desktop. Five things stood out.
          </SectionHead>
          <BeforeSchematic active={activeFinding} onActivate={setActiveFinding} />
        </section>

        <section id="prototype" className="section" aria-labelledby="prototype-title">
          <SectionHead index="02" id="prototype-title" title="Prototype">
            Live and clickable. Drag the amount, switch the speed and the term, change the market. Then run
            the edge cases.
          </SectionHead>

          <div className="proto">
            <div className="proto__device">
              <fieldset className="device">
                <legend className="device__label">Phone width</legend>
                <div className="device__options">
                  {[false, true].map((isNarrow) => (
                    <label key={String(isNarrow)} className="device__option">
                      <input
                        type="radio"
                        name="phone-width"
                        checked={narrow === isNarrow}
                        onChange={() => withViewTransition(() => setNarrow(isNarrow))}
                      />
                      <span>{isNarrow ? '320 px' : '375 px'}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
                    onAmountInput={countInput}
                  />
                </div>
                <p className="toast" role="status" data-visible={toast !== null}>
                  {toast}
                </p>
              </div>
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
                <p className={`lab__draft ${UNCHECKED_LOCALES.includes(locale) ? 'is-active' : ''}`}>
                  LV and LT are machine drafts, not checked by a native speaker.
                </p>
              </fieldset>

              <div className="lab__group">
                <div className="lab__head">
                  <h3 className="lab__title" id="edge-title">
                    Edge cases
                  </h3>
                  <button
                    type="button"
                    className="button button--ghost lab__reset"
                    disabled={!active}
                    onClick={() => runScenario(null)}
                  >
                    Reset screen
                  </button>
                </div>
                <ul className="scenarios" aria-labelledby="edge-title">
                  {SCENARIOS.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="scenario"
                        aria-pressed={scenario === s.id}
                        disabled={loading && s.id !== 'slow'}
                        onClick={() => runScenario(s.id)}
                      >
                        <span className="scenario__name">{s.name}</span>
                        <span className="scenario__setup">{s.setup}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="lab__result" role="status" hidden={!active}>
                  <span className="lab__result-label">{loading ? 'Loading' : 'Handled'}</span>
                  {loading ? 'Waiting for the limit…' : active?.result}
                </p>
              </div>
            </aside>
          </div>

          <h3 className="subhead">Before and now</h3>
          <ol className="changes">
            {findings.map((finding, i) => (
              <li key={finding.id} className="change">
                <span className="change__num">{i + 1}</span>
                <div className="change__body">
                  <p className="change__label">Before</p>
                  <p className="change__was">{finding.issue}</p>
                  <p className="change__label change__label--now">Now</p>
                  <p className="change__now">{finding.fix}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside className="research" aria-labelledby="research-title">
            <p className="research__kicker">Open question</p>
            <h3 id="research-title" className="research__title">
              How do people set the amount?
            </h3>
            <div className="research__grid">
              <div className="research__story">
                <p>
                  I have designed loan flows at Bigbank and Inbank, for the same customers in the same
                  markets. At Bigbank we also had a slider with + and − buttons. In Hotjar recordings, some
                  people tapped + again and again until they reached their amount. Others struggled to stop
                  the slider on the exact value they wanted.
                </p>
                <p>
                  This prototype keeps both controls for now, because I would not redesign them on a hunch.
                  That’s something I would really like to research.
                </p>
                <InputCounter counts={inputs} />
              </div>
              <ol className="research__plan">
                <li>
                  <strong>Watch.</strong> Session recordings of this screen. Count repeated + and − taps, and
                  slider moves back and forth before Continue.
                </li>
                <li>
                  <strong>Ask.</strong> Five to eight short moderated tests with one task: “withdraw 420 €”.
                  Time it, count the corrections, ask what felt hard.
                </li>
                <li>
                  <strong>Try.</strong> If the problem is real, test alternatives: quick amounts, bigger
                  steps, or tapping the number to type it. In parallel, we could test a version with no slider
                  and no + and −, only a field to type the amount, and compare how people behave.
                </li>
                <li>
                  <strong>Measure.</strong> Adjustments per withdrawal, by input type. It is already in the
                  tracking spec below.
                </li>
              </ol>
            </div>
            <p className="research__note">
              Lessons only. No Bigbank or Inbank screens, numbers or internal data.
            </p>
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
            math, the number formats, the amount rules, the screen states and every translation. CI runs them
            on every push.
          </SectionHead>
          <ul className="built">
            <li>
              Time: <Todo>add when finished</Todo>
            </li>
            <li>
              Code:{' '}
              <ExternalLink href="https://github.com/rockgomes/esto-withdrawal-concept">
                github.com/rockgomes/esto-withdrawal-concept
              </ExternalLink>
            </li>
            <li>
              LV and LT copy are machine drafts. I don’t speak either, so they need a native speaker first.
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>
          Rock Gomes · <ExternalLink href="https://www.rockgomes.com">rockgomes.com</ExternalLink> ·{' '}
          <a href="mailto:rock@rockgomes.com">rock@rockgomes.com</a>
        </p>
        <p className="footer__legal">
          Unofficial concept for a job application. Not affiliated with or endorsed by ESTO. All rates and
          fees in the prototype are examples.
        </p>
      </footer>
    </>
  );
}

function InputCounter({ counts }: { counts: InputCounts }) {
  const total = counts.stepper + counts.slider + counts.typed;
  return (
    <div className="counter">
      <p className="counter__title">How you set the amount in this session</p>
      <dl className="counter__rows">
        <div>
          <dt>+ and − taps</dt>
          <dd className="num">{counts.stepper}</dd>
        </div>
        <div>
          <dt>Slider moves</dt>
          <dd className="num">{counts.slider}</dd>
        </div>
        <div>
          <dt>Typed</dt>
          <dd className="num">{counts.typed}</dd>
        </div>
      </dl>
      <p className="counter__hint">
        {total === 0
          ? 'Try the prototype above, then look again.'
          : counts.stepper >= 8
            ? 'That many taps is the pattern we saw at Bigbank.'
            : 'The real version would log this per withdrawal.'}
      </p>
    </div>
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
