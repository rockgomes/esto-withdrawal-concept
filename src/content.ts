/**
 * What I found on the current withdrawal screen, why it matters, and what the
 * prototype does about it. The schematic, the findings list and the
 * before/now cards all read from this one list, so they can never disagree.
 */

export type FindingId = 'maxDefault' | 'paidDefault' | 'nextMonthOnly' | 'format' | 'loading';

export interface Finding {
  id: FindingId;
  /** What the current screen does. Plain description, no screenshot. */
  issue: string;
  /** Why that is a problem for the customer, or for ESTO. */
  why: string;
  /** What the prototype does instead. */
  fix: string;
}

export const findings: Finding[] = [
  {
    id: 'maxDefault',
    issue: 'The amount starts at the full limit. The slider opens all the way to the right.',
    why: 'Bigbank, Inbank, Cleo, Shopee and Zopa all start the amount below the limit, not at the end of the slider.',
    fix: 'It starts at a modest amount. Going higher is the customer’s choice, not the default.',
  },
  {
    id: 'paidDefault',
    issue:
      '“Instant transfer” (19.90 €) is already switched on. The user needs to tap that toggle to find out that there’s a free option.',
    why: 'Instant payout is a fair, useful service. But when people notice the fee late, it feels like a trick, and a fair 19.90 € becomes a support ticket. As a clear choice, the people who need speed still pay for it, and feel good about it.',
    fix: 'Two options side by side, each with its price: “In 1-3 business days” (free) and “Right now” (19.90 €). The free one is selected when the screen opens.',
  },
  {
    id: 'nextMonthOnly',
    issue: 'The only cost shown is next month’s payment. No term, no interest, no total.',
    why: 'Seeing the full cost up front makes the decision feel safe, so people finish with confidence. Hiding it does not remove the question. It moves it to support, or to a competitor with a clearer screen.',
    fix: 'Monthly payment, term, interest, fee and total update live, with the full plan below.',
  },
  {
    id: 'format',
    issue: 'This screen writes “2,000 €” and “19.90 €”. The dashboard writes “2 000 €”.',
    why: 'Estonian uses the comma for decimals, so “2,000 €” can read as two euros. On a money screen, any doubt about the number slows people down.',
    fix: 'One formatting rule for all three markets: “2 000 €”, “19,90 €”. A test locks it in.',
  },
  {
    id: 'loading',
    issue: 'While the page loads, the toggle shows off for a moment while the text says on.',
    why: 'It is brief. But a money screen should never show two answers at once, and a proper loading state is a small fix.',
    fix: 'A real loading state. Nothing is shown until it is true, and nothing is clickable.',
  },
];
