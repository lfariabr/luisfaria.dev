# 0002 — dev.to is where writing lives; the site reads it

**Status:** Accepted, 2026-11-17 ([#336](https://github.com/lfariabr/luisfaria.dev/issues/336), implemented in [#512](https://github.com/lfariabr/luisfaria.dev/issues/512))

## Context

What Luis publishes was spread over five places:

- **dev.to:** 36 Posts. The nav's "Writing" already links there.
- **MongoDB Articles** at `/articles`: 10 hand-made copies of Posts, the newest from June, not linked from the nav.
- **MongoDB Projects** at `/projects`: 11 entries, most written like Posts.
- **`CASE_STUDIES`** at `/work`, which is what the nav's "Work" shows.
- **`LATEST_WRITING`** on the homepage: a hand-kept list, so every new Post needed a pull request (#510).

## Decision

1. **dev.to is the source of truth for Posts.** Luis writes and publishes there.
2. **The site reads dev.to.** Latest writing fetches the newest Posts from the public API (`/api/articles?username=lfariaus`) on the server, cached and revalidated hourly. No API key is needed.
3. **The site never breaks because of dev.to.** A timeout, non-2xx response, unexpected shape or empty list renders the static `LATEST_WRITING` fallback and logs a warning.
4. **Articles stay as they are.** `/articles` and its MongoDB copies are kept, unsynced. This is accepted for now, not fixed.
5. **Projects are a separate decision** (#513).

## Rejected alternatives

- **Write in the site's admin and publish to dev.to through its API.** It would need a dev.to API key on the server, a sync for edits made on dev.to, and handling for publish failures. All of that duplicates dev.to's own editor to save a step Luis doesn't mind.
- **Keep the hand-kept homepage list.** It goes stale the day a Post goes out, and each update costs a pull request and a deploy.
- **A shared "publication" model for Projects and Articles.** It isn't needed to fix Latest writing, so it's deferred to #513.
