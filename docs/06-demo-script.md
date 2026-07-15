# 06 — Demo Script

> **Last updated:** 2026-07-12
> **Updated by:** Team Lead
> **Reason:** Updated to reflect actual score story from calibrated seed data. All values confirmed by scoring engine simulation.

---

## Demo Story

Carles is strong in tourism and lifestyle. Carles has decent transport access and safety services. Carles needs better work-ready infrastructure and long-stay accommodation packaging to attract digital nomads.

---

## Final Score Story — Approved

```
Overall Score:  68 / 100
Label:          Developing NomadReady Destination
```

| Category | Score | Story |
|---|---|---|
| Internet & Work Readiness | **45** | Needs improvement — only 2 verified work spots with Wi-Fi |
| Long-Stay Accommodation | **70** | Decent — options exist but not packaged for nomads |
| Safety & Essential Services | **75** | Good — health, police, pharmacy, ATM all listed |
| Transport & Access | **70** | Good — Iloilo route, port, local transport, schedules listed |
| Tourism & Lifestyle Appeal | **100** | Excellent — 5 attractions including Gigantes Islands, island hopping, food scene |

**Demo narrative:**
- Tourism is the strongest card — Carles has world-class island destinations
- Safety and transport are solid — accessible, reasonably safe
- Work readiness is the critical gap — not enough cafés or co-working spots with reliable Wi-Fi
- Accommodation exists but lacks long-stay packaging (monthly rates, desk, kitchen)

---

## Demo Click-Path

Follow this exact sequence during the live demo.

### Screen 1 — Dashboard Overview (`/dashboard`)

**URL:** `http://localhost:5173/dashboard`

**Click path:**
1. Open the app — dashboard loads automatically
2. Point to the overall score card: **68 / 100 — Developing NomadReady Destination**
3. Walk through the 5 category cards left to right:
   - Internet & Work Readiness: **45** — "This is the critical gap"
   - Long-Stay Accommodation: **70** — "Options exist, not yet packaged for nomads"
   - Safety & Essential Services: **75** — "Solid foundation"
   - Transport & Access: **70** — "Well-connected from Iloilo City"
   - Tourism & Lifestyle Appeal: **100** — "World-class islands and activities"
4. Point to the Top Readiness Gaps card — **Internet and work-ready infrastructure** appears as the top gap

**Talking points:**
- "This is what an LGU tourism officer sees when they open NomadReady."
- "The score of 68 tells us Carles is developing — not yet there, but on the right track."
- "The biggest gap is work readiness. Digital nomads need reliable Wi-Fi and a good place to work."
- "Tourism is already perfect. Carles doesn't need to attract tourists — it needs to convert them into long-stay nomads."

---

### Screen 2 — Local Assets (`/assets`)

**URL:** `http://localhost:5173/assets`

**Click path:**
1. Click "Local Assets" or "Destination Data" in the navigation
2. Default view shows All listings — 20 listings visible
3. Click **Work Spots** filter tab — shows 3 work spots (Carles Port Café, Isla Work Lounge, Gigantes Gateway Inn Lobby)
4. Click **Accommodations** filter — shows 3 accommodations (Carles Bay Homestay, Gigantes Gateway Pension, Island Stay Carles)
5. Click **Services** filter — shows health, police, pharmacy, ATM, laundry listings
6. Click **Transport** filter — shows van route, port, tricycle, boat route listings
7. Click **Attractions** filter — shows 5 attractions including Gigantes Islands, Cabugao Gamay Island, Bantigue Sandbar

**Talking points:**
- "This is the underlying data. Every score comes from real listings the LGU enters and verifies."
- "Only LGU-verified listings count toward the score. If it's a draft, it doesn't move the number."
- "Right now we have 3 work spots — not enough. The LGU needs to identify and verify more co-working-ready spaces."
- "Look at tourism — 5 verified attractions. That's why the tourism score is 100."

---

### Screen 3 — Map View (`/map`)

**URL:** `http://localhost:5173/map`

**Click path:**
1. Click "Map View" in the navigation
2. Map loads centered on Carles, Iloilo — all listing pins visible
3. Point to the cluster of pins in the town center (services, work spots)
4. Click any pin — popup shows listing name, category, and address
5. Point to the pins for Gigantes Islands (further offshore)
6. Refer to the map legend — color-coded by category

**Talking points:**
- "Every listing is on the map. The LGU can see at a glance where services are concentrated."
- "Notice the gap — most work spots are clustered in town. Nothing out near the islands."
- "This map view helps the LGU plan: where should the next co-working space go?"

---

### Screen 4 — AI Readiness Advisor (`/ai-advisor`)

**URL:** `http://localhost:5173/ai-advisor`

**Click path:**
1. Click "AI Advisor" in the navigation
2. Show the score summary panel — overall score and category breakdown are pre-loaded
3. Click **Generate AI Recommendations** button
4. Loading state appears — show the spinner briefly
5. AI response loads:
   - Summary panel — 2-3 sentence overview of Carles' readiness
   - Strengths — what's already working
   - Weaknesses — what needs improvement
   - Top 3 Recommended Actions — priority-ordered LGU action cards

**Talking points:**
- "This is the AI advisor. It doesn't calculate the score — our Python engine does that."
- "What the AI does is explain the score and translate it into action items for the LGU."
- "Notice the recommendations are specific and practical — things an LGU can actually do."
- "Priority is set: high, medium, low. The LGU knows exactly where to start."
- "This is what we're handing to the tourism officer — a clear action plan, not just a number."

---

## Closing Pitch

> "NomadReady PH gives LGUs a data-driven way to understand where they stand and what to do next. Carles is at 68 — developing. With targeted investments in work-ready infrastructure and long-stay packaging, they can hit 75 and become a certified NomadReady Destination. This tool shows them exactly what to prioritize."

---

## Backup Plan

If the demo environment fails:

| Failure | Fallback |
|---|---|
| Docker not running | Use screenshots — see `docs/screenshots/` (to be added before demo) |
| OpenAI API fails | AI Advisor falls back to structured placeholder response — demo still works |
| Database empty | Run `docker compose exec backend python manage.py seed_demo_data` |
| Score shows 0 | Run `POST /api/scores/recalculate/` via curl or Postman |
| Frontend blank | Check `docker compose logs frontend` for build error |

---

## Pre-Demo Checklist

Run this before going live:

```bash
# 1. Start services
docker compose up -d

# 2. Verify seed data is loaded
docker compose exec backend python manage.py shell -c "from apps.listings.models import Listing; print(Listing.objects.count(), 'listings')"
# Expected: 20 listings

# 3. Recalculate score
curl -s -X POST http://localhost:8000/api/scores/recalculate/ | python3 -m json.tool

# 4. Verify score
# Expected: overall_score=68, score_label="Developing NomadReady Destination"

# 5. Open browser
open http://localhost:5173/dashboard
```
