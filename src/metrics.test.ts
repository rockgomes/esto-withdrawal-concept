import { describe, expect, it } from 'vitest';
import { metrics } from './metrics';
import { spec } from './spec';

describe('metrics', () => {
  it('only measure events and fields that the spec tracks', () => {
    const tracking = spec.find((group) => group.title === 'Tracking')!;
    const tracked = tracking.items.join(' ');

    const used = metrics.flatMap((m) =>
      m.formula.flatMap((part) => (typeof part === 'string' ? [] : [part.tracked])),
    );

    expect(used.length).toBeGreaterThan(0);
    used.forEach((name) => expect(tracked).toMatch(new RegExp(`\\b${name}\\b`)));
  });
});
