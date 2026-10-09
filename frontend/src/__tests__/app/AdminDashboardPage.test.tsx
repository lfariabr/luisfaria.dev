import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from '@apollo/client';
import AdminDashboardPage from '@/app/admin/page';
import { GET_PROJECTS } from '@/lib/graphql/queries/project.queries';
import { GET_ARTICLES } from '@/lib/graphql/queries/article.queries';
import { GET_USERS } from '@/lib/graphql/queries/user.queries';
import { GET_PAYMENTS } from '@/lib/graphql/queries/payment.queries';
import { GET_PINS } from '@/lib/graphql/queries/pin.queries';

jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

const mockedUseQuery = useQuery as jest.Mock;
const recent = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

type QueryResult = { data?: unknown; loading?: boolean; error?: Error; refetch?: jest.Mock };

const mockQueries = (overrides: Map<unknown, QueryResult> = new Map()) => {
  const defaults = new Map<unknown, QueryResult>([
    [GET_PROJECTS, { data: { projects: [{ id: '1', featured: true }, { id: '2', featured: false }] } }],
    [GET_ARTICLES, { data: { articles: [{ id: 'a1', published: true, updatedAt: recent() }] } }],
    [GET_USERS, { data: { users: [{ id: 'u1', createdAt: recent() }] } }],
    [GET_PAYMENTS, { data: { payments: [{ id: 'p1', status: 'paid', amount: 500, currency: 'aud', createdAt: recent() }] } }],
    [GET_PINS, { data: { pins: [{ id: 'pin1', placeName: 'Bistro Rex', date: recent() }] } }],
  ]);

  mockedUseQuery.mockImplementation((query: unknown) => ({
    loading: false,
    refetch: jest.fn(),
    ...(overrides.get(query) ?? defaults.get(query)),
  }));
};

const attention = () => screen.getByRole('region', { name: 'Needs attention' });

describe('AdminDashboardPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows "All clear" when nothing needs attention', () => {
    mockQueries();
    render(<AdminDashboardPage />);

    expect(within(attention()).getByText('All clear')).toBeInTheDocument();
  });

  it('lists failed payments, stale pending payments and recent drafts', () => {
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    mockQueries(
      new Map<unknown, QueryResult>([
        [GET_PAYMENTS, { data: { payments: [
          { id: 'f', status: 'failed', amount: 500, currency: 'aud', createdAt: recent() },
          { id: 'p', status: 'pending', amount: 500, currency: 'aud', createdAt: old },
        ] } }],
        [GET_ARTICLES, { data: { articles: [{ id: 'd', published: false, updatedAt: recent() }] } }],
      ]),
    );
    render(<AdminDashboardPage />);

    const strip = attention();
    expect(within(strip).getByRole('link', { name: /1 failed payment/ })).toHaveAttribute('href', '/admin/payments');
    expect(within(strip).getByRole('link', { name: /1 payment pending for over 24h/ })).toHaveAttribute('href', '/admin/payments');
    expect(within(strip).getByRole('link', { name: /1 draft article/ })).toHaveAttribute('href', '/admin/articles');
    expect(within(strip).queryByText('All clear')).not.toBeInTheDocument();
  });

  it('renders the six launch tiles with their stats and actions', () => {
    mockQueries();
    render(<AdminDashboardPage />);

    const projects = screen.getByTestId('tile-projects');
    expect(within(projects).getByText('2')).toBeInTheDocument();
    expect(within(projects).getByText('1 featured')).toBeInTheDocument();
    expect(within(projects).getByRole('link', { name: 'New' })).toHaveAttribute('href', '/admin/projects/new');

    expect(within(screen.getByTestId('tile-articles')).getByText('0 drafts')).toBeInTheDocument();
    expect(within(screen.getByTestId('tile-payments')).getByText(/AUD 5\.00/)).toBeInTheDocument();
    expect(within(screen.getByTestId('tile-users')).getByText('1 new in the last 7 days')).toBeInTheDocument();
    expect(within(screen.getByTestId('tile-pins')).getByText('Latest: Bistro Rex')).toBeInTheDocument();
    expect(within(screen.getByTestId('tile-emom')).getByRole('link', { name: 'Start session' })).toHaveAttribute('href', '/admin/emom');
  });

  it('keeps other tiles working when one query fails, and retries it', async () => {
    const refetch = jest.fn();
    mockQueries(new Map<unknown, QueryResult>([[GET_USERS, { error: new Error('boom'), refetch }]]));
    render(<AdminDashboardPage />);

    const users = screen.getByTestId('tile-users');
    expect(within(users).getByText(/Couldn.t load users/)).toBeInTheDocument();
    expect(within(screen.getByTestId('tile-projects')).getByText('1 featured')).toBeInTheDocument();

    await userEvent.click(within(users).getByRole('button', { name: /Retry/ }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows a retry in the attention strip instead of "All clear" when payments fail', () => {
    mockQueries(new Map<unknown, QueryResult>([[GET_PAYMENTS, { error: new Error('boom') }]]));
    render(<AdminDashboardPage />);

    expect(within(attention()).getByText(/Couldn.t load payments/)).toBeInTheDocument();
    expect(within(attention()).queryByText('All clear')).not.toBeInTheDocument();
  });

  it('shows skeletons while a tile is loading', () => {
    mockQueries(new Map<unknown, QueryResult>([[GET_PINS, { loading: true }]]));
    render(<AdminDashboardPage />);

    const pins = screen.getByTestId('tile-pins');
    expect(within(pins).queryByText(/Latest/)).not.toBeInTheDocument();
    expect(pins.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
