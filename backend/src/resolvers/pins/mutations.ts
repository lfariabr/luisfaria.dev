import Pin from '../../models/Pin';
import { Errors } from '../../utils/errors';
import { UserRole } from '../../models/User';
import { withPinErrorHandling } from './errorHandler';
import type { PinInput } from '../../validation/schemas/pin.schema';

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
    return withPinErrorHandling(
      () =>
        Pin.create({
          ...input,
          placeName: input.placeName.trim(),
          date: new Date(input.date),
        }),
      'createPin'
    );
  },
};
