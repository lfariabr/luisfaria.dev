import Payment from '../../models/Payment';
import { UserRole } from '../../models/User';
import { Errors } from '../../utils/errors';

interface ResolverContext {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

export const paymentQueries = {
  payments: async (_: unknown, __: unknown, context: ResolverContext) => {
    if (!context.user) throw Errors.unauthenticated();
    if (context.user.role !== UserRole.ADMIN) throw Errors.forbidden('Admin only');
    return Payment.find().sort({ createdAt: -1 });
  },
};
