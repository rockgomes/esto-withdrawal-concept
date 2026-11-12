import { describe, expect, it } from 'vitest';
import { DEMO_ACCOUNT, fits, freeLimit, minimumPayment, plan } from './credit';

describe('credit', () => {
  it('knows the free limit and what fits it', () => {
    expect(freeLimit(DEMO_ACCOUNT)).toBe(118_000);
    expect(fits(118_000, DEMO_ACCOUNT)).toBe(true);
    expect(fits(118_001, DEMO_ACCOUNT)).toBe(false);
    expect(freeLimit({ ...DEMO_ACCOUNT, used: 200_000 })).toBe(0);
  });

  it('makes a plan whose parts add up', () => {
    const p = plan(107_900, DEMO_ACCOUNT, 12);
    expect(p.monthly).toBe(10_899);
    expect(p.total).toBe(107_900 + p.cost);
    expect(plan(107_900, DEMO_ACCOUNT, 24).cost).toBeGreaterThan(p.cost);
  });

  it('charges no interest at a 0% rate', () => {
    expect(plan(120_000, { ...DEMO_ACCOUNT, rate: 0 }, 12)).toMatchObject({ monthly: 10_000, cost: 0 });
  });

  it('computes the lowest allowed payment: 1/120 plus one month of interest', () => {
    expect(minimumPayment(120_000, 12)).toBe(1_000 + 1_200);
  });
});
