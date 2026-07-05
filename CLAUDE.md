# CLAUDE.md

## Project Name

NomadReady PH

## Project Type

Hackathon MVP

## Core Goal

Build a working LGU dashboard that helps a tourism office evaluate whether a destination is ready for digital nomads.

Pilot destination: **Carles, Iloilo**

The MVP must show:

1. Digital Nomad Readiness Score
2. Five category score breakdown
3. Local asset data
4. Simple map with pins
5. Top readiness gaps
6. OpenAI-generated readiness explanation
7. OpenAI-generated LGU action plan

Winning demo flow:

```text
Local tourism data → Readiness score → Gaps → Map → AI action plan
```

---

## Final Tech Stack

Use only this stack unless explicitly instructed otherwise.

### Backend

- Django
- Django REST Framework
- PostgreSQL
- Python scoring service
- OpenAI API

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Recharts
- Leaflet
- OpenStreetMap

### DevOps

- Docker
- Docker Compose
- Git
- CI/CD from main branch

---

## Non-Negotiable Product Rules

1. OpenAI must not calculate the numeric Digital Nomad Readiness Score.
2. The numeric score must be calculated by deterministic backend Python code.
3. OpenAI may only explain the score and recommend LGU actions.
4. Only `lgu_verified` listings count toward scoring.
5. Draft listings must not increase the score.
6. Missing data should lower the score.
7. Category scores must be capped at 100.
8. Overall score must be rounded to the nearest whole number.
9. Do not build features outside the hackathon scope.
10. Do not change the architecture without approval.

---

## What We Are Building

Build only these 4 MVP screens:

1. Dashboard Overview
2. Destination Data / Local Assets
3. Map View
4. AI Readiness Advisor

---

## What We Are Not Building

Do not build these unless explicitly approved:

- Full digital nomad public app
- Login system unless required for deployment
- Business owner portal
- Booking system
- Payment system
- Review system
- Real-time Wi-Fi testing
- Public destination pages
- Multi-LGU comparison
- Advanced admin panel
- Mobile app
- Chatbot interface
- Complex role-based permissions
- Kubernetes
- Microservices

---

## Required Directory Architecture

Follow this monorepo structure:

```text
nomadready-ph/
  backend/
    manage.py
    requirements.txt
    Dockerfile
    config/
      settings.py
      urls.py
      asgi.py
      wsgi.py
    apps/
      destinations/
      listings/
      scoring/
      ai_advisor/
    tests/

  frontend/
    package.json
    vite.config.js
    Dockerfile
    src/
      main.jsx
      App.jsx
      routes/
        Dashboard.jsx
        Assets.jsx
        MapView.jsx
        AIAdvisor.jsx
      components/
        layout/
        dashboard/
        assets/
        map/
        ai/
        ui/
      services/
        api.js
      lib/
        constants.js
        formatters.js

  docs/
    00-product-context.md
    01-hackathon-scope.md
    02-build-spec.md
    03-directory-architecture-and-claude-workflow.md
    04-api-contract.md
    05-scoring-rules.md
    06-demo-script.md
    decisions/
      001-tech-stack.md
      002-scoring-model.md
      003-openai-advisor.md

  infra/
    deploy.md
    nginx.conf

  scripts/
    reset-dev.sh
    deploy.sh

  .github/
    workflows/
      ci.yml
      deploy.yml

  docker-compose.yml
  docker-compose.prod.yml
  .env.example
  README.md
  CLAUDE.md
```

---

## Required Docs to Read Before Coding

Before implementing any feature, read these files first:

```text
CLAUDE.md
docs/02-build-spec.md
docs/03-directory-architecture-and-claude-workflow.md
docs/04-api-contract.md
docs/05-scoring-rules.md
```

For demo polish, also read:

```text
docs/06-demo-script.md
```

Do not start coding until the implementation plan is approved.

---

## Development Workflow

Use this workflow:

```text
Spec → Task → Branch → Claude Implementation → Human Review → Test → Merge → Deploy
```

Do not use this workflow:

```text
Prompt Claude → Build Randomly → Debug Chaos
```

---

## Git Workflow

Use:

```text
1 feature = 1 branch
```

Branch naming format:

```text
feature/name-of-feature
```

Approved branch examples:

```text
feature/project-setup
feature/backend-models-seed
feature/scoring-engine
feature/dashboard-overview
feature/assets-table
feature/map-view
feature/ai-readiness-advisor
feature/cicd-deployment
feature/demo-polish
```

Rules:

1. Create feature branch from `main`.
2. Implement only the approved feature.
3. Do not push unfinished work to `main`.
4. Do not directly commit to `main`.
5. Run tests or checks before completion.
6. Submit a completion report.
7. Wait for human review before merge.
8. Keep `main` deployable.

**Exception — Team Lead direct commits to `main`:**

The team lead may commit directly to `main` without a PR for the following low-risk changes only:

- Documentation updates (`docs/`, `CLAUDE.md`, `README.md`)
- Status updates to `docs/03` after a PR merge
- Typo or formatting fixes in markdown files
- No code changes, no model changes, no API changes

All other changes — including any file under `backend/` or `frontend/` — must go through a feature branch and PR regardless of who makes them.

---

## Backend Architecture Rules

Backend folder: `backend/`

Django apps:

```text
backend/apps/destinations/
backend/apps/listings/
backend/apps/scoring/
backend/apps/ai_advisor/
```

### destinations

Handles the Carles destination profile.

### listings

Handles local assets:

- Work spots
- Accommodations
- Services
- Transport
- Attractions

### scoring

Handles deterministic rule-based scoring.

All numeric score calculation must live here:

```text
backend/apps/scoring/services.py
```

### ai_advisor

Handles OpenAI-powered readiness explanations and LGU action recommendations.

OpenAI logic must live here:

```text
backend/apps/ai_advisor/services.py
```

---

## Frontend Architecture Rules

Frontend folder: `frontend/`

Routes:

```text
/
/dashboard
/assets
/map
/ai-advisor
```

Route behavior:

- `/` redirects to `/dashboard`
- `/dashboard` shows Dashboard Overview
- `/assets` shows Destination Data / Local Assets
- `/map` shows Map View
- `/ai-advisor` shows AI Readiness Advisor

Frontend API calls should be centralized in:

```text
frontend/src/services/api.js
```

Do not scatter API calls across many components unless approved.

---

## Readiness Categories

The MVP uses exactly 5 categories:

1. Internet & Work Readiness
2. Long-Stay Accommodation
3. Safety & Essential Services
4. Transport & Access
5. Tourism & Lifestyle Appeal

Do not add more categories during the hackathon MVP.

---

## Scoring Formula

Each category is scored from 0 to 100.

Overall formula:

```text
Digital Nomad Readiness Score =
(Internet & Work Readiness × 0.30) +
(Long-Stay Accommodation × 0.20) +
(Safety & Essential Services × 0.20) +
(Transport & Access × 0.15) +
(Tourism & Lifestyle Appeal × 0.15)
```

Weights:

```text
Internet & Work Readiness: 30%
Long-Stay Accommodation: 20%
Safety & Essential Services: 20%
Transport & Access: 15%
Tourism & Lifestyle Appeal: 15%
```

Score labels:

```text
0–39   Not Yet NomadReady
40–59  Emerging Destination
60–74  Developing NomadReady Destination
75–89  NomadReady Destination
90–100 Highly NomadReady Destination
```

---

## Scoring Rules

### Internet & Work Readiness

Maximum: 100 points

Base score:

```text
5+ verified work-friendly places with Wi-Fi: 30
3–4 verified work-friendly places with Wi-Fi: 20
1–2 verified work-friendly places with Wi-Fi: 10
No verified work-friendly places: 0
```

Additional points:

```text
At least 3 places publish Wi-Fi speed: 25
At least 3 places are Zoom-friendly: 20
At least 3 places have power outlets: 15
Mobile data coverage is available: 10
```

### Long-Stay Accommodation

Maximum: 100 points

Base score:

```text
5+ long-stay options: 35
3–4 long-stay options: 25
1–2 long-stay options: 10
No long-stay options: 0
```

Additional points:

```text
Monthly rates are published: 25
Listings have Wi-Fi: 20
Listings have desk, kitchen, or laundry access: 20
```

### Safety & Essential Services

Maximum: 100 points

```text
Clinic or hospital is listed: 25
Police or emergency contact is listed: 20
Pharmacy is listed: 15
ATM is listed: 15
Laundry or grocery is listed: 15
Safety notes are available: 10
```

### Transport & Access

Maximum: 100 points

```text
Main access route from Iloilo City is listed: 30
Port or terminal is listed: 25
Local transport option is listed: 20
Schedules or fare information is available: 15
Travel time is shown: 10
```

### Tourism & Lifestyle Appeal

Maximum: 100 points

Base score:

```text
5+ attractions or activities are listed: 30
3–4 attractions or activities are listed: 20
1–2 attractions or activities are listed: 10
No attractions listed: 0
```

Additional points:

```text
Island hopping or beach activity is available: 25
Tour operator is listed: 20
Food, culture, nature, or wellness activity is listed: 15
Event or community activity is listed: 10
```

---

## Backend Models

Create these models:

### Destination

Fields:

```text
id
name
province
municipality
description
created_at
updated_at
```

### Listing

Fields:

```text
id
destination
name
category
type
address
latitude
longitude
details
verification_status
created_at
updated_at
```

Listing category options:

```text
work_spot
accommodation
service
transport
attraction
```

Verification status options:

```text
draft
lgu_verified
needs_update
```

Use a JSON field for `details`.

### ScoreSnapshot

Fields:

```text
id
destination
overall_score
score_label
internet_work_score
accommodation_score
safety_services_score
transport_score
tourism_lifestyle_score
strongest_category
weakest_category
top_gaps
created_at
```

Use JSON field for `top_gaps`.

### AIRecommendation

Fields:

```text
id
destination
score_snapshot
title
affected_category
recommendation
priority
reason
generated_at
```

Priority options:

```text
high
medium
low
```

---

## API Endpoints

Base URL:

```text
/api/
```

Required endpoints:

```text
GET  /api/destinations/carles/
GET  /api/listings/
POST /api/listings/
PATCH /api/listings/{id}/
GET  /api/scores/current/
POST /api/scores/recalculate/
POST /api/ai-advisor/generate/
```

For the hackathon, `POST /api/listings/` and `PATCH /api/listings/{id}/` are optional if seeded demo data is enough.

---

## OpenAI Advisor Rules

The OpenAI Advisor receives structured data from the backend:

```text
destination name
overall score
score label
category scores
strongest category
weakest category
top gaps
verified listing summary
missing data
```

The OpenAI output must include:

```text
summary
strengths
weaknesses
recommendations
```

OpenAI must follow these guardrails:

1. Do not invent places.
2. Do not invent statistics.
3. Do not change the numeric score.
4. Mention missing data clearly.
5. Recommendations must be practical for an LGU.
6. Tone must be professional, constructive, and government-friendly.
7. Output should be structured JSON when possible.

---

## Required Backend Service Functions

Create scoring functions in:

```text
backend/apps/scoring/services.py
```

Required functions:

```python
calculate_internet_work_score(listings) -> int
calculate_accommodation_score(listings) -> int
calculate_safety_services_score(listings) -> int
calculate_transport_score(listings) -> int
calculate_tourism_lifestyle_score(listings) -> int
calculate_overall_score(category_scores) -> dict
get_score_label(overall_score) -> str
get_top_gaps(category_scores, listings) -> list[str]
calculate_destination_score(destination_id) -> ScoreSnapshot
```

Create OpenAI advisor function in:

```text
backend/apps/ai_advisor/services.py
```

Required function:

```python
generate_readiness_advice(destination_id, score_snapshot_id) -> dict
```

---

## Required Frontend Screens

### Dashboard Overview

Route: `/dashboard`

Required UI:

- Header
- Overall score card
- Score label
- 5 category score cards
- Top gaps card
- AI recommendations preview
- Key metrics cards

### Destination Data / Local Assets

Route: `/assets`

Required UI:

- Page header
- Category filters
- Listings table
- Verification status display

Categories:

```text
All
Work Spots
Accommodations
Services
Transport
Attractions
```

### Map View

Route: `/map`

Required UI:

- Leaflet map
- OpenStreetMap tiles
- Pins for local assets
- Map legend
- Popup on pin click

### AI Readiness Advisor

Route: `/ai-advisor`

Required UI:

- Score summary panel
- Generate AI Recommendations button
- Loading state
- AI readiness summary
- Strengths
- Weaknesses
- Top 3 recommended actions
- Recommendation cards

---

## Demo Data

Seed enough Carles data to produce this target story:

```text
Overall Score: 68 / 100
Label: Developing NomadReady Destination
```

Target category scores:

```text
Internet & Work Readiness: 55
Long-Stay Accommodation: 60
Safety & Essential Services: 75
Transport & Access: 70
Tourism & Lifestyle Appeal: 90
```

Demo story:

```text
Carles is strong in tourism.
Carles has decent access and services.
Carles needs better work-ready infrastructure and long-stay packaging.
```

Example seed listings:

```text
Work spots:
- Carles Port Café
- Isla Work Lounge
- Gigantes Gateway Inn Lobby

Accommodations:
- Carles Bay Homestay
- Gigantes Gateway Pension
- Island Stay Carles

Services:
- Carles Municipal Health Office
- Carles Police Station
- Local Pharmacy
- Laundry Service
- ATM near town center

Transport:
- Iloilo City to Carles van route
- Bancal Port
- Tricycle local transport
- Boat route to Gigantes Islands

Attractions:
- Gigantes Islands
- Cabugao Gamay Island
- Bantigue Sandbar
- Antonia Beach
- Seafood food experience
```

Mark demo listings as sample data where needed.

---

## Docker Requirements

Use Docker Compose.

Required services:

```text
backend
frontend
db
```

Environment variables:

```text
POSTGRES_DB=nomadready
POSTGRES_USER=nomadready
POSTGRES_PASSWORD=nomadready_dev
DATABASE_URL=postgres://nomadready:nomadready_dev@db:5432/nomadready
OPENAI_API_KEY=
DJANGO_SECRET_KEY=
DJANGO_DEBUG=True
```

Backend port: `8000`

Frontend development port: `5173`

Database port: `5432`

---

## Testing Requirements

### Backend Tests

Required tests:

1. Score label test
2. Internet & Work Readiness scoring test
3. Accommodation scoring test
4. Safety & Services scoring test
5. Transport scoring test
6. Tourism scoring test
7. Overall score calculation test
8. Current score API test
9. Listings API test
10. AI Advisor endpoint mock test

### Frontend Manual Checks

Required manual checks:

1. Dashboard loads
2. Score cards display
3. Category scores display
4. Asset table filters work
5. Map loads
6. Pins appear
7. Pin popups display listing details
8. AI button triggers API call
9. Loading state appears
10. AI recommendations display
11. Layout works on laptop screen

---

## Commands to Run

Backend checks:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
```

Frontend checks:

```bash
docker compose exec frontend npm run build
```

Database commands:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo_data
```

Full local startup:

```bash
docker compose up -d --build
```

---

## Claude Code Task Protocol

Before coding any feature, respond with:

```text
1. What I understand
2. Files I expect to modify
3. Implementation steps
4. Acceptance criteria
5. Risks or unclear items
```

Do not write code until the human approves the plan.

After completing a feature, respond with:

```text
1. Feature branch name
2. Summary of what was implemented
3. Files changed
4. Tests or checks run
5. Acceptance criteria status
6. Anything not completed
7. Risks or follow-up needed
8. Confirmation that no out-of-scope features were added
```

---

## PR Review Check Rules

When checking whether a PR is ready to merge, always do the following:

1. **Check the latest review chronologically — not just whether CHANGES_REQUESTED exists anywhere in the history.**
   A PR may have an old CHANGES_REQUESTED from round 1 and a newer APPROVED after the dev addressed the feedback. The latest review state is what matters.

2. **Check reviews in order per reviewer.** If CodeRabbit or any reviewer posted multiple rounds, the most recent round is the current verdict.

3. **A PR is ready for team lead review only when all of the following are true:**
   - Latest review state is APPROVED (or no blocking reviews remain)
   - No merge conflicts with main
   - CI checks pass (or no CI configured)

4. **Do not report a PR as blocked solely because an older CHANGES_REQUESTED review exists if a subsequent APPROVED review was posted on a later commit.**

5. **When in doubt, read the actual review timeline** using:
   ```bash
   gh pr view <number> --json reviews --jq '.reviews[] | "[\(.state)] \(.author.login) \(.submittedAt[:10])"'
   ```

6. **After every PR merge, update `docs/03-directory-architecture-and-claude-workflow.md`** — update the Feature Branch Build Order table and Team Task Split status to reflect the merge. Do this immediately after confirming the merge, without waiting to be asked.

7. **Always check both open AND recently merged PRs.** Never query `--state open` alone. A PR merged by the team lead will no longer appear in open PRs but is still relevant to the current state of main. Always verify against `git log origin/main` to confirm what has actually landed.
   ```bash
   gh pr list --state all --limit 20
   git log origin/main --oneline -10
   ```

---

## Scaffolding Task Instruction

When asked to scaffold the project, do only the initial project structure.

Scaffolding scope:

- Create backend Django project structure
- Create Django apps: destinations, listings, scoring, ai_advisor
- Create frontend React + Vite structure
- Create placeholder route files
- Create Dockerfiles
- Create docker-compose.yml
- Create `.env.example`
- Create placeholder docs files
- Create placeholder scripts
- Create basic `README.md`
- Create initial `CLAUDE.md`

Out of scope during scaffolding:

- Do not implement database models yet
- Do not implement scoring yet
- Do not implement OpenAI integration yet
- Do not build UI details yet
- Do not add login
- Do not add public digital nomad app
- Do not add booking, reviews, payments, or multi-LGU features

After scaffolding:

- Show the final directory tree
- Explain what was created
- List commands to run locally
- List assumptions or setup issues
- Do not proceed to backend models until approved

---

## Feature Branch Build Order

Build in this order:

1. `feature/project-setup`
2. `feature/backend-models-seed`
3. `feature/scoring-engine`
4. `feature/dashboard-overview`
5. `feature/assets-table`
6. `feature/map-view`
7. `feature/ai-readiness-advisor`
8. `feature/cicd-deployment`
9. `feature/demo-polish`

Do not skip ahead unless approved.

---

## Team Usage Guidance

Use Claude Code this way:

**Team Lead uses Claude for planning, reviewing, and demo polish.**

**Backend dev uses Claude for Django, scoring, APIs, and tests.**

**Frontend dev uses Claude for React screens, Tailwind, map, and API integration.**

Claude should follow the docs.

Claude should not decide scope.

Claude should not change architecture without approval.

Claude should not add features because they are “nice to have.”

Claude should implement the approved specs, one feature branch at a time.

---

## Final Demo Message

NomadReady PH helps LGUs prepare for the future of tourism by showing whether a destination is ready for digital nomads, what gaps need to be fixed, and what actions should be taken first.

Pilot destination:

**Carles, Iloilo — from island tourism destination to digital nomad-ready destination.**
