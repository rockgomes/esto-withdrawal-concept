import { EXAMPLE } from './lib/withdrawal';

export interface SpecRow {
  label: string;
  /** Plain text, or a list of exact values shown as tags. */
  value: string | string[];
  /** Render the label as code, for event names. */
  code?: boolean;
  /** A short aside after the value, such as a scope note. */
  note?: string;
}

export interface SpecGroup {
  title: string;
  rows: SpecRow[];
}

const euros = (cents: number) => `${cents / 100} €`;

/** The engineering handover. Rendered on the page and copied as Markdown. */
export const spec: SpecGroup[] = [
  {
    title: 'Defaults',
    rows: [
      {
        label: 'Amount',
        value: `${euros(EXAMPLE.defaultAmount)}, or the limit if lower.`,
        note: 'Replace with the median withdrawal once we have it.',
      },
      { label: 'Speed', value: 'Free. Instant transfer is never pre-selected.' },
      { label: 'Term', value: '12 months.' },
    ],
  },
  {
    title: 'Amount rules',
    rows: [
      { label: 'Minimum', value: euros(EXAMPLE.minAmount) },
      { label: 'Step', value: euros(EXAMPLE.step) },
      { label: 'Maximum', value: 'The available limit.' },
      { label: 'Typed input', value: ['1500', '1 500', '1500,50', '1.500', '1,500.50'] },
      { label: 'Out of range', value: 'Corrected, with an inline message that says why. Never silently.' },
    ],
  },
  {
    title: 'Cost display',
    rows: [
      { label: 'Show', value: ['monthly payment', 'term', 'interest', 'fee', 'total paid back'] },
      { label: 'Update', value: 'On every change.' },
      { label: 'Money', value: 'Integer cents. The last instalment absorbs rounding, so the plan adds up.' },
    ],
  },
  {
    title: 'Formatting',
    rows: [
      { label: 'Method', value: 'Intl.NumberFormat with useGrouping: "always".' },
      { label: 'Output', value: ['2 000 €', '19,90 €'], note: 'Same in ET, LV and LT.' },
      { label: 'Precision', value: 'Whole euros for amounts and limits. Cents for payments and costs.' },
    ],
  },
  {
    title: 'States',
    rows: [
      { label: 'Loading', value: 'Skeleton. All controls disabled. No value shown until it is real.' },
      { label: 'Empty', value: 'Limit fully used. Explain why. No clickable submit.' },
      {
        label: 'Error',
        value: 'Limit request fails. Keep the screen and offer retry.',
        note: 'Not in this prototype.',
      },
    ],
  },
  {
    title: 'Tracking',
    rows: [
      { label: 'withdrawal_viewed', code: true, value: ['market'] },
      {
        label: 'amount_changed',
        code: true,
        value: ['amount', 'source'],
        note: 'source is slider, stepper or typed. Debounced.',
      },
      { label: 'speed_selected', code: true, value: ['speed'] },
      { label: 'term_selected', code: true, value: ['months'] },
      {
        label: 'withdrawal_submitted',
        code: true,
        value: ['amount', 'speed', 'months', 'market', 'adjustments'],
        note: 'adjustments counts stepper, slider and typed changes.',
      },
    ],
  },
];

const markdownValue = (value: SpecRow['value']) =>
  typeof value === 'string' ? value : value.map((v) => `\`${v}\``).join(', ');

export function specAsMarkdown(): string {
  const body = spec.map((group) => {
    const rows = group.rows.map((row) => {
      const label = row.code ? `\`${row.label}\`` : `**${row.label}:**`;
      return `- ${label} ${markdownValue(row.value)}${row.note ? ` ${row.note}` : ''}`;
    });
    return `## ${group.title}\n\n${rows.join('\n')}`;
  });
  return ['# Withdrawal screen: handover spec', ...body].join('\n\n') + '\n';
}
