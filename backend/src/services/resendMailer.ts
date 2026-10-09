// resendMailer.ts
import { Resend } from 'resend';
import config from '../config/config';
import { logger } from '../utils/logger';
import { escapeHtml, renderEmailLayout, type EmailLayoutInput } from './emailLayout';

const SUPPORT_SENDER = 'Luis Faria <contact@luisfaria.dev>';
const SUPPORT_REPLY_TO = 'contact@luisfaria.dev';

// Resend expects a string API key in the constructor
const resendApiKey = config.resendApiKey?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type SendEmailResult = {
  data: any | null;
  error: any | null;
};

export async function sendGogginsEmail(
  to: string,
  text: string,
  opts?: { explicitMode?: boolean }
): Promise<SendEmailResult> {
  if (process.env.NODE_ENV === 'test') {
    return { data: null, error: null };
  }
  if (!resend) {
    console.warn('[resendMailer] RESEND_API_KEY not set. Skipping email send.');
    return { data: null, error: null };
  }
  try {
    const subject = `Your Wake Up Call${opts?.explicitMode ? ' (Explicit)' : ''}!`;
    const safeText = escapeHtml(text);

    const { data, error } = await resend.emails.send({
      from: 'Goggins <goggins@luisfaria.dev>', // verified domain sender
      to,
      subject,
      html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0f172a;background-color:#f8fafc;padding:24px;border-radius:8px">
        <h1 style="margin:0 0 12px;font-size:24px;color:#0f172a">📢 Time to Wake the F*ck Up</h1>
        
        <p style="margin:0 0 12px;font-size:16px;color:#334155">
          You asked for it - no fluff, no excuses. Here's your dose of <strong>discipline and truth</strong>.
        </p>

        <blockquote style="margin:0;padding:16px 20px;border-left:4px solid #f97316;background:#f1f5f9;border-radius:6px">
          <p style="margin:0;font-size:16px;white-space:pre-wrap;color:#0f172a"><em>${safeText}</em></p>
        </blockquote>

        <p style="margin:20px 0 4px;color:#475569;font-size:14px">
          Now get back to building. No one's coming to save you.
        </p>
        
        <p style="margin:0;color:#64748b;font-size:13px">
          - Goggins Mode 🔥
        </p>
      </div>
    `,
    });

    if (error) {
      console.error('[resendMailer] Error sending email:', error);
      return { data: null, error };
    } else {
      console.log('[resendMailer] Email sent successfully:', data);
      return { data, error: null };
    }
  } catch (err: any) {
    console.error('[resendMailer] Error sending email:', err);
    return { data: null, error: err };
  }
}

interface SupportEmail {
  kind: string;
  to: string;
  subject: string;
  content: EmailLayoutInput;
}

async function sendSupportEmail({ kind, to, subject, content }: SupportEmail): Promise<SendEmailResult> {
  if (config.nodeEnv === 'test') {
    return { data: null, error: null };
  }
  if (!resend) {
    logger.warn('Support email skipped: RESEND_API_KEY is not set', { email: kind });
    return { data: null, error: null };
  }

  const { data, error } = await resend.emails.send({
    from: SUPPORT_SENDER,
    replyTo: SUPPORT_REPLY_TO,
    to,
    subject,
    html: renderEmailLayout(content),
  });

  if (error) {
    logger.error('Support email failed', { email: kind, error: String(error.message ?? error) });
    return { data: null, error };
  }
  return { data, error: null };
}

export function sendCoffeeThankYouEmail(to: string): Promise<SendEmailResult> {
  return sendSupportEmail({
    kind: 'coffee thank-you',
    to,
    subject: 'Thanks for the coffee ☕',
    content: {
      heading: 'Thanks for the coffee ☕',
      paragraphs: [
        'Your support just landed, and it genuinely makes my day.',
        'Coffee is what keeps the side projects, the write-ups and the build-in-public posts going. If you ever want to say hi or suggest something to build next, just reply to this email.',
      ],
      cta: { label: 'See what I’m building', url: config.frontendUrl },
    },
  });
}

export function sendMeetingBookingEmail(to: string, bookingUrl: string): Promise<SendEmailResult> {
  return sendSupportEmail({
    kind: 'meeting booking',
    to,
    subject: 'Book your session with Luis',
    content: {
      heading: 'Thanks — let’s find a time',
      paragraphs: [
        'Your payment for a consulting session went through. Thank you for trusting me with your time.',
        'Pick a slot that suits you using the link below. If none of the times work, or you want to share some context before we meet, just reply to this email.',
      ],
      cta: { label: 'Book your session', url: bookingUrl },
    },
  });
}
