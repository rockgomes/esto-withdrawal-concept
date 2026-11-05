/**
 * What I found on the current withdrawal screen, why it matters, and what the
 * prototype does about it. The schematic, the findings list and the
 * before/now cards all read from this one list, so they can never disagree.
 */

export type FindingId = 'maxDefault' | 'paidDefault' | 'nextMonthOnly' | 'format' | 'copy' | 'loading';

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
    why: 'Most people do not want the full limit, so their first move is a correction: dragging back, or tapping − many times. That is the friction we saw at Bigbank. And an amount set higher than needed is harder to repay, which is ESTO’s risk too.',
    fix: 'It starts at a modest amount. Going higher is the customer’s choice, not the default.',
  },
  {
    id: 'paidDefault',
    issue: 'The paid instant payout (19.90 €) is already switched on. Free needs an extra tap.',
    why: 'Instant payout is a fair, useful service. But when people notice the fee late, it feels like a trick, and a fair 19.90 € becomes a support ticket. As a clear choice, the people who need speed still pay for it, and feel good about it.',
    fix: 'Speed is two equal choices with the price on each. Free is selected first.',
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
    id: 'copy',
    issue: 'The help text says to “press the button above”. The control is a toggle.',
    why: 'The text describes a control that is not there. People stop and re-read, and every pause on this screen is a chance to leave.',
    fix: 'No instructions needed. Each option says what it is and what it costs.',
  },
  {
    id: 'loading',
    issue: 'While loading, the toggle shows off while the text next to it says on.',
    why: 'For a moment the screen says two opposite things. A tap in that moment can pick the paid option by accident, which leads straight to a complaint.',
    fix: 'A real loading state. Nothing is shown until it is true, and nothing is clickable.',
  },
];
