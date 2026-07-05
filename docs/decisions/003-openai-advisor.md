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

---

## Implementation Architecture

All AI logic lives in one file: `backend/apps/ai_advisor/services.py`.

This file is the AI service layer for the project. It handles all six responsibilities inline — no new Django apps, no new files, no extra abstraction.

### The six responsibilities and how we handle them

**1. Authentication**

Initialize the OpenAI client once at the top of the module using the key from Django settings. Never hardcode the key.

```python
import openai
from django.conf import settings

client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
```

**2. Prompt Construction**

A private `_build_prompt()` function assembles the prompt from a `Destination` object and a `ScoreSnapshot`. It passes only structured, verified data — never raw user input. This is what prevents hallucination: OpenAI receives facts, not open-ended questions.

```python
def _build_prompt(destination, snapshot) -> str:
    # Builds prompt from destination name, overall_score, score_label,
    # category scores, strongest_category, weakest_category, top_gaps.
    # Returns a string ready to send to the API.
```

**3. Model Selection**

Use `gpt-4o-mini` for all calls. It is fast, cheap, and sufficient for structured JSON output on a well-constructed prompt. Do not add dynamic model selection — that is out of scope for the MVP.

```python
MODEL = "gpt-4o-mini"
```

**4. Caching**

The database is the cache. Before calling OpenAI, check whether an `AIRecommendation` already exists for the given `score_snapshot_id`. If one exists, return it immediately. Only call OpenAI on a cache miss.

```python
existing = AIRecommendation.objects.filter(score_snapshot_id=score_snapshot_id).first()
if existing:
    return existing  # return saved result, skip API call
```

This means the same score snapshot will never be sent to OpenAI twice. If the LGU wants fresh recommendations, they must trigger a score recalculation first, which creates a new `ScoreSnapshot`.

**5. Logging**

Use Python's standard `logging` module. Log three events: the outgoing prompt payload, the raw response from OpenAI, and any errors. Do not use `print()`.

```python
import logging
logger = logging.getLogger(__name__)

logger.info("OpenAI request: destination=%s snapshot=%s", destination_id, score_snapshot_id)
logger.info("OpenAI response: %s", raw_response)
logger.exception("OpenAI call failed")  # inside except block
```

**6. Safety Checks / Response Validation**

Validate that OpenAI returned valid JSON with the expected keys before saving anything to the database. If validation fails, raise an exception rather than saving partial or malformed data.

Expected keys in the OpenAI response:
- `summary` — string
- `strengths` — list of strings
- `weaknesses` — list of strings
- `recommendations` — list of objects, each with `title`, `affected_category`, `recommendation`, `priority`, `reason`

```python
def _validate_response(data: dict) -> None:
    required = {"summary", "strengths", "weaknesses", "recommendations"}
    missing = required - data.keys()
    if missing:
        raise ValueError(f"OpenAI response missing keys: {missing}")
```

---

### Full service function structure

```python
def generate_readiness_advice(destination_id: int, score_snapshot_id: int) -> dict:
    # 1. Check DB cache
    existing = AIRecommendation.objects.filter(score_snapshot_id=score_snapshot_id).first()
    if existing:
        return serialize(existing)

    # 2. Load destination + snapshot from DB
    destination = Destination.objects.get(id=destination_id)
    snapshot = ScoreSnapshot.objects.get(id=score_snapshot_id)

    # 3. Build prompt
    prompt = _build_prompt(destination, snapshot)

    # 4. Log + call OpenAI
    logger.info("OpenAI request: destination=%s snapshot=%s", destination_id, score_snapshot_id)
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        logger.info("OpenAI response received")
    except Exception:
        logger.exception("OpenAI call failed")
        raise

    # 5. Parse + validate
    data = json.loads(raw)
    _validate_response(data)

    # 6. Save to DB and return
    recommendations = _save_recommendations(destination, snapshot, data)
    return recommendations
```

---

### What does NOT belong in this file

- Numeric scoring — stays in `scoring/services.py`
- Listing data queries — pass the snapshot in, do not re-query listings here
- HTTP request/response handling — stays in `views.py`
- Prompt text exposed as a user-editable setting — the prompt is code, not config
