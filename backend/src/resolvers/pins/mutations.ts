import Pin from '../../models/Pin';
import { Errors } from '../../utils/errors';
import { UserRole } from '../../models/User';
import { withPinErrorHandling } from './errorHandler';
import { pinInputSchema, type PinInput } from '../../validation/schemas/pin.schema';

interface ResolverContext {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

export const pinMutations = {
  createPin: async (_: unknown, { input }: { input: PinInput }, context: ResolverContext) => {
    if (!context.user) throw Errors.unauthenticated();
    if (context.user.role !== UserRole.ADMIN) throw Errors.forbidden('Admin only');
    // Re-parse with Zod so resolvers receive the trimmed/uppercased/transformed shape
    // even if shield validation was bypassed in tests, and so we never persist raw input.
    const parsed = await pinInputSchema.parseAsync(input);
    return withPinErrorHandling(
      () =>
        Pin.create({
          ...parsed,
          date: new Date(parsed.date),
        }),
      'createPin'
    );
  },
};
