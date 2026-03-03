const DEFAULT_OG_IMAGE = 'https://luisfaria.dev/og-default.png';

export function stripMarkdown(input: string): string {
  return input.replace(/[#*_`\n]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildDescription(primary: string | undefined, fallback: string, max = 160): string {
  const raw = primary?.trim() ? primary : fallback;
  const normalized = stripMarkdown(raw);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

export function resolveOgImage(imageUrl?: string): string {
  if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
  return DEFAULT_OG_IMAGE;
}

export function sanitizeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
