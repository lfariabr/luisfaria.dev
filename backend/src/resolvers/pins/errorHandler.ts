import { GraphQLError } from 'graphql';
import { createErrorHandler, ErrorCodes, type ServiceError } from '../../utils/errors';

type PinErrorCode = 'DATABASE_ERROR';

interface PinServiceError extends ServiceError {
  code: PinErrorCode;
}

const mapPinErrorCode = () => ErrorCodes.INTERNAL_SERVER_ERROR;

const isPinServiceError = (error: unknown): error is PinServiceError =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'DATABASE_ERROR'
  );

const withPinErrorHandlingBase = createErrorHandler<PinErrorCode, PinServiceError>(
  mapPinErrorCode,
  isPinServiceError,
  'Unable to process pins request'
);

const toPinServiceError = (error: unknown): PinServiceError => {
  const source = error instanceof Error ? error : new Error('Unknown pins error');
  const wrapped = new Error(source.message) as PinServiceError;
  wrapped.code = 'DATABASE_ERROR';
  wrapped.details = {
    originalName: (error as { name?: unknown })?.name,
  };
  return wrapped;
};

export const withPinErrorHandling = async <T>(operation: () => Promise<T>, operationName: string) =>
  withPinErrorHandlingBase(async () => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof GraphQLError || isPinServiceError(error)) throw error;
      throw toPinServiceError(error);
    }
  }, operationName);
