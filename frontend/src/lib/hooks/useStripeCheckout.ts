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
    } catch (error) {
      trackClientEvent('stripe_checkout_error', {
        productKey,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Unable to start checkout. Please try again.');
    }
  };

  return {
    startCheckout,
    loading,
  };
}
