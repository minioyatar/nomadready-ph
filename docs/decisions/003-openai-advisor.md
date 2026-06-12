# Decision 003 — OpenAI Advisor

**Status:** Approved

## Decision

OpenAI is used only to generate a natural language readiness summary and LGU action recommendations. It receives structured data from the backend and returns structured JSON.

## What OpenAI May Do

- Explain the readiness score in plain language.
- Highlight strengths and weaknesses.
- Recommend practical LGU actions based on top gaps.

## What OpenAI Must Never Do

- Calculate the numeric score.
- Invent places, statistics, or data not in the payload.
- Change or override the verified numeric score.

## Guardrails

- Tone must be professional, constructive, and government-friendly.
- OpenAI must mention missing data clearly.
- Recommendations must be practical for an LGU to act on.
