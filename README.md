# One loop, shipped

An unofficial concept for the ESTO **Product Builder** application: the credit-line
withdrawal screen, redesigned and built as a working prototype.

By Rock Gomes, product designer. Portfolio: [rockgomes.com](https://www.rockgomes.com)

The page runs the loop from the job post on one real screen:

1. **Problem.** Five findings from the current screen, drawn as redlines over a wireframe (not a screenshot).
2. **Prototype.** A live withdrawal screen. Drag the amount, pick when you need the money and the term, switch between EN, ET, LV and LT. An edge cases panel puts it into states that often break: over the limit, under the minimum, limit used up, slow network, longest copy, 320px phone.
3. **Spec.** The handover an engineer would need, copyable as Markdown.
4. **Numbers.** How success would be measured, with no made-up baselines.

> Not affiliated with or endorsed by ESTO. Rates and fees in the prototype are examples, not real pricing.

## Run it

```bash
npm install
npm run dev
```

## Check it

```bash
npm run check   # typecheck, lint, format check, tests
npm run build
```

CI runs the same steps on every push and pull request.

## How it is put together

| Path                                  | What it does                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/money.ts`                    | Credit math in integer cents: annuity payment, schedule, total cost. The last instalment absorbs rounding, so the plan always adds up exactly. |
| `src/lib/format.ts`                   | Money formatting per market and a forgiving parser for typed amounts (`1 500`, `1500,50`, `1.500`, `1,500.50`).                                |
| `src/lib/withdrawal.ts`               | The screen's state as a reducer: defaults, clamping with a visible notice, limit changes.                                                      |
| `src/i18n/strings.ts`                 | Typed copy for EN, ET, LV and LT. A missing key is a type error; a mismatched placeholder fails a test.                                        |
| `src/components/WithdrawalScreen.tsx` | The prototype screen, including its loading and empty states.                                                                                  |
| `src/components/BeforeSchematic.tsx`  | The current screen as a wireframe with animated redlines.                                                                                      |
| `src/components/Loop.tsx`             | The hero: the job post's loop as the page's navigation.                                                                                        |
| `src/content.ts`, `src/spec.ts`       | Findings and spec as data, shared by every part of the page that shows them.                                                                   |

Decisions worth knowing:

- **One grouping rule for three markets.** CLDR writes `2000 €` in Estonian and Latvian but `2 000 €` in Lithuanian. The formatter forces `useGrouping: 'always'` so all three match, and a test locks it in.
- **Free is the default.** “Right now” (19.90 €) is never pre-selected.
- **Corrections are never silent.** Out-of-range input is fixed and the screen says why.
- **Motion has a still version.** Every animation respects `prefers-reduced-motion`. Big state changes use the View Transitions API where the browser has it.

## Copy

English is the source. The Estonian, Latvian and Lithuanian strings are first drafts and need a native
speaker's review before anything like this ships.

## Stack

React 19, TypeScript, Vite, Vitest and Testing Library. Plain CSS with custom properties, no UI library.
Built with [Claude Code](https://claude.com/claude-code).

## Shop with your limit (second concept, at `/shop/`)

A product search for ESTO credit-line customers. It shows real products from ESTO partner stores with the customer's own monthly price, compares stores, and sends a price alert.

- **Real data.** `scripts/build-catalog.mjs` reads the open product feeds that stores publish in the Hinnavaatlus price list format. It matches the same product across stores by barcode (GTIN) and writes `public/data/catalog.json`.
- **Daily refresh.** `.github/workflows/refresh-catalog.yml` runs the script once a day and commits the result. Real price changes are saved to `public/data/history.json`.
- **Start page.** Real products stand on the customer's limit at their price. Then the two phases, each with a small live demo and a button that opens the prototype (`?phase=1` or `?phase=2`). Phase 1: search, the customer's own monthly price, and price alerts, then the real store page. Phase 2: "Credit line" as a new method on ESTO's checkout page.
- **Example data.** The customer's limit and amount in use are examples. The 37.10% rate is the highest interest rate in ESTO's own credit line example. The phase 2 payment is simulated, and the store checkout page is a stand-in. The page says so.

| File                      | What it holds                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `scripts/catalog-lib.mjs` | Feed parsing, barcode matching, the listing rules, and price history. Pure functions with tests. |
| `src/shop/search.ts`      | Search, filters, and ranking.                                                                    |
| `src/shop/credit.ts`      | Free limit, payment plan, and lowest allowed payment.                                            |
| `src/shop/watch.ts`       | Price watch and price-drop alerts.                                                               |
| `src/shop/Checkout.tsx`   | Phase 2: the store checkout stand-in and the ESTO checkout page.                                 |
| `src/shop/phase.ts`       | The two phases and what each one needs.                                                          |
| `src/shop/ShopApp.tsx`    | The screens.                                                                                     |

Run `node scripts/build-catalog.mjs` to refresh the catalog by hand. This is an unofficial concept. Product data belongs to each store.
