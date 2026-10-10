# `npm run lint || true`: the CI line that hid 44 errors for eight months

**Tags:** `eslint` `nextjs` `react` `devops`

**On 30 January 2026 I added a lint step to my portfolio's CI with `|| true` on the end and a TODO to remove it. 277 commits landed after that, and the lint step never once went red. When I finally took the `|| true` off, the linter didn't even start. Behind the crash were 44 errors and 67 warnings, eleven React hooks rules asking real questions about my components, and one bug fix I claimed that turned out to fix nothing.**

> *"A check that can't fail isn't a check. It's a log line."*

---

## Contents

- [The TODO from January](#the-todo-from-january)
- [Two reasons it couldn't run](#two-reasons-it-couldnt-run)
- [44 errors, sorted by how much thinking they needed](#44-errors-sorted-by-how-much-thinking-they-needed)
- [What the hooks rules were really asking](#what-the-hooks-rules-were-really-asking)
- [The bug fix that wasn't](#the-bug-fix-that-wasnt)
- [67 warnings, then zero, then enforced](#67-warnings-then-zero-then-enforced)
- [Try it yourself](#try-it-yourself)

---

## The TODO from January

[luisfaria.dev](https://luisfaria.dev) is a Next.js 16 frontend and an Express + Apollo GraphQL API, deployed by GitHub Actions. In January I was fixing the pipeline: adding a MongoDB service, wiring environment variables, and getting the frontend job green. Lint was failing on a config problem I didn't have time for, so I wrote this:

```yaml
- name: Run linting
  run: npm run lint || true
  # TODO: Fix eslint-config-next version mismatch, then remove '|| true'
```

The commit that added it was titled *"fix lint config"*. It didn't fix the lint config. It made lint unable to fail.

From then on the Frontend Tests job had a green lint step on every run, and a green step doesn't invite you to read its log. Eight months and 277 commits later, I was cleaning up after a mobile bug fix, ran `npx eslint` by hand, and got this:

```text
TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'Object'
    |     property 'configs' -> object with constructor 'Object'
    |     property 'flat' -> object with constructor 'Object'
    |     ...
    |     property 'plugins' -> object with constructor 'Object'
    --- property 'react' closes the circle
```

**So what:** `|| true` doesn't say "this is fine for now". It says "never tell me". A temporary escape hatch needs an end date or an owner, or it becomes permanent.

<sub>[↑ Back to contents](#contents)</sub>

---

## Two reasons it couldn't run

**The config.** My `eslint.config.mjs` used `FlatCompat`, the adapter that lets ESLint 9 load old-style "eslintrc" configs:

```js
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
```

That was the right setup once. But `eslint-config-next` 16 already ships native flat configs. Wrapping them in the compat layer a second time creates the circular reference that crashes ESLint before it reads a single file. The fix is to stop translating and import them directly:

```js
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [...coreWebVitals, ...typescript /* , my overrides */];
```

**The script.** My `package.json` had `"lint": "next lint"`. Next.js 16 removed `next lint`. So even with a working config, the command CI ran no longer existed. It became `"lint": "eslint ."`.

Either problem alone would have failed the step. With `|| true` on the end, both were invisible.

**So what:** if a tool's major version bumps while its output is muted, you won't hear about the breaking change. You'll find out the day you unmute it.

<sub>[↑ Back to contents](#contents)</sub>

---

## 44 errors, sorted by how much thinking they needed

With the linter running again, it reported 44 errors across the frontend:

| Rule | Errors | Effort |
|---|---|---|
| `react/no-unescaped-entities` | 11 | Mechanical: `'` → `&apos;`, renders the same |
| `@typescript-eslint/no-explicit-any` | 13 | Real types: `unknown` + narrowing, the library's own prop types |
| `react-hooks/set-state-in-effect` | 9 | **Refactors** |
| Jest config (`require`, `@ts-ignore`) | 5 | Config override for CommonJS files |
| `no-empty-object-type` | 3 | `interface X extends Y {}` → `type X = Y` |
| `react-hooks/immutability` | 2 | Functions used before they were declared |
| `react/display-name` | 1 | Name the test wrapper |

Thirty-three of them took minutes. The `any`s were the most satisfying: two error handlers in one dialog each cast GraphQL errors to `any` to read rate-limit fields, and replacing both with one typed helper removed duplicated code as well as the errors.

The eleven React hooks errors were different. They weren't style. Each one pointed at a component doing something React 19 considers a mistake.

<sub>[↑ Back to contents](#contents)</sub>

---

## What the hooks rules were really asking

`set-state-in-effect` fires when an effect synchronously calls `setState`. The rule's point: if you can compute a value during render, an effect that copies it into state just costs an extra render and opens a window where the screen shows stale data. Three patterns covered most of my cases.

**1. "Am I on the client?" doesn't need an effect.** My rotating hero text started its animation like this:

```ts
const [isRotating, setIsRotating] = useState(false);

useEffect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setIsRotating(true);
  // ...start the interval
}, []);
```

`useSyncExternalStore` answers the motion question directly, with a separate server value so hydration still matches:

```ts
const motionAllowed = useSyncExternalStore(
  subscribeToMotionPreference,
  () => !window.matchMedia(REDUCED_MOTION).matches, // client
  () => false                                       // server
);
const isRotating = motionAllowed && length > 1;
```

A side effect I didn't plan: it now reacts live if you change your OS motion setting, because it subscribes to the media query instead of reading it once.

**2. "Reset when a prop changes" can happen during render.** My login page mirrored the auth error into local state so typing could dismiss it:

```ts
useEffect(() => {
  if (error) setLocalError(error);
}, [error]);
```

React's documented alternative is to compare with the previous value while rendering:

```ts
const [lastError, setLastError] = useState(error);
if (error !== lastError) {
  setLastError(error);
  if (error) setLocalError(error);
}
```

It looks strange the first time. It's the pattern the React docs recommend for exactly this case, and React handles the state update before the screen is drawn.

**3. "Copy props into state when they change" usually means "remount".** My note edit form had an effect that re-copied every field whenever the `note` prop changed. Giving the form a key does the same job with no effect at all:

```tsx
<NoteForm key={editingNote.id} note={editingNote} ... />
```

A different note means a different key, so React mounts a fresh form with fresh state.

**Where I stopped.** Three effects react to rate-limit data from the server. Two drive wall-clock countdowns, and computing those during render would mean calling `Date.now()` during render, which React's `purity` rule forbids too. The third fires "you're nearly at the limit" notices, which really belong in the mutation handlers, but that page has no tests yet and I wasn't going to change its behaviour blind. All three got a one-line `eslint-disable` with a comment saying why, and the rewrite is listed as a follow-up in the PR.

**So what:** the hooks rules are worth reading as questions, not commands. Most of my answers were "you're right, this doesn't need an effect". A few were "yes it does, and here's why", written down next to the disable.

<sub>[↑ Back to contents](#contents)</sub>

---

## The bug fix that wasn't

I was pleased with the `key` change on the note form. Pleased enough that I wrote this in the PR description:

> *Fixes a latent bug where an Apollo refetch while editing wiped unsaved input.*

The reasoning sounded right. The old effect re-ran whenever `note` changed, and a refetch produces new note objects. So a refetch mid-edit would reset the form. I put the same claim in the release notes.

CodeRabbit reviewed the PR, rated the merge risk minimal, and left one warning: the change removed prop synchronisation without any test coverage, and the issue said "no behaviour change".

So I traced it properly. The edit dialog doesn't receive notes from the query. It receives `editingNote`, a piece of state set once when you tap Edit. A refetch replaces the list, but it never replaces that state while the dialog is open. The effect I deleted had never fired mid-edit. There was no bug, so I hadn't fixed one.

The fix for the overclaim was tests, not more code:

```tsx
it('keeps unsaved edits when the notes list re-renders with fresh objects', () => {
  const { rerender } = render(<NotesPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved title' } });

  rerender(<NotesPage />); // the mock returns new note objects, like a refetch

  expect(screen.getByLabelText('Title')).toHaveValue('Unsaved title');
});
```

That test, plus one for switching between notes, now pins the behaviour. I corrected the PR description and both docs, and replied on the PR explaining the mistake.

**So what:** "this fixes a bug" is a claim, and claims need the same evidence as code. If you can't write the test that fails before your change, you probably didn't fix a bug. You may have just refactored, which is fine, as long as you say so.

<sub>[↑ Back to contents](#contents)</sub>

---

## 67 warnings, then zero, then enforced

Zero errors still left 67 warnings in CI, and a gate that only fails on errors lets warnings pile up exactly the way errors had. So a second PR took them to zero:

- **22 were deliberate.** `({ node, ...props }) => <h1 {...props} />` strips a prop so it doesn't reach the DOM. ESLint's `ignoreRestSiblings` option exists for this.
- **22 were dead code.** Unused imports, a `useRouter` nobody called, catch bindings that could be `catch {}`.
- **14 `console` calls were intentional** (test setup, Sentry bootstrapping, a debug page) and got a scoped override. Two server pages switched to the project's logger.
- **5 hook dependency warnings** were fixed without changing when anything runs.
- **2 `<img>` tags stayed.** They render admin-entered and markdown image URLs from any host, and `next/image` refuses hosts it hasn't been told about.

Then the script became `eslint . --max-warnings 0`. To make sure the new gate actually bites, I fed it a file with one unused variable:

```bash
echo 'export const f = () => { const unused = 1; return 2; };' \
  | npx eslint --stdin --stdin-filename src/probe.ts --max-warnings 0
echo $?   # 1
```

One warning, exit code 1, red build.

**So what:** after you fix a gate, prove it can fail. A gate you've only ever seen pass might just be another `|| true`.

<sub>[↑ Back to contents](#contents)</sub>

---

## Try it yourself

Search your workflows for the ways a step can be told not to fail:

```bash
grep -rnE '\|\| true|continue-on-error|set \+e' .github/workflows/
```

Mine now returns one line: an SEO audit marked `continue-on-error`, with a comment saying it's informational and never blocks a deploy. That one is a decision. The `|| true` was an accident that lasted eight months.

- **The repo:** [github.com/lfariabr/luisfaria.dev](https://github.com/lfariabr/luisfaria.dev)
- **Lint fixed and gated:** [PR #300](https://github.com/lfariabr/luisfaria.dev/pull/300) · [v3.18.3](https://github.com/lfariabr/luisfaria.dev/releases/tag/v3.18.3)
- **Zero warnings, enforced:** [PR #304](https://github.com/lfariabr/luisfaria.dev/pull/304) · [v3.18.4](https://github.com/lfariabr/luisfaria.dev/releases/tag/v3.18.4)

What's the oldest TODO in *your* CI config, and do you know what it's been hiding?

---

## Let's connect

- **GitHub:** [github.com/lfariabr](https://github.com/lfariabr)
- **LinkedIn:** [linkedin.com/in/lfariabr](https://www.linkedin.com/in/lfariabr/)
- **Portfolio:** [luisfaria.dev](https://luisfaria.dev)

*Unmute the check, prove it can fail, and test the bug before you claim the fix.*
