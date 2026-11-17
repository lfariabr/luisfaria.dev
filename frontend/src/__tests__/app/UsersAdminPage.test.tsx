import React from 'react';
import { render, screen } from '@testing-library/react';
import UsersAdminPage from '@/app/admin/users/page';
import { useUsers } from '@/lib/hooks/useUsers';
import { UserRole } from '@/lib/graphql/types/user.types';

jest.mock('@/lib/hooks/useUsers', () => ({
  useUsers: jest.fn(),
  useUserMutations: () => ({ updateUserRole: jest.fn(), deleteUser: jest.fn(), loading: false }),
}));

const mockedUseUsers = useUsers as jest.Mock;

describe('UsersAdminPage', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-11-17T00:00:00.000Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shows how long ago a user joined from the ISO createdAt the API sends (#322)', () => {
    mockedUseUsers.mockReturnValue({
      users: [
        {
          id: 'u1',
          name: 'Ada',
          email: 'ada@example.com',
          role: UserRole.USER,
          createdAt: '2026-11-14T00:00:00.000Z',
          updatedAt: '2026-11-14T00:00:00.000Z',
        },
      ],
      loading: false,
      error: undefined,
    });

    render(<UsersAdminPage />);

    expect(screen.getByText('3 days ago')).toBeInTheDocument();
    expect(screen.queryByText('recently')).not.toBeInTheDocument();
  });
});
