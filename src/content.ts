/**
 * What I found on the current withdrawal screen, and what the prototype does
 * about it. The schematic, the findings list and the "why" notes all read
 * from this one list, so they can never disagree.
 */

export type FindingId = 'maxDefault' | 'paidDefault' | 'nextMonthOnly' | 'format' | 'copy' | 'loading';

export interface Finding {
  id: FindingId;
  /** What the current screen does. Plain description, no screenshot. */
  issue: string;
  /** What the prototype does instead. */
  fix: string;
}

export const findings: Finding[] = [
  {
    id: 'maxDefault',
    issue: 'The amount starts at the full limit. The slider opens all the way to the right.',
    fix: 'It starts at a modest amount. Going higher is the customer’s choice, not the default.',
  },
  {
    id: 'paidDefault',
    issue: 'The paid instant payout (19.90 €) is already switched on. Free needs an extra tap.',
    fix: 'Speed is two equal choices with the price on each. Free is selected first.',
  },
  {
    id: 'nextMonthOnly',
    issue: 'The only cost shown is next month’s payment. No term, no interest, no total.',
    fix: 'Monthly payment, term, interest, fee and total update live, with the full plan below.',
  },
  {
    id: 'format',
    issue: 'This screen writes “2,000 €” and “19.90 €”. The dashboard writes “2 000 €”.',
    fix: 'One formatting rule for all three markets: “2 000 €”, “19,90 €”. A test locks it in.',
  },
  {
    id: 'copy',
    issue: 'The help text says to “press the button above”. The control is a toggle.',
    fix: 'No instructions needed. Each option says what it is and what it costs.',
  },
  {
    id: 'loading',
    issue: 'While loading, the toggle shows off while the text next to it says on.',
    fix: 'A real loading state. Nothing is shown until it is true, and nothing is clickable.',
  },
];
