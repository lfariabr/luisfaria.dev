// scripts/extract-pullups.ts
import fs from "fs";
import path from "path";

// Optional clipboard support: npm i clipboardy
// import clipboard from "clipboardy";

type PullUpMatch = {
  day?: number;
  lineNumber: number;
  text: string;          // the full original line
  perSession?: number;   // e.g., 50 from "pull ups 50 (...)"
  cumulative?: number;   // e.g., 750 from "(750/1500)"
  target?: number;       // e.g., 1500 from "(750/1500)"
};

function parseDay(line: string): number | undefined {
  // Matches lines like "Day 15" (case-insensitive)
  const m = line.match(/^\s*Day\s+(\d+)\s*$/i);
  return m ? Number(m[1]) : undefined;
}

function parsePullUpCounts(line: string): { perSession?: number; cumulative?: number; target?: number } {
  // Examples in your file:
  // - "Workout Quads 40m (55 pull ups (450/1500)"
  // - "Pull Ups + Grip Workout  + pull ups 105 (1105/1500)"
  // Strategy:
  // - per-session: first number immediately before or after "pull ups"
  // - cumulative/target: look for "(X/Y)" patterns
  const result: { perSession?: number; cumulative?: number; target?: number } = {};

  // Case-insensitive search for "pull ups" and an adjacent integer
  const perSessionRegex = /pull\s*ups[^0-9\-]*(-?\d+)|(-?\d+)\s*pull\s*ups/i;
  const matchPS = line.match(perSessionRegex);
  if (matchPS) {
    const n = matchPS[1] ?? matchPS[2];
    if (n) result.perSession = Number(n);
  }

  // Cumulative format like (1105/1500)
  const cumRegex = /\((\d+)\s*\/\s*(\d+)\)/;
  const matchCum = line.match(cumRegex);
  if (matchCum) {
    result.cumulative = Number(matchCum[1]);
    result.target = Number(matchCum[2]);
  }

  return result;
}

export function extractPullUps(md: string): PullUpMatch[] {
  const lines = md.split(/\r?\n/);

  let currentDay: number | undefined = undefined;
  const results: PullUpMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    // Track current day when encountered
    const maybeDay = parseDay(line.trim());
    if (maybeDay !== undefined) currentDay = maybeDay;

    // Look for "pull ups" anywhere on the line (case-insensitive)
    if (/pull\s*ups/i.test(line)) {
      const counts = parsePullUpCounts(line);
      results.push({
        day: currentDay,
        lineNumber,
        text: line,
        ...counts,
      });
    }
  }

  return results;
}

// Runner
async function main() {
  const filePath = path.resolve("/Users/luisfaria/Desktop/sEngineer/luisfaria/_docs/studying/pullup/context.md");
  const md = fs.readFileSync(filePath, "utf-8");

  const matches = extractPullUps(md);

  if (matches.length === 0) {
    console.log("No lines containing 'pull ups' were found.");
    return;
  }

  // 1) Print the full raw lines
  console.log("=== Full 'pull ups' lines ===");
  for (const m of matches) {
    const dayLabel = m.day ? `Day ${m.day}: ` : "";
    console.log(`${dayLabel}[L${m.lineNumber}] ${m.text}`);
  }

  // 2) Also print a compact table of parsed info (if your console supports console.table)
  console.log("\n=== Parsed summary ===");
  console.table(
    matches.map(m => ({
      day: m.day ?? "",
      line: m.lineNumber,
      perSession: m.perSession ?? "",
      cumulative: m.cumulative ?? "",
      target: m.target ?? "",
    }))
  );

  // 3) Optional: copy the full lines to clipboard for quick pasting elsewhere
  // const block = matches.map(m => `[Day ${m.day ?? "?"}] [L${m.lineNumber}] ${m.text}`).join("\n");
  // await clipboard.write(block);
  // console.log("\nCopied all matching lines to clipboard.");
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}