#!/usr/bin/env ts-node
/**
 * SEO Audit Script — checks live pages and markdown content for SEO health.
 *
 * Check A: Fetches production pages from sitemap and validates meta tags.
 * Check B: Reads _docs/devTo/**\/*.md and validates content structure.
 *
 * Usage:
 *   npx ts-node backend/scripts/seo-audit.ts           # stdout report
 *   npx ts-node backend/scripts/seo-audit.ts --discord # post embed to Discord
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_URL = 'https://luisfaria.dev';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const DOCS_ROOT = path.resolve(__dirname, '../../_docs/devTo');
const PASS_THRESHOLD = 0.8; // 80% pass rate required
const CONCURRENCY = 5;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? '';
const USE_DISCORD = process.argv.includes('--discord');

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageResult {
  url: string;
  checks: {
    title: boolean;
    description: boolean;
    ogTitle: boolean;
    ogImage: boolean;
    jsonLd: boolean;
  };
  passing: boolean;
  error?: string;
}

interface MarkdownResult {
  file: string;
  checks: {
    h1Title: boolean;
    hasTags: boolean;
    wordCount: boolean;
    noDeadLinks: boolean;
  };
  passing: boolean;
  details: string[];
}

interface AuditReport {
  timestamp: string;
  pageAudit: {
    results: PageResult[];
    passed: number;
    total: number;
    score: number;
  };
  markdownAudit: {
    results: MarkdownResult[];
    passed: number;
    total: number;
    score: number;
  };
  overallScore: number;
  overallPassing: boolean;
}

// ─── Sitemap Parsing ──────────────────────────────────────────────────────────

async function fetchSitemap(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  const xml = await res.text();
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  const urls: string[] = [];
  for (const m of matches) {
    const url = m[1].trim();
    // Only audit article and project content pages (skip homepage, /about, etc.)
    if (url.includes('/articles/') || url.includes('/projects/')) {
      urls.push(url);
    }
  }
  return urls;
}

// ─── Live Page Audit (Check A) ────────────────────────────────────────────────

function checkTitle(html: string): boolean {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match) return false;
  const title = match[1].trim();
  // Fail if title is the generic site title with no specific page content
  return title.length > 0 && title !== 'Luis Faria | Senior Software Engineer';
}

function checkMetaDescription(html: string): boolean {
  return /<meta\s[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html) ||
    /<meta\s[^>]*content=["'][^"']+["'][^>]*name=["']description["']/i.test(html);
}

function checkOgTitle(html: string): boolean {
  return /<meta\s[^>]*property=["']og:title["'][^>]*content=["'][^"']+["']/i.test(html) ||
    /<meta\s[^>]*content=["'][^"']+["'][^>]*property=["']og:title["']/i.test(html);
}

function checkOgImage(html: string): boolean {
  return /<meta\s[^>]*property=["']og:image["'][^>]*content=["'][^"']+["']/i.test(html) ||
    /<meta\s[^>]*content=["'][^"']+["'][^>]*property=["']og:image["']/i.test(html);
}

function checkJsonLd(html: string): boolean {
  return /<script\s[^>]*type=["']application\/ld\+json["']/i.test(html);
}

async function auditPage(url: string): Promise<PageResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SEO-Audit-Bot/1.0 (+https://luisfaria.dev)' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return {
        url,
        checks: { title: false, description: false, ogTitle: false, ogImage: false, jsonLd: false },
        passing: false,
        error: `HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    const checks = {
      title: checkTitle(html),
      description: checkMetaDescription(html),
      ogTitle: checkOgTitle(html),
      ogImage: checkOgImage(html),
      jsonLd: checkJsonLd(html),
    };
    const passing = Object.values(checks).every(Boolean);
    return { url, checks, passing };
  } catch (err) {
    return {
      url,
      checks: { title: false, description: false, ogTitle: false, ogImage: false, jsonLd: false },
      passing: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runBatched<T>(items: T[], fn: (item: T) => Promise<PageResult>, concurrency: number): Promise<PageResult[]> {
  const results: PageResult[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ─── Markdown Audit (Check B) ─────────────────────────────────────────────────

function countWords(content: string): number {
  // Strip markdown syntax before counting
  const stripped = content
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '')         // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[.*?\]\(.*?\)/g, '')  // links (keep text)
    .replace(/[#*_>~\-|]/g, ' ')     // markdown symbols
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}

function checkH1(content: string): boolean {
  return /^#\s+\S+/m.test(content);
}

function checkTagsLine(content: string): { ok: boolean; count: number } {
  const match = content.match(/^(?:\*\*)?(?:Tags|Hashtags)[:\s*]+(.+)$/im);
  if (!match) return { ok: false, count: 0 };
  const tags = match[1]
    .split(/[,\s]+/)
    .filter((t) => t.replace(/\*\*/g, '').startsWith('#'));
  return { ok: tags.length >= 3, count: tags.length };
}

function checkRelativeLinks(content: string, filePath: string): string[] {
  const broken: string[] = [];
  const dir = path.dirname(filePath);
  const linkRegex = /\[.*?\]\((\.\/[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(content)) !== null) {
    const linkTarget = m[1];
    const resolved = path.resolve(dir, linkTarget);
    if (!fs.existsSync(resolved)) {
      broken.push(linkTarget);
    }
  }
  return broken;
}

function auditMarkdown(filePath: string): MarkdownResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(DOCS_ROOT, filePath);
  const details: string[] = [];

  const h1Ok = checkH1(content);
  const { ok: tagsOk, count: tagCount } = checkTagsLine(content);
  const words = countWords(content);
  const wordCountOk = words >= 300;
  const brokenLinks = checkRelativeLinks(content, filePath);
  const noDeadLinks = brokenLinks.length === 0;

  if (!h1Ok) details.push('missing H1 title');
  if (!tagsOk) details.push(`tags: found ${tagCount}, need ≥ 3`);
  if (!wordCountOk) details.push(`word count: ${words} (need ≥ 300)`);
  if (!noDeadLinks) details.push(`broken links: ${brokenLinks.join(', ')}`);

  const checks = { h1Title: h1Ok, hasTags: tagsOk, wordCount: wordCountOk, noDeadLinks };
  const passing = Object.values(checks).every(Boolean);
  return { file: fileName, checks, passing, details };
}

function scanMarkdownFiles(): MarkdownResult[] {
  if (!fs.existsSync(DOCS_ROOT)) {
    console.error(`Docs directory not found: ${DOCS_ROOT}`);
    return [];
  }

  const files: string[] = [];
  const subdirs = fs.readdirSync(DOCS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(DOCS_ROOT, d.name));

  for (const dir of subdirs) {
    const mdFiles = fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(dir, f));
    files.push(...mdFiles);
  }

  return files.map(auditMarkdown);
}

// ─── Report Formatting ────────────────────────────────────────────────────────

function formatStdout(report: AuditReport): void {
  const { pageAudit, markdownAudit, overallScore, overallPassing } = report;

  console.log('\n═══════════════════════════════════════════');
  console.log('  SEO Audit Report');
  console.log(`  ${report.timestamp}`);
  console.log('═══════════════════════════════════════════\n');

  // Check A: Live pages
  console.log('── CHECK A: Live Page Audit ────────────────');
  for (const r of pageAudit.results) {
    const icon = r.passing ? '✅' : '❌';
    const shortUrl = r.url.replace(SITE_URL, '');
    if (r.error) {
      console.log(`  ${icon} ${shortUrl}  [ERROR: ${r.error}]`);
    } else {
      const failedChecks = Object.entries(r.checks)
        .filter(([, v]) => !v)
        .map(([k]) => k);
      const detail = failedChecks.length ? `  → missing: ${failedChecks.join(', ')}` : '';
      console.log(`  ${icon} ${shortUrl}${detail}`);
    }
  }
  console.log(`\n  Score: ${pageAudit.passed}/${pageAudit.total} pages passing (${Math.round(pageAudit.score * 100)}%)\n`);

  // Check B: Markdown
  console.log('── CHECK B: Markdown Content Audit ─────────');
  for (const r of markdownAudit.results) {
    const icon = r.passing ? '✅' : '❌';
    const detail = r.details.length ? `  → ${r.details.join('; ')}` : '';
    console.log(`  ${icon} ${r.file}${detail}`);
  }
  console.log(`\n  Score: ${markdownAudit.passed}/${markdownAudit.total} files passing (${Math.round(markdownAudit.score * 100)}%)\n`);

  // Overall
  const overallIcon = overallPassing ? '✅' : '❌';
  console.log('── Overall ─────────────────────────────────');
  console.log(`  ${overallIcon} Overall score: ${Math.round(overallScore * 100)}% (threshold: ${PASS_THRESHOLD * 100}%)`);
  console.log('═══════════════════════════════════════════\n');
}

async function postDiscord(report: AuditReport): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('[WARN] DISCORD_WEBHOOK_URL not set — skipping Discord notification');
    return;
  }

  const { pageAudit, markdownAudit, overallScore, overallPassing } = report;
  const color = overallPassing ? 0x00c853 : 0xff1744;
  const statusIcon = overallPassing ? '✅' : '❌';

  // Build field values (Discord limits: 1024 chars per field)
  const pageLines = pageAudit.results.map((r) => {
    const icon = r.passing ? '✅' : '❌';
    const shortUrl = r.url.replace(SITE_URL, '') || '/';
    if (r.error) return `${icon} \`${shortUrl}\` — ${r.error}`;
    const failed = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k);
    return failed.length
      ? `${icon} \`${shortUrl}\` — missing: ${failed.join(', ')}`
      : `${icon} \`${shortUrl}\``;
  });

  const mdLines = markdownAudit.results.map((r) => {
    const icon = r.passing ? '✅' : '❌';
    return r.details.length
      ? `${icon} \`${r.file}\` — ${r.details.join('; ')}`
      : `${icon} \`${r.file}\``;
  });

  // Truncate to fit Discord limits
  const truncate = (lines: string[], max = 1000): string => {
    let out = lines.join('\n');
    if (out.length > max) out = out.slice(0, max - 3) + '...';
    return out || '_No items_';
  };

  const payload = {
    embeds: [
      {
        title: `${statusIcon} SEO Audit — ${Math.round(overallScore * 100)}% overall`,
        color,
        fields: [
          {
            name: `Live Pages  (${pageAudit.passed}/${pageAudit.total})`,
            value: truncate(pageLines),
            inline: false,
          },
          {
            name: `Markdown Files  (${markdownAudit.passed}/${markdownAudit.total})`,
            value: truncate(mdLines),
            inline: false,
          },
        ],
        footer: { text: `luisfaria.dev · ${report.timestamp}` },
      },
    ],
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} — ${body}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const timestamp = new Date().toISOString();

  // Check A: Live page audit
  let pageResults: PageResult[] = [];
  try {
    console.error('Fetching sitemap...');
    const urls = await fetchSitemap();
    console.error(`Auditing ${urls.length} page(s)...`);
    pageResults = await runBatched(urls, auditPage, CONCURRENCY);
  } catch (err) {
    console.error(`[ERROR] Page audit failed: ${err instanceof Error ? err.message : err}`);
  }

  // Check B: Markdown audit
  console.error('Scanning markdown files...');
  const mdResults = scanMarkdownFiles();

  // Scores
  const pagePassed = pageResults.filter((r) => r.passing).length;
  const mdPassed = mdResults.filter((r) => r.passing).length;
  const pageScore = pageResults.length > 0 ? pagePassed / pageResults.length : 1;
  const mdScore = mdResults.length > 0 ? mdPassed / mdResults.length : 1;
  const overallScore = pageResults.length + mdResults.length > 0
    ? (pagePassed + mdPassed) / (pageResults.length + mdResults.length)
    : 1;
  const overallPassing = overallScore >= PASS_THRESHOLD;

  const report: AuditReport = {
    timestamp,
    pageAudit: { results: pageResults, passed: pagePassed, total: pageResults.length, score: pageScore },
    markdownAudit: { results: mdResults, passed: mdPassed, total: mdResults.length, score: mdScore },
    overallScore,
    overallPassing,
  };

  // Output
  if (USE_DISCORD) {
    await postDiscord(report);
    console.error(`Discord report sent. Overall score: ${Math.round(overallScore * 100)}%`);
  } else {
    formatStdout(report);
  }

  // Exit with non-zero if below threshold (for CI enforcement)
  if (!overallPassing) {
    console.error(`\n[FAIL] Overall score ${Math.round(overallScore * 100)}% is below threshold ${PASS_THRESHOLD * 100}%`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
