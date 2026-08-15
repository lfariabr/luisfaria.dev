import Pin from '../../models/Pin';
import { Errors } from '../../utils/errors';
import { UserRole } from '../../models/User';
import { withPinErrorHandling } from './errorHandler';
import config from '../../config/config';

interface ResolverContext {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

const canViewRelationshipPins = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.PARTNER;

export const pinQueries = {
  pins: async (_: unknown, __: unknown, context: ResolverContext) => {
    if (!context.user) throw Errors.unauthenticated();
    if (!canViewRelationshipPins(context.user.role)) throw Errors.forbidden('Admin or partner only');
    return withPinErrorHandling(() => Pin.find().sort({ date: -1 }), 'pins');
  },

  relationshipHomeLocation: async (_: unknown, __: unknown, context: ResolverContext) => {
    if (!context.user) throw Errors.unauthenticated();
    if (!canViewRelationshipPins(context.user.role)) throw Errors.forbidden('Admin or partner only');
    return config.relationshipHome;
  },
};
