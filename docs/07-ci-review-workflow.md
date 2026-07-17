# 07 — CI and Automated Review Workflow

> This document describes how automated code checks and AI code review work on every pull request in the NomadReady PH project.

---

## Why This Setup

CodeRabbit was used during early development but requires a paid plan for private repositories.
The repo was made public on 2026-06-27, which makes all tools below free.

The replacement workflow uses:
- **Ruff** — free Python linter (faster than flake8/pylint, no config needed)
- **ESLint** — free JavaScript/React linter (already the Vite ecosystem standard)
- **Claude Code (Anthropic)** — AI code review via GitHub Actions, replacing CodeRabbit's narrative review and inline comments
- **Claude Code Routine** — daily 3am PHT scheduled check that also posts inline PR review comments

Together these tools automatically post inline comments on specific lines of every PR — the same way CodeRabbit did — before any human reviews the code.

---

## How It Works

There are two automated review triggers.

### Trigger 1 — On Every PR Open or Update (`ci.yml`)

```
PR opened or updated
        │
        ├── Job 1: Python Lint (Ruff)       ← checks backend/
        │
        ├── Job 2: JavaScript Lint (ESLint)  ← checks frontend/src/
        │
        └── Job 3: Claude AI Code Review   ← runs after jobs 1 and 2
                   posts inline line comments on the PR
```

Claude runs regardless of whether the linters passed or failed, so it can comment on the same files ESLint flagged with additional context.

### Trigger 2 — Scheduled Daily at 3am PHT (`scheduled-review.yml`)

```
Every day at 3am PHT (19:00 UTC)
        │
        └── For each open PR:
              1. Fetch the PR diff via gh pr diff
              2. Ask Claude to return structured JSON:
                 { summary, verdict, event, inline_comments: [{path, line, body}] }
              3. Post a GitHub PR Review via REST API
                 → inline comments appear on the exact changed lines
                 → summary card with READY TO MERGE / NEEDS CHANGES / BLOCKED verdict
              4. Fallback: if a line number is invalid, retries as a plain review comment
```

This is the CodeRabbit replacement for the scheduled automated check. The inline comments
appear directly on the lines that have issues, exactly as CodeRabbit did.

---

## What Each Tool Checks

### Ruff — Python Lint

Ruff checks backend Python code for:
- Syntax errors
- Import issues
- Unused variables
- Style violations (PEP 8)
- Common anti-patterns (mutable class attributes, etc.)

Config: zero-config, just points at `./backend`.

### ESLint — JavaScript/React Lint

ESLint checks frontend React code for:
- JavaScript syntax errors
- React hooks rule violations (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`)
- Invalid React patterns
- Common JS errors (undefined variables, unreachable code)

Config: `frontend/eslint.config.js`

Rules in use:
- `eslint:recommended` — standard JS rules
- `eslint-plugin-react` recommended rules
- `eslint-plugin-react-hooks` recommended rules
- `react/react-in-jsx-scope` is OFF (React 17+ doesn't need the import)
- `react/prop-types` is OFF (hackathon — prop-types are optional)

### Graphify Blast Radius

Two jobs run on every PR:

**`Graphify Blast Radius` (analysis, read-only):**
- Builds the head graph and a base graph (via git worktree at the exact base commit SHA)
- Classifies changed files (added/modified/deleted/renamed)
- Identifies direct dependents, BFS reachable nodes (≤3 hops), affected tests, cross-layer impacts
- Produces a Markdown report with high-risk warnings first
- Writes to GitHub Actions step summary and uploads as a workflow artifact

**`Graphify Publish Comment` (trusted publish, PR-write):**
- Downloads the artifact from the analysis job
- Creates or updates a single reusable PR comment with sentinel `<!-- graphify-blast-radius -->`
- Failure to comment is a warning — report remains available in summary and artifact

**Stage 1:** Both jobs use `continue-on-error: true`. They are informational only and do not block merges.
**Stage 2 (future):** Blast radius will become a required check for Graphify operational health failures only (install failure, graph build failure). Large blast radius, missing tests, or risky paths will remain warnings.

### Claude AI Code Review

Claude reviews the PR diff and posts specific inline comments about:

1. Whether the code matches the stated MVP task
2. Bugs, broken API calls, stale-fetch race conditions, missing error states
3. Tech stack and directory structure compliance
4. Out-of-scope changes (auth, booking, payments, reviews, multi-LGU)
5. Frontend: Tailwind classes vs. inline styles or injected `<style>` tags
6. Backend: whether filtering enforces `lgu_verified`, whether scoring logic stays in `scoring/services.py`
7. Demo story alignment: local data → score → gaps → map → AI action plan
8. **Blast radius** — `graphify path "<changed node>" "<possibly affected node>"` to surface non-obvious cross-file ripple effects before commenting

Claude is given full project context in a `direct_prompt` built into the workflow so it reviews against our specific rules, not generic best practices.

---

## Required GitHub Secret

Claude needs an API key to run. Add this secret to the GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret

Name:  ANTHROPIC_API_KEY
Value: (your Anthropic API key)
```

Without this secret, the Claude review job will fail but the lint jobs will still run.

To get an Anthropic API key: https://console.anthropic.com

---

## Files Changed

| File | What it does |
|------|-------------|
| `.github/workflows/ci.yml` | GitHub Actions workflow — Ruff + ESLint + Claude review |
| `frontend/package.json` | Added `"lint": "eslint src"` script and ESLint devDependencies |
| `frontend/eslint.config.js` | ESLint v9 flat config for React + hooks |

---

## Developer Setup (Run Linters Locally)

Before pushing, developers can run the same checks locally to catch issues early.

### Backend — Ruff

```bash
# Install Ruff (one-time)
pip install ruff

# Run from project root
ruff check backend/

# Auto-fix safe issues
ruff check backend/ --fix
```

### Frontend — ESLint

```bash
# Install dependencies (one-time, from frontend/)
cd frontend
npm install

# Run ESLint
npm run lint

# Auto-fix safe issues
npm run lint -- --fix
```

---

## Commit the package-lock.json

After running `npm install` locally for the first time with the new ESLint packages, commit the updated `package-lock.json`:

```bash
cd frontend
npm install
cd ..
git add frontend/package-lock.json frontend/package.json frontend/eslint.config.js
git commit -m "chore: add ESLint with React and hooks plugins"
```

This ensures GitHub Actions uses the exact same dependency versions that were tested locally.

---

## Workflow for the Team

### Developer

```
1. Open feature branch
2. Orient with the graph before touching any files:
      graphify query "<feature area>"
      graphify explain "<key model or function>"
3. Build the feature
4. Open a PR against main
5. Wait for CI to run (2–3 minutes)
6. Read Claude's inline comments on the PR
7. Fix any must-fix issues flagged by Claude or the linters
8. Push fixes — CI reruns automatically
9. Tag @minioyatar for human review
```

### Team Lead (human review)

```
1. Check blast radius of what changed:
      → Now automated by the Graphify Blast Radius CI job (see PR comment with blast-radius report)
      → Manual fallback: graphify path "<changed thing>" "<thing that might break>"
2. Check that all CI jobs passed (green)
3. Read Claude's review comments — they cover the same checklist as the audit
4. Run the PR locally if it touches backend scoring or API integration
5. Approve and merge, or request changes
```

---

## What the Inline Comments Look Like

Claude posts a proper **GitHub PR Review** (not just a comment). This means:

1. A **summary card** appears at the top of the PR with the overall verdict:
   - ✅ `READY TO MERGE`
   - ⚠️ `NEEDS CHANGES`
   - 🚫 `BLOCKED`

2. **Inline comments appear directly on the changed lines**, like this:

   ```
   frontend/src/routes/Assets.jsx  line 62

   ❌ must-fix — getListings() returns an Axios response object, not the
   listings array. Change setListings(response) to setListings(response.data)
   or the table will always be empty.
   ```

3. Each comment is prefixed:
   - `❌` — must fix before merge
   - `⚠️` — warning, should fix
   - `[optional]` — style note, can ignore for hackathon

4. Maximum 8 inline comments per PR — Claude prioritises the highest-impact issues.

This is the same experience as CodeRabbit's "Actionable comments posted: N" format.

---

## How This Replaces CodeRabbit

| What CodeRabbit did | Replacement |
|--------------------|-------------|
| Lint Python style | Ruff |
| Lint JavaScript/React | ESLint |
| Docstring coverage check | Skipped for hackathon MVP |
| PR title / description check | Human review |
| AI narrative review (walkthrough) | Claude Code Action (on PR open) |
| Inline comments on specific lines | Claude Code Action + scheduled-review.yml |
| Daily automated re-check | `scheduled-review.yml` cron at 3am PHT |
| Pre-merge checks summary | CI status checks (green/red) + verdict card |

The one thing CodeRabbit had that this setup does not: **automatic fix suggestions via stacked PRs**. For the hackathon, team members fix issues manually based on Claude's inline comments.

---

## Public Repository Note

CodeRabbit is free for public repositories. The NomadReady PH repo was made public on 2026-06-27 to enable this free tier. This also means:

- Do not commit real secrets to any branch
- `.env` files are in `.gitignore` — never commit them
- `.env.example` contains only placeholder values — this is safe to commit
- The `ANTHROPIC_API_KEY` is stored as a GitHub Actions secret — never in code
