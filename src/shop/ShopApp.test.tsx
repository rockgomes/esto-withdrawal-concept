import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ShopApp from './ShopApp';
import { PACKED } from './testCatalog';

function mockFeeds(ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok,
      status: ok ? 200 : 503,
      json: async () => (url.includes('history') ? {} : PACKED),
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  window.scrollTo = vi.fn();
  mockFeeds();
});

afterEach(() => vi.unstubAllGlobals());

describe('shop prototype', () => {
  it('shows real products with a personal monthly price and a limit check', async () => {
    render(<ShopApp />);
    const phone = await screen.findByRole('button', { name: /Apple iPhone 17 256GB/ });
    expect(phone).toHaveTextContent('100,94 € / month for you');
    expect(phone).toHaveTextContent('Fits your limit');
    expect(screen.getByRole('button', { name: /Samsung QLED/ })).toHaveTextContent('Above your free limit');
  });

  it('searches as the person types', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    await user.type(await screen.findByRole('searchbox'), 'samsung');
    expect(screen.getByText('1 product for “samsung”')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iPhone 17 256GB/ })).not.toBeInTheDocument();
  });

  it('compares stores, changes the plan, and buys with the limit', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    await user.click(await screen.findByRole('button', { name: /Apple iPhone 17 256GB/ }));

    const offers = screen.getAllByRole('radio');
    expect(offers[0]).toHaveTextContent('ONOFF');
    expect(offers[0]).toHaveTextContent('Lowest');
    expect(offers[1]).toHaveTextContent('2 to 4 working days');

    await user.click(screen.getByRole('button', { name: 'Buy at ONOFF with your limit' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('12 × 100,94 €');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm with Smart-ID' }));
    expect(
      await within(dialog).findByText(/ONOFF has your order/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Your credit limit')).toHaveTextContent('101 €');
  });

  it('watches a price and shows an alert when the price goes down', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    await user.click(await screen.findByRole('button', { name: /Apple iPhone 17 256GB/ }));
    await user.click(screen.getByRole('button', { name: 'Tell me when the price goes down' }));
    expect(screen.getByRole('button', { name: 'Watching the price' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: /Back to search/ }));
    expect(screen.queryByText(/Price went down/)).not.toBeInTheDocument();

    await user.click(screen.getByText(/About this concept/));
    const simulate = screen.getByRole('group', { name: /Simulate a lower price/ });
    await user.click(within(simulate).getByRole('button', { name: /iPhone 17 256GB/ }));
    expect(screen.getByText(/Price went down/)).toBeInTheDocument();
  });

  it('sits inside the app frame, with a dashboard that leads to the shop', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('button', { name: /Shop/ })).toHaveAttribute('aria-current', 'page');

    await user.click(within(nav).getByRole('button', { name: 'Dashboard' }));
    expect(await screen.findByRole('button', { name: 'Make a withdrawal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fits your limit today' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: 'Invoices' }));
    expect(screen.getByText(/"Invoices" is not part of this concept/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Shop with your limit' }));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('says so when the product data does not load, and lets the person retry', async () => {
    mockFeeds(false);
    const user = userEvent.setup();
    render(<ShopApp />);
    expect(await screen.findByRole('alert')).toHaveTextContent('The product data did not load');
    mockFeeds(true);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: /Apple iPhone 17 256GB/ })).toBeInTheDocument();
  });
});
