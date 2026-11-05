# One loop, shipped

An unofficial concept for the ESTO **Product Builder** application: the credit-line
withdrawal screen, redesigned and built as a working prototype.

The page runs the loop from the job post on one real screen:

1. **Problem.** Six findings from the current screen, drawn as redlines over a wireframe (not a screenshot).
2. **Prototype.** A live withdrawal screen. Drag the amount, pick the speed and the term, switch between EN, ET, LV and LT. A "Try to break it" panel pushes it into its edge cases: over the limit, under the minimum, limit used up, slow network, longest copy, 320px phone.
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
- **Free is the default.** The paid instant payout is an equal, visible choice, never pre-selected.
- **Corrections are never silent.** Out-of-range input is fixed and the screen says why.
- **Motion has a still version.** Every animation respects `prefers-reduced-motion`. Big state changes use the View Transitions API where the browser has it.

## Copy

English is the source. The Estonian, Latvian and Lithuanian strings are first drafts and need a native
speaker's review before anything like this ships.

## Stack

React 19, TypeScript, Vite, Vitest and Testing Library. Plain CSS with custom properties, no UI library.
Built with [Claude Code](https://claude.com/claude-code).
