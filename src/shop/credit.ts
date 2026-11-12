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
 * The lowest monthly payment the credit line allows: 1/120 of the amount in
 * use plus one month of interest on it.
 */
export function minimumPayment(amount: Cents, rate: number): Cents {
  return Math.round(amount / 120 + (amount * rate) / 100 / 12);
}
