/**
 * Credit math for a credit-line withdrawal, in integer cents.
 *
 * Working in cents keeps every displayed number exact: the payments in the
 * schedule always add up to the total we show, with no floating point drift.
 */

export type Cents = number;

export interface ScheduleRow {
  month: number;
  payment: Cents;
  principal: Cents;
  interest: Cents;
  /** Balance left after this payment. */
  balance: Cents;
}

export interface CostBreakdown {
  schedule: ScheduleRow[];
  monthlyPayment: Cents;
  interest: Cents;
  fee: Cents;
  /** Everything the customer pays back: principal + interest + fee. */
  totalRepaid: Cents;
}

/** Fixed monthly payment for an amortising loan (annuity formula). */
export function annuityPayment(principal: Cents, aprPercent: number, months: number): Cents {
  if (months <= 0) throw new RangeError('months must be positive');
  if (principal <= 0) return 0;

  const rate = aprPercent / 100 / 12;
  if (rate === 0) return Math.ceil(principal / months);

  const payment = (principal * rate) / (1 - Math.pow(1 + rate, -months));
  return Math.round(payment);
}

/**
 * Month-by-month plan. Interest is charged on the remaining balance each month.
 * The last payment absorbs rounding, so the balance always ends at exactly zero.
 */
export function buildSchedule(principal: Cents, aprPercent: number, months: number): ScheduleRow[] {
  const rate = aprPercent / 100 / 12;
  const payment = annuityPayment(principal, aprPercent, months);
  const rows: ScheduleRow[] = [];
  let balance = principal;

  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = Math.round(balance * rate);
    const isLast = month === months;
    const principalPart = isLast ? balance : Math.min(balance, payment - interest);
    balance -= principalPart;
    rows.push({ month, payment: principalPart + interest, principal: principalPart, interest, balance });
  }

  return rows;
}

export function costOf(principal: Cents, aprPercent: number, months: number, fee: Cents = 0): CostBreakdown {
  const schedule = buildSchedule(principal, aprPercent, months);
  const interest = schedule.reduce((sum, row) => sum + row.interest, 0);

  return {
    schedule,
    monthlyPayment: schedule[0]?.payment ?? 0,
    interest,
    fee,
    totalRepaid: principal + interest + fee,
  };
}
