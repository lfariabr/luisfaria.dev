// frontend/src/__tests__/app/GogginsDialog.component.test.tsx
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GogginsDialog } from '@/components/goggins/GogginsDialog';
import { ACTIVATE_GOGGINS_MODE } from '@/lib/graphql/mutations/scream.mutations';

const mocks = [
  {
    request: {
      query: ACTIVATE_GOGGINS_MODE,
      variables: { input: { userEmail: 'you@example.com', explicitMode: false } },
    },
    result: {
      data: {
        activateGogginsMode: {
          id: 's1',
          text: 'Get after it. No excuses.',
          userEmail: 'you@example.com',
          modelUsed: 'gpt-test',
          explicitMode: false,
          isSubscriber: false,
          createdAt: new Date().toISOString(),
          rateLimitInfo: { allowed: true, limit: 2, remaining: 1, resetIn: 0, __typename: 'RateLimitInfo' },
          __typename: 'Scream',
        },
      },
    },
  },
];

test('submits and shows response', async () => {
  render(
    <MockedProvider mocks={mocks}>
      <GogginsDialog open onOpenChange={() => {}} />
    </MockedProvider>
  );
  await userEvent.type(screen.getByLabelText(/email/i), 'you@example.com');
  await userEvent.click(screen.getByRole('button', { name: /generate/i }));
  expect(await screen.findByText(/Get after it/)).toBeInTheDocument();
});
