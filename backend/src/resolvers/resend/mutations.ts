import { GraphQLError } from 'graphql';
import { sendGogginsEmail as sendGogginsEmailService } from '../../services/resendMailer';
import { Errors } from '../../utils/errors';

export const sendGogginsEmailMutation = async (
  _: unknown,
  args: { to: string; text: string; explicitMode?: boolean }
) => {
  try {
    const { data, error } = await sendGogginsEmailService(args.to, args.text, { explicitMode: args.explicitMode });
    if (error) {
      throw Errors.internal(typeof error === 'string' ? error : 'Failed to send email');
    }
    return Boolean(data);
  } catch (e: unknown) {
    // Already a GraphQL error (e.g. from above) — surface it as-is.
    if (e instanceof GraphQLError) throw e;
    throw Errors.internal(e instanceof Error ? e.message : 'Failed to send email');
  }
};
