# v2.9.0 — *Chatbot Knowledge Base Upgrade* 🧠

### What's New

- **Enriched Knowledge Base (20 articles)**
  - Expanded `luis-profile.json` from 9 metadata-only entries to 20 fully enriched articles
  - Each article now includes `summary` (2-3 sentences), `tech[]` (key technologies), and `term` (academic period)
  - Coverage across 3 terms: t1_2026 (4), t2_2025 (11), t3_2025 (5)

- **2026 Career Milestone**
  - Added St Catherine's School Sydney — Data Analyst role to experience timeline
  - Updated `current_focus` to reflect the Data Analyst position alongside Master's studies
  - Added `T-SQL` to languages, `SQL Server` to databases, `GitHub Actions` to devops

- **Structured System Prompt**
  - Replaced raw JSON dump with `buildProfileContext()` — structured sections for Bio, Career Timeline, Projects, Articles, Skills, Education
  - Model now references specific articles by title when answering related questions
  - Career presented as a narrative progression: agency TPM → healthcare SE → data analyst + Master's student
  - Concise markdown formatting enforced (bullets, short paragraphs, no walls of text)

- **Content Sync Script**
  - New `backend/scripts/sync-profile-articles.ts` reads all `.md` files from `_docs/devTo/`
  - Extracts title, tags, and first paragraph as summary
  - Outputs JSON to stdout for review before updating the profile

### Files Changed

| File | Change |
|------|--------|
| `backend/src/data/luis-profile.json` | Enriched articles (9 → 20), 2026 experience, updated skills |
| `backend/src/services/openai.ts` | Structured prompt builder, article-aware instructions |
| `backend/scripts/sync-profile-articles.ts` | New sync script for article discovery |
| `_docs/featureBreakdown/v3.1-chatbot-knowledge-upgrade.md` | Feature breakdown doc |

### Tests ✅

- **Backend**: 192/192 tests passed across 14 suites
- **Build**: TypeScript compiles cleanly
- **Sync Script**: Discovered all 15 markdown articles across 3 terms

### Before / After

| Scenario | Before | After |
|----------|--------|-------|
| "Tell me about the CI/CD article" | Generic or no answer | Summarizes the pipeline article with tech stack |
| "What's Luis doing now?" | References Master's only | Data Analyst at St Catherine's + Master's |
| "Does Luis know SQL Server?" | Not in skills | Yes, with article reference |
| Article count in context | 9 (title/date only) | 20 (with summaries and tech) |
| Prompt structure | Raw JSON blob | Sectioned markdown (Bio, Timeline, Projects, Articles, Skills) |

### Configuration

No new environment variables required. The enriched profile is loaded at build time from `luis-profile.json`.

---

### TL;DR Changelog

**Added**
- `backend/scripts/sync-profile-articles.ts` — article sync utility
- `_docs/featureBreakdown/v3.1-chatbot-knowledge-upgrade.md` — feature spec
- 11 new article entries with summaries and tech arrays
- St Catherine's School Sydney experience entry (2026)
- `T-SQL`, `SQL Server`, `GitHub Actions`, `Matplotlib`, `Plotly` to skills

**Changed**
- `backend/src/data/luis-profile.json` — enriched from 9 to 20 articles, updated `current_focus` and `summary`
- `backend/src/services/openai.ts` — `getSystemPrompt()` now uses structured `buildProfileContext()` with article-aware instructions

**Deferred**
- Conversation history (multi-turn context)
- Article deep-linking (dev.to URLs in responses)
- RAG pipeline for larger knowledge bases
- Model upgrade from `gpt-3.5-turbo` to `gpt-4o-mini`

---

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.6.0...v2.9.0