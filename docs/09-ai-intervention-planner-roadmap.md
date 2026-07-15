# 09 — AI Intervention Planner — Phase 2 Roadmap

> **Status:** Future scope — NOT part of the current hackathon MVP.
> **Phase:** 2 — post-hackathon extension
> **Last updated:** 2026-07-15
> **Author:** Team Lead
> **Source:** Feature request — AI Intervention Planner for NomadReady PH

---

## MVP Boundary — What This Document Is Not

This document describes a feature that does **not** exist yet and is **not** being built for the hackathon.

The current MVP (`main` branch) delivers:
- Readiness score and category breakdown
- Local asset data and map
- AI-generated readiness explanation and LGU recommendations

This document describes what Phase 2 would add on top of that foundation.

**Do not implement any part of this document without a separate approved spec and branch.**

---

## 1. Purpose

The AI Intervention Planner transforms NomadReady PH from a readiness assessment dashboard into a full LGU planning and decision-support system.

Where the current MVP answers:

> "How ready is Carles for digital nomads?"

The Intervention Planner answers:

> "Given our current assets, score, budget, and available time — what should we improve first, where, how much will it cost, and what will it do to our score?"

---

## 2. Why It Matters

The current system correctly identifies weaknesses. LGU officers using the dashboard already know, for example, that internet reliability or work-friendly spaces need improvement. What they cannot do yet is:

- Compare intervention options against their actual budget
- Estimate which intervention improves the score the most per peso spent
- See a simulated score before committing resources
- Get an evidence-grounded explanation they can take to the mayor or planning council

The Intervention Planner closes this gap. It gives the AI a more meaningful role: not just explaining a score, but helping an LGU decide where to act first.

Example of the shift in output quality:

**Current MVP output:**
> "Improve internet access and build coworking spaces."

**Intervention Planner output:**
> "Verify and equip three existing cafés near the main accommodation cluster with reliable internet, backup connectivity, charging stations, and work-friendly seating. This is estimated to increase the Work-Friendly Spaces score from 42 to 68 and the overall readiness score from 61 to 67."

The feature remains human-centered. The system recommends and simulates — the LGU decides.

---

## 3. How It Builds on the Current MVP

The Intervention Planner does not replace the readiness score. It consumes it.

```
Current MVP output:
  Overall score: 68
  Category scores
  Verified asset data
  Top gaps
  AI explanation
          ↓
Phase 2 adds:
  Gap and indicator analysis
  Intervention eligibility and ranking engine
  Budget and time-frame constraints
  Score simulation (via existing scoring rules)
  Evidence-grounded AI explanation of the plan
  Human review, save, and export
```

All existing models, scoring rules, and seed data remain unchanged. Phase 2 adds a new Django app (`interventions/`) and a new React route (`/intervention-planner`).

---

## 4. Proposed User Workflow

### Step 1 — Load Destination Baseline

LGU user selects a destination (MVP: Carles, Iloilo).

System loads:
- Current overall readiness score and category scores
- Verified and unverified local assets
- Geographic distribution of assets
- Missing or incomplete readiness indicators
- Current readiness gaps

### Step 2 — Identify Priority Gaps

The backend analyzes the score breakdown and classifies each indicator:

| Status | Description |
|---|---|
| Missing asset | No asset of this type exists |
| Existing but unverified | Asset exists but LGU has not verified it |
| Existing but incomplete | Asset exists but lacks key data (e.g. no Wi-Fi speed) |
| Existing, upgradeable | Asset exists and meets some requirements but not all |
| Geographic gap | Asset type exists but not in the needed area |

This distinction matters because upgrading an existing café is more affordable and faster than constructing new coworking infrastructure.

### Step 3 — LGU Provides Planning Constraints

Required inputs:
- Available budget
- Target implementation period
- Maximum number of interventions

Optional inputs:
- Priority readiness category
- Priority barangay or geographic area
- Preferred intervention type (upgrade existing vs. build new)
- Excluded intervention types
- Available LGU partners

A **quick mode** with defaults is also available:
- Budget: not specified
- Time frame: 6 months
- Goal: maximum score improvement
- Maximum interventions: 3

### Step 4 — Generate Eligible Interventions

The backend filters the intervention catalog against:
- The destination's current indicator state
- The LGU's budget and time-frame constraints
- Geographic availability of eligible assets

Each intervention template in the catalog specifies:
- Intervention name and description
- Affected readiness categories
- Required conditions for eligibility
- Estimated cost range
- Estimated duration
- Applicable asset types
- Estimated score effect per indicator change
- Responsible office suggestion
- Possible local partners

### Step 5 — Rank Interventions

The backend ranks eligible interventions using a weighted scoring model:

```
priority_score =
  (gap_severity          × 0.25)
+ (score_improvement     × 0.25)
+ (cost_efficiency       × 0.20)
+ (implementation_ease   × 0.15)
+ (geographic_relevance  × 0.10)
+ (multi_category_benefit × 0.05)
```

The ranking logic is deterministic, documented, and explainable. No black-box optimization model is required for the MVP.

When selecting multiple interventions, the planner checks that the combined set does not exceed the user's budget, exceeds the implementation period, or includes duplicate or conflicting interventions.

### Step 6 — Simulate Score Improvement

For each recommended intervention, the system:

1. Identifies which readiness indicators would change
2. Simulates the new indicator values
3. Passes the simulated indicators through the **existing scoring engine** (unchanged)
4. Reports the projected category and overall score

**Simulation is not performed by the LLM.** The LLM only explains the result.

Example simulation:

```
Before:
  Verified work-friendly cafés:     0
  Cafés with verified internet:     1
  Venues with backup connection:    0

After simulated intervention:
  Verified work-friendly cafés:     3
  Cafés with verified internet:     3
  Venues with backup connection:    3

Scoring engine result:
  Work-Friendly Spaces: 42 → 68
  Internet Reliability: 48 → 57
  Overall readiness:    61 → 67
```

### Step 7 — AI Explains the Plan

The LLM receives only the structured planner output (no raw data, no unverified claims) and generates:

- Why the intervention was selected
- Which evidence from the destination supports it
- Which readiness gaps it addresses
- Why it fits the budget and time frame
- Which LGU office may lead it
- Which local partners may participate
- What assumptions were made
- What the estimated score improvement means
- What the plan does not guarantee

The explanation must include this disclaimer:

> "The projected score represents an estimated improvement in digital-nomad readiness based on the current scoring framework. It does not guarantee a specific increase in tourist arrivals, business revenue, or economic activity."

### Step 8 — Human Review and Action

The LGU user can:
- Accept a recommendation
- Remove a recommendation
- Replace a recommendation
- Adjust the budget or time frame
- Select a different priority category
- Rerun the plan
- Save the plan
- Export or print the plan

The UI must display:

> "AI-generated decision support — final planning and implementation decisions remain with the LGU."

---

## 5. Proposed Backend Architecture

### New Django App

```
backend/
  apps/
    interventions/
      models.py          ← InterventionTemplate, InterventionPlan, RecommendedIntervention
      serializers.py
      services.py        ← deterministic planning and score simulation
      views.py
      urls.py
      prompts.py         ← LLM prompt templates (no scoring logic here)
      tests/
        test_ranking.py
        test_simulation.py
        test_api.py
```

### Proposed Data Models

**InterventionTemplate** — catalog of available intervention types
```
id
code
name
description
affected_categories          (JSON)
eligible_asset_types         (JSON)
required_conditions          (JSON)
estimated_cost_min
estimated_cost_max
estimated_duration_weeks
indicator_changes            (JSON — maps indicator keys to expected delta)
responsible_office
possible_partners            (JSON)
is_active
```

**InterventionPlan** — an LGU's saved planning session
```
id
destination                  (FK → Destination)
budget
implementation_months
priority_categories          (JSON)
current_overall_score
projected_overall_score
estimated_total_cost
status                       (draft | approved | exported)
created_at
updated_at
```

**RecommendedIntervention** — a specific intervention within a plan
```
id
plan                         (FK → InterventionPlan)
intervention_template        (FK → InterventionTemplate)
rank
selected_assets              (JSON — list of Listing IDs)
selected_area
estimated_cost
estimated_duration_weeks
priority_score
current_category_scores      (JSON)
projected_category_scores    (JSON)
indicator_changes            (JSON)
evidence                     (JSON — supporting data from existing assets)
assumptions                  (JSON)
is_accepted
```

### Proposed API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/destinations/{id}/readiness-baseline/` | Current scores, gaps, assets, missing indicators |
| `GET` | `/api/interventions/catalog/` | Available intervention templates |
| `POST` | `/api/interventions/plan/` | Generate ranked plan with simulated scores |
| `POST` | `/api/interventions/explain/` | Generate LLM explanation for a structured plan |
| `POST` | `/api/intervention-plans/` | Save an approved or edited plan |
| `GET` | `/api/intervention-plans/{id}/` | Load a saved plan |

For the MVP, `/api/interventions/plan/` and `/api/interventions/explain/` may be combined into a single endpoint, but the deterministic result and LLM explanation must remain logically separated in `services.py`.

### Two-Layer Separation (Non-Negotiable)

| Layer | Responsibility | May use LLM? |
|---|---|---|
| Deterministic planner (`services.py`) | Ranking, eligibility, score simulation | **No** |
| AI explanation layer (`prompts.py` + OpenAI) | Narrative explanation of planner output | **Yes** |

The LLM must never calculate scores, costs, durations, or rankings.

---

## 6. Proposed Frontend Sections

**Route:** `/intervention-planner`

**Navigation label:** Intervention Planner (accessible from main nav and from a "Plan Improvements" button on the readiness results page)

### Section A — Current Readiness Baseline
- Overall score and label
- Category score cards (weakest highlighted)
- Top gaps summary
- Small destination map
- Asset counts by category and verification status

### Section B — Planning Constraints
Form fields:
- Budget (₱ — optional, has no-budget mode)
- Implementation period (months)
- Maximum interventions
- Priority category (dropdown)
- Priority location (optional)
- Strategy: upgrade existing vs. build new

### Section C — Recommended Plan
Each recommendation rendered as a card:
- Rank badge
- Intervention name
- One-sentence reason
- Estimated cost range
- Estimated duration
- Affected categories
- Current score → projected score (per category)
- Evidence used (asset names, indicator states)
- Location on mini-map
- Action buttons: Accept / Remove / Replace

### Section D — Projected Impact Summary
- Current overall score vs. projected overall score
- Total estimated cost
- Implementation period
- Category comparison table or bar chart
- AI explanation text (collapsible)
- Disclaimer label
- Save / Export buttons

---

## 7. Deterministic Planning Layer

This layer runs entirely in Python without LLM involvement.

Responsibilities:
1. Load current readiness baseline for the destination
2. Classify each indicator as missing, unverified, incomplete, or upgradeable
3. Filter intervention catalog against asset state and LGU constraints
4. Score and rank eligible interventions using the priority formula
5. Select the optimal combination within budget and time limits
6. Simulate indicator changes for each selected intervention
7. Re-run the existing scoring engine on simulated indicators
8. Return structured result (rankings, costs, scores, evidence, assumptions)

The output of this layer is a structured Python dict — not a prose explanation.

This layer must be independently testable without any LLM calls.

---

## 8. Generative AI Explanation Layer

This layer receives the structured planner output and generates a human-readable LGU action plan.

What the LLM receives:
- Destination name and province
- Current overall score and category scores
- Selected interventions with rank, cost, duration, and score projections
- Evidence (asset names, indicator states) per intervention
- Assumptions used
- LGU's budget and time-frame constraints

What the LLM must produce:
- Why each intervention was selected
- Which destination evidence supports it
- Which gaps it addresses
- Which office may lead it
- Which local partners may be involved
- Risks and assumptions
- What the projected score means and what it does not guarantee

LLM guardrails (same principles as current AI advisor):
- Do not invent assets, statistics, or costs
- Do not change the numeric score
- Do not fabricate stakeholder commitments
- Mention assumptions and limitations explicitly
- Tone must be professional, constructive, and government-appropriate

---

## 9. Example Expected Output

### Input

```json
{
  "destination_id": 1,
  "budget": 500000,
  "implementation_months": 6,
  "max_interventions": 3,
  "priority_categories": ["internet_reliability", "work_friendly_spaces"],
  "preferred_strategy": "upgrade_existing_assets"
}
```

### Output Summary

```
Destination:              Carles, Iloilo
Available budget:         ₱500,000
Implementation period:    6 months
Current score:            61 / 100
Projected score:          69 / 100
Estimated total cost:     ₱460,000
```

### Recommendation 1 — Upgrade three cafés into verified work-friendly venues
- Estimated cost: ₱300,000 | Duration: 3–4 months
- Evidence: 3 existing cafés near accommodation cluster, none currently work-verified
- Projected effect: Work-Friendly Spaces 42 → 68 | Internet Reliability 48 → 57 | Overall 61 → 67

### Recommendation 2 — LGU-led internet verification program
- Estimated cost: ₱60,000 | Duration: 4–6 weeks
- Evidence: Multiple assets lack verified internet data
- Projected effect: Internet Reliability 57 → 63 | Overall 67 → 68

### Recommendation 3 — Digital nomad stay information package
- Estimated cost: ₱100,000 | Duration: 2 months
- Evidence: Accommodation and tourism assets exist; long-stay information is fragmented
- Projected effect: Long-Stay Accommodation 72 → 77 | Overall 68 → 69

---

## 10. MVP vs. Phase 2 Boundary

| Capability | Current MVP | Phase 2 |
|---|---|---|
| Readiness score and category breakdown | ✅ | ✅ |
| Local asset map and table | ✅ | ✅ |
| AI-generated readiness explanation | ✅ | ✅ |
| Gap identification | ✅ (top_gaps) | ✅ (enriched) |
| Intervention catalog | ❌ | ✅ |
| Budget and time-frame input | ❌ | ✅ |
| Ranked intervention recommendations | ❌ | ✅ |
| Score simulation | ❌ | ✅ |
| Evidence-grounded AI explanation | ❌ | ✅ |
| Save and export plan | ❌ | ✅ |
| Human review and modification | ❌ | ✅ |

### What Phase 2 Does Not Include (Explicitly Out of Scope)
- Real procurement or budgeting integration
- Exact engineering cost estimates (planning estimates only)
- Automatic government budget approval workflows
- Advanced economic forecasting or tourism-arrival projections
- Autonomous plan implementation
- Complex multi-agent architecture
- Trained optimization models

---

## 11. Future Acceptance Criteria

The feature is complete for Phase 2 when an LGU user can:

- [ ] Open Carles' readiness assessment from the Intervention Planner
- [ ] See the current score and weakest categories
- [ ] Enter a budget and implementation period
- [ ] Generate at least three ranked interventions
- [ ] See the evidence supporting each intervention
- [ ] See estimated costs and implementation durations
- [ ] See category scores before and after each intervention
- [ ] See the projected overall score
- [ ] Read a grounded AI explanation with a clear disclaimer
- [ ] Remove or replace a recommendation
- [ ] Rerun the plan with different constraints
- [ ] Save or export the intervention plan
- [ ] See the label "AI-generated decision support — final planning and implementation decisions remain with the LGU"

---

## Implementation Notes for Future Team

**Do not start Phase 2 until:**
1. The hackathon demo is complete and results are known
2. A separate feature branch (`feature/intervention-planner`) is created from `main`
3. This roadmap is reviewed and approved for implementation
4. The intervention catalog (10–15 templates) is designed and approved
5. The scoring simulation integration with the existing engine is scoped

**Key constraint to preserve:** The deterministic planning layer and the LLM explanation layer must remain separated. Tests for the planning layer must pass without any LLM calls.
