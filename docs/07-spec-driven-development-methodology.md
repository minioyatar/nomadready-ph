# 07 — Spec-Driven Development Methodology

> This document describes the development methodology used for NomadReady PH.

---

## Core Principle

Build only what is specified. Approve before building.

---

## Workflow

```
Spec → Task → Branch → Claude Implementation → Test → Human Review → Merge → Deploy
```

---

## Claude Code Protocol

Before coding any feature, Claude responds with:
1. What I understand
2. Files I expect to modify
3. Implementation steps
4. Acceptance criteria
5. Risks or unclear items

After completing a feature, Claude responds with:
1. Feature branch name
2. Summary of what was implemented
3. Files changed
4. Tests or checks run
5. Acceptance criteria status
6. Anything not completed
7. Risks or follow-up needed
8. Confirmation that no out-of-scope features were added

---

## Rules

- Claude does not decide scope.
- Claude does not change architecture without approval.
- Claude does not add "nice to have" features.
- One feature = one branch.
- Do not push unfinished work to main.

---

## Claude Code Skills — When to Use Them

Skills are slash commands that give Claude domain-specific capabilities. Invoke them at the start of a task, not after.

### Rule: Match the skill to the task domain

| You are working on | Invoke before starting |
|---|---|
| **Starting any feature** | Read the relevant source files. Optionally run `graphify query "<area>"` for cross-file dependency context on complex tasks. |
| **Any PR review** | Read the diff. Optionally run `graphify path "<changed>" "<affected>"` to trace dependencies. Then `/review`. |
| Any Python test | `/python-testing` |
| Any React component | `/react-dev` |
| Any chart or data viz | Use installed `chart-visualization` skill (active automatically) |
| Any code cleanup after a feature | `/simplify` |
| E2E test setup | `/playwright-e2e-testing` |
| Frontend unit tests | `/frontend-testing` |
| Accessibility check | `/wcag-accessibility-audit` |
| Security review | `/security-review` |
| npm/pip vulnerability check | `/dependency-vulnerability-triage` |
| CI/CD pipeline | `/agent-ops-cicd-github` |
| Codebase exploration / debugging | `graphify query` or `/graphify` to rebuild the graph (optional, local only) |

### Skills audit for this project

A full audit of available skills was run against the project tech stack. See `docs/03-directory-architecture-and-claude-workflow.md` for the complete skills map, installed skills, and rejected skills with reasons.

---

## Skills Installation Reference

Skills were evaluated using the open skills registry at https://skills.sh/

Threshold used for external skill installation: **1K installs or reputable official source**.

| Category | Decision |
|---|---|
| Chart visualization | Installed — `antvis/chart-visualization-skills@chart-visualization` (3.8K installs) |
| React, testing, accessibility, security, CI/CD | Using built-in skills — already available, higher trust than registry alternatives found |
| Django/Python registry skills | Skipped — all had <40 installs |
| OpenAI API registry skills | Skipped — all had <100 installs |
| Leaflet/map registry skills | Skipped — all had <130 installs |
