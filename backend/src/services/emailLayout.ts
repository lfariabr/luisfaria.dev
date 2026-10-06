export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailLayoutInput {
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  signOff?: string;
}

export function renderEmailLayout({ heading, paragraphs, cta, signOff = '— Luis' }: EmailLayoutInput): string {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 12px;font-size:16px;color:#44403c">${escapeHtml(p)}</p>`)
    .join('');

  const button = cta
    ? `<p style="margin:20px 0">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#059669;color:#ffffff;font-weight:600;text-decoration:none">${escapeHtml(cta.label)}</a>
      </p>`
    : '';

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;background-color:#fafaf9;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-top:3px solid #10b981;border-radius:10px;padding:24px">
        <h1 style="margin:0 0 16px;font-size:22px;color:#1c1917">${escapeHtml(heading)}</h1>
        ${body}
        ${button}
        <p style="margin:20px 0 0;color:#78716c;font-size:14px">${escapeHtml(signOff)}</p>
        <p style="margin:4px 0 0;color:#a8a29e;font-size:12px">luisfaria.dev</p>
      </div>
    </div>
  `;
}
