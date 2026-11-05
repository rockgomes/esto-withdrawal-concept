import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

const scenario = (name: RegExp) => screen.getByRole('button', { name });

describe('edge case scenarios', () => {
  it('starts on Normal', () => {
    render(<App />);
    expect(scenario(/^normal/i)).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the same labels after a scenario runs', async () => {
    const user = userEvent.setup();
    render(<App />);
    const labels = () => within(screen.getByRole('list', { name: 'Edge cases' })).getAllByRole('button');
    const before = labels().map((b) => b.textContent);

    await user.click(scenario(/limit fully used/i));

    expect(labels().map((b) => b.textContent)).toEqual(before);
  });

  it('never leaves the screen stuck: over the limit works after the limit was used up', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(scenario(/limit fully used/i));
    expect(screen.getByRole('heading', { name: 'Nothing to withdraw right now' })).toBeInTheDocument();

    await user.click(scenario(/more than the limit/i));
    expect(screen.queryByRole('heading', { name: 'Nothing to withdraw right now' })).not.toBeInTheDocument();
    expect(screen.getByText(/so we set the amount to that/i)).toBeInTheDocument();
    expect(scenario(/more than the limit/i)).toHaveAttribute('aria-pressed', 'true');
    expect(scenario(/limit fully used/i)).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches to Lithuanian for the longest language', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(scenario(/longest language/i));

    expect(screen.getByRole('radio', { name: 'LT' })).toBeChecked();
    expect(screen.getByRole('heading', { name: 'Kiek norite išsiimti?' })).toBeInTheDocument();
  });
});

describe('amount input counter', () => {
  it('counts plus and minus taps', async () => {
    const user = userEvent.setup();
    render(<App />);
    const plus = screen.getByRole('button', { name: /increase/i });

    await user.click(plus);
    await user.click(plus);

    const taps = screen.getByText('+ and − taps').nextElementSibling;
    expect(taps).toHaveTextContent('2');
  });
});

describe('phone width', () => {
  it('is a separate control from the scenarios', () => {
    render(<App />);
    const width = screen.getByRole('group', { name: 'Phone width' });
    expect(within(width).getByRole('radio', { name: '375 px' })).toBeChecked();
  });
});
