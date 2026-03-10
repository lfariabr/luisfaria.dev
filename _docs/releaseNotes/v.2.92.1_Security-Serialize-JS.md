# v2.92.1 — Security Patch: serialize-javascript RCE

**Release date:** 2026-03-04
**Type:** Security patch

---

## What's New

- **CVE patch:** Forced `serialize-javascript` to `7.0.3` across the entire frontend dependency tree via npm `overrides`, closing Dependabot alert #29
- **Zero API changes:** v7.0.3 is a pure security patch; no runtime behavior changed
- **Build verified:** `npm run build` and `npm test` pass cleanly with the override in place

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/package.json` | Added `"overrides": { "serialize-javascript": "7.0.3" }` |
| `frontend/package-lock.json` | Regenerated — all instances resolve to `7.0.3` |
| `_docs/featureBreakdown/v2.92.1-security-serialize-javascript.md` | New doc |
| `_docs/releaseNotes/v.2.92.1_Security-Serialize-JS.md` | This file |

---

## Tests

| Suite | Result |
|-------|--------|
| `npm audit` | 0 vulnerabilities |
| `npm ls serialize-javascript` | All instances `7.0.3 overridden` |
| Frontend unit tests | Pass |

---

## Before / After

| | Before | After |
|---|--------|-------|
| `serialize-javascript` version | `6.0.2` (vulnerable) | `7.0.3` (patched) |
| `npm audit` result | High/critical CVE present | `found 0 vulnerabilities` |
| Build status | Passing (but vulnerable) | Passing |

---

## TL;DR Changelog

```
fix(security): force serialize-javascript 7.0.3 via npm overrides (closes #29)
```

Dependabot #29 flagged `serialize-javascript` <= 7.0.2 for RCE via malformed `RegExp`/`Date` serialization. A direct upgrade was blocked by `terser-webpack-plugin@5.3.16`'s `^6.0.2` constraint. Added npm `overrides` to `frontend/package.json` to force the patched version everywhere.
