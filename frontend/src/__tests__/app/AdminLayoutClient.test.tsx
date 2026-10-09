import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import AdminLayoutClient from '@/app/admin/AdminLayoutClient';

const mockSetTheme = jest.fn();
const mockLogout = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, onClick, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { role: 'ADMIN' },
    logout: mockLogout,
    refetchUser: jest.fn(),
  }),
}));

const mockedUsePathname = usePathname as jest.Mock;

const renderAt = (pathname: string) => {
  mockedUsePathname.mockReturnValue(pathname);
  return render(
    <AdminLayoutClient>
      <p>page content</p>
    </AdminLayoutClient>,
  );
};

const sidebar = () => screen.getByRole('complementary');

describe('AdminLayoutClient', () => {
  beforeEach(() => jest.clearAllMocks());

  it('groups the nav into Content, Business and Personal', () => {
    renderAt('/admin');
    const nav = within(sidebar()).getByRole('navigation', { name: 'Admin' });

    for (const [group, items] of [
      ['Content', ['Projects', 'Articles']],
      ['Business', ['Payments', 'Users']],
      ['Personal', ['Pins', 'EMOM']],
    ] as const) {
      const section = within(nav).getByText(group).parentElement as HTMLElement;
      expect(within(section).getAllByRole('link').map((link) => link.textContent)).toEqual(items);
    }
  });

  it('marks the matching item active on nested routes', () => {
    renderAt('/admin/articles/new');

    expect(within(sidebar()).getByRole('link', { name: 'Articles' })).toHaveAttribute('aria-current', 'page');
    expect(within(sidebar()).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('marks Dashboard active only on an exact match', () => {
    renderAt('/admin');

    expect(within(sidebar()).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  it('links the brand and "View site" back to the public site', () => {
    renderAt('/admin');

    expect(within(sidebar()).getByRole('link', { name: /luisfaria\.dev/ })).toHaveAttribute('href', '/');
    expect(within(sidebar()).getByRole('link', { name: 'View site' })).toHaveAttribute('href', '/');
  });

  it('has no link to the removed settings page', () => {
    renderAt('/admin');

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/admin/settings');
  });

  it('sets the theme from the footer toggle', async () => {
    renderAt('/admin');

    await userEvent.click(within(sidebar()).getByRole('button', { name: 'Light' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
    expect(within(sidebar()).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the current page title in the mobile top bar', () => {
    renderAt('/admin/payments');

    expect(within(screen.getByRole('banner')).getByText('Payments')).toBeInTheDocument();
  });

  it('opens the drawer from the hamburger and closes it on navigation', async () => {
    renderAt('/admin');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open admin menu' }));

    const drawer = screen.getByRole('dialog');
    await userEvent.click(within(drawer).getByRole('link', { name: 'EMOM' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('logs out from the sidebar', async () => {
    renderAt('/admin');

    await userEvent.click(within(sidebar()).getByRole('button', { name: 'Logout' }));
    expect(mockLogout).toHaveBeenCalled();
  });
});
