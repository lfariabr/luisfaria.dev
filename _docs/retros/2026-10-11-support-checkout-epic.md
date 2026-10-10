# Retro — Support checkout epic (#311), 6–9 Oct 2026

First full run of the Matt Pocock loop on this repo: `/grill-with-docs` on the Support FAB → epic #311 with children #312 #313 #314 → per-ticket breakdowns → tests red first → two-axis `/code-review` beside CodeRabbit → production cutover → verification written back into the docs. Three PRs merged (#315, #316, #317), v3.21.0–v3.21.2 released.

Method: the plugin's `retro` skill (still in its `in-progress` folder, so run by hand): session log parsed for tool mix, user turns, errors and reruns; repo checked for guardrails and steering files.

## Session shape

| | |
|---|---|
| Tool calls | 150 Bash, 13 Write, 8 Edit, 5 Agent, 7 browser, 0 Grep/Glob |
| Skills | grilling, domain-modeling, code-review (×2) |
| Red runs | 20, of which 4 were plain type errors found only by running Jest |
| User turns | 61 over four calendar days |

## Findings, by severity

### 1. Backend had no lint or typecheck guardrail → fixed in #323
No lint script, CI ran build + tests only, no pre-commit hook anywhere. Fix: backend ESLint (flat config), `lint` + `typecheck` scripts, CI lint step, `.githooks/pre-commit`. `no-explicit-any` ratcheted at 123 so new ones fail.

### 2. Standards live in a judgement doc pretending to be a rulebook → fixed in #330
The review used `CLAUDE.md` + `copilot-instructions.md` and flagged a resolver not wrapped in `createErrorHandler`. Mechanical rule → linter. Proposed: ESLint `no-restricted-syntax` on `new GraphQLError` in the backend, and a short `CODING_STANDARDS.md` for the judgement calls the `code-review` skill looks for by name.

### 3. Redis test dependency lived in agent memory, not the repo → fixed in #323
The agent knew about port 6381 from a saved memory, started Redis by hand, and saw `cookieAuthE2E` fail twice in a full run then pass alone; moved on without diagnosing. Fix: `npm test` pretest guard that starts Redis when the port is silent, and a line in `CLAUDE.md` naming the requirement and the suspected flake. Diagnosis of the flake is backlog.

### 4. `copilot-instructions.md` is sediment → fixed in #330
Called the "authoritative reference" by `CLAUDE.md`, yet it claims NextAuth.js (never in the code) and Next.js 14 (installed: 16). Two architecture sources of truth, one stale. Proposed: delete after moving any live judgement calls into the standards file.

### 5. Navigation pointers lagged the code → fixed in #323
`CLAUDE.md` omitted `notes/`, `pins/`, `stripe/`, `payments/` resolvers, the REST routes and three services; `CONTEXT.md` terms had no path. The agent re-surveyed the backend with ~8 reads at the start of each ticket. Fix: pointers added, `_Lives in_` per glossary term.

### 6. Tool economy, minor → open
Browser screenshot after the FAB restyle failed twice on viewport bounds and was abandoned. A review subagent hit `command not found: gh` (subagents get a different PATH). The nginx / DNS / ImprovMX cutover ran as pasted terminal output over many turns: the `wizard` skill's exact use case.

## Keep doing
Grill → epic + children → breakdown as spec → red first → two-axis review → verification in docs. Add `/handoff` at the end of each day on multi-day epics (day three opened with "remind me where we stopped").
