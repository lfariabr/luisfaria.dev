import Pin from '../../models/Pin';
import { Errors } from '../../utils/errors';
import { UserRole } from '../../models/User';
import { GraphQLError } from 'graphql';
import { createErrorHandler } from '../../utils/errors';
import {
  isPinServiceError,
  mapPinErrorCode,
  toPinServiceError,
  type PinErrorCode,
  type PinServiceError,
} from './errorHandler';
import config from '../../config/config';

interface ResolverContext {
  user?: {
    id: string;
    role: UserRole;
  } | null;
}

const canViewRelationshipPins = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.PARTNER;

const withPinResolverErrorHandling = createErrorHandler<PinErrorCode, PinServiceError>(
  mapPinErrorCode,
  isPinServiceError,
  'Unable to process pins request'
);

const runPinResolver = <T>(operationName: string, operation: () => Promise<T>): Promise<T> =>
  withPinResolverErrorHandling(async () => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof GraphQLError || isPinServiceError(error)) throw error;
      throw toPinServiceError(error);
    }
  }, operationName);

export const pinQueries = {
  pins: async (_: unknown, __: unknown, context: ResolverContext) => runPinResolver('pins', async () => {
    if (!context.user) throw Errors.unauthenticated();
    if (!canViewRelationshipPins(context.user.role)) throw Errors.forbidden('Admin or partner only');
    return await Pin.find().sort({ date: -1 });
  }),

  relationshipHomeLocation: async (_: unknown, __: unknown, context: ResolverContext) => runPinResolver('relationshipHomeLocation', async () => {
    if (!context.user) throw Errors.unauthenticated();
    if (!canViewRelationshipPins(context.user.role)) throw Errors.forbidden('Admin or partner only');
    return config.relationshipHome;
  }),
};
