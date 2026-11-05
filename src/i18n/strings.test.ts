import { describe, expect, it } from 'vitest';
import { dictionaries, t } from './strings';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('dictionaries', () => {
  const [source, ...translations] = Object.entries(dictionaries);

  it.each(translations)('%s uses the same placeholders as English', (_locale, dict) => {
    for (const [key, text] of Object.entries(source[1])) {
      expect(placeholders(dict[key as keyof typeof dict]), key).toEqual(placeholders(text));
    }
  });

  it.each(Object.entries(dictionaries))('%s has no empty strings', (_locale, dict) => {
    Object.values(dict).forEach((text) => expect(text.trim()).not.toBe(''));
  });
});

describe('t', () => {
  it('fills placeholders', () => {
    expect(t('en', 'cta', { amount: '€300' })).toBe('Withdraw €300');
  });

  it('leaves unknown placeholders visible instead of dropping them', () => {
    expect(t('en', 'cta')).toBe('Withdraw {amount}');
  });
});
