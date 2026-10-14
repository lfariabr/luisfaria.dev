import Pin from '../../models/Pin';
import { Errors } from '../../utils/errors';
import { UserRole } from '../../models/User';
import { logger } from '../../utils/logger';
import { withPinErrorHandling } from './errorHandler';
import {
  pinIdSchema,
  pinInputSchema,
  pinUpdateSchema,
  type PinInput,
  type PinUpdateInput,
} from '../../validation/schemas/pin.schema';

interface ResolverContext {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

type Actor = NonNullable<ResolverContext['user']>;

// Shield enforces these first; the resolvers check again so a bypassed shield never writes.
const requireWriter = (context: ResolverContext): Actor => {
  if (!context.user) throw Errors.unauthenticated();
  if (context.user.role !== UserRole.ADMIN && context.user.role !== UserRole.PARTNER) {
    throw Errors.forbidden('Admin or partner only');
  }
  return context.user;
};

const requireAdmin = (context: ResolverContext): Actor => {
  if (!context.user) throw Errors.unauthenticated();
  if (context.user.role !== UserRole.ADMIN) throw Errors.forbidden('Admin only');
  return context.user;
};

const parseId = (id: string) => {
  const result = pinIdSchema.safeParse(id);
  if (!result.success) throw Errors.badInput('Invalid pin id');
  return result.data;
};

export const pinMutations = {
  createPin: async (_: unknown, { input }: { input: PinInput }, context: ResolverContext) => {
    const actor = requireWriter(context);
    // Re-parse with Zod so resolvers receive the trimmed/uppercased/transformed shape
    // even if shield validation was bypassed in tests, and so we never persist raw input.
    const parsed = await pinInputSchema.parseAsync(input);
    const pin = await withPinErrorHandling(
      () => Pin.create({ ...parsed, date: new Date(parsed.date) }),
      'createPin'
    );
    logger.info('Pin created', { userId: actor.id, pinId: pin.id });
    return pin;
  },

  updatePin: async (
    _: unknown,
    { id, input }: { id: string; input: PinUpdateInput },
    context: ResolverContext
  ) => {
    const actor = requireWriter(context);
    const pinId = parseId(id);
    const parsed = await pinUpdateSchema.parseAsync(input);
    const update: Record<string, unknown> = { ...parsed };
    if (parsed.date) update.date = new Date(parsed.date);

    const pin = await withPinErrorHandling(
      () => Pin.findByIdAndUpdate(pinId, { $set: update }, { new: true, runValidators: true }),
      'updatePin'
    );
    if (!pin) throw Errors.notFound('Pin');
    logger.info('Pin updated', { userId: actor.id, pinId, fields: Object.keys(update) });
    return pin;
  },

  deletePin: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
    const actor = requireAdmin(context);
    const pinId = parseId(id);
    const pin = await withPinErrorHandling(() => Pin.findByIdAndDelete(pinId), 'deletePin');
    if (!pin) throw Errors.notFound('Pin');
    logger.info('Pin deleted', { userId: actor.id, pinId });
    return true;
  },
};
