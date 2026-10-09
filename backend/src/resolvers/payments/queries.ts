import Payment from '../../models/Payment';
import { UserRole } from '../../models/User';
import { isStripeServiceError, mapStripeErrorCode } from '../../services/stripe';
import { createErrorHandler, Errors } from '../../utils/errors';

interface ResolverContext {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

const withPaymentErrorHandling = createErrorHandler(
  mapStripeErrorCode,
  isStripeServiceError,
  'Unable to load payments'
);

export const paymentQueries = {
  payments: async (_: unknown, __: unknown, context: ResolverContext) =>
    withPaymentErrorHandling(async () => {
      if (!context.user) throw Errors.unauthenticated();
      if (context.user.role !== UserRole.ADMIN) throw Errors.forbidden('Admin only');
      return Payment.find().sort({ createdAt: -1 });
    }, 'payments'),
};
