import type { Cents } from './money';

export const LOCALES = ['en', 'et', 'lv', 'lt'] as const;
export type Locale = (typeof LOCALES)[number];

const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-IE',
  et: 'et-EE',
  lv: 'lv-LV',
  lt: 'lt-LT',
};

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: Locale, fractionDigits: 0 | 2): Intl.NumberFormat {
  const key = `${locale}:${fractionDigits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(INTL_LOCALE[locale], {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      // CLDR skips grouping for 4-digit numbers in et and lv ("2000 €") but not
      // in lt ("2 000 €"). Force one rule so all three markets look the same.
      useGrouping: 'always',
    });
    formatters.set(key, f);
  }
  return f;
}

/** Money with cents, for payments and costs: "77,19 €". */
export function formatMoney(cents: Cents, locale: Locale): string {
  return formatter(locale, 2).format(cents / 100);
}

/** Money in whole euros, for amounts and limits: "2 000 €". */
export function formatWhole(cents: Cents, locale: Locale): string {
  return formatter(locale, 0).format(Math.round(cents / 100));
}

/** A whole-euro amount without the symbol, for the editable field: "2 000". */
export function formatNumber(cents: Cents, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    useGrouping: 'always',
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

/** True when the market writes the symbol first ("€300"), false for "300 €". */
export function currencyFirst(locale: Locale): boolean {
  return formatter(locale, 0).formatToParts(1)[0]?.type === 'currency';
}

/**
 * Reads what a person types into the amount field, in any of the formats people
 * really use: "1500", "1 500", "1500,50", "1.500,50", "1,500.50", "€ 1500".
 * Returns cents, or null when the input is not a number.
 */
export function parseAmount(input: string): Cents | null {
  const cleaned = input.replace(/[\s\u00a0\u202f€]/g, '');
  if (!/^\d[\d.,]*$/.test(cleaned)) return null;

  const lastSep = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  const decimals = lastSep === -1 ? '' : cleaned.slice(lastSep + 1);

  // A separator followed by 1 or 2 digits is a decimal mark. Otherwise every
  // separator is a thousands separator ("1.500" is fifteen hundred).
  const hasDecimal = lastSep !== -1 && decimals.length > 0 && decimals.length <= 2;
  const whole = (hasDecimal ? cleaned.slice(0, lastSep) : cleaned).replace(/[.,]/g, '');
  const fraction = hasDecimal ? decimals.padEnd(2, '0') : '00';

  return Number(whole) * 100 + Number(fraction);
}
