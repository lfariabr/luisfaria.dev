import { createErrorHandler, ErrorCodes, type ServiceError } from '../../utils/errors';

type NotesErrorCode = 'DATABASE_ERROR';

interface NotesServiceError extends ServiceError {
  code: NotesErrorCode;
}

const mapNotesErrorCode = () => ErrorCodes.INTERNAL_SERVER_ERROR;

const isNotesServiceError = (error: unknown): error is NotesServiceError =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'DATABASE_ERROR'
  );

const withNotesErrorHandlingBase = createErrorHandler<NotesErrorCode, NotesServiceError>(
  mapNotesErrorCode,
  isNotesServiceError,
  'Unable to process notes request'
);

const toNotesServiceError = (error: unknown): NotesServiceError => {
  const source = error instanceof Error ? error : new Error('Unknown notes error');
  const wrapped = new Error(source.message) as NotesServiceError;
  wrapped.code = 'DATABASE_ERROR';
  wrapped.details = {
    originalName: (error as { name?: unknown })?.name,
  };
  return wrapped;
};

export const withNotesErrorHandling = async <T>(operation: () => Promise<T>, operationName: string) =>
  withNotesErrorHandlingBase(async () => {
    try {
      return await operation();
    } catch (error) {
      if (isNotesServiceError(error)) throw error;
      throw toNotesServiceError(error);
    }
  }, operationName);
