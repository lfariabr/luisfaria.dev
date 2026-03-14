import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegisterPage from '@/app/(auth)/register/page';

const mockRegister = jest.fn();

jest.mock('next/script', () => {
  return function MockScript() {
    return null;
  };
});

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    loading: false,
    error: null,
  }),
}));

jest.mock('@/utils/discord', () => ({
  sendDiscordWebhook: jest.fn().mockResolvedValue(undefined),
}));

describe('RegisterPage captcha guardrails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
  });

  it('blocks submission when captcha token is missing', async () => {
    // @ts-expect-error test-only window mocking
    window.turnstile = { render: () => 'widget-id' };

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Test1234!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Test1234!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Please complete captcha verification.')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits with captcha token when turnstile callback succeeds', async () => {
    // @ts-expect-error test-only window mocking
    window.turnstile = {
      render: (_container: HTMLElement, options: { callback: (token: string) => void }) => {
        options.callback('turnstile-test-token');
        return 'widget-id';
      },
    };

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Test1234!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Test1234!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!',
        captchaToken: 'turnstile-test-token',
      });
    });
  });
});
