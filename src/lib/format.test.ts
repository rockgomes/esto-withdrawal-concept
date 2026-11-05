import { describe, expect, it } from 'vitest';
import { currencyFirst, formatMoney, formatNumber, formatWhole, parseAmount } from './format';

// Intl uses non-breaking spaces. Normalise them so the expectations stay readable.
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('formatWhole', () => {
  it.each(['et', 'lv', 'lt'] as const)('groups thousands the same way in %s', (locale) => {
    expect(plain(formatWhole(200000, locale))).toBe('2 000 €');
  });

  it('uses English conventions for en', () => {
    expect(formatWhole(200000, 'en')).toBe('€2,000');
  });
});

describe('formatMoney', () => {
  it.each(['et', 'lv', 'lt'] as const)('uses a decimal comma in %s', (locale) => {
    expect(plain(formatMoney(1990, locale))).toBe('19,90 €');
    expect(plain(formatMoney(7719, locale))).toBe('77,19 €');
  });
});

describe('formatNumber', () => {
  it('groups without a symbol, for the editable field', () => {
    expect(plain(formatNumber(200000, 'et'))).toBe('2 000');
    expect(formatNumber(200000, 'en')).toBe('2,000');
  });
});

describe('currencyFirst', () => {
  it('puts the euro sign first only in English', () => {
    expect(currencyFirst('en')).toBe(true);
    expect(currencyFirst('et')).toBe(false);
    expect(currencyFirst('lv')).toBe(false);
    expect(currencyFirst('lt')).toBe(false);
  });
});

describe('parseAmount', () => {
  it.each([
    ['1500', 150000],
    ['1 500', 150000],
    ['1\u00a0500', 150000],
    ['1500,5', 150050],
    ['1500,50', 150050],
    ['1500.50', 150050],
    ['1.500', 150000],
    ['1.500,50', 150050],
    ['1,500.50', 150050],
    ['€ 300', 30000],
    ['300 €', 30000],
  ])('reads %j as %i cents', (input, cents) => {
    expect(parseAmount(input)).toBe(cents);
  });

  it.each(['', 'abc', '-50', ',50', '12a'])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});
