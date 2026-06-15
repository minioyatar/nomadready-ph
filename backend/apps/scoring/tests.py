# Placeholder — scoring tests will be implemented in feature/scoring-engine
from django.test import TestCase
from django.urls import reverse
from apps.destinations.models import Destination
from apps.listings.models import Listing
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


class ScoringEngineTests(TestCase):
	def setUp(self):
		# Create a fresh destination for each test.  We deliberately **do not**
		# load the full seed data here because the new tests use minimal
		# isolated fixtures that exercise the scoring thresholds directly.
		self.destination = Destination.objects.create(
			name="Carles",
			province="Iloilo",
			municipality="Carles",
			description="Demo destination",
		)

	def _create_listing(self, **kwargs):
		"""Helper to create a verified listing with sensible defaults."""
		defaults = {
			"destination": self.destination,
			"verification_status": Listing.VerificationStatus.LGU_VERIFIED,
		}
		defaults.update(kwargs)
		return Listing.objects.create(**defaults)

	def test_internet_work_score_base_and_additions(self):
		"""Internet & Work score covering all thresholds.

		* 5 verified work spots → base 30
		* ≥3 listings publish Wi‑Fi speed → +25
		* ≥3 Zoom‑friendly listings → +20
		* ≥3 listings have power outlets → +15
		* At least one listing has mobile data → +10
		Expected total = 100 (capped).
		"""
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
		"""Accommodation score exercising base and all bonuses.

		* 5 verified accommodations → base 35
		* Monthly rates published → +25
		* Listings have Wi‑Fi → +20
		* At least one listing provides desk, kitchen or laundry → +20
		Expected total = 100.
		"""
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
		"""Safety & Services score covering every point.

		* Clinic → +25
		* Police → +20
		* Pharmacy → +15
		* ATM → +15
		* Laundry → +15
		* Safety notes present → +10
		Expected total = 100.
		"""
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
		"""Transport score exercising each rule.

		* Main route from Iloilo → +30
		* Port listed → +25
		* Local transport option → +20
		* Schedule information → +15
		* Travel time shown → +10
		Expected total = 100.
		"""
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
		"""Tourism & Lifestyle score covering all bonuses.

		* 5 verified attractions → base 30
		* Island hopping available → +25
		* Tour operator listed → +20
		* Food activity type → +15
		* Community event present → +10
		Expected total = 100.
		"""
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
		"""Validate overall weighted calculation against a known scenario.

		All five categories are forced to 100, so the weighted sum should be
		100 and the label should be *Highly NomadReady Destination*.
		"""
		# Build minimal fixtures that push each category to its maximum (100).
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
		# Use the seeded demo data for Carles (20 verified listings).
		snapshot = calculate_destination_score(self.destination.id)
		self.assertIsNotNone(snapshot.id)
		self.assertEqual(snapshot.destination, self.destination)
		# The overall score should be consistent with the label mapping.
		expected_label = get_score_label(snapshot.overall_score)
		self.assertEqual(snapshot.score_label, expected_label)

	def test_only_lgu_verified_listings_count(self):
		"""Verified listings count toward the score; drafts are ignored.

		We create a single verified work spot that satisfies the base rule
		(1‑2 verified places → base 10).  Adding a draft listing with the same
		attributes must not change the computed score.
		"""
		# Verified listing – should give a base score of 10 (no bonuses).
		self._create_listing(
			name="Verified Work",
			category=Listing.Category.WORK_SPOT,
			details={"wifi_available": True},
		)
		score_verified = calculate_internet_work_score(Listing.objects.all())

		# Draft listing – should be ignored.
		self._create_listing(
			name="Draft Work",
			category=Listing.Category.WORK_SPOT,
			verification_status=Listing.VerificationStatus.DRAFT,
			details={"wifi_available": True},
		)
		score_with_draft = calculate_internet_work_score(Listing.objects.all())
		self.assertEqual(score_verified, score_with_draft)
