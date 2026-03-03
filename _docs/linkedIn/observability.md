# LinkedIn Post — Observability on a Portfolio Site

Sentry pinged me on a Sunday morning.

23 errors. 1,721 transactions. Stack traces, breadcrumbs, and session replays on my side project: my own portfolio site.

I read it twice, not because production was burning, but because I had signal. Real numbers. A clear view of what happened after shipping.

Before: errors were abstract.
After: 17 backend errors with call stacks, 6 frontend errors with replays, and 1.4k frontend transactions tied to actual user flows.

To get here I layered observability in 4 parts:
1) health endpoints + uptime checks (Pulsetic),
2) Sentry on Express (backend),
3) Sentry on Next.js (frontend),
4) a cron-based server monitor that posts CPU/memory/disk alerts to Discord with cooldowns.

Recent example: during an SEO rollout, observability surfaced two important regressions fast:
- server/client boundary violation in a card component after moving pages to SSR,
- GraphQL endpoint mismatch causing build/runtime fetch failures.

Because errors were instrumented, fixes were straightforward and verifiable instead of guesswork.

The full stack costs $0.

This is why I build in public: instrument first, ship, listen, iterate.

Full walk-through in the comments.

#observability #sentry #webdev #pulsetic #buildinpublic
