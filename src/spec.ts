import { EXAMPLE } from './lib/withdrawal';

export interface SpecGroup {
  title: string;
  items: string[];
}

const euros = (cents: number) => `${cents / 100} €`;

/** The engineering handover. Rendered on the page and copied as Markdown. */
export const spec: SpecGroup[] = [
  {
    title: 'Defaults',
    items: [
      `Amount starts at ${euros(EXAMPLE.defaultAmount)} (or the limit, if lower). Replace with the median withdrawal once we have it.`,
      'Speed starts on the free payout. The instant payout is never pre-selected.',
      'Term starts at 12 months.',
    ],
  },
  {
    title: 'Amount rules',
    items: [
      `Minimum ${euros(EXAMPLE.minAmount)}, step ${euros(EXAMPLE.step)}, maximum is the available limit.`,
      'Typed input accepts “1500”, “1 500”, “1500,50”, “1.500” and “1,500.50”.',
      'Out-of-range input is corrected, and an inline message says why. Never silently.',
    ],
  },
  {
    title: 'Cost display',
    items: [
      'Show monthly payment, term, interest, fee and total paid back. Update on every change.',
      'All money is integer cents. The last instalment absorbs rounding, so the plan adds up exactly.',
    ],
  },
  {
    title: 'Formatting',
    items: [
      'Intl.NumberFormat with useGrouping: "always". ET, LV and LT all render “2 000 €” and “19,90 €”.',
      'Whole euros for amounts and limits, cents for payments and costs.',
    ],
  },
  {
    title: 'States',
    items: [
      'Loading: skeleton, all controls disabled, no value shown until it is real.',
      'Empty: limit fully used. Explain why, no clickable submit.',
      'Error (not in this prototype): limit request fails. Keep the screen, offer retry.',
    ],
  },
  {
    title: 'Tracking',
    items: [
      'withdrawal_viewed { market }',
      'amount_changed { amount, source: slider | stepper | typed } (debounced)',
      'speed_selected { speed }, term_selected { months }',
      'withdrawal_submitted { amount, speed, months, market }',
    ],
  },
];

export function specAsMarkdown(): string {
  const body = spec.map(
    (group) => `## ${group.title}\n\n${group.items.map((item) => `- ${item}`).join('\n')}`,
  );
  return ['# Withdrawal screen: handover spec', ...body].join('\n\n') + '\n';
}
