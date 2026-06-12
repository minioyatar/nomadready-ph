# Decision 002 — Scoring Model

**Status:** Approved

## Decision

The Digital Nomad Readiness Score is calculated by deterministic Python code in `backend/apps/scoring/services.py`. OpenAI must never calculate or influence the numeric score.

## Rationale

- A deterministic score is auditable, repeatable, and defensible to an LGU audience.
- AI-generated scores are unpredictable and cannot be trusted for official reporting.
- The scoring formula is transparent and based on verified listing data only.

## Key Rules

- Only `lgu_verified` listings count toward scoring.
- Category scores are capped at 100.
- Overall score is rounded to the nearest whole number.
- Missing data lowers the score.
