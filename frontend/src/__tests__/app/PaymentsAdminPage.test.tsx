import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { useQuery } from '@apollo/client';
import PaymentsAdminPage from '@/app/admin/payments/page';

jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

const mockedUseQuery = useQuery as jest.Mock;

const payments = [
  {
    id: 'pay-2',
    email: 'new@example.com',
    productKey: 'meeting',
    amount: 15000,
    currency: 'aud',
    status: 'refunded',
    createdAt: '2026-10-05T00:00:00.000Z',
  },
  {
    id: 'pay-1',
    email: null,
    productKey: 'coffee',
    amount: 500,
    currency: 'aud',
    status: 'paid',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

describe('PaymentsAdminPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('lists Payments in the order the API returns them', () => {
    mockedUseQuery.mockReturnValue({ data: { payments }, loading: false, error: undefined });
    render(<PaymentsAdminPage />);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);

    expect(within(rows[0]).getByText('new@example.com')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Meeting')).toBeInTheDocument();
    expect(within(rows[0]).getByText('AUD 150.00')).toBeInTheDocument();
    expect(within(rows[0]).getByText('refunded')).toBeInTheDocument();

    expect(within(rows[1]).getByText('—')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Coffee')).toBeInTheDocument();
    expect(within(rows[1]).getByText('AUD 5.00')).toBeInTheDocument();
  });

  it('shows an empty state when there are no Payments', () => {
    mockedUseQuery.mockReturnValue({ data: { payments: [] }, loading: false, error: undefined });
    render(<PaymentsAdminPage />);

    expect(screen.getByText(/no payments yet/i)).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    mockedUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });
    render(<PaymentsAdminPage />);

    expect(screen.getByText(/loading payments/i)).toBeInTheDocument();
  });

  it('shows an error when the query fails', () => {
    mockedUseQuery.mockReturnValue({ data: undefined, loading: false, error: new Error('Not authorized') });
    render(<PaymentsAdminPage />);

    expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
  });
});
