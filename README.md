# NomadReady PH

An AI-powered LGU dashboard that helps a tourism office evaluate whether a destination is ready for digital nomads — and what to do about it.

**Pilot destination: Carles, Iloilo**
From island tourism destination to digital nomad-ready destination.

---

## What This Project Is

NomadReady PH answers one question for a Local Government Unit:

> *Is our destination ready not only for short-term tourists, but also for digital nomads who want to stay, work, and explore?*

The dashboard shows a Digital Nomad Readiness Score, breaks it down by five categories, maps local assets, identifies gaps, and generates an AI-powered LGU action plan.

**Winning demo flow:**
```
Local tourism data → Readiness score → Gaps → Map → AI action plan
```

---

## MVP Screens

| Screen | Route | Purpose |
|---|---|---|
| Dashboard Overview | `/dashboard` | Overall score, 5 category scores, top gaps, AI preview |
| Local Assets | `/assets` | Verified listings table with category filters |
| Map View | `/map` | Leaflet map with pins for all local assets |
| AI Readiness Advisor | `/ai-advisor` | OpenAI-generated summary and LGU action plan |

`/` redirects to `/dashboard`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django, Django REST Framework, PostgreSQL |
| Scoring | Deterministic Python — `backend/apps/scoring/services.py` |
| AI | OpenAI API — explanation and action plan only, never the score |
| Frontend | React, Vite, Tailwind CSS, React Router, Recharts, Leaflet |
| DevOps | Docker, Docker Compose, Git |

---

## Environment Setup

Copy the example environment file and fill in your secrets:

```bash
cp .env.example .env
```

Required values to set in `.env`:

```
DJANGO_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-key-here
```

All other values in `.env.example` work for local development without changes.
Never commit `.env` to git.

---

## Local Development

### Prerequisites

- Docker Desktop installed and running
- `.env` file created from `.env.example` (see above)

### Start the project

```bash
docker compose up -d --build
```

This starts three services:
- `db` — PostgreSQL on port `5433` (host) / `5432` (internal Docker network)
- `backend` — Django on port `8000`
- `frontend` — React + Vite on port `5173`

### First-time setup

Run migrations after the database is healthy:

```bash
docker compose exec backend python manage.py migrate
```

Seed Carles demo data:

```bash
docker compose exec backend python manage.py seed_demo_data
```

### Open the app

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- Django admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)

### Stop the project

```bash
docker compose down
```

---

## Docker Commands Reference

| Command | Purpose |
|---|---|
| `docker compose up -d --build` | Build and start all services |
| `docker compose down` | Stop all services |
| `docker compose logs backend` | View backend logs |
| `docker compose logs frontend` | View frontend logs |
| `docker compose exec backend python manage.py migrate` | Run database migrations |
| `docker compose exec backend python manage.py seed_demo_data` | Load Carles demo data |
| `docker compose exec backend python manage.py check` | Run Django system checks |
| `docker compose exec backend python manage.py test` | Run backend tests |
| `docker compose exec frontend npm run build` | Test frontend production build |

---

## Project Structure

```
nomadready/
  backend/
    config/           Django project config (settings, urls, wsgi, asgi)
    apps/
      destinations/   Carles destination profile
      listings/       Local assets (work spots, accommodations, services, transport, attractions)
      scoring/        Deterministic readiness score calculation — services.py
      ai_advisor/     OpenAI explanation and LGU action plan — services.py
    tests/

  frontend/
    src/
      routes/         Dashboard, Assets, MapView, AIAdvisor
      components/     layout/, dashboard/, assets/, map/, ai/, ui/
      services/       api.js — all backend calls go here
      lib/            constants.js, formatters.js

  docs/               Planning docs, API contract, scoring rules, decisions
  docs/source-pdfs/   Original planning PDFs and reference documents
  infra/              Nginx config and deployment notes
  scripts/            reset-dev.sh, deploy.sh
  .github/workflows/  CI and deploy pipeline placeholders
```

---

## Important Docs

Read these before implementing any feature:

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project rules, architecture, scoring formula, Claude Code protocol |
| `docs/02-build-spec.md` | Full build specification |
| `docs/04-api-contract.md` | API endpoint definitions |
| `docs/05-scoring-rules.md` | Scoring formula and category rules |
| `docs/06-demo-script.md` | Demo flow and target scores |
| `docs/07-spec-driven-development-methodology.md` | How to work on this project |

For architecture decisions:

| File | Topic |
|---|---|
| `docs/decisions/001-tech-stack.md` | Why this stack |
| `docs/decisions/002-scoring-model.md` | Why scoring is deterministic Python |
| `docs/decisions/003-openai-advisor.md` | What OpenAI may and may not do |

---

## Branch Workflow

**One feature = one branch.** Branch from `main`. Do not commit directly to `main`.

```
git checkout main
git pull
git checkout -b feature/your-feature-name
```

Git workflow:

```
Spec → Task → Branch → Claude Implementation → Human Review → Test → Merge → Deploy
```

Branch naming format: `feature/name-of-feature`

---

## Feature Branch Build Order

Build in this order. Do not skip ahead without approval.

| # | Branch | Purpose |
|---|---|---|
| 1 | `feature/project-setup` | Scaffolding ✅ |
| 2 | `feature/backend-models-seed` | Django models and Carles demo data ✅ |
| 3 | `feature/scoring-engine` | Deterministic scoring logic and tests ✅ |
| 4 | `feature/dashboard-overview` | Dashboard screen with score cards |
| 5 | `feature/assets-table` | Local assets table with filters |
| 6 | `feature/map-view` | Leaflet map with asset pins |
| 7 | `feature/ai-readiness-advisor` | OpenAI advisor screen |
| 8 | `feature/cicd-deployment` | CI/CD pipeline and production config |
| 9 | `feature/demo-polish` | Demo-ready polish and final checks |

---

## Team Roles

| Role | Responsibilities |
|---|---|
| Team Lead | Planning, reviewing, demo polish, Claude Code coordination |
| Backend Dev | Django models, scoring engine, APIs, tests |
| Frontend Dev | React screens, Tailwind UI, Leaflet map, API integration |

**How to use Claude Code:**

- Always present a plan and wait for approval before coding.
- Claude follows the spec. Claude does not decide scope.
- Claude does not change architecture without approval.
- Claude does not add features because they are "nice to have."

---

## What Is Out of Scope

Do not build these unless explicitly approved:

- Full digital nomad public app
- Login system
- Business owner portal
- Booking, payment, or review system
- Real-time Wi-Fi testing
- Public destination pages
- Multi-LGU comparison
- Advanced admin panel
- Mobile app
- Chatbot interface
- Kubernetes or microservices

---

## Non-Negotiable Rules

1. OpenAI must not calculate the numeric score.
2. The numeric score must be calculated by deterministic Python code.
3. OpenAI may only explain the score and recommend LGU actions.
4. Only `lgu_verified` listings count toward scoring.
5. Draft listings must not increase the score.
6. Missing data lowers the score.
7. Category scores are capped at 100.
8. Overall score is rounded to the nearest whole number.
9. Do not build features outside the hackathon scope.
10. Do not change architecture without approval.

---

## Current Status

| Branch | Status |
|---|---|
| `feature/project-setup` | ✅ Merged to main |
| `feature/backend-models-seed` | ✅ Merged to main |
| `feature/scoring-engine` | Next |

Claude Code skills installed and mapped to feature branches.
See `docs/03-directory-architecture-and-claude-workflow.md` for the full skills guide.
