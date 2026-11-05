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
    why: 'Bigbank, Inbank, Cleo, Shopee and Zopa all start the amount below the limit. Also, Swedbank doesn’t have + and − buttons, and Coop has neither of them.',
    fix: 'It starts at a modest amount. The customer moves it up.',
  },
  {
    id: 'paidDefault',
    issue:
      '“Instant transfer” (19.90 €) is already switched on. The user needs to tap that toggle to find out that there’s a free option.',
    why: 'Instant transfer is a useful service. If people find the fee late, it feels like a trick. People who need the money right now will still choose it.',
    fix: 'Two options side by side is a more open and honest approach. The free one is selected when the screen opens.',
  },
  {
    id: 'nextMonthOnly',
    issue: 'The only cost shown is next month’s payment. No term, no interest, no total.',
    why: 'Seeing the full cost up front makes the decision feel safe, so people finish with confidence. Without the full cost, people must guess or ask support.',
    fix: 'Monthly payment, term, interest, fee and total update live, with the full plan below.',
  },
  {
    id: 'format',
    issue: 'This screen writes “2,000 €” and “19.90 €”. The dashboard writes “2 000 €”.',
    why: 'Estonian uses the comma for decimals, so “2,000 €” can read as two euros. ',
    fix: 'One formatting rule for all three markets: “2 000 €”, “19,90 €”. A test locks it in.',
  },
  {
    id: 'loading',
    issue: 'While the page loads, the toggle shows off for a moment while the text says on.',
    why: 'It is brief, and a proper loading state fixes it.',
    fix: 'The screen shows a skeleton and locks every control until the data loads.',
  },
];
