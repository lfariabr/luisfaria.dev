// resendMailer.ts
import { Resend } from 'resend';
import config from '../config/config';

// Resend expects a string API key in the constructor
const resendApiKey = config.resendApiKey?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type SendEmailResult = {
  data: any | null;
  error: any | null;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
          You asked for it — no fluff, no excuses. Here's your dose of <strong>discipline and truth</strong>.
        </p>

        <blockquote style="margin:0;padding:16px 20px;border-left:4px solid #f97316;background:#f1f5f9;border-radius:6px">
          <p style="margin:0;font-size:16px;white-space:pre-wrap;color:#0f172a"><em>${safeText}</em></p>
        </blockquote>

        <p style="margin:20px 0 4px;color:#475569;font-size:14px">
          Now get back to building. No one's coming to save you.
        </p>
        
        <p style="margin:0;color:#64748b;font-size:13px">
          — Goggins Mode 🔥
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