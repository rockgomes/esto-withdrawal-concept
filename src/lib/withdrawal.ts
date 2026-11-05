import type { Cents } from './money';

export type Speed = 'free' | 'instant';
export const TERMS = [6, 12, 24, 36] as const;
export type Term = (typeof TERMS)[number];

/**
 * Example terms. These are illustrative numbers for the prototype,
 * not ESTO's real pricing.
 */
export const EXAMPLE = {
  aprPercent: 20,
  instantFee: 1990,
  minAmount: 1000,
  step: 1000,
  defaultAmount: 30000,
  limit: 200000,
} as const;

export type Notice = { kind: 'overLimit' } | { kind: 'belowMin' } | null;

export interface WithdrawalState {
  limit: Cents;
  amount: Cents;
  speed: Speed;
  term: Term;
  /** Shown once after the input was corrected, so the change is never silent. */
  notice: Notice;
}

export type WithdrawalAction =
  | { type: 'setAmount'; amount: Cents }
  | { type: 'step'; direction: 1 | -1 }
  | { type: 'setSpeed'; speed: Speed }
  | { type: 'setTerm'; term: Term }
  | { type: 'setLimit'; limit: Cents }
  | { type: 'reset' };

export const initialState: WithdrawalState = {
  limit: EXAMPLE.limit,
  // Start from a modest amount, not the full limit. The customer chooses to go higher.
  amount: Math.min(EXAMPLE.defaultAmount, EXAMPLE.limit),
  // The free option is the default. Paying for speed is an active choice.
  speed: 'free',
  term: 12,
  notice: null,
};

/** True when the limit is too small to withdraw anything at all. */
export function isEmpty(state: WithdrawalState): boolean {
  return state.limit < EXAMPLE.minAmount;
}

function clamp(amount: Cents, limit: Cents): { amount: Cents; notice: Notice } {
  if (amount > limit) return { amount: limit, notice: { kind: 'overLimit' } };
  if (amount < EXAMPLE.minAmount)
    return { amount: Math.min(EXAMPLE.minAmount, limit), notice: { kind: 'belowMin' } };
  return { amount, notice: null };
}

export function withdrawalReducer(state: WithdrawalState, action: WithdrawalAction): WithdrawalState {
  switch (action.type) {
    case 'setAmount':
      return { ...state, ...clamp(action.amount, state.limit) };

    case 'step': {
      // Snap to the step grid first, so 305 € goes to 310 € or 300 €, not 315 €.
      const snapped =
        action.direction === 1
          ? Math.floor(state.amount / EXAMPLE.step) * EXAMPLE.step + EXAMPLE.step
          : Math.ceil(state.amount / EXAMPLE.step) * EXAMPLE.step - EXAMPLE.step;
      return { ...state, ...clamp(snapped, state.limit) };
    }

    case 'setSpeed':
      return { ...state, speed: action.speed };

    case 'setTerm':
      return { ...state, term: action.term };

    case 'setLimit': {
      const limit = Math.max(0, action.limit);
      if (limit < EXAMPLE.minAmount) return { ...state, limit, amount: 0, notice: null };
      const amount = state.amount === 0 ? Math.min(EXAMPLE.defaultAmount, limit) : state.amount;
      return { ...state, limit, ...clamp(amount, limit) };
    }

    case 'reset':
      return initialState;
  }
}
