# 08 — Backend Dev Task List

> **Last updated:** 2026-07-05
> **Owner:** Backend Dev
> **Reviewed by:** Team Lead

---

## Backend Goal

Build the backend that turns Carles local tourism data into:

1. Local asset and listing API
2. Digital Nomad Readiness Score
3. Five category scores
4. Top readiness gaps
5. AI-generated LGU action plan

---

## Scope Note

You are **not** responsible for:
- CI/CD pipelines
- Deployment or server management
- nginx configuration
- Production environment setup
- docker-compose.prod.yml

The Team Lead handles all of the above.

---

## Full Backend Task List

| Status | Task | Required Work | Done Means |
|---|---|---|---|
| ✅ | Django backend setup | Django + DRF backend runs inside Docker | Backend container starts successfully |
| ✅ | PostgreSQL connection | Backend connects to Postgres database | Migrations run without error |
| ✅ | Destination model | Create `Destination` model for Carles, Iloilo | Carles destination exists in DB |
| ✅ | Listing model | Create `Listing` model for local tourism assets | Assets can be stored with category, address, lat/lng, details, verification status |
| ✅ | ScoreSnapshot model | Create model for readiness score results | Overall score, label, five category scores, strongest/weakest category, and gaps can be saved |
| ✅ | AIRecommendation model | Create model for AI-generated recommendations | AI recommendations can be linked to destination and score snapshot |
| ✅ | Seed Carles demo data | Add Carles destination and demo listings | Database has realistic demo data for work spots, accommodations, services, transport, attractions |
| ✅ | Listings API | Build listing API endpoints | Frontend can fetch, create, and update listings |
| ✅ | Destination API | Build Carles destination endpoint | Frontend can fetch Carles destination info |
| ✅ | Scoring engine | Build Python scoring function | Backend calculates readiness score without OpenAI |
| ✅ | Score rules | Enforce scoring rules | Only `lgu_verified` listings count; drafts do not increase score; missing data lowers score |
| ✅ | Current score API | Build endpoint for latest readiness score | Dashboard can fetch overall score, label, five category scores, top gaps |
| ✅ | Recalculate score API | Build endpoint to recalculate score | Backend recalculates score from current listing data |
| ✅ | AI Advisor backend service | Build OpenAI service | AI explains score and recommends actions, but does not calculate numeric score |
| ✅ | AI Advisor API | Build AI generate endpoint | Frontend can request AI explanation and recommendations |
| ⬜ | AI fallback response | Add fallback if OpenAI fails | Demo still works even if OpenAI is unavailable |
| ⬜ | AI output structure hardening | Make AI response predictable | API returns summary, strengths, weaknesses, and top 3 actions consistently |
| ⬜ | API contract check | Match frontend field names | Dashboard, assets table, map, and AI advisor all receive expected fields |
| ⬜ | Carles score calibration | Adjust seed data or scoring output | Demo score lands around **68/100** with label **Developing NomadReady Destination** |
| ⬜ | Top gaps calibration | Ensure gaps match demo story | Gaps show weak internet/work readiness and long-stay accommodation packaging |
| ⬜ | Backend smoke testing | Test all backend endpoints | Destination, listings, current score, recalculate score, and AI advisor endpoints work |
| ⬜ | Backend security check | Check API key and backend settings | OpenAI key stays server-side; no secret exposed to frontend |
| ⬜ | Final backend demo check | Run seed → recalculate score → generate AI action plan | Backend supports the full demo flow |

---

## Remaining Tasks — Detail

### Task 1 — AI Fallback Response

**Branch:** `feature/demo-polish`

If OpenAI fails, times out, or the API key is missing, the backend must return a safe, demo-ready fallback response instead of an error.

**Required behavior:**
- If OpenAI is unavailable → return a structured placeholder response
- Placeholder must match the same shape as a real response:
  - `summary` — string
  - `strengths` — list of strings
  - `weaknesses` — list of strings
  - `recommendations` — list of 3 items, each with `title`, `affected_category`, `priority`, `reason`, `suggested_next_step`
- The AI Advisor page must never show a crash or blank screen during the demo

**Done means:** Disconnect OpenAI, hit the endpoint — page still shows a structured response.

---

### Task 2 — AI Output Structure Hardening

**Branch:** `feature/demo-polish`

The API must consistently return the same structure regardless of what OpenAI returns.

**Required response structure:**
```json
{
  "summary": "string — 2 to 3 sentences",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "recommendations": [
    {
      "title": "string",
      "affected_category": "string",
      "priority": "high | medium | low",
      "reason": "string",
      "suggested_next_step": "string"
    }
  ]
}
```

**Rules:**
- OpenAI must never calculate the numeric score
- Backend scoring engine is the only source of the numeric score
- Recommendations list must always have exactly 3 items
- Priority must be validated against `high`, `medium`, `low` before DB write

**Done means:** Hit the endpoint 3 times in a row — same structure every time.

---

### Task 3 — API Contract Check

**Branch:** `feature/demo-polish`

Confirm that every field the frontend expects is present in backend responses.

**Endpoints to verify:**

| Endpoint | Key fields frontend expects |
|---|---|
| `GET /api/destinations/carles/` | `id`, `name`, `province`, `municipality`, `description` |
| `GET /api/listings/` | `id`, `name`, `category`, `type`, `address`, `latitude`, `longitude`, `details`, `verification_status` |
| `GET /api/scores/current/` | `overall_score`, `score_label`, `internet_work_score`, `accommodation_score`, `safety_services_score`, `transport_score`, `tourism_lifestyle_score`, `strongest_category`, `weakest_category`, `top_gaps` |
| `POST /api/scores/recalculate/` | Same fields as current score |
| `POST /api/ai-advisor/generate/` | `summary`, `strengths`, `weaknesses`, `recommendations` |

**Done means:** Every field in this table is present in the actual API response. No field name mismatches.

---

### Task 4 — Calibrate Carles Demo Score

**Branch:** `feature/demo-polish`

The demo score must tell the intended Carles story.

**Target output:**
```
Overall Score:  68 / 100
Label:          Developing NomadReady Destination

Internet & Work Readiness:    45
Long-Stay Accommodation:      70
Safety & Essential Services:  75
Transport & Access:           70
Tourism & Lifestyle Appeal:   100
```

> **Note:** These are the actual calibrated values confirmed by scoring engine simulation against the seeded demo data. No changes to scoring rules or seed data are needed — these scores are already achieved.

**Demo story the score must support:**
- Tourism and lifestyle is the strongest card → Carles has world-class islands and activities
- Safety and transport are solid → accessible and reasonably safe
- Internet and work readiness is the critical gap → only 2 verified work spots with Wi-Fi
- Long-stay accommodation exists but lacks long-stay packaging (monthly rates, desk, kitchen)

**Done means:** Run `POST /api/scores/recalculate/` on fresh seeded data — scores match the table above (already verified).

---

### Task 5 — Calibrate Top Readiness Gaps

**Branch:** `feature/demo-polish`

The gaps displayed on the Dashboard must clearly support the demo story.

**Actual gap output from current scoring engine:**
1. Internet and work-ready infrastructure (score: 45 — below 50 threshold)
2. Long-stay accommodation packaging and transport access are secondary talking points in the demo story, but are not surfaced as formal gaps (scores are 70 — above threshold)

> **Note:** `get_top_gaps()` in `scoring/services.py` uses score < 50 as the threshold. Only Internet (45) currently qualifies. Accommodation (70) and Transport (70) do not qualify as gaps. This is the approved behavior — do not change the threshold without team lead approval.

**Done means:** `GET /api/scores/current/` returns `top_gaps` that mention Internet and work-ready infrastructure. The demo talking points cover accommodation packaging as context, not as a formal gap card.

---

### Task 6 — Backend Smoke Test

**Branch:** `feature/demo-polish`

Manually verify all endpoints work end-to-end on a clean local environment.

**Test checklist:**
- [ ] `GET /api/destinations/carles/` → returns Carles destination data
- [ ] `GET /api/listings/` → returns all 20 demo listings
- [ ] `GET /api/listings/?category=work_spot` → returns only work spots
- [ ] `GET /api/listings/?verification_status=lgu_verified` → returns only verified listings
- [ ] `POST /api/listings/` → creates a new listing
- [ ] `PATCH /api/listings/{id}/` → updates a listing
- [ ] `GET /api/scores/current/` → returns current score snapshot
- [ ] `POST /api/scores/recalculate/` → recalculates and returns new snapshot
- [ ] `POST /api/ai-advisor/generate/` → returns AI recommendation structure
- [ ] `POST /api/ai-advisor/generate/` with OpenAI disabled → returns fallback response

**Done means:** All 10 checks pass. No 500 errors. No missing fields.

---

### Task 7 — Backend Security Check

**Branch:** `feature/demo-polish`

**Check these before demo:**
- [ ] `OPENAI_API_KEY` is set only in `.env` — never hardcoded in Python files
- [ ] `DJANGO_SECRET_KEY` is not the default Django key
- [ ] No API keys or secrets appear in `frontend/` code
- [ ] `.env` is in `.gitignore` and has not been committed
- [ ] `.env.example` lists all required environment variables with placeholder values
- [ ] `DJANGO_DEBUG=False` in production environment

**Done means:** All 6 checks pass.

---

### Task 8 — Final Backend Demo Readiness Check

**Branch:** `feature/demo-polish`

Run the full backend demo flow on a clean environment:

```
1. docker compose down -v       ← wipe database
2. docker compose up -d         ← fresh start
3. python manage.py migrate     ← apply migrations
4. python manage.py seed_demo_data   ← seed Carles data
5. POST /api/scores/recalculate/     ← generate score snapshot
6. POST /api/ai-advisor/generate/    ← generate AI recommendations
7. GET  /api/scores/current/         ← confirm score story
```

**Done means:** Full flow completes without error. Score lands near 68/100. AI response is structured and demo-ready.

---

## Rules You Must Never Break

1. **OpenAI must never calculate the numeric score.** Only `backend/apps/scoring/services.py` computes numbers.
2. **Only `lgu_verified` listings count toward the score.** Draft listings must not increase any score.
3. **Category scores are capped at 100.** No category can exceed 100 even if the rules add up to more.
4. **Overall score is rounded to the nearest whole number.**
5. **The AI fallback must never expose a raw exception or traceback to the frontend.**
