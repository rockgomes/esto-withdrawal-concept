import { describe, expect, it } from 'vitest';
import { annuityPayment, buildSchedule, costOf } from './money';

describe('annuityPayment', () => {
  it('matches the standard annuity formula', () => {
    // 1 000 € at 12% a year over 12 months is 88.85 € a month.
    expect(annuityPayment(100000, 12, 12)).toBe(8885);
  });

  it('splits evenly when there is no interest', () => {
    expect(annuityPayment(120000, 0, 12)).toBe(10000);
  });

  it('is zero for a zero amount', () => {
    expect(annuityPayment(0, 20, 12)).toBe(0);
  });

  it('rejects a non-positive term', () => {
    expect(() => annuityPayment(1000, 20, 0)).toThrow(RangeError);
  });
});

describe('buildSchedule', () => {
  it.each([
    [30000, 20, 6],
    [200000, 20, 36],
    [1000, 20, 36],
    [123457, 7.5, 24],
    [99999, 0, 12],
  ])('pays back exactly the principal (%i cents, %d%%, %i months)', (principal, apr, months) => {
    const rows = buildSchedule(principal, apr, months);
    const paidPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);

    expect(rows).toHaveLength(months);
    expect(paidPrincipal).toBe(principal);
    expect(rows.at(-1)?.balance).toBe(0);
  });

  it('keeps every payment equal except the last, which absorbs rounding', () => {
    const rows = buildSchedule(200000, 20, 12);
    const first = rows[0].payment;

    rows.slice(0, -1).forEach((row) => expect(row.payment).toBe(first));
    expect(Math.abs(rows.at(-1)!.payment - first)).toBeLessThanOrEqual(12);
  });

  it('charges less interest each month as the balance goes down', () => {
    const rows = buildSchedule(200000, 20, 12);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].interest).toBeLessThanOrEqual(rows[i - 1].interest);
    }
  });
});

describe('costOf', () => {
  it('adds principal, interest and fee into the total', () => {
    const cost = costOf(100000, 12, 12, 1990);
    const paidInSchedule = cost.schedule.reduce((sum, row) => sum + row.payment, 0);

    expect(cost.fee).toBe(1990);
    expect(cost.totalRepaid).toBe(100000 + cost.interest + 1990);
    expect(paidInSchedule).toBe(100000 + cost.interest);
  });
});
