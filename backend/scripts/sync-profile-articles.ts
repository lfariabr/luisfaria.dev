#!/usr/bin/env ts-node
/**
 * Reads all .md files from _docs/devTo/ subdirectories and outputs
 * a JSON array of article entries matching the luis-profile.json schema.
 *
 * Usage: npx ts-node backend/scripts/sync-profile-articles.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DOCS_ROOT = path.resolve(__dirname, '../../_docs/devTo');

interface ArticleEntry {
  title: string;
  platform: string;
  published: string;
  language: string;
  term: string;
  summary: string;
  tech: string[];
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

function extractTags(content: string): string[] {
  // Match lines like "Tags: #foo #bar" or "Hashtags: #foo, #bar"
  const match = content.match(/^(?:Tags|Hashtags)[:\s]+(.+)$/im);
  if (!match) return [];
  return match[1]
    .split(/[,\s]+/)
    .filter((t) => t.startsWith('#'))
    .map((t) => t.replace(/^#/, ''));
}

function extractSummary(content: string): string {
  const lines = content.split('\n');
  let collecting = false;
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip metadata-like lines at the top
    if (!collecting) {
      if (
        trimmed === '' ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('---') ||
        trimmed.startsWith('![') ||
        /^(Tags|Hashtags|Published|Cover|Series|Canonical)[:\s]/i.test(trimmed)
      ) {
        continue;
      }
      collecting = true;
    }

    if (collecting) {
      if (trimmed === '' && paragraph.length > 0) break;
      if (trimmed.startsWith('#')) break;
      paragraph += (paragraph ? ' ' : '') + trimmed;
    }
  }

  // Truncate to ~2-3 sentences
  const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
  return sentences.slice(0, 3).join(' ').trim();
}

function termFromDir(dir: string): string {
  // e.g. "t1_2026", "t2_2025", "t3_2025"
  return path.basename(dir);
}

function scanArticles(): ArticleEntry[] {
  const articles: ArticleEntry[] = [];

  if (!fs.existsSync(DOCS_ROOT)) {
    console.error(`Directory not found: ${DOCS_ROOT}`);
    process.exit(1);
  }

  const subdirs = fs.readdirSync(DOCS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse(); // newest terms first

  for (const subdir of subdirs) {
    const dirPath = path.join(DOCS_ROOT, subdir);
    const term = termFromDir(dirPath);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const title = extractTitle(content);
      const tags = extractTags(content);
      const summary = extractSummary(content);

      articles.push({
        title,
        platform: 'dev.to',
        published: term.replace('t1_', 'T1 ').replace('t2_', 'T2 ').replace('t3_', 'T3 '),
        language: 'English',
        term,
        summary: summary || `Article about ${tags.join(', ') || title}`,
        tech: tags.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
      });
    }
  }

  return articles;
}

const articles = scanArticles();
console.log(JSON.stringify(articles, null, 2));
console.error(`\n✔ Found ${articles.length} articles across ${new Set(articles.map((a) => a.term)).size} terms`);
