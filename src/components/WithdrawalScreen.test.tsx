import { useReducer } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WithdrawalScreen } from './WithdrawalScreen';
import { initialState, withdrawalReducer, type WithdrawalState } from '../lib/withdrawal';
import type { Locale } from '../lib/format';

function Harness({
  start = initialState,
  locale = 'en',
  loading = false,
  onSubmit = () => {},
}: {
  start?: WithdrawalState;
  locale?: Locale;
  loading?: boolean;
  onSubmit?: () => void;
}) {
  const [state, dispatch] = useReducer(withdrawalReducer, start);
  return (
    <WithdrawalScreen
      state={state}
      dispatch={dispatch}
      locale={locale}
      loading={loading}
      onSubmit={onSubmit}
    />
  );
}

const plain = (s: string | null) => (s ?? '').replace(/[\u00a0\u202f]/g, ' ');

describe('WithdrawalScreen', () => {
  it('starts on the free payout with no fee in the summary', () => {
    render(<Harness />);

    expect(screen.getByRole('radio', { name: /1-3 business days/i })).toBeChecked();
    expect(screen.queryByText('Instant payout fee')).not.toBeInTheDocument();
  });

  it('adds the fee to the summary only when the customer picks instant', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: /right now/i }));

    expect(screen.getByText('Instant payout fee', { selector: 'dt' })).toBeInTheDocument();
  });

  it('corrects a typed amount over the limit and explains why', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const field = screen.getByLabelText(/amount in euros/i);

    await user.clear(field);
    await user.type(field, '2500{Enter}');

    expect(field).toHaveValue('2,000');
    expect(plain(screen.getByRole('status').textContent)).toMatch(/Your limit is €2,000/);
  });

  it('steps the amount with the plus and minus buttons', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: /increase/i }));

    expect(screen.getByRole('button', { name: /withdraw/i })).toHaveTextContent('Withdraw €310');
  });

  it('disables plus at the limit', () => {
    render(<Harness start={{ ...initialState, amount: initialState.limit }} />);

    expect(screen.getByRole('button', { name: /increase/i })).toBeDisabled();
  });

  it('formats money for the selected market', () => {
    render(<Harness locale="et" />);

    expect(plain(screen.getByRole('button', { name: /võta välja/i }).textContent)).toBe('Võta välja 300 €');
    expect(plain(screen.getByText(/^Saadaval/).textContent)).toBe('Saadaval: 2 000 €');
  });

  it('shows a loading state with nothing to click', () => {
    render(<Harness loading />);

    expect(screen.getByRole('status')).toHaveTextContent('Checking your limit');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('shows an empty state when the limit is used up', () => {
    render(<Harness start={withdrawalReducer(initialState, { type: 'setLimit', limit: 0 })} />);

    expect(screen.getByRole('heading', { name: 'Nothing to withdraw right now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /withdraw/i })).toBeDisabled();
  });

  it('submits', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /withdraw/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
