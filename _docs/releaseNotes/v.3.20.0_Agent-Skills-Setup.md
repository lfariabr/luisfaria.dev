# v3.20.0 — Agent Skills Setup

**Release date:** 2026-10-07
**Type:** Developer tooling (no user-facing change)

## What's New

- **Matt Pocock's engineering skills are part of the repo.** `.claude/settings.json` enables `mattpocock-skills@claude-plugins-official` at project scope, so any clone gets `/grill-with-docs`, `/to-spec`, `/implement`, `/tdd`, `/code-review`, `/triage` and the rest.
- **Per-repo skill config scaffolded** under `docs/agents/`: GitHub Issues as the tracker, the five default triage labels, and a single-context domain-doc layout (`CONTEXT.md` + `docs/adr/`, created lazily).
- **`CLAUDE.md` gained an `## Agent skills` section** pointing at those files.
- **Triage labels created on GitHub**: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human` (alongside the existing `wontfix`).

## Files Changed

| Area | Files |
|------|-------|
| Claude Code config | `.claude/settings.json` (new), `CLAUDE.md` |
| Skill config | `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md` (all new) |
| Docs | `_docs/featureBreakdown/v3.20-agent-skills-setup.md`, this file |

## Tests

- No application code changed; no test run required
- `claude plugins list` → ✅ plugin enabled, v1.2.3
- `gh label list` → ✅ five triage labels present

## Before / After

| Surface | Before | After |
|---|---|---|
| Plugin scope | User only (one machine) | Project (committed) + user |
| Issue tracker config for skills | None | `docs/agents/issue-tracker.md` (GitHub via `gh`) |
| Triage labels on GitHub | `wontfix` only | All five canonical labels |
| Domain docs layout | Undeclared | Single-context, lazy `CONTEXT.md` + `docs/adr/` |

## TL;DR Changelog

```
chore(agents): enable mattpocock-skills at repo scope and scaffold docs/agents (closes #309)
```
