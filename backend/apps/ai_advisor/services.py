"""OpenAI advisor service - placeholder implementation.

For the MVP the function returns a deterministic structure that can be
mocked in tests.  The real OpenAI integration will be added later.
"""

from typing import Dict, Any
import json
import re
import os
from openai import OpenAI
from django.conf import settings
from apps.destinations.models import Destination
from apps.scoring.models import ScoreSnapshot
from apps.listings.models import Listing


def _get_client():
    """Return an OpenAI client or ``None`` when no URL is configured.

    The ``OPENAI_API_URL`` may be provided without the ``/v1`` suffix - the
    OpenAI client expects the full API base, so we append it when missing.
    """
    key = settings.OPENAI_API_KEY or "dummy"
    base = getattr(settings, "OPENAI_API_URL", "")
    if not base:
        return None
    # Ensure the URL ends with ``/v1`` for OpenAI‑compatible servers.
    if not base.rstrip("/").endswith("/v1"):
        base = base.rstrip("/") + "/v1"
    return OpenAI(api_key=key, base_url=base)


def _build_prompt(destination: Destination, snapshot: ScoreSnapshot) -> str:
    """Construct the prompt with guardrails, structured data, and a strict JSON schema."""
    # Gather verified listings summary
    verified = Listing.objects.filter(
        destination=destination, verification_status=Listing.VerificationStatus.LGU_VERIFIED
    )
    verified_summary = f"{verified.count()} verified listings."

    # Missing data example
    missing = []
    if snapshot.internet_work_score < 30:
        missing.append("Insufficient work-ready infrastructure")
    if snapshot.accommodation_score < 30:
        missing.append("Limited long-stay accommodation")

    schema = (
        '{\n'
        '  "summary": "string, 2-3 sentences",\n'
        '  "strengths": ["string", ...],\n'
        '  "weaknesses": ["string", ...],\n'
        '  "recommendations": [\n'
        '    {\n'
        '      "title": "string",\n'
        '      "affected_category": "string",\n'
        '      "priority": "high|medium|low",\n'
        '      "reason": "string",\n'
        '      "suggested_next_step": "string"\n'
        '    }\n'
        '  ]\n'
        '}'
    )

    prompt = (
        "You are an LGU advisor. Respond with a single valid JSON object and "
        "nothing else - no markdown, no code fences, no commentary before or "
        "after. Do not invent data or modify the numeric score. Mention "
        "missing data inside the summary or weaknesses field. "
        "Provide exactly three items in recommendations.\n\n"
        f"Required JSON schema:\n{schema}\n\n"
        f"Destination: {destination.name}\n"
        f"Score: {snapshot.overall_score} ({snapshot.score_label})\n"
        f"Category scores: Internet & Work: {snapshot.internet_work_score}, "
        f"Accommodation: {snapshot.accommodation_score}, Safety: {snapshot.safety_services_score}, "
        f"Transport: {snapshot.transport_score}, Tourism: {snapshot.tourism_lifestyle_score}\n"
        f"Strongest: {snapshot.strongest_category}\n"
        f"Weakest: {snapshot.weakest_category}\n"
        f"Top gaps: {', '.join(snapshot.top_gaps)}\n"
        f"Verified listings: {verified_summary}\n"
        f"Missing data: {', '.join(missing)}"
    )
    return prompt


def _placeholder_advice(destination: Destination, snapshot) -> Dict[str, Any]:
    """Create a deterministic placeholder advice payload.

    The placeholder mirrors the structure expected by the frontend and tests
    but derives its content from the actual ``ScoreSnapshot`` so that the
    information is relevant to the destination being queried.
    """
    # Determine strengths and weaknesses based on simple thresholds.
    strengths: list[str] = []
    weaknesses: list[str] = []
    # Mapping of category attribute names to human‑readable titles.
    category_map = {
        "internet_work_score": "Internet & Work Readiness",
        "accommodation_score": "Long-Stay Accommodation",
        "safety_services_score": "Safety & Essential Services",
        "transport_score": "Transport & Access",
        "tourism_lifestyle_score": "Tourism & Lifestyle Appeal",
    }
    for attr, title in category_map.items():
        score = getattr(snapshot, attr, 0)
        if score >= 70:
            strengths.append(f"{title} (score {score})")
        elif score <= 40:
            weaknesses.append(f"{title} (score {score})")

    # Build simple recommendations from the top gaps list.
    recommendations: list[Dict[str, Any]] = []
    for gap in getattr(snapshot, "top_gaps", []):
        recommendations.append({
            "title": f"Improve {gap}",
            "affected_category": gap,
            "priority": "high",
            "reason": f"Addressing the gap in {gap} will raise the overall readiness score.",
            "suggested_next_step": f"Create an action plan to enhance {gap.lower()}.",
        })

    summary = (
        f"{destination.name} has an overall score of {snapshot.overall_score} "
        f"({snapshot.score_label})."
    )
    return {
        "summary": summary,
        "strengths": strengths or ["No strong categories identified."],
        "weaknesses": weaknesses or ["No weak categories identified."],
        "recommendations": recommendations,
    }


def _extract_json_block(text: str) -> str:
    """Strip markdown code fences and grab the outermost {...} block.

    Models sometimes wrap their JSON in ```json ... ``` fences or add a
    stray sentence before/after the object. This pulls out the most likely
    JSON substring so it can be parsed.
    """
    text = text.strip()
    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def _coerce_advice(data: Dict[str, Any], destination: Destination) -> Dict[str, Any]:
    """Normalize a parsed JSON object into the expected shape, filling gaps.

    Handles missing keys, wrong types, or malformed recommendation entries
    without raising, so a partially-correct LLM response still produces a
    usable result instead of falling all the way back to the placeholder.
    """
    summary = data.get("summary") or ""
    strengths = data.get("strengths") or []
    weaknesses = data.get("weaknesses") or []
    raw_recs = data.get("recommendations") or []

    recommendations = []
    for rec in raw_recs:
        if not isinstance(rec, dict):
            continue
        recommendations.append({
            "title": rec.get("title", ""),
            "affected_category": rec.get("affected_category", ""),
            "priority": rec.get("priority", "medium"),
            "reason": rec.get("reason", ""),
            "suggested_next_step": rec.get("suggested_next_step", ""),
        })

    return {
        "summary": summary or f"{destination.name} readiness summary unavailable.",
        "strengths": strengths if isinstance(strengths, list) else [str(strengths)],
        "weaknesses": weaknesses if isinstance(weaknesses, list) else [str(weaknesses)],
        "recommendations": recommendations,
    }


def generate_readiness_advice(destination_id: int) -> Dict[str, Any]:
    """Generate AI readiness advice for a destination.

    The function fetches the most recent ``ScoreSnapshot`` for the
    destination, builds a prompt, calls OpenAI, and parses the JSON
    response into a dictionary. If the OpenAI client is unavailable or an
    error occurs, a deterministic placeholder based on the snapshot is
    returned.
    """
    destination = Destination.objects.get(pk=destination_id)
    try:
        snapshot = ScoreSnapshot.objects.filter(destination=destination).latest("created_at")
    except ScoreSnapshot.DoesNotExist:
        # Provide minimal snapshot for placeholder
        snapshot = type("Dummy", (), {
            "overall_score": 0,
            "score_label": "Not Yet NomadReady",
            "internet_work_score": 0,
            "accommodation_score": 0,
            "safety_services_score": 0,
            "transport_score": 0,
            "tourism_lifestyle_score": 0,
            "strongest_category": "",
            "weakest_category": "",
            "top_gaps": [],
        })()

    prompt = _build_prompt(destination, snapshot)
    client = _get_client()
    if client is None:
        # Return a deterministic placeholder that reflects the actual data.
        return _placeholder_advice(destination, snapshot)

    # Choose a model that works with local Ollama servers. Allow override via env.
    model_name = getattr(settings, "OPENAI_MODEL", "llama2")

    try:
        request_kwargs = dict(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful LGU advisor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )

        # Use strict JSON mode when the backend supports it (real OpenAI, vLLM,
        # newer Ollama, etc). Some OpenAI-compatible servers reject the
        # response_format kwarg outright, so fall back to a plain completion
        # if the structured request errors.
        try:
            response = client.chat.completions.create(
                response_format={"type": "json_object"}, **request_kwargs
            )
        except Exception:
            response = client.chat.completions.create(**request_kwargs)

        content = response.choices[0].message.content or ""

        try:
            parsed = json.loads(content)
        except Exception:
            try:
                parsed = json.loads(_extract_json_block(content))
            except Exception:
                # Could not recover valid JSON from the response at all.
                return _placeholder_advice(destination, snapshot)

        if not isinstance(parsed, dict):
            return _placeholder_advice(destination, snapshot)

        return _coerce_advice(parsed, destination)

    except Exception:  # pragma: no cover – any connection error falls back
        # If the LLM server is unreachable, return the deterministic placeholder.
        return _placeholder_advice(destination, snapshot)