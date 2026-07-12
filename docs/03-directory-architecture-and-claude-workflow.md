# 03 — Directory Architecture and Claude Code Workflow

> This document describes the monorepo structure, how Claude Code should be used on this project, and which Claude Code skills to invoke for each feature branch.
>
> **Last updated:** 2026-07-12
> **Updated by:** Team Lead (Claude)
> **Reason:** PR #11 merged — AI advisor serializer improvements, lazy score snapshot. All screens stable. Next: feature/demo-polish.

---

## Directory Structure

See `CLAUDE.md` for the full required directory architecture.

Key locations:

```
backend/apps/scoring/services.py    ← all numeric score logic lives here
backend/apps/ai_advisor/services.py ← all OpenAI logic lives here
frontend/src/services/api.js        ← all frontend API calls go here
frontend/src/lib/constants.js       ← all frontend constants (category keys, colors, endpoints)
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

## Feature Branch Build Order — Current Status

| # | Branch | Owner | Status | PR |
|---|---|---|---|---|
| 1 | `feature/project-setup` | Both | ✅ Merged | — |
| 2 | `feature/backend-models-seed` | Backend | ✅ Merged | PR #2 |
| 3 | `feature/scoring-engine` | Backend | ✅ Merged | PR #3 |
| 4 | `feature/dashboard-overview` | Frontend | ✅ Merged | PR #4 |
| 5 | `feature/ai-readiness-advisor-backend` | Backend | ✅ Merged | PR #10 |
| 6 | `feature/assets-table-ui` | Frontend | ✅ Merged | PR #5 |
| 7 | `feature/map-view` | Frontend | ✅ Merged | PR #6 |
| 8 | `feature/ai-readiness-advisor-ui` | Frontend | ✅ Merged | PR #7 |
| 9 | `feature/cicd-deployment` | Both | ❌ Not started | — |
| 10 | `feature/demo-polish` | Both + Team Lead | ❌ Not started | — |

---

## Complete Task List — Start to Finish

| Order | Task | Branch | Owner | What Gets Built | Done Means |
|---|---|---|---|---|---|
| 1 | Project scaffold | `feature/project-setup` | Both | Django backend, React frontend, Docker Compose, base repo | App starts locally, containers run |
| 2 | Backend models + seed data | `feature/backend-models-seed` | Backend | Destination, Listing, ScoreSnapshot, AIRecommendation; Carles seed data | DB has Carles and 20 demo listings |
| 3 | Scoring engine | `feature/scoring-engine` | Backend | Python scoring logic, weighted formula, score labels | Score returns target output; only lgu_verified count |
| 4 | Score API endpoints | `feature/scoring-engine` | Backend | `GET /api/scores/current/`, `POST /api/scores/recalculate/` | Frontend can fetch and trigger score |
| 5 | Dashboard Overview | `feature/dashboard-overview` | Frontend | Score card, 5 category cards, gaps card, metrics, AI preview | /dashboard renders from real API |
| 6 | AI Advisor backend | `feature/ai-readiness-advisor-backend` | Backend | `generate_readiness_advice()`, OpenAI integration, `POST /api/ai-advisor/generate/` | Returns structured summary, strengths, weaknesses, top actions |
| 7 | Assets Table | `feature/assets-table-ui` | Frontend | /assets page, category tabs, listings table, status badges | Filter tabs map correctly to backend enum, table updates |
| 8 | Map View | `feature/map-view` | Frontend | /map page, Leaflet map, pins, legend, popup details | Map loads, pins clickable, contrast/focus fixed |
| 9 | AI Advisor UI | `feature/ai-readiness-advisor-ui` | Frontend | /ai-advisor screen, generate button, loading, result panels, error state | Calls real API, shows summary/strengths/weaknesses/top 3 actions |
| 10 | CI/CD deployment | `feature/cicd-deployment` | Both | GitHub Actions, docker-compose.prod.yml, nginx.conf, frontend CI step | CI passes on every PR; prod build runs |
| 11 | Demo polish | `feature/demo-polish` | Both + Team Lead | Seed calibration, E2E smoke, accessibility, copy, demo script | Full demo flow works start to finish |
| 12 | Demo prep | docs/demo branch | Team Lead | Demo script, screenshots, backup plan, PR freeze | Team can demo without hesitation |

---

## Team Task Split

### ✅ Done

| Task ID | Task | Branch | Owner |
|---|---|---|---|
| Task 1 | Project Scaffolding | `feature/project-setup` | Both |
| Task 2 | Backend Models & Seed Data | `feature/backend-models-seed` | Backend |
| Task 3 | Scoring Engine Logic | `feature/scoring-engine` | Backend |
| Task 4 | Score API Endpoints | `feature/scoring-engine` | Backend |
| Task F1 | Dashboard Screen | `feature/dashboard-overview` | Frontend |
| Task B1 | AI Advisor Service | `feature/ai-readiness-advisor-backend` | Backend |
| Task B2 | AI Advisor API Endpoint | `feature/ai-readiness-advisor-backend` | Backend |

### 🔄 In Progress — Frontend Track

| Task ID | Task | Branch | PR | Status | Blocker |
|---|---|---|---|---|---|
| Task F2 | Assets Table Screen | `feature/assets-table-ui` | #5 | Almost done | Category filter values still plural — must use `work_spot`, `accommodation`, `service`, `attraction` |
| Task F3 | Map View Screen | `feature/map-view` | #6 | Almost done | 3 fixes: MapView animation → Tailwind class toggle, CSS contrast tokens, focus-visible style |
| Task F4 | AI Advisor UI Screen | `feature/ai-readiness-advisor-ui` | #7 | Blocked | Merge conflicts; needs rebase on main after PR #5 and #6 merge, then wire real API |

### ❌ Not Started

| Task ID | Task | Branch | Owner | Starts After |
|---|---|---|---|---|
| Task B3 | CI/CD Backend | `feature/cicd-deployment` | Backend | PR #7 merged — **Team Lead handles, not backend dev** |
| Task F5 | CI/CD Frontend | `feature/cicd-deployment` | Frontend | PR #7 merged |
| Task B4 | AI Fallback Response | `feature/demo-polish` | Backend | PR #7 merged |
| Task B5 | AI Output Structure Hardening | `feature/demo-polish` | Backend | PR #7 merged |
| Task B6 | API Contract Check | `feature/demo-polish` | Both | PR #7 merged |
| Task B7 | Carles Score Calibration | `feature/demo-polish` | Backend | PR #7 merged |
| Task B8 | Top Gaps Calibration | `feature/demo-polish` | Backend | PR #7 merged |
| Task B9 | Backend Smoke Testing | `feature/demo-polish` | Backend | PR #7 merged |
| Task B10 | Backend Security Check | `feature/demo-polish` | Backend | PR #7 merged |
| Task B11 | Final Backend Demo Check | `feature/demo-polish` | Backend | All demo-polish tasks done |
| Task P1 | Demo Polish & Integration | `feature/demo-polish` | Both + Team Lead | CI/CD merged |

> Full backend task details with acceptance criteria: see `docs/08-backend-tasks.md`

---

## Remaining Work — In Correct Order

### Immediate Sprint — Finish Open PRs

| Order | Owner | Task | Branch/PR | Output |
|---|---|---|---|---|
| 1 | Frontend | Fix assets category filter values | PR #5 | `/assets` done |
| 2 | Team Lead | Review and merge PR #5 | PR #5 | main updated |
| 3 | Frontend | Fix map animation, contrast, focus | PR #6 | `/map` done |
| 4 | Team Lead | Review and merge PR #6 | PR #6 | main updated |
| 5 | Frontend | Rebase AI Advisor UI on latest main | PR #7 | Conflicts resolved |
| 6 | Frontend + Backend | Wire AI UI to real API | PR #7 | `/ai-advisor` done |
| 7 | Team Lead | Review and merge PR #7 | PR #7 | All 4 screens complete |

### Final Sprint — CI/CD + Demo Polish

| Order | Owner | Task | Branch | Output |
|---|---|---|---|---|
| 8 | Backend | Backend CI + deploy config | `feature/cicd-deployment` | CI/CD backend ready |
| 9 | Frontend | Frontend CI build step | `feature/cicd-deployment` | Frontend build checked in CI |
| 10 | Both | Production Docker + nginx | `feature/cicd-deployment` | Deploy config ready |
| 11 | Team Lead | Merge CI/CD | `feature/cicd-deployment` | main is deploy-ready |
| 12 | Backend | AI fallback response | `feature/demo-polish` | Demo works even if OpenAI is down |
| 13 | Backend | AI output structure hardening | `feature/demo-polish` | API returns consistent shape every time |
| 14 | Both | API contract check | `feature/demo-polish` | All frontend field names match backend responses |
| 15 | Backend | Carles score calibration | `feature/demo-polish` | Score lands ~68/100, label correct |
| 16 | Backend | Top gaps calibration | `feature/demo-polish` | Gaps tell the right demo story |
| 17 | Frontend | UI and accessibility polish | `feature/demo-polish` | Demo screens clean, focus/contrast fixed |
| 18 | Backend | Backend smoke testing | `feature/demo-polish` | All 10 endpoint checks pass |
| 19 | Backend | Backend security check | `feature/demo-polish` | No secrets exposed, .env.example complete |
| 20 | Team Lead | Demo script + backup screenshots | `feature/demo-polish` | Team knows exact click path |
| 21 | Both | Final E2E smoke test | `feature/demo-polish` | Full demo flow works without error |
| 22 | Backend | Final backend demo check | `feature/demo-polish` | Seed → score → AI flow completes clean |

---

## Gaps Needed Before Demo (Not Originally Planned)

These are not nice-to-have. They protect the demo.

| Gap | Why It Matters | Owner | Priority |
|---|---|---|---|
| Seed data calibration | Score must tell the intended Carles story | Backend + Team Lead | 🔴 High |
| Full demo walkthrough script | Prevents messy live demo | Team Lead | 🔴 High |
| E2E smoke test | Catches broken routes before demo | Both | 🔴 High |
| Error and loading states on all screens | Prevents awkward blank screens | Frontend | 🔴 High |
| AI fallback response | OpenAI may fail or rate-limit during demo | Backend | 🔴 High |
| API contract check | Frontend and backend field names must match | Both | 🔴 High |
| Demo screenshots backup | Needed if internet or API fails live | Team Lead | 🔴 High |
| Security sanity check | API keys must not be exposed in frontend | Backend + Team Lead | 🔴 High |
| Accessibility pass | Judges may notice poor contrast and focus | Frontend | 🟡 Medium |
| Mobile/responsive check | Demo may happen on projector | Frontend | 🟡 Medium |
| .env.example completeness | Dev environment must be repeatable | Backend | 🟡 Medium |

---

## Definition of Done — By Role

### Backend Done Means
- API endpoint returns expected data
- Database query is scoped correctly
- Scoring rules are deterministic
- OpenAI does not calculate the numeric score
- Tests or manual API checks pass
- No API keys exposed
- Seed data supports the demo story

### Frontend Done Means
- Route loads without crash
- API data renders correctly
- Loading, empty, and error states exist
- UI works on laptop or demo screen
- No obvious contrast or focus issues
- No console errors
- Screen matches the demo flow

### Team Lead Done Means
- PR reviewed and acceptance criteria checked
- Scope has not expanded
- Demo story still holds
- main remains stable and deployable
- Team knows what the next task is

---

## Parallel Work Plan

```
RIGHT NOW — finish open PRs:
  Frontend  →  Fix and merge PR #5  (Assets Table)
  Frontend  →  Fix and merge PR #6  (Map View)
  Frontend  →  Rebase + wire + merge PR #7  (AI Advisor UI)

AFTER all 3 frontend PRs merge:
  Backend   →  Task B3  (CI/CD backend)
  Frontend  →  Task F5  (CI/CD frontend step)
  Both      →  feature/cicd-deployment merged

AFTER CI/CD merges:
  Both      →  Task P1  (Demo polish — all screens, calibration, E2E, script)
```

---

## Important Rules for All Devs

1. **CI files belong in `feature/cicd-deployment` only.** Do not add `ci.yml`, `scheduled-review.yml`, or `scheduled_review.py` changes to feature/assets-table, feature/map-view, or feature/ai-readiness-advisor branches.
2. **Do not merge `main` into your feature branch mid-development.** This pulls in unrelated files and causes CodeRabbit to review out-of-scope code. If you need to catch up with main, rebase instead.
3. **Category filter values must use singular backend enum values:** `work_spot`, `accommodation`, `service`, `transport`, `attraction`. Do NOT use plural forms.
4. **All frontend constants (category keys, colors, endpoints) must come from `frontend/src/lib/constants.js`.** Do not define duplicate local arrays in route files.
5. **OpenAI must never calculate the numeric score.** The backend Python scoring engine computes all numbers. OpenAI only explains the result and suggests LGU actions.

---

## Claude Code Skills

### Built-in Skills

| Skill | Invoke | Use in this project |
|---|---|---|
| `react-dev` | `/react-dev` | All frontend feature branches |
| `python-testing` | `/python-testing` | Backend scoring and API tests |
| `frontend-testing` | `/frontend-testing` | Dashboard and assets screens |
| `playwright-e2e-testing` | `/playwright-e2e-testing` | `feature/demo-polish` E2E tests |
| `wcag-accessibility-audit` | `/wcag-accessibility-audit` | `feature/demo-polish` accessibility check |
| `security-review` | `/security-review` | `feature/cicd-deployment` before prod |
| `dependency-vulnerability-triage` | `/dependency-vulnerability-triage` | `feature/cicd-deployment` npm audit |
| `simplify` | `/simplify` | Any branch after implementation |
| `review` | `/review` | Every PR before merge |
| `agent-ops-cicd-github` | `$agent-ops-cicd-github` | `feature/cicd-deployment` |

### Installed External Skills

| Skill | Use in this project |
|---|---|
| `chart-visualization` | `feature/dashboard-overview` — Recharts score cards and charts |
| `systematic-debugging` | Any branch — structured fault isolation |
| `test-driven-development` | `feature/scoring-engine` — write test first, then implement |

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
