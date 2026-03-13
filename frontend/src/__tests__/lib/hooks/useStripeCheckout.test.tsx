import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { useStripeCheckout } from '@/lib/hooks/useStripeCheckout';
import { CREATE_CHECKOUT_SESSION } from '@/lib/graphql/mutations/stripe.mutations';

const mockTrackClientEvent = jest.fn();
const mockToastError = jest.fn();
const mockLocationAssign = jest.fn();

jest.mock('@/utils/analytics', () => ({
  trackClientEvent: (...args: unknown[]) => mockTrackClientEvent(...args),
}));

jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://luisfaria.dev/projects',
    assign: mockLocationAssign,
  },
  writable: true,
});

const successMock: MockedResponse = {
  request: {
    query: CREATE_CHECKOUT_SESSION,
    variables: {
      input: {
        productKey: 'coffee',
        email: undefined,
        returnUrl: 'https://luisfaria.dev/projects',
      },
    },
  },
  result: {
    data: {
      createCheckoutSession: {
        sessionId: 'cs_test_1',
        url: 'https://checkout.stripe.com/c/pay/cs_test_1',
      },
    },
  },
};

const meetingSuccessMock: MockedResponse = {
  request: {
    query: CREATE_CHECKOUT_SESSION,
    variables: {
      input: {
        productKey: 'meeting',
        email: 'user@example.com',
        returnUrl: 'https://luisfaria.dev/projects',
      },
    },
  },
  result: {
    data: {
      createCheckoutSession: {
        sessionId: 'cs_test_meeting_1',
        url: 'https://checkout.stripe.com/c/pay/cs_test_meeting_1',
      },
    },
  },
};

const graphqlErrorMock: MockedResponse = {
  request: {
    query: CREATE_CHECKOUT_SESSION,
    variables: {
      input: {
        productKey: 'coffee',
        email: undefined,
        returnUrl: 'https://luisfaria.dev/projects',
      },
    },
  },
  result: {
    errors: [new GraphQLError('Return URL must belong to the frontend origin')],
  },
};

const missingUrlMock: MockedResponse = {
  request: {
    query: CREATE_CHECKOUT_SESSION,
    variables: {
      input: {
        productKey: 'coffee',
        email: undefined,
        returnUrl: 'https://luisfaria.dev/projects',
      },
    },
  },
  result: {
    data: {
      createCheckoutSession: {
        sessionId: 'cs_test_2',
        url: null,
      },
    },
  },
};

const networkErrorMock: MockedResponse = {
  request: {
    query: CREATE_CHECKOUT_SESSION,
    variables: {
      input: {
        productKey: 'coffee',
        email: undefined,
        returnUrl: 'https://luisfaria.dev/projects',
      },
    },
  },
  error: new Error('Network request failed'),
};

function wrapper(mocks: MockedResponse[]) {
  return ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
}

describe('useStripeCheckout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('starts as not loading', () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([]),
    });
    expect(result.current.loading).toBe(false);
  });

  it('redirects to Stripe on successful checkout', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([successMock]),
    });

    let outcome: Awaited<ReturnType<typeof result.current.startCheckout>>;
    await act(async () => {
      outcome = await result.current.startCheckout('coffee');
    });

    expect(outcome!.ok).toBe(true);
    expect(mockLocationAssign).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test_1'
    );
  });

  it('captures window.location.href as returnUrl', async () => {
    window.location.href = 'https://luisfaria.dev/projects';

    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([successMock]),
    });

    await act(async () => {
      await result.current.startCheckout('coffee');
    });

    // The mock only matches if returnUrl === 'https://luisfaria.dev/projects'
    expect(mockLocationAssign).toHaveBeenCalled();
  });

  it('passes email and meeting product key to mutation', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([meetingSuccessMock]),
    });

    let outcome: Awaited<ReturnType<typeof result.current.startCheckout>>;
    await act(async () => {
      outcome = await result.current.startCheckout('meeting', 'user@example.com');
    });

    expect(outcome!.ok).toBe(true);
    expect(mockLocationAssign).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test_meeting_1'
    );
  });

  it('shows toast and returns { ok: false } on GraphQL error', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([graphqlErrorMock]),
    });

    let outcome: Awaited<ReturnType<typeof result.current.startCheckout>>;
    await act(async () => {
      outcome = await result.current.startCheckout('coffee');
    });

    expect(outcome!.ok).toBe(false);
    expect(outcome!.errorMessage).toBe('Return URL must belong to the frontend origin');
    expect(mockToastError).toHaveBeenCalledWith(
      'Return URL must belong to the frontend origin'
    );
    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  it('shows toast and returns { ok: false } on network error', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([networkErrorMock]),
    });

    let outcome: Awaited<ReturnType<typeof result.current.startCheckout>>;
    await act(async () => {
      outcome = await result.current.startCheckout('coffee');
    });

    expect(outcome!.ok).toBe(false);
    expect(mockToastError).toHaveBeenCalled();
    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  it('shows toast and returns { ok: false } when checkout URL is missing', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([missingUrlMock]),
    });

    let outcome: Awaited<ReturnType<typeof result.current.startCheckout>>;
    await act(async () => {
      outcome = await result.current.startCheckout('coffee');
    });

    expect(outcome!.ok).toBe(false);
    expect(mockToastError).toHaveBeenCalled();
    expect(mockLocationAssign).not.toHaveBeenCalled();
  });

  it('tracks stripe_checkout_started event when checkout starts', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([successMock]),
    });

    await act(async () => {
      await result.current.startCheckout('coffee');
    });

    expect(mockTrackClientEvent).toHaveBeenCalledWith('stripe_checkout_started', {
      productKey: 'coffee',
    });
  });

  it('tracks stripe_checkout_error event on failure', async () => {
    const { result } = renderHook(() => useStripeCheckout(), {
      wrapper: wrapper([graphqlErrorMock]),
    });

    await act(async () => {
      await result.current.startCheckout('coffee');
    });

    expect(mockTrackClientEvent).toHaveBeenCalledWith(
      'stripe_checkout_error',
      expect.objectContaining({ productKey: 'coffee' })
    );
  });
});
