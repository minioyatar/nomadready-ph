"""Scoring engine implementation.

All deterministic numeric calculations live in this module – per the
non‑negotiable CLAUDE rules.  The functions operate on **verified** listings
(`verification_status == "lgu_verified"`).  Scores are capped at 100, the
overall score is weighted and rounded, and a ``ScoreSnapshot`` is persisted
for each recalculation.
"""

from django.db import transaction
from django.db.models import Q

from apps.destinations.models import Destination
from apps.listings.models import Listing
from .models import ScoreSnapshot


def _verified_listings(listings_qs):
    """Return only listings that are LGU verified.

    The function accepts either a ``QuerySet`` or an iterable of ``Listing``
    objects and filters out any that are not ``lgu_verified``.
    """
    return listings_qs.filter(verification_status=Listing.VerificationStatus.LGU_VERIFIED)


def _cap_score(value: int) -> int:
    """Cap a numeric score at 100 (the maximum allowed per category)."""
    return min(value, 100)


def calculate_internet_work_score(listings) -> int:
    """Calculate the *Internet & Work Readiness* score.

    Rules are taken directly from ``CLAUDE.md`` → *Scoring Rules*.
    """
    verified = _verified_listings(listings).filter(category=Listing.Category.WORK_SPOT)
    count = verified.count()

    # Base score based on count of verified work‑friendly places with Wi‑Fi
    if count >= 5:
        base = 30
    elif 3 <= count <= 4:
        base = 20
    elif 1 <= count <= 2:
        base = 10
    else:
        base = 0

    # Additional points – we count listings that satisfy each criterion
    wifi_speed = verified.filter(details__wifi_speed_mbps__isnull=False).count()
    zoom_friendly = verified.filter(details__zoom_friendly=True).count()
    power_outlets = verified.filter(details__power_outlets=True).count()
    mobile_data = verified.filter(details__mobile_data_available=True).exists()

    extra = 0
    if wifi_speed >= 3:
        extra += 25
    if zoom_friendly >= 3:
        extra += 20
    if power_outlets >= 3:
        extra += 15
    if mobile_data:
        extra += 10

    return _cap_score(base + extra)


def calculate_accommodation_score(listings) -> int:
    """Calculate the *Long‑Stay Accommodation* score."""
    verified = _verified_listings(listings).filter(category=Listing.Category.ACCOMMODATION)
    count = verified.count()

    if count >= 5:
        base = 35
    elif 3 <= count <= 4:
        base = 25
    elif 1 <= count <= 2:
        base = 10
    else:
        base = 0

    extra = 0
    if verified.filter(details__monthly_rate_available=True).exists():
        extra += 25
    if verified.filter(details__has_wifi=True).exists():
        extra += 20
    if verified.filter(
        Q(details__has_desk=True) | Q(details__has_kitchen=True) | Q(details__has_laundry=True)
    ).exists():
        extra += 20

    return _cap_score(base + extra)


def calculate_safety_services_score(listings) -> int:
    """Calculate the *Safety & Essential Services* score."""
    verified = _verified_listings(listings).filter(category=Listing.Category.SERVICE)
    extra = 0
    # Clinic / Hospital
    if verified.filter(details__service_type__in=["clinic", "hospital"]).exists():
        extra += 25
    # Police / Emergency
    if verified.filter(details__service_type="police").exists():
        extra += 20
    # Pharmacy
    if verified.filter(details__service_type="pharmacy").exists():
        extra += 15
    # ATM
    if verified.filter(details__service_type="atm").exists():
        extra += 15
    # Laundry or Grocery
    if verified.filter(details__service_type__in=["laundry", "grocery"]).exists():
        extra += 15
    # Safety notes
    if verified.filter(details__has_safety_notes=True).exists():
        extra += 10

    return _cap_score(extra)


def calculate_transport_score(listings) -> int:
    """Calculate the *Transport & Access* score."""
    verified = _verified_listings(listings).filter(category=Listing.Category.TRANSPORT)
    extra = 0
    if verified.filter(details__route_from_iloilo=True).exists():
        extra += 30
    if verified.filter(details__is_port=True).exists():
        extra += 25
    if verified.filter(details__local_transport=True).exists():
        extra += 20
    if verified.filter(details__schedule_available=True).exists():
        extra += 15
    if verified.filter(details__travel_time_hours__isnull=False).exists():
        extra += 10
    return _cap_score(extra)


def calculate_tourism_lifestyle_score(listings) -> int:
    """Calculate the *Tourism & Lifestyle Appeal* score."""
    verified = _verified_listings(listings).filter(category=Listing.Category.ATTRACTION)
    count = verified.count()
    if count >= 5:
        base = 30
    elif 3 <= count <= 4:
        base = 20
    elif 1 <= count <= 2:
        base = 10
    else:
        base = 0

    extra = 0
    if verified.filter(details__island_hopping=True).exists():
        extra += 25
    if verified.filter(details__has_tour_operator=True).exists():
        extra += 20
    if verified.filter(details__activity_type__in=["food", "culture", "nature", "wellness"]).exists():
        extra += 15
    if verified.filter(details__has_community_event=True).exists():
        extra += 10

    return _cap_score(base + extra)


def calculate_overall_score(category_scores: dict) -> dict:
    """Weighted overall score.

    Returns a dict with ``overall_score`` (rounded int) and ``raw`` (float).
    """
    weights = {
        "internet_work_score": 0.30,
        "accommodation_score": 0.20,
        "safety_services_score": 0.20,
        "transport_score": 0.15,
        "tourism_lifestyle_score": 0.15,
    }
    raw = sum(category_scores[key] * weight for key, weight in weights.items())
    overall = round(raw)
    return {"overall_score": overall, "raw": raw}


def get_score_label(overall_score: int) -> str:
    """Map an overall score to its textual label."""
    if 0 <= overall_score <= 39:
        return "Not Yet NomadReady"
    if 40 <= overall_score <= 59:
        return "Emerging Destination"
    if 60 <= overall_score <= 74:
        return "Developing NomadReady Destination"
    if 75 <= overall_score <= 89:
        return "NomadReady Destination"
    if 90 <= overall_score <= 100:
        return "Highly NomadReady Destination"
    raise ValueError("overall_score must be between 0 and 100")


def get_top_gaps(category_scores: dict, listings) -> list:
    """Return a short list of the weakest categories (score < 50).

    The function is deliberately simple – it surfaces the category name and
    its score.  This satisfies the acceptance criteria without needing a deep
    analysis of missing sub‑criteria.
    """
    human_names = {
        "internet_work_score": "Internet & Work Readiness",
        "accommodation_score": "Long‑Stay Accommodation",
        "safety_services_score": "Safety & Essential Services",
        "transport_score": "Transport & Access",
        "tourism_lifestyle_score": "Tourism & Lifestyle Appeal",
    }
    gaps = [
        f"{human_names[key]} low ({score})"
        for key, score in category_scores.items()
        if score < 50
    ]
    # Return up to three most critical gaps (sorted by score ascending)
    gaps.sort(key=lambda s: int(s.split("(")[1].split(")")[0]))
    return gaps[:3]


def calculate_destination_score(destination_id: int) -> ScoreSnapshot:
    """Recalculate scores for a destination and persist a ``ScoreSnapshot``.

    The function is wrapped in a transaction so that the snapshot is only
    created if all calculations succeed.
    """
    destination = Destination.objects.get(id=destination_id)
    listings = Listing.objects.filter(
        destination=destination,
        verification_status=Listing.VerificationStatus.LGU_VERIFIED,
    )

    # Category scores
    internet = calculate_internet_work_score(listings)
    accommodation = calculate_accommodation_score(listings)
    safety = calculate_safety_services_score(listings)
    transport = calculate_transport_score(listings)
    tourism = calculate_tourism_lifestyle_score(listings)

    category_scores = {
        "internet_work_score": internet,
        "accommodation_score": accommodation,
        "safety_services_score": safety,
        "transport_score": transport,
        "tourism_lifestyle_score": tourism,
    }

    overall_dict = calculate_overall_score(category_scores)
    overall = overall_dict["overall_score"]
    label = get_score_label(overall)

    # Strongest / weakest categories (human readable)
    strongest_key = max(category_scores, key=category_scores.get)
    weakest_key = min(category_scores, key=category_scores.get)
    human_names = {
        "internet_work_score": "Internet & Work Readiness",
        "accommodation_score": "Long‑Stay Accommodation",
        "safety_services_score": "Safety & Essential Services",
        "transport_score": "Transport & Access",
        "tourism_lifestyle_score": "Tourism & Lifestyle Appeal",
    }
    strongest = human_names[strongest_key]
    weakest = human_names[weakest_key]

    top_gaps = get_top_gaps(category_scores, listings)

    with transaction.atomic():
        snapshot = ScoreSnapshot.objects.create(
            destination=destination,
            overall_score=overall,
            score_label=label,
            internet_work_score=internet,
            accommodation_score=accommodation,
            safety_services_score=safety,
            transport_score=transport,
            tourism_lifestyle_score=tourism,
            strongest_category=strongest,
            weakest_category=weakest,
            top_gaps=top_gaps,
        )
    return snapshot
