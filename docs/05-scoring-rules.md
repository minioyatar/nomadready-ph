# 05 — Scoring Rules

> Full scoring rules are defined in `CLAUDE.md`. This document is the canonical reference during implementation.

## Overall Formula

```
Digital Nomad Readiness Score =
  (Internet & Work Readiness × 0.30) +
  (Long-Stay Accommodation × 0.20) +
  (Safety & Essential Services × 0.20) +
  (Transport & Access × 0.15) +
  (Tourism & Lifestyle Appeal × 0.15)
```

## Score Labels

| Range  | Label                             |
|--------|-----------------------------------|
| 0–39   | Not Yet NomadReady                |
| 40–59  | Emerging Destination              |
| 60–74  | Developing NomadReady Destination |
| 75–89  | NomadReady Destination            |
| 90–100 | Highly NomadReady Destination     |

## Non-Negotiable Rules

- Only `lgu_verified` listings count toward scoring.
- Category scores are capped at 100.
- Overall score is rounded to the nearest whole number.
- OpenAI must never calculate the numeric score.
