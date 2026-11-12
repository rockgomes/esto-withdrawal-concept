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
  window.history.replaceState(null, '', '/?phase=2');
  window.location.hash = '';
  window.scrollTo = vi.fn();
  mockFeeds();
});

afterEach(() => vi.unstubAllGlobals());

describe('shop prototype', () => {
  it('shows real products with a personal monthly price and a limit check', async () => {
    render(<ShopApp />);
    const phone = await screen.findByRole('button', { name: /Apple iPhone 17 256GB/ });
    expect(phone).toHaveTextContent('108,99 € / month for you');
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

  it('compares stores, then pays from the credit line on the ESTO payment page (phase 2)', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    await user.click(await screen.findByRole('button', { name: /Apple iPhone 17 256GB/ }));

    const offers = screen.getAllByRole('radio');
    expect(offers[0]).toHaveTextContent('ONOFF');
    expect(offers[0]).toHaveTextContent('Lowest');
    expect(offers[1]).toHaveTextContent('2 to 4 working days');

    await user.click(screen.getByRole('button', { name: 'Buy at ONOFF with your credit line' }));
    const flow = screen.getByRole('dialog');
    expect(flow).toHaveTextContent('You are on the ONOFF site. This page is a stand-in.');
    await user.click(within(flow).getByRole('radio', { name: /Card/ }));
    expect(within(flow).getByRole('button', { name: 'Continue to ESTO' })).toBeDisabled();
    await user.click(within(flow).getByRole('radio', { name: /ESTO/ }));
    await user.click(within(flow).getByRole('button', { name: 'Continue to ESTO' }));

    // ESTO has to know who the customer is before it can offer the credit line.
    expect(within(flow).getByRole('heading', { name: 'Confirm who you are' })).toBeInTheDocument();
    await user.click(within(flow).getByRole('button', { name: 'Smart-ID' }));
    expect(within(flow).getByRole('radio', { name: /Credit line/ })).toHaveAttribute('aria-checked', 'true');
    expect(flow).toHaveTextContent('12 × 108,99 €');
    expect(flow).toHaveTextContent('No application and no new contract');

    // Another method goes on as today, with no push back to the credit line.
    await user.click(within(flow).getByRole('radio', { name: 'Hire purchase' }));
    await user.click(within(flow).getByRole('button', { name: 'Continue with Hire purchase' }));
    expect(within(flow).getByRole('heading', { name: 'The demo stops here' })).toBeInTheDocument();
    await user.click(within(flow).getByRole('button', { name: 'Back to the payment methods' }));

    await user.click(within(flow).getByRole('radio', { name: /Credit line/ }));
    await user.click(within(flow).getByRole('button', { name: /from my credit line/ }));
    expect(within(flow).getByRole('heading', { name: 'Order confirmed' })).toBeInTheDocument();
    expect(flow).toHaveTextContent('No order is made');

    // Back in the ESTO app, the purchase is on the dashboard and in Transactions.
    await user.click(within(flow).getByRole('button', { name: 'See the purchase in the ESTO app' }));
    expect(screen.getByRole('heading', { name: 'Latest purchase' })).toBeInTheDocument();
    expect(screen.getByLabelText('Your credit limit')).toHaveTextContent('101 €');
    await user.click(screen.getByRole('button', { name: 'All transactions' }));
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
    const row = screen.getAllByRole('row')[1];
    expect(row).toHaveTextContent('Purchase');
    expect(row).toHaveTextContent('ESTO AS');
    expect(row).toHaveTextContent('ONOFF');
    expect(row).toHaveTextContent('1 079,00 €');

    await user.click(screen.getByRole('button', { name: 'Credit Line' }));
    expect(screen.getByText('Credit used').parentElement).toHaveTextContent('1 399 €');
    expect(screen.getByText(/Your next monthly payment went up by/)).toBeInTheDocument();
  });

  it('lets a customer buy above the free limit with another method', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    await user.click(await screen.findByRole('button', { name: /Samsung QLED/ }));
    await user.click(screen.getByRole('button', { name: /^Buy at \w+$/ }));
    const flow = screen.getByRole('dialog');
    await user.click(within(flow).getByRole('button', { name: 'Continue to ESTO' }));
    await user.click(within(flow).getByRole('button', { name: 'Mobile-ID' }));

    expect(within(flow).getByRole('radio', { name: /Credit line.*Limit too low/ })).toBeInTheDocument();
    expect(within(flow).getByRole('radio', { name: 'Hire purchase' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(within(flow).getByRole('radio', { name: /Credit line/ }));
    expect(flow).toHaveTextContent(/This order needs .* more/);
    expect(within(flow).queryByRole('button', { name: /from my credit line/ })).not.toBeInTheDocument();
  });

  it('sends the person to the real store page in phase 1', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    await user.click(await screen.findByRole('button', { name: 'Switch to Phase 1' }));
    expect(window.location.search).toBe('?phase=1');

    await user.click(screen.getByRole('button', { name: /Apple iPhone 17 256GB/ }));
    expect(screen.getByRole('link', { name: /Go to ONOFF to buy/ })).toHaveAttribute(
      'href',
      'https://onoff.ee/iphone-17',
    );
    expect(screen.queryByRole('button', { name: /with your credit line/ })).not.toBeInTheDocument();
  });

  it('starts on a page that shows real products on the limit, and opens the prototype', async () => {
    window.history.replaceState(null, '', '/');
    const user = userEvent.setup();
    render(<ShopApp />);
    expect(screen.getByRole('heading', { name: 'Shop with your credit line' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Credit line at checkout' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();

    // The small search on the page runs on the real catalog.
    const result = await screen.findByRole('button', { name: /Apple iPhone 17 256GB.*month/ });
    await user.click(result);
    expect(window.location.search).toBe('?phase=1');
    expect(await screen.findByRole('link', { name: /Go to ONOFF to buy/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'About the concept' }));
    await user.click(screen.getByRole('button', { name: 'Open the Phase 2 prototype' }));
    expect(window.location.search).toBe('?phase=2');
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('Prototype, Phase 2: Credit line at checkout')).toBeInTheDocument();
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
    expect(screen.getAllByText(/Price went down/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('The email the customer gets')).toHaveTextContent('no email is sent');
  });

  it('sits inside the app frame, with a dashboard that leads to the shop', async () => {
    const user = userEvent.setup();
    render(<ShopApp />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('button', { name: /Find products/ })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(nav).getByRole('button', { name: 'Dashboard' }));
    expect(await screen.findByRole('button', { name: 'Withdraw money' })).toBeInTheDocument();
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
