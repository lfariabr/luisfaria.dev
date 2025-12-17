# v2.0.0 — Activate Goggins Mode

# v2.0.0 — *Activate Goggins Mode* ✅  

### What’s New
- **Goggins Mode Mutation** (`activateGogginsMode`)  
  - Backend GraphQL mutation powered by OpenAI.  
  - Generates short, intense motivational screams for builders.  
  - Supports **18-** (clean, respectful tone) and **18+** (raw language, tough love).  
  - Enforced **Redis rate limiting**: 2 requests per email per 24h.  

- **Frontend Experience**  
  - Floating action button with subtle pulse to summon Goggins Mode.  
  - Sleek modal with email input + zod validation.  
  - AI response displayed with avatar + styled quote block.  
  - Actions: **Copy**, **Share** (Web Share API / social), and **Close**.  
  - Handles rate-limit gracefully with countdown timer + reset info.  
  - Persists email + last generated quote for smoother UX.  

- **Observability**  
  - Logs with hashed email, timestamp, and model used.  
  - Optional Discord webhook notifications (snippet only).  

### Tests ✅  
- **Backend**: Unit + integration tests for rate limiting, schema, and resolver.  
- **Frontend**: Component + page tests (happy path + rate-limited path).  
- All suites green (`npm run test`):  
  - Backend: 8/8 passed  
  - Frontend: 6/6 passed  

### Highlights
> “Goggins Mode” is now live — click the floating button, drop your email, and get a kick-in-the-ass message when you need it most. Discipline, ownership, action.  

---

### TL;DR Changelog
**Added**
- `activateGogginsMode` GraphQL mutation  
- Goggins FAB + Dialog modal (frontend)  
- Redis-backed rate limiting (2/day/email)  
- Observability logging + optional Discord webhook  

**Changed**
- Improved dialog visuals, avatars, and dark mode handling  

**Fixed**
- Rate limit countdown display in dark mode  