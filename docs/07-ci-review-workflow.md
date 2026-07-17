# 07 — CI and Automated Review Workflow

> This document describes how automated code checks and PR review work on every pull request in the NomadReady PH project.

---

## Approved Review Workflow

```
Claude Code implements and tests locally
        │
        ├── Graphify — feature context and blast-radius analysis
        │
        ├── Ruff — Python lint
        │
        ├── ESLint — JavaScript/React lint
        │
        ├── Tests and frontend build (local)
        │
        ├── CodeRabbit — reviews the GitHub PR
        │
        └── Human Tech Lead — required approval before merge
```

---

## Tool Roles

### Claude Code — Coding and Implementation Agent

Claude Code is the team's coding and implementation agent. It reads specs, writes code, runs tests, and opens PRs. It is a local CLI tool, not a cloud PR-review service.

Claude Code is **not** used to review GitHub PRs via the Anthropic API. Anthropic API-based Claude PR review is not part of this workflow.

### Graphify — Feature Context and Blast-Radius Analysis

Graphify maintains a live knowledge graph of the codebase (code only, no API cost).

**On every prompt** on a `feature/*`, `fix/*`, or `chore/*` branch, the `UserPromptSubmit` hook automatically injects branch context before Claude responds.

**On every PR**, two CI jobs run:

**`Graphify Blast Radius` (analysis, read-only):**
- Builds the head graph and a base graph
- Classifies changed files (added / modified / deleted / renamed)
- Identifies direct dependents, BFS reachable nodes (≤3 hops), affected tests, cross-layer impacts
- Produces a Markdown report with high-risk warnings first
- Uploads the report as a workflow artifact and writes to the Actions step summary

**`Graphify Publish Comment` (trusted publish, PR-write):**
- Downloads the artifact from the analysis job
- Creates or updates a single reusable PR comment with sentinel `<!-- graphify-blast-radius -->`
- Failure to comment is a warning — report remains available in the artifact

**Stage 1:** Both jobs use `continue-on-error: true`. They are informational only and do not block merges.

### Ruff — Python Lint

Ruff checks `backend/` for syntax errors, import issues, unused variables, style violations (PEP 8), and common anti-patterns.

Config: zero-config, points at `./backend`.

### ESLint — JavaScript/React Lint

ESLint checks `frontend/src/` for JavaScript syntax errors, React hooks rule violations, invalid React patterns, and common JS errors.

Config: `frontend/eslint.config.js`

Rules in use:
- `eslint:recommended` — standard JS rules
- `eslint-plugin-react` recommended rules
- `eslint-plugin-react-hooks` recommended rules
- `react/react-in-jsx-scope` is OFF (React 17+ JSX transform)
- `react/prop-types` is OFF (hackathon — prop-types are optional)

### CodeRabbit — PR Review

CodeRabbit reviews the GitHub pull request and posts inline comments. It is free for public repositories.

CodeRabbit is the approved automated PR reviewer. No other AI PR-review agent (UltraReview, Anthropic API-based Claude review, PR-Agent, Reviewdog, or similar) is part of this workflow.

### Human Tech Lead — Required Approval

Human approval is mandatory before any merge. No automated tool can approve a merge.

---

## CI Workflow — On Every PR (`ci.yml`)

```
PR opened or updated
        │
        ├── Job 1: Python Lint (Ruff)         ← checks backend/
        │
        ├── Job 2: JavaScript Lint (ESLint)   ← checks frontend/src/
        │
        ├── Job 3: Graphify Blast Radius       ← read-only, continue-on-error
        │            analysis job
        │
        └── Job 4: Graphify Publish Comment   ← needs job 3, continue-on-error
                     posts or updates sentinel comment
```

No CI job calls the Anthropic API. No CI job requires `ANTHROPIC_API_KEY`.

---

## Developer Setup (Run Linters Locally)

### Backend — Ruff

```bash
pip install ruff
ruff check backend/
ruff check backend/ --fix   # auto-fix safe issues
```

### Frontend — ESLint

```bash
cd frontend
npm install
npm run lint
npm run lint -- --fix       # auto-fix safe issues
```

---

## Workflow for the Team

### Developer

```
1. Open feature branch from main
2. Orient with the graph before touching files:
      graphify query "<feature area>"
      graphify explain "<key model or function>"
3. Implement the approved feature
4. Open a PR against main
5. Wait for CI (Ruff, ESLint, Graphify Blast Radius)
6. Read CodeRabbit's inline comments
7. Read the Graphify blast-radius report in the PR comment
8. Fix any must-fix issues
9. Push fixes — CI reruns automatically
10. Tag @minioyatar for human Tech Lead review
```

### Team Lead

```
1. Check blast radius — automated Graphify Blast Radius comment in the PR
   Manual fallback: graphify path "<changed thing>" "<thing that might break>"
2. Confirm CI jobs pass (Ruff, ESLint)
3. Read CodeRabbit's review comments
4. Run the PR locally if it touches backend scoring or API integration
5. Approve and merge, or request changes
```

---

## What Is Not Part of This Workflow

- UltraReview
- Anthropic API-based Claude PR review
- Local AI code-review agents (Ollama, PR-Agent, CodeFox, Reviewdog, Bandit, or similar)
- Scheduled daily AI re-check

No additional local or cloud AI reviewer is currently planned or required.

---

## Files

| File | What it does |
|------|-------------|
| `.github/workflows/ci.yml` | Ruff + ESLint + Graphify Blast Radius + Graphify Publish Comment |
| `.github/scripts/graphify_blast_radius.py` | Blast-radius analysis script |
| `frontend/package.json` | `"lint": "eslint src"` script and ESLint devDependencies |
| `frontend/eslint.config.js` | ESLint v9 flat config for React + hooks |

---

## Public Repository Note

CodeRabbit is free for public repositories. The NomadReady PH repo was made public on 2026-06-27 to enable this free tier.

- Do not commit real secrets to any branch
- `.env` files are in `.gitignore` — never commit them
- `.env.example` contains only placeholder values — safe to commit
