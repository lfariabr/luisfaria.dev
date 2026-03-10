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

  const startCheckout = async (productKey: StripeProductKey, email?: string) => {
    trackClientEvent('stripe_checkout_started', { productKey });

    try {
      const { data } = await createSession({
        variables: {
          input: {
            productKey,
            email: email?.trim() || undefined,
          },
        },
      });

      const url = data?.createCheckoutSession?.url;
      if (!url) {
        throw new Error('Checkout URL missing');
      }

      window.location.assign(url);
      return true;
    } catch (error) {
      const errorMessage = getCheckoutErrorMessage(error);
      trackClientEvent('stripe_checkout_error', {
        productKey,
        message: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    startCheckout,
    loading,
  };
}
