import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { GogginsDialog } from '@/components/goggins/GogginsDialog';
import { ACTIVATE_GOGGINS_MODE } from '@/lib/graphql/mutations/scream.mutations';

jest.mock('@/utils/discord', () => ({
  sendDiscordWebhook: jest.fn().mockResolvedValue(undefined),
}));

const email = 'rl@test.com';

beforeEach(() => {
  // make sure the email field renders
  try { localStorage.clear(); } catch {}
});

describe('GogginsDialog - rate limit paths', () => {
  it('shows error and countdown when GraphQL returns rate limit error with extensions', async () => {
    const mocks = [
      {
        request: {
          query: ACTIVATE_GOGGINS_MODE,
          variables: { input: { userEmail: email, explicitMode: false } },
        },
        result: {
          errors: [
            new GraphQLError('Rate limit exceeded', {
              extensions: { limit: 2, remaining: 0, resetIn: 65 },
            }),
          ],
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <GogginsDialog open onOpenChange={() => {}} />
      </MockedProvider>
    );

    await userEvent.type(screen.getByLabelText(/email/i), email);
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // Error should be visible with countdown string (under 5m => mm:ss)
    expect(await screen.findByText(/Rate limit exceeded/i)).toBeInTheDocument();
    expect(screen.getByText(/Try again in 01:05/i)).toBeInTheDocument();

    // Also ensure the button reflects waiting state
    expect(screen.getByRole('button', { name: /wait 01:05/i })).toBeDisabled();
  });

  it('handles allowed=false response by showing result, rate banner, and disabled button with countdown', async () => {
    const mocks = [
      {
        request: {
          query: ACTIVATE_GOGGINS_MODE,
          variables: { input: { userEmail: email, explicitMode: false } },
        },
        result: {
          data: {
            activateGogginsMode: {
              id: 's-rl-1',
              text: 'You hit the wall today. Recover and plan the next move.',
              userEmail: email,
              modelUsed: 'gpt-test',
              explicitMode: false,
              isSubscriber: false,
              createdAt: new Date().toISOString(),
              rateLimitInfo: { allowed: false, limit: 2, remaining: 0, resetIn: 120, __typename: 'RateLimitInfo' },
              __typename: 'Scream',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <GogginsDialog open onOpenChange={() => {}} />
      </MockedProvider>
    );

    await userEvent.type(screen.getByLabelText(/email/i), email);
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));

    // Response text is shown
    expect(await screen.findByText(/You hit the wall/i)).toBeInTheDocument();

    // Rate limit banner shows remaining/limit and reset pill
    expect(screen.getByText('0/2')).toBeInTheDocument();
    // Accept either the previous copy ("Resets in 02:00") or the current UI ("+ in 02:00")
    expect(
      screen.getByText((_, node) => {
        const text = (node?.textContent || '').trim();
        return /^(Resets in\s*02:00|\+\s*in\s*02:00)$/i.test(text);
      })
    ).toBeInTheDocument();

    // Button shows Wait label and is disabled
    expect(screen.getByRole('button', { name: /wait 02:00/i })).toBeDisabled();

    // Error banner for allowed=false path should also appear
    expect(screen.getByText(/Rate limited\./i)).toBeInTheDocument();
  });
});
