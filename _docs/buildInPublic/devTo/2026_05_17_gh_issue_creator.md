# How I keep LLMs on a tight leash — and stopped hand-creating 30 GitHub issues in the process

**Tags:** `python` `github` `productivity` `opensource`

---

The way I keep LLMs on a tight leash is through structured issue breakdowns. In this post you'll see how I go from concept to issue breakdown to GitHub issues to code — and why that sequence makes it easier to run an orchestrator agent directing a focused executor agent without it hallucinating scope.

It starts with a planning doc: a problem statement and a list of items dissecting the solution. Below you'll see how to turn that into GitHub issues with labels, milestones, and acceptance criteria — without copy-pasting each one by hand.

You copy-paste the first five, by issue eight you are making typos... by issue fifteen you have a duplicate and by issue twenty you have stopped caring about the body format entirely.

I was refactoring a multi-model NLP sentiment classifier from a flat `src/` folder into a proper package structure - eight packages, 30+ issues, 3 phases. Every time the plan changed I was back to copy-pasting so I decided to write a 300-line Python CLI to end that.

The result: [`gh-issue-creator`](https://github.com/lfariabr/gh-issue-creator). Give it a JSON template or a plain markdown planning file, it discovers your repo automatically, runs dry by default and even skips issues that already exist. One command, done.

---

## The problem

Most developers plan in text. GitHub Issues wants structured input via a web form or API calls: the gap between those two surfaces is where time disappears.

The GitHub CLI (`gh`) already handles authentication and API calls cleanly. The missing layer is a thin converter that takes a batch of planned issues — from wherever they live — and creates them with one command.

The constraints I set:

1. **Dry-run by default.** Never touch the API without explicit intent.
2. **Read markdown natively.** My planning docs are already in `### Issue #50 - Title` format. The tool should parse that directly.
3. **Skip duplicates by title.** Running the script twice should not create duplicates.
4. **Zero config on a correctly authenticated machine.** `gh repo view` already knows the repo.
5. **Fail loudly and early.** Validation errors before any API call, not halfway through a 30-issue batch.

This structure matters even more when the executor is an AI agent. A well-scoped issue with a clear Acceptance section is a bounded task. A vague one is an invitation for the agent to hallucinate scope. The tool forces you to write tight issues before you run anything.

---

## How it works

### Two input formats, one output

The tool accepts JSON or markdown. The JSON format gives you full control: labels, assignees, milestones per issue. The markdown format is a convenience parser for when your plan already exists as a doc.

The markdown parser reads headings like `### Issue #50 - Your title` and treats everything below each heading as the issue body:

```python
pattern = re.compile(
    r"^###\s+Issue\s+#(?P<number>\d+)\s*-\s*(?P<title>.+?)\s*$"
    r"(?P<section>[\s\S]*?)(?=^###\s+Issue\s+#\d+\s*-|^##\s+|\Z)",
    flags=re.MULTILINE,
)
```

The lookahead (`(?=^###\s+Issue\s+#\d+\s*-|^##\s+|\Z)`) stops at the next issue heading rather than a fixed delimiter — because planning docs don't have consistent separators.

If you pass a `.json` path that doesn't exist but a sibling `.md` file does, the tool uses it silently. The template path is the default argument and markdown is the natural planning format.

### Deduplication before creation

`_existing_titles` fetches up to 1,000 issues from the target repo before creating anything:

```python
def _existing_titles(repo: str) -> dict[str, int]:
    data = _run_gh([
        "issue", "list", "--repo", repo,
        "--state", "all", "--limit", "1000",
        "--json", "title,number",
    ])
    issues = json.loads(data)
    return {issue["title"]: issue["number"] for issue in issues}
```

One API call up front, O(1) dict lookup per issue. If the title already exists, it logs the existing issue number and skips. No duplicates even if you run the script twice.

### Dry-run is the default

`--create` must be explicitly passed. Without it, the script logs every planned issue with its metadata and exits without touching GitHub:

```python
if not args.create:
    details = []
    if labels:
        details.append(f"labels={labels}")
    if assignees:
        details.append(f"assignees={assignees}")
    if milestone:
        details.append(f"milestone={milestone}")
    suffix = f" [{', '.join(details)}]" if details else ""
    planned.append(f"- {title}{suffix}")
    continue
```

The first time I ran a batch tool without a dry-run step and created five duplicate issues on a test repo, I added it immediately.

---

## Lessons learned

1. **Dry-run by default is not extra engineering.** It is the minimum viable trust for any tool that writes to a shared API.
2. **Markdown is a planning format. JSON is an API format.** Tools that force you to convert your planning format into an API format before they will accept input are adding friction, not removing it. Meet engineers where they already are.
3. **`subprocess.run(check=True, capture_output=True)` is the right pattern for CLI composition.** Let the subprocess fail loudly. Catch `CalledProcessError` at the call site and print a clean error. Don't swallow it.
4. **Delegate to existing tools.** `_discover_repo()` is three lines because it just calls `gh repo view`. Reimplementing remote detection would have been twenty lines and two edge cases I hadn't thought of.
5. **Tight issues are better context than long prompts.** When you hand an executor agent a well-formed GitHub issue — Goal, Scope, Acceptance — it has less room to drift than when you paste a paragraph of instructions. The discipline of writing issues before coding pays double when the coder is an LLM.

---

## No install required

The script uses only Python stdlib — `argparse`, `json`, `re`, `subprocess`, `pathlib`. No `pip install`, no virtualenv.

```bash
curl -O https://raw.githubusercontent.com/lfariabr/gh-issue-creator/main/issue_creator.py
curl -O https://raw.githubusercontent.com/lfariabr/gh-issue-creator/main/examples/template.example.md

# dry-run
python issue_creator.py --template template.example.md --repo owner/your-repo

# create
python issue_creator.py --template template.example.md --repo owner/your-repo --create
```

---

The repo is at [github.com/lfariabr/gh-issue-creator](https://github.com/lfariabr/gh-issue-creator). The README includes three AI agent prompts for delegating the entire workflow — from writing the plan to creating the issues — to a coding agent. That's the loop: plan in markdown, issues on GitHub, agent on a tight leash.

Clone it, run a dry-run, open a PR if you extend it to handle sub-tasks or GitHub Projects boards.