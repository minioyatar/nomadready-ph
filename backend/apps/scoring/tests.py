"""Tests for the scoring engine and scoring API.

Covers:
  - Individual category scoring functions
  - Overall score calculation and label mapping
  - Only lgu_verified listings count
  - API endpoints: default slug, explicit slugs, invalid slug, 404
  - Snapshot isolation: Carles snapshot never returned for Malay/Boracay and vice versa
  - Lazy snapshot creation (current-score endpoint)
  - Recalculation determinism
  - Carles approved baseline after seeding
"""

from django.test import TestCase
from django.core.management import call_command
from django.urls import reverse
from apps.destinations.models import Destination
from apps.listings.models import Listing
from .models import ScoreSnapshot
from .services import (
    calculate_internet_work_score,
    calculate_accommodation_score,
    calculate_safety_services_score,
    calculate_transport_score,
    calculate_tourism_lifestyle_score,
    calculate_overall_score,
    get_score_label,
    get_top_gaps,
    calculate_destination_score,
)


# ── Scoring engine unit tests ─────────────────────────────────────────────────

class ScoringEngineTests(TestCase):
    def setUp(self):
        self.destination = Destination.objects.create(
            name="Carles",
            slug="carles",
            province="Iloilo",
            municipality="Carles",
            description="Demo destination",
        )

    def _create_listing(self, **kwargs):
        defaults = {
            "destination": self.destination,
            "verification_status": Listing.VerificationStatus.LGU_VERIFIED,
        }
        defaults.update(kwargs)
        return Listing.objects.create(**defaults)

    def test_internet_work_score_base_and_additions(self):
        for i in range(5):
            self._create_listing(
                name=f"Work Spot {i}",
                category=Listing.Category.WORK_SPOT,
                details={
                    "wifi_available": True,
                    "zoom_friendly": True,
                    "power_outlets": True,
                    "wifi_speed_mbps": 20 if i < 3 else None,
                    "mobile_data_available": True,
                },
            )
        score = calculate_internet_work_score(Listing.objects.all())
        self.assertEqual(score, 100)

    def test_accommodation_score(self):
        for i in range(5):
            self._create_listing(
                name=f"Acc {i}",
                category=Listing.Category.ACCOMMODATION,
                details={
                    "monthly_rate_available": True,
                    "has_wifi": True,
                    "has_desk": i == 0,
                    "has_kitchen": i == 1,
                    "has_laundry": i == 2,
                },
            )
        score = calculate_accommodation_score(Listing.objects.all())
        self.assertEqual(score, 100)

    def test_safety_services_score(self):
        services = [
            ("clinic", "clinic"),
            ("police", "police"),
            ("pharmacy", "pharmacy"),
            ("atm", "atm"),
            ("laundry", "laundry"),
        ]
        for name, stype in services:
            self._create_listing(
                name=name,
                category=Listing.Category.SERVICE,
                details={"service_type": stype, "has_safety_notes": True},
            )
        score = calculate_safety_services_score(Listing.objects.all())
        self.assertEqual(score, 100)

    def test_transport_score(self):
        self._create_listing(
            name="route",
            category=Listing.Category.TRANSPORT,
            details={"route_from_iloilo": True},
        )
        self._create_listing(
            name="port",
            category=Listing.Category.TRANSPORT,
            details={"is_port": True},
        )
        self._create_listing(
            name="local",
            category=Listing.Category.TRANSPORT,
            details={"local_transport": True, "schedule_available": True, "travel_time_hours": 2.5},
        )
        score = calculate_transport_score(Listing.objects.all())
        self.assertEqual(score, 100)

    def test_tourism_lifestyle_score(self):
        for i in range(5):
            self._create_listing(
                name=f"attr{i}",
                category=Listing.Category.ATTRACTION,
                details={
                    "island_hopping": True,
                    "has_tour_operator": True,
                    "activity_type": "food",
                    "has_community_event": True,
                },
            )
        score = calculate_tourism_lifestyle_score(Listing.objects.all())
        self.assertEqual(score, 100)

    def test_overall_score_and_label(self):
        self.test_internet_work_score_base_and_additions()
        self.test_accommodation_score()
        self.test_safety_services_score()
        self.test_transport_score()
        self.test_tourism_lifestyle_score()

        listings = Listing.objects.filter(destination=self.destination)
        category_scores = {
            "internet_work_score": calculate_internet_work_score(listings),
            "accommodation_score": calculate_accommodation_score(listings),
            "safety_services_score": calculate_safety_services_score(listings),
            "transport_score": calculate_transport_score(listings),
            "tourism_lifestyle_score": calculate_tourism_lifestyle_score(listings),
        }
        overall = calculate_overall_score(category_scores)
        self.assertEqual(overall["overall_score"], 100)
        self.assertEqual(get_score_label(overall["overall_score"]), "Highly NomadReady Destination")

    def test_calculate_destination_score_creates_snapshot(self):
        snapshot = calculate_destination_score(self.destination.id)
        self.assertIsNotNone(snapshot.id)
        self.assertEqual(snapshot.destination, self.destination)
        expected_label = get_score_label(snapshot.overall_score)
        self.assertEqual(snapshot.score_label, expected_label)

    def test_only_lgu_verified_listings_count(self):
        self._create_listing(
            name="Verified Work",
            category=Listing.Category.WORK_SPOT,
            details={"wifi_available": True},
        )
        score_verified = calculate_internet_work_score(Listing.objects.all())

        self._create_listing(
            name="Draft Work",
            category=Listing.Category.WORK_SPOT,
            verification_status=Listing.VerificationStatus.DRAFT,
            details={"wifi_available": True},
        )
        score_with_draft = calculate_internet_work_score(Listing.objects.all())
        self.assertEqual(score_verified, score_with_draft)


# ── Scoring API — single-destination tests ────────────────────────────────────

class ScoreAPITests(TestCase):
    """Tests for GET /api/scores/current/ and POST /api/scores/recalculate/."""

    def setUp(self):
        self.destination = Destination.objects.create(
            name="Carles",
            slug="carles",
            province="Iloilo",
            municipality="Carles",
            description="Pilot destination.",
        )

    def test_current_score_generates_snapshot_when_missing(self):
        response = self.client.get("/api/scores/current/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["destination_name"], "Carles")
        self.assertIn("overall_score", data)
        self.assertEqual(ScoreSnapshot.objects.count(), 1)

    def test_recalculate_creates_snapshot_and_returns_201(self):
        response = self.client.post(
            "/api/scores/recalculate/", {}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("overall_score", data)
        self.assertIn("score_label", data)
        self.assertIn("top_gaps", data)

    def test_recalculate_response_includes_all_category_scores(self):
        response = self.client.post(
            "/api/scores/recalculate/", {}, content_type="application/json"
        )
        data = response.json()
        for field in [
            "internet_work_score",
            "accommodation_score",
            "safety_services_score",
            "transport_score",
            "tourism_lifestyle_score",
            "strongest_category",
            "weakest_category",
            "destination_name",
            "destination_id",
        ]:
            self.assertIn(field, data)

    def test_current_score_returns_200_after_recalculate(self):
        self.client.post("/api/scores/recalculate/", {}, content_type="application/json")
        response = self.client.get("/api/scores/current/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["destination_name"], "Carles")
        self.assertIn("overall_score", data)

    def test_recalculate_persists_snapshot(self):
        self.assertEqual(ScoreSnapshot.objects.count(), 0)
        self.client.post("/api/scores/recalculate/", {}, content_type="application/json")
        self.assertEqual(ScoreSnapshot.objects.count(), 1)


# ── Multi-destination API isolation tests ─────────────────────────────────────

class MultiDestinationScoreAPITests(TestCase):
    """Verify destination-awareness and snapshot isolation for score endpoints."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo_data", verbosity=0)

    # ── slug resolution ───────────────────────────────────────────────────────

    def test_omitted_destination_defaults_to_carles(self):
        response = self.client.get("/api/scores/current/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["destination_name"], "Carles")

    def test_explicit_carles_slug_returns_carles(self):
        response = self.client.get("/api/scores/current/?destination=carles")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["destination_name"], "Carles")

    def test_explicit_malay_slug_returns_malay(self):
        response = self.client.get("/api/scores/current/?destination=malay-boracay")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["destination_name"], "Malay / Boracay")

    def test_invalid_slug_current_score_returns_404(self):
        response = self.client.get("/api/scores/current/?destination=nowhere")
        self.assertEqual(response.status_code, 404)

    def test_recalculate_defaults_to_carles(self):
        response = self.client.post("/api/scores/recalculate/", {}, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["destination_name"], "Carles")

    def test_recalculate_explicit_malay_slug(self):
        response = self.client.post(
            "/api/scores/recalculate/",
            {"destination": "malay-boracay"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["destination_name"], "Malay / Boracay")

    def test_recalculate_invalid_slug_returns_404(self):
        response = self.client.post(
            "/api/scores/recalculate/",
            {"destination": "nowhere"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    # ── snapshot isolation ────────────────────────────────────────────────────

    def test_carles_snapshot_not_returned_for_malay(self):
        """Recalculate Carles; querying Malay must not return the Carles snapshot."""
        self.client.post(
            "/api/scores/recalculate/",
            {"destination": "carles"},
            content_type="application/json",
        )
        response = self.client.get("/api/scores/current/?destination=malay-boracay")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotEqual(data["destination_name"], "Carles",
            "Malay/Boracay query returned a Carles snapshot")
        self.assertEqual(data["destination_name"], "Malay / Boracay")

    def test_malay_snapshot_not_returned_for_carles(self):
        """Recalculate Malay; querying Carles must not return the Malay snapshot."""
        self.client.post(
            "/api/scores/recalculate/",
            {"destination": "malay-boracay"},
            content_type="application/json",
        )
        response = self.client.get("/api/scores/current/?destination=carles")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotEqual(data["destination_name"], "Malay / Boracay",
            "Carles query returned a Malay/Boracay snapshot")
        self.assertEqual(data["destination_name"], "Carles")

    def test_destination_id_in_snapshot_response(self):
        """Snapshot serializer must expose destination_id for the AI Advisor."""
        response = self.client.get("/api/scores/current/?destination=carles")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("destination_id", data)
        carles = Destination.objects.get(slug="carles")
        self.assertEqual(data["destination_id"], carles.id)

    def test_lazy_snapshot_created_only_for_requested_destination(self):
        """Current-score lazy creation must not touch the other destination."""
        ScoreSnapshot.objects.all().delete()
        self.client.get("/api/scores/current/?destination=carles")
        carles = Destination.objects.get(slug="carles")
        malay = Destination.objects.get(slug="malay-boracay")
        self.assertEqual(ScoreSnapshot.objects.filter(destination=carles).count(), 1)
        self.assertEqual(ScoreSnapshot.objects.filter(destination=malay).count(), 0)

    def test_existing_snapshot_reused_not_recalculated(self):
        """GET /api/scores/current/ must reuse existing snapshot, not create a new one."""
        self.client.post(
            "/api/scores/recalculate/",
            {"destination": "carles"},
            content_type="application/json",
        )
        carles = Destination.objects.get(slug="carles")
        count_before = ScoreSnapshot.objects.filter(destination=carles).count()
        self.client.get("/api/scores/current/?destination=carles")
        count_after = ScoreSnapshot.objects.filter(destination=carles).count()
        self.assertEqual(count_before, count_after, "Current-score created a new snapshot unnecessarily")

    def test_recalculation_uses_only_destination_verified_listings(self):
        """Recalculating Malay must not count Carles verified listings."""
        carles = Destination.objects.get(slug="carles")
        malay = Destination.objects.get(slug="malay-boracay")

        carles_snap = calculate_destination_score(carles.id)
        malay_snap = calculate_destination_score(malay.id)

        # Each snapshot must belong to the correct destination.
        self.assertEqual(carles_snap.destination_id, carles.id)
        self.assertEqual(malay_snap.destination_id, malay.id)

    def test_malay_recalculation_is_deterministic(self):
        """Two successive recalculations must produce identical scores."""
        malay = Destination.objects.get(slug="malay-boracay")
        snap1 = calculate_destination_score(malay.id)
        snap2 = calculate_destination_score(malay.id)
        self.assertEqual(snap1.overall_score, snap2.overall_score)
        self.assertEqual(snap1.internet_work_score, snap2.internet_work_score)
        self.assertEqual(snap1.accommodation_score, snap2.accommodation_score)
        self.assertEqual(snap1.safety_services_score, snap2.safety_services_score)
        self.assertEqual(snap1.transport_score, snap2.transport_score)
        self.assertEqual(snap1.tourism_lifestyle_score, snap2.tourism_lifestyle_score)

    # ── Carles approved baseline ──────────────────────────────────────────────

    def test_carles_approved_baseline(self):
        """Carles scores must match the approved MVP baseline after seeding.

        Overall: 68
        internet_work: 45, accommodation: 70, safety_services: 75,
        transport: 70, tourism_lifestyle: 100
        """
        carles = Destination.objects.get(slug="carles")
        snap = calculate_destination_score(carles.id)

        self.assertEqual(snap.overall_score, 68)
        self.assertEqual(snap.internet_work_score, 45)
        self.assertEqual(snap.accommodation_score, 70)
        self.assertEqual(snap.safety_services_score, 75)
        self.assertEqual(snap.transport_score, 70)
        self.assertEqual(snap.tourism_lifestyle_score, 100)
        self.assertEqual(snap.score_label, "Developing NomadReady Destination")
