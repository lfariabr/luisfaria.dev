<!-- DRAFT, not for publication. Hold until after the FT conversion conversation; show Lucas first. -->
<!-- Numbers measured between the 0.2.0 cut (30a9185b, 31 Aug 2026) and the 0.9.9 cut (2fe938b2, 30 Sep 2026). -->

# 0.2.0 to 0.9.9 in 30 days: five agent roles, one owner, and a merge word nobody gets for free

**Tags:** `ai` `softwareengineering` `codereview` `buildinpublic`

**Between 31 August and 30 September 2026, a parent portal built on children's data went from version 0.2.0 to 0.9.9: 953 merges, 94,229 lines of application source, 152,816 lines of tests, 23,229 lines of SQL. I did not type most of that code. I designed the system that did, and I kept the decisions it is not allowed to make. This is how that system works, and the night it caught its own mistake.**

---

## The month in one table

The [previous post](https://dev.to/lfariabr) covered the merge gate that replaced a CI bill. This one is about the people in the loop, most of whom are not people.

| | `0.2.0` (31 Aug) | `0.9.9` (30 Sep) |
|---|---:|---:|
| Source files under `web/src` | 280 | 733 |
| Test files | 180 | 727 |
| Runtime tests passing at the cut | not recorded | 10,761 |
| API route handlers / pages | 35 / 19 | 64 / 56 |
| SQL files under `web/sql` | 12 | 60 |

The version lines, not the individual cuts, tell the product story:

| Line | What a parent or a staff member got |
|---|---|
| `0.2` | A parent could submit data for the first time: drafts, then an immutable submission |
| `0.3` | A staff area on real directory roles, the forms families, medical attachments |
| `0.4`, `0.5` | Never packaged. Both were closed on the go-live day and shipped inside `0.6` |
| `0.6` | Attachment virus scanning, and the go-live package itself |
| `0.7` | Notifications: real families received e-mails from an outbox |
| `0.8` | The UX release: dark theme, a help centre, a feedback channel |
| `0.9` | The staff review area for the enrolment forms |

---

## Five roles and one owner

Each role is an agent with a written contract: what it may touch, what it must produce, and what it may never do. The contracts are plain Markdown in the repository, versioned like code.

| Role | Does | Never does |
|---|---|---|
| **CHIEF** | sequences the work, briefs the lanes, runs the merge train, keeps the delivery record | writes product code |
| **TIAO** | implements backend, tests, refactors | reviews or merges its own work |
| **CRAFT** | UX, copy, accessibility, UI tests | changes a data boundary |
| **GATE** | reviews the exact head: correctness, security, privacy, regressions | edits a file; it is read-only |
| **PO** | the final verdict: reads the diff *and* every comment, checks each raised item was closed | edits a file; it is read-only |

And one role that is not an agent. **I own the things a mistake there cannot be undone from:** the product scope, the version cut, the install on the school's server, the rollback, and any change to what a parent is allowed to see. Ordinary merges are delegated to CHIEF in writing, per briefing. A version cut waits for me.

The design principle is the oldest one in the book: **the author never approves the author.** TIAO cannot review. GATE and PO cannot write. A finding cannot be fixed by the role that raised it.

---

## The rules that turned out to matter

**1. A verdict names a commit.** Every review opens with `GATE round N, head <sha>`. If one character of the branch changes after the verdict, the verdict is void and a new round runs. "Approved" without a SHA is not evidence.

**2. There is no conditional MERGE.** "MERGE once you fix X" is a NO-MERGE. Fix X, push, new round. This single rule removed a whole class of "I thought it was fixed" merges.

**3. Reviewers measure, they do not read.** GATE runs the tests itself, and on risky changes it *mutates the code* to check the tests notice. On one staff-area PR this month, GATE flipped the role check both ways and both mutations survived: the page's access rule had no test. NO-MERGE, one test round, merged the same afternoon.

**4. A note is not a waiver.** On the 0.9.9 fix, PO returned NO-MERGE because one unrelated test had timed out at 5,055 ms. The author's note said it was a flake, and it probably was. The verdict: *"a note is not a waiver"*. Either the rerun reads PASS at that head, or a waiver of that one case is written on the thread, by name. It was, and it is still there.

**5. The PR thread is the record.** Every round, every disposition, every waiver lives on the PR. A decision made in a chat somewhere else did not happen.

---

## The night the loop caught its own mistake

The previous post ended with a promise: a nightly tier, running the expensive checks (full suite, a disposable SQL Server replaying every migration, end-to-end browsers) on GitHub's runners three nights a week, only when `master` has moved.

An implementation lane built it. The PR looked right: the skip logic worked, the manual `force` run passed, the permissions were minimal. GATE's first round came back:

> *NO-MERGE (MF-1). On a `schedule` event, the pinned `dorny/paths-filter` throws before `full: true` can take effect. Every scheduled night would report ci `failure` without running tests. A forced `workflow_dispatch` after merge would pass anyway, so that proof cannot catch MF-1.*

Read the last sentence again. The one test anyone would run by hand, a manual dispatch, **could not see the bug**, because a manual run carries a field a scheduled run does not. Merged as written, the nightly would have gone red every night, and the red would have taught everyone to ignore it. GATE found it by reading the pinned action's source, not the README.

Round two closed it. Then the first forced run of the fixed nightly found something real: a SQL validation scenario that had been failing on `master`, **unseen, because the local gate only runs the default scenario**. That is exactly what the nightly exists for, and it is an open issue today, not a footnote.

Two smaller lessons from the same week:

- **The first scheduled run never fired.** It was set for minute 0, and GitHub drops scheduled runs under load at the top of the hour. It now runs at minute 17.
- **Silence is a signal only if it is designed to be.** Every nightly, executed or skipped, posts one comment on a tracking issue. A night that did not run shows up as a missing comment, not as nothing.

---

## What the loop does not do

It would be easy to read this as "the agents run the project". They do not, and the boundary is the point:

- **No agent installs anything.** Every production install is a human at a console, following a written runsheet, with a rollback folder named before the first command.
- **No agent widens what a parent can see.** The list of fields a parent may see is a governance document with a named approver. Code and document are held in lockstep by tests, and changing either needs my decision.
- **No agent resolves its own finding.** GATE raises it, TIAO or CRAFT fixes it, GATE closes it at a new head, PO checks the ledger.
- **No agent decides priority.** CHIEF sequences; the roadmap and the scope are mine.

The volume in the first table is real, but it is not the product. The product is that each of those 953 merges has a head-addressed verdict from a reviewer that did not write it, and I can show you which one.

---

## Try the smallest version

You do not need five roles to start. You need two rules and one discipline:

1. **Separate the author from the reviewer**, even when both are the same model with different instructions. Give the reviewer no write access.
2. **Make the verdict name the commit**, and void it when the commit moves.
3. **Keep a written list of decisions no agent makes.** Mine is five lines long. Yours will be different, but it has to exist before the first merge, not after the first incident.

If you run agents on a real codebase: what is on your "never delegated" list?

---

- **The portal's public demo, fictional data only:** [mydashboard-demo.vercel.app](https://mydashboard-demo.vercel.app)
- **The previous post, the merge gate:** [dev.to/lfariabr](https://dev.to/lfariabr)
- **GitHub:** [github.com/lfariabr](https://github.com/lfariabr) · **LinkedIn:** [linkedin.com/in/lfariabr](https://www.linkedin.com/in/lfariabr/) · **Portfolio:** [luisfaria.dev](https://luisfaria.dev)

*Agents write the code. The merge word is earned, one head at a time.*
