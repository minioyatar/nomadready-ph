# 07 — CI and Automated Review Workflow

> This document describes how automated code checks and PR review work on every pull request in the NomadReady PH project.

---

## Approved Review Workflow

```
Claude Code implements and tests locally
        │
        ├── Ruff — Python lint
        │
        ├── ESLint — JavaScript/React lint
        │
        ├── Backend Tests — Django test suite
        │
        ├── Frontend Production Build
        │
        ├── CodeRabbit — reviews the GitHub PR
        │
        └── Human Tech Lead — required approval before merge
```

---

## Tool Roles

### Claude Code — Coding and Implementation Agent

Claude Code is the team's coding and implementation agent. It reads specs, writes code, runs tests, and opens PRs. It is a local CLI tool, not a cloud PR-review service.

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

### Backend Tests

The backend test job runs the Django test suite against a PostgreSQL service container. Django's test runner creates the test database, applies all migrations, and runs all discovered tests.

### Frontend Production Build

The frontend build job installs dependencies via `npm ci` and runs `npm run build` (Vite production build). This confirms the application bundles correctly independent of lint results.

### CodeRabbit — PR Review

CodeRabbit reviews the GitHub pull request and posts inline comments. It is free for public repositories.

CodeRabbit is the approved automated PR reviewer. No other AI PR-review agent is part of this workflow.

### Human Tech Lead — Required Approval

Human approval is mandatory before any merge. No automated tool can approve a merge.

---

## CI Workflow — On Every PR (`ci.yml`)

```
PR opened or updated
        │
        ├── Job 1: Python Lint (Ruff)           ← checks backend/
        │
        ├── Job 2: JavaScript Lint (ESLint)     ← checks frontend/src/
        │
        ├── Job 3: Backend Tests                ← Django test suite + PostgreSQL
        │
        └── Job 4: Frontend Production Build    ← npm ci && npm run build
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
2. Read the relevant source files
3. Optionally query the local Graphify map for cross-file relationships
4. Implement the approved feature
5. Open a PR against main
6. Wait for CI (Ruff, ESLint, Backend Tests, Frontend Production Build)
7. Read CodeRabbit's inline comments
8. Fix any must-fix issues
9. Push fixes — CI reruns automatically
10. Tag @minioyatar for human Tech Lead review
```

### Team Lead

```
1. Confirm CI jobs pass (Ruff, ESLint, Backend Tests, Frontend Build)
2. Read CodeRabbit's review comments
3. Run the PR locally if it touches backend scoring or API integration
4. Approve and merge, or request changes
```

---

## What Is Not Part of This Workflow

- Automatic Graphify context injection into Claude prompts
- Graphify blast-radius CI jobs or PR comments
- UltraReview
- Anthropic API-based Claude PR review
- Local AI code-review agents (Ollama, PR-Agent, CodeFox, Reviewdog, Bandit, or similar)
- Scheduled daily AI re-check

---

## Files

| File | What it does |
|------|-------------|
| `.github/workflows/ci.yml` | Ruff + ESLint + Backend Tests + Frontend Production Build |
| `frontend/package.json` | `"lint": "eslint src"` and `"build": "vite build"` scripts |
| `frontend/eslint.config.js` | ESLint v9 flat config for React + hooks |

---

## Public Repository Note

CodeRabbit is free for public repositories. The NomadReady PH repo was made public on 2026-06-27 to enable this free tier.

- Do not commit real secrets to any branch
- `.env` files are in `.gitignore` — never commit them
- `.env.example` contains only placeholder values — safe to commit
