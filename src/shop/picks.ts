import type { Cents } from '../lib/money';
import { lowestPrice, type Product } from './catalog';

/**
 * One real product for each price step between zero and the credit limit.
 * It takes the product that the most stores sell, so the pick is stable.
 */
export function rulerPicks(products: Product[], max: Cents, count = 9): Product[] {
  const from = max * 0.05;
  const step = (max * 0.96 - from) / count;
  const picks: Product[] = [];
  for (let i = 0; i < count; i++) {
    const low = from + i * step;
    const middle = low + step / 2;
    let best: Product | null = null;
    for (const p of products) {
      const price = lowestPrice(p);
      if (price < low || price >= low + step || !p.image || p.offers.length < 2) continue;
      if (
        !best ||
        p.offers.length > best.offers.length ||
        (p.offers.length === best.offers.length &&
          Math.abs(price - middle) < Math.abs(lowestPrice(best) - middle))
      ) {
        best = p;
      }
    }
    if (best) picks.push(best);
  }
  return picks;
}
