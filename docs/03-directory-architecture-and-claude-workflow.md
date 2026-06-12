# 03 — Directory Architecture and Claude Code Workflow

> This document describes the monorepo structure, how Claude Code should be used on this project, and which Claude Code skills to invoke for each feature branch.

---

## Directory Structure

See `CLAUDE.md` for the full required directory architecture.

Key locations:

```
backend/apps/scoring/services.py    ← all numeric score logic lives here
backend/apps/ai_advisor/services.py ← all OpenAI logic lives here
frontend/src/services/api.js        ← all frontend API calls go here
```

---

## Claude Code Workflow

```
Spec → Task → Branch → Claude Implementation → Human Review → Test → Merge → Deploy
```

Do not use:
```
Prompt Claude → Build Randomly → Debug Chaos
```

---

## Feature Branch Build Order

| # | Branch | Status |
|---|---|---|
| 1 | `feature/project-setup` | ✅ Merged |
| 2 | `feature/backend-models-seed` | ✅ Merged |
| 3 | `feature/scoring-engine` | Next |
| 4 | `feature/dashboard-overview` | Pending |
| 5 | `feature/assets-table` | Pending |
| 6 | `feature/map-view` | Pending |
| 7 | `feature/ai-readiness-advisor` | Pending |
| 8 | `feature/cicd-deployment` | Pending |
| 9 | `feature/demo-polish` | Pending |

---

## Claude Code Skills

Claude Code skills extend what Claude can do for specific domains. This section maps the available skills to the feature branches where they are most useful.

Skills are invoked with `/skill-name` in the Claude Code prompt.

### Built-in Skills (no installation required)

These skills are already available in this project's Claude Code session:

| Skill | Invoke | Use in this project |
|---|---|---|
| `react-dev` | `/react-dev` | All frontend feature branches — React components, hooks, routing, Tailwind patterns |
| `python-testing` | `/python-testing` | `feature/scoring-engine` — pytest, coverage, fixtures, scoring logic tests |
| `frontend-testing` | `/frontend-testing` | `feature/dashboard-overview` onward — Jest, Vitest, React Testing Library |
| `playwright-e2e-testing` | `/playwright-e2e-testing` | `feature/demo-polish` — end-to-end tests for the full demo flow |
| `wcag-accessibility-audit` | `/wcag-accessibility-audit` | `feature/demo-polish` — LGU dashboard should meet WCAG 2.1 AA for government use |
| `security-review` | `/security-review` | `feature/cicd-deployment` — review before going to production |
| `dependency-vulnerability-triage` | `/dependency-vulnerability-triage` | `feature/cicd-deployment` — triage `npm audit` and `pip` vulnerabilities |
| `simplify` | `/simplify` | Any branch — review changed code for reuse and quality after implementation |
| `review` | `/review` | Every PR — review before merge |
| `agent-ops-cicd-github` | `$agent-ops-cicd-github` | `feature/cicd-deployment` — GitHub Actions CI/CD setup |

### Installed External Skills

These skills were installed from the open skills ecosystem for this project:

| Skill | Install count | Use in this project | Install command |
|---|---|---|---|
| `chart-visualization` (antvis) | 3.8K | `feature/dashboard-overview` — Recharts score cards and category bar charts | Already installed globally |

**Security note:** The `chart-visualization` skill shows "Medium Risk" on Snyk. Review generated chart code before committing. It is safe for development use (Snyk risk is at package level, not usage level).

### External Skills to Watch (not yet installed)

These were found during the skills audit but do not meet the 1K install threshold for automatic installation. Revisit before `feature/cicd-deployment` if needed:

| Skill | Install count | Purpose |
|---|---|---|
| `martinholovsky/claude-skills-generator@cicd-expert` | 567 | CI/CD pipeline guidance |
| `ansanabria/skills@recharts` | 669 | Recharts-specific patterns (alternative to chart-visualization) |
| `affaan-m/ecc@accessibility` | 676 | Additional accessibility checks |

Install any of these with:
```bash
npx skills add <owner/repo@skill> -g -y
```

### Skills Not Installed (wrong stack or out of scope)

| Skill type | Reason skipped |
|---|---|
| `fastapi` | Project uses Django, not FastAPI |
| `tailwind-v4-shadcn` | Project uses Tailwind v3, not v4; shadcn is out of scope |
| Django/Python skills from registry | All had <40 installs; built-in `python-testing` is better |
| OpenAI API skills from registry | All had <100 installs; use `claude-api` built-in for API patterns |
| Leaflet/map skills from registry | All had <130 installs; `react-dev` + Leaflet docs are sufficient |

---

## How to Use Skills in Practice

### Backend dev — scoring engine

```
1. Open feature/scoring-engine branch
2. Ask Claude: /python-testing — write tests for calculate_internet_work_score()
3. Implement the function in services.py
4. Run: docker compose exec backend python manage.py test
```

### Frontend dev — dashboard charts

```
1. Open feature/dashboard-overview branch
2. Ask Claude: /react-dev — build a CategoryCard with a Recharts BarChart
   (chart-visualization skill will be active for chart guidance)
3. Check the output matches the scoring formula weights
```

### Team lead — PR review

```
1. When a feature branch PR is ready:
2. Ask Claude: /review — review PR #N
3. Also ask Claude: /simplify — check changed files for quality
4. Merge only after review passes
```

### Before deployment

```
1. Ask Claude: /security-review — review the full branch
2. Ask Claude: /dependency-vulnerability-triage — run npm audit and pip check
3. Ask Claude: /wcag-accessibility-audit — check the dashboard screens
4. Ask Claude: /playwright-e2e-testing — set up E2E tests for the demo flow
```

---

## MCP Plugins

The following MCP (Model Context Protocol) plugin is available in this session:

| Plugin | Purpose |
|---|---|
| `Google Drive` | Access planning documents stored in Google Drive if needed |

To authenticate Google Drive if you need to pull docs:
```
Use: mcp__claude_ai_Google_Drive__authenticate
```

This is optional. All planning documents are already available locally in `docs/source-pdfs/`.

---

## Claude Code Task Protocol (reminder)

Before coding any feature, Claude responds with:
1. What I understand
2. Files I expect to modify
3. Implementation steps
4. Acceptance criteria
5. Risks or unclear items

**Do not write code until the human approves the plan.**

After completing a feature, Claude responds with:
1. Feature branch name
2. Summary of what was implemented
3. Files changed
4. Tests or checks run
5. Acceptance criteria status
6. Anything not completed
7. Risks or follow-up needed
8. Confirmation that no out-of-scope features were added
