'use client';

import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CREATE_CHECKOUT_SESSION } from '@/lib/graphql/mutations/stripe.mutations';
import type {
  CreateCheckoutSessionData,
  CreateCheckoutSessionVariables,
  StripeProductKey,
} from '@/lib/graphql/types/stripe.types';
import { trackClientEvent } from '@/utils/analytics';

interface CheckoutStartResult {
  ok: boolean;
  errorMessage?: string;
}

function getCheckoutErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Unable to start checkout. Please try again.';
  }

  const apolloLikeError = error as {
    graphQLErrors?: Array<{ message?: string }>;
    networkError?: { message?: string };
    message?: string;
  };

  return (
    apolloLikeError.graphQLErrors?.[0]?.message ||
    apolloLikeError.networkError?.message ||
    apolloLikeError.message ||
    'Unable to start checkout. Please try again.'
  );
}

export function useStripeCheckout() {
  const [createSession, { loading }] = useMutation<
    CreateCheckoutSessionData,
    CreateCheckoutSessionVariables
  >(CREATE_CHECKOUT_SESSION);

  const startCheckout = async (
    productKey: StripeProductKey,
    email?: string
  ): Promise<CheckoutStartResult> => {
    trackClientEvent('stripe_checkout_started', { productKey });

    const returnUrl = typeof window !== 'undefined' ? window.location.href : undefined;

    try {
      const { data, errors } = await createSession({
        variables: {
          input: {
            productKey,
            email: email?.trim() || undefined,
            returnUrl,
          },
        },
        errorPolicy: 'all',
      });

      if (errors?.length) {
        throw errors[0];
      }

      const url = data?.createCheckoutSession?.url;
      if (!url) {
        throw new Error('Checkout URL missing');
      }

      window.location.assign(url);
      return { ok: true };
    } catch (error) {
      const errorMessage = getCheckoutErrorMessage(error);
      trackClientEvent('stripe_checkout_error', {
        productKey,
        message: errorMessage,
      });
      toast.error(errorMessage);
      return {
        ok: false,
        errorMessage,
      };
    }
  };

  return {
    startCheckout,
    loading,
  };
}
