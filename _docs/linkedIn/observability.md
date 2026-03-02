# LinkedIn Post — Observability on a Portfolio Site

The email from @Sentry landed on a Sunday morning.

23 errors. 1,721 transactions. Stack traces, breadcrumbs, session replays on my side project - my own portfolio site.

I read it twice, not because something was on fire, but because there were real numbers. A true view into what's happening after the code ships.

Before: errors were abstract. I knew they might exist.
After: 17 backend errors with call stacks. 6 frontend errors with session replays. 1.4k frontend transactions. I knew exactly what happened, when, and what the user was doing.

That's the difference between guessing and knowing.

To get here I built 4 layers: health endpoints for Pulsetic to ping (so I'd know if MongoDB went down, not just if the site went dark), Sentry on both the Express backend and Next.js frontend, and a cron script that watches CPU, memory, and disk and fires a Discord alert with a 30-minute cooldown so I'm not muted before breakfast.

The whole stack costs $0.

Moments like this remind me why building in public matters. You ship something, instrument it properly, and suddenly the code starts talking back. We stop guessing and start knowing.

Full article on the comments.

#observability #sentry #webdev #pulsetic #buildinpublic
