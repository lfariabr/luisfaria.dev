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
const NOW = new Date('2026-10-12T10:00:00.000Z').getTime();
const inSeconds = (s: number) => new Date(NOW + s * 1000).toISOString();
const request = { query: ACTIVATE_GOGGINS_MODE, variables: { input: { userEmail: email, explicitMode: false } } };

const renderAndSubmit = async (mocks: ReadonlyArray<object>) => {
  render(
    <MockedProvider mocks={mocks}>
      <GogginsDialog open onOpenChange={() => {}} />
    </MockedProvider>
  );
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.click(screen.getByRole('button', { name: /generate/i }));
};

beforeEach(() => {
  try { localStorage.clear(); } catch {}
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GogginsDialog - rate limit paths', () => {
  it('over the limit: RATE_LIMITED error shows the message and counts down from resetTime', async () => {
    await renderAndSubmit([
      {
        request,
        result: {
          errors: [
            new GraphQLError('Rate limit exceeded', {
              extensions: { code: 'RATE_LIMITED', limit: 2, remaining: 0, resetTime: inSeconds(65) },
            }),
          ],
        },
      },
    ]);

    expect(await screen.findByText(/Rate limit exceeded/i)).toBeInTheDocument();
    expect(screen.getByText(/Try again in 01:05/i)).toBeInTheDocument();
    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wait 01:05/i })).toBeDisabled();
  });

  it('last scream used: shows the result, 0/limit and a countdown from resetTime, with no error', async () => {
    await renderAndSubmit([
      {
        request,
        result: {
          data: {
            activateGogginsMode: {
              id: 's-rl-1',
              text: 'You hit the wall today. Recover and plan the next move.',
              userEmail: email,
              modelUsed: 'gpt-test',
              explicitMode: false,
              isSubscriber: false,
              createdAt: new Date(NOW).toISOString(),
              rateLimitInfo: { limit: 2, remaining: 0, resetTime: inSeconds(120), __typename: 'RateLimitInfo' },
              __typename: 'Scream',
            },
          },
        },
      },
    ]);

    expect(await screen.findByText(/You hit the wall/i)).toBeInTheDocument();
    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(screen.getByText(/\+\s*in\s*02:00/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wait 02:00/i })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('screams left: no countdown', async () => {
    await renderAndSubmit([
      {
        request,
        result: {
          data: {
            activateGogginsMode: {
              id: 's-rl-2',
              text: 'Stay hard.',
              userEmail: email,
              modelUsed: 'gpt-test',
              explicitMode: false,
              isSubscriber: false,
              createdAt: new Date(NOW).toISOString(),
              rateLimitInfo: { limit: 2, remaining: 1, resetTime: inSeconds(3600), __typename: 'RateLimitInfo' },
              __typename: 'Scream',
            },
          },
        },
      },
    ]);

    expect(await screen.findByText(/Stay hard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate (1/2)' })).toBeEnabled();
  });

  it('Redis down: SERVICE_UNAVAILABLE shows the message and no countdown', async () => {
    await renderAndSubmit([
      {
        request,
        result: {
          errors: [
            new GraphQLError('Temporarily unavailable, please try again shortly', {
              extensions: { code: 'SERVICE_UNAVAILABLE' },
            }),
          ],
        },
      },
    ]);

    expect(await screen.findByText(/Temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/Try again in/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });
});
