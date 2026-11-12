import { costOf, type Cents } from '../lib/money';

/**
 * The demo customer. A real customer's limit and rate come from their ESTO
 * account. The limit and the amount in use are example values. The rate is
 * the highest interest rate in ESTO's published credit line example (37.10%,
 * APR 44.84% on a 500 EUR limit). The page says so.
 */
export interface Account {
  limit: Cents;
  used: Cents;
  /** Yearly interest rate in percent. */
  rate: number;
}

export const DEMO_ACCOUNT: Account = { limit: 150_000, used: 32_000, rate: 37.1 };
export const LIMIT_CHOICES: Cents[] = [50_000, 150_000, 300_000];
export const DEFAULT_MONTHS = 12;
export const MIN_MONTHS = 3;
export const MAX_MONTHS = 36;

/** From this share of the limit in use, the used part is drawn in orange. */
export const HIGH_USE = 0.8;

export function isHighUse(account: Account): boolean {
  return account.limit > 0 && account.used / account.limit >= HIGH_USE;
}

export function freeLimit(account: Account): Cents {
  return Math.max(0, account.limit - account.used);
}

export function fits(price: Cents, account: Account): boolean {
  return price <= freeLimit(account);
}

export interface Plan {
  months: number;
  monthly: Cents;
  /** Interest paid over the whole plan. */
  cost: Cents;
  total: Cents;
}

export function plan(price: Cents, account: Account, months: number = DEFAULT_MONTHS): Plan {
  const breakdown = costOf(price, account.rate, months);
  return {
    months,
    monthly: breakdown.monthlyPayment,
    cost: breakdown.interest,
    total: breakdown.totalRepaid,
  };
}

/**
 * The lowest monthly payment the credit line allows. ESTO's wording: the
 * first payment is 1/120 of the loan amount plus the interest. The principal
 * share stays the same and the interest follows the balance, so the payment
 * goes down each month.
 */
export function minimumPayment(amount: Cents, rate: number): Cents {
  return Math.round(amount / 120 + (amount * rate) / 100 / 12);
}

/** How many months the lowest payments take: the principal share is 1/120 each month. */
export const MINIMUM_MONTHS = 120;

/** Interest paid in total when a customer only pays the lowest amount each month. */
export function minimumPathInterest(amount: Cents, rate: number): Cents {
  let interest = 0;
  for (let month = 0; month < MINIMUM_MONTHS; month++) {
    const balance = (amount * (MINIMUM_MONTHS - month)) / MINIMUM_MONTHS;
    interest += (balance * rate) / 100 / 12;
  }
  return Math.round(interest);
}

/**
 * The two parts of one monthly invoice when the amount is paid back in a
 * number of months. One part pays back the amount: it is the same every
 * month. The other part is interest on what is still owed. With 120 months
 * this is ESTO's rule for the lowest payment.
 */
export function paybackParts(amount: Cents, rate: number, months: number, month: number) {
  const fixed = amount / months;
  const stillOwed = (amount * (months - month + 1)) / months;
  const interest = (stillOwed * rate) / 100 / 12;
  return { fixed: Math.round(fixed), interest: Math.round(interest), total: Math.round(fixed + interest) };
}

/** Interest paid in total when the amount is paid back in a number of months. */
export function paybackInterest(amount: Cents, rate: number, months: number): Cents {
  let interest = 0;
  for (let month = 1; month <= months; month++) {
    interest += (((amount * (months - month + 1)) / months) * rate) / 100 / 12;
  }
  return Math.round(interest);
}

/** The two parts of the lowest payment in one month, by ESTO's rule. */
export function lowestPaymentParts(amount: Cents, rate: number, month: number) {
  return paybackParts(amount, rate, MINIMUM_MONTHS, month);
}
