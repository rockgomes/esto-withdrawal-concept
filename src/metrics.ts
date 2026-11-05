/**
 * How success is measured. Every formula is built from the tracking events in
 * the spec, so each metric can be read on day one. No targets: I don't have
 * ESTO's baselines.
 */

export type MetricKind = 'primary' | 'guardrail' | 'research' | 'trade';

/** A formula reads left to right. Strings are plain words, objects are tracked events or fields. */
export type FormulaPart = string | { tracked: string };

export interface Metric {
  kind: MetricKind;
  name: string;
  body: string;
  /** The unit the number is read in, shown large. */
  unit: string;
  formula: FormulaPart[];
  /** How often it is read, and how it is cut. */
  cadence: string;
}

export const KIND_LABEL: Record<MetricKind, string> = {
  primary: 'Primary',
  guardrail: 'Guardrail',
  research: 'Research',
  trade: 'Trade-off',
};

export const metrics: Metric[] = [
  {
    kind: 'primary',
    name: 'Withdrawal completion',
    body: 'Share of people who open the screen and finish a withdrawal. Clear cost should not scare them off.',
    unit: '%',
    formula: [{ tracked: 'withdrawal_submitted' }, '÷', { tracked: 'withdrawal_viewed' }],
    cadence: 'Weekly, per market. Watched week by week.',
  },
  {
    kind: 'primary',
    name: 'Time to complete',
    body: 'How long it takes from opening the screen to finishing. Less doubt should mean less time.',
    unit: 'sec',
    formula: ['median of', { tracked: 'withdrawal_submitted' }, '−', { tracked: 'withdrawal_viewed' }],
    cadence: 'Weekly, per market. Median, so a few long sessions don’t skew it.',
  },
  {
    kind: 'research',
    name: 'Amount corrections',
    body: 'How many times people adjust the amount before they continue. This puts numbers on the slider and + and − question.',
    unit: 'per withdrawal',
    formula: ['median of', { tracked: 'adjustments' }, 'on', { tracked: 'withdrawal_submitted' }],
    cadence: 'Split by input: slider, stepper, typed.',
  },
  {
    kind: 'guardrail',
    name: 'Repayment on time',
    body: 'First three instalments paid on time. People who saw the full plan should repay at least as well.',
    unit: '%',
    formula: ['first 3 instalments on time', '÷', { tracked: 'withdrawal_submitted' }],
    cadence: 'Monthly, by withdrawal cohort.',
  },
  {
    kind: 'guardrail',
    name: 'Support contacts about fees',
    body: 'Fewer “why was I charged?” tickets means people saw the fee before paying.',
    unit: 'per 1 000',
    formula: ['fee tickets', '÷', { tracked: 'withdrawal_submitted' }, '× 1 000'],
    cadence: 'Weekly, per market.',
  },
  {
    kind: 'trade',
    name: 'Instant transfer revenue will likely drop',
    body: 'Free as the default means fewer paid transfers. I would measure by how much, per market, before arguing it is worth it.',
    unit: '%',
    formula: [
      'instant',
      { tracked: 'withdrawal_submitted' },
      '÷',
      'all',
      { tracked: 'withdrawal_submitted' },
    ],
    cadence: 'Weekly, per market. Read next to completion.',
  },
];
