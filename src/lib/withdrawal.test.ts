import { describe, expect, it } from 'vitest';
import { EXAMPLE, initialState, isEmpty, withdrawalReducer as reduce } from './withdrawal';

describe('initial state', () => {
  it('defaults to the free payout, not the paid one', () => {
    expect(initialState.speed).toBe('free');
  });

  it('does not start at the full limit', () => {
    expect(initialState.amount).toBeLessThan(initialState.limit);
  });
});

describe('setAmount', () => {
  it('clamps to the limit and says so', () => {
    const next = reduce(initialState, { type: 'setAmount', amount: 250000 });
    expect(next.amount).toBe(initialState.limit);
    expect(next.notice).toEqual({ kind: 'overLimit' });
  });

  it('raises to the minimum and says so', () => {
    const next = reduce(initialState, { type: 'setAmount', amount: 100 });
    expect(next.amount).toBe(EXAMPLE.minAmount);
    expect(next.notice).toEqual({ kind: 'belowMin' });
  });

  it('clears the notice on a valid amount', () => {
    const corrected = reduce(initialState, { type: 'setAmount', amount: 999999 });
    expect(reduce(corrected, { type: 'setAmount', amount: 50000 }).notice).toBeNull();
  });
});

describe('step', () => {
  it('snaps to the step grid', () => {
    const odd = reduce(initialState, { type: 'setAmount', amount: 30500 });
    expect(reduce(odd, { type: 'step', direction: 1 }).amount).toBe(31000);
    expect(reduce(odd, { type: 'step', direction: -1 }).amount).toBe(30000);
  });

  it('stops at the limit', () => {
    const atMax = reduce(initialState, { type: 'setAmount', amount: initialState.limit });
    expect(reduce(atMax, { type: 'step', direction: 1 }).amount).toBe(initialState.limit);
  });
});

describe('setLimit', () => {
  it('lowers the amount when the new limit is smaller', () => {
    const next = reduce(initialState, { type: 'setLimit', limit: 20000 });
    expect(next.amount).toBe(20000);
    expect(next.notice).toEqual({ kind: 'overLimit' });
  });

  it('becomes empty when the limit is below the minimum', () => {
    const next = reduce(initialState, { type: 'setLimit', limit: 0 });
    expect(isEmpty(next)).toBe(true);
    expect(next.amount).toBe(0);
  });

  it('recovers a sensible amount when the limit comes back', () => {
    const empty = reduce(initialState, { type: 'setLimit', limit: 0 });
    const back = reduce(empty, { type: 'setLimit', limit: 200000 });
    expect(back.amount).toBe(EXAMPLE.defaultAmount);
    expect(back.notice).toBeNull();
  });
});
