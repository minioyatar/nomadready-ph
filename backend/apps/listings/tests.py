"""Tests for the Listings read-only API — multi-destination aware.

Covers:
  - Omitted destination defaults to Carles
  - Destination filter isolation (Carles vs Malay/Boracay)
  - Invalid slug returns 404
  - Valid destination with no listings returns 200 []
  - category and verification_status filters still work within destination scope
  - Existing fields contract (backward-compat)
  - seed_demo_data idempotency at listing level
"""

from django.urls import reverse
from django.test import TestCase
from django.core.management import call_command
import json


class ListingsAPITest(TestCase):
	@classmethod
	def setUpTestData(cls):
		call_command("seed_demo_data", verbosity=0)

	def _get(self, query=""):
		url = reverse("listings-list") + query
		return self.client.get(url)

	def _json(self, query=""):
		response = self._get(query)
		self.assertEqual(response.status_code, 200)
		return json.loads(response.content)

	# ── backward-compat / field contract ─────────────────────────────────────

	def test_list_returns_all_required_fields(self):
		data = self._json()
		self.assertGreater(len(data), 0)
		required = {
			"id", "destination", "name", "category", "type",
			"address", "latitude", "longitude", "details",
			"verification_status", "created_at", "updated_at",
		}
		for item in data:
			self.assertTrue(required.issubset(set(item.keys())))

	# ── destination default and isolation ────────────────────────────────────

	def test_omitted_destination_defaults_to_carles(self):
		"""No ?destination= param must return only Carles listings."""
		data = self._json()
		from apps.listings.models import Listing
		from apps.destinations.models import Destination
		carles = Destination.objects.get(slug="carles")
		carles_ids = set(Listing.objects.filter(destination=carles).values_list("id", flat=True))
		returned_ids = {item["id"] for item in data}
		self.assertTrue(returned_ids.issubset(carles_ids),
			"Default response contained non-Carles listings")

	def test_carles_query_returns_no_malay_listings(self):
		carles_data = self._json("?destination=carles")
		malay_data = self._json("?destination=malay-boracay")
		carles_names = {item["name"] for item in carles_data}
		malay_names = {item["name"] for item in malay_data}
		overlap = carles_names & malay_names
		self.assertEqual(overlap, set(),
			f"Listings appear in both destinations: {overlap}")

	def test_malay_query_returns_no_carles_listings(self):
		carles_data = self._json("?destination=carles")
		malay_data = self._json("?destination=malay-boracay")
		carles_ids = {item["id"] for item in carles_data}
		malay_ids = {item["id"] for item in malay_data}
		self.assertEqual(carles_ids & malay_ids, set(),
			"Same listing IDs appear for both destinations")

	def test_invalid_destination_returns_404(self):
		response = self._get("?destination=nowhere-land")
		self.assertEqual(response.status_code, 404)

	def test_valid_destination_with_no_listings_returns_empty_200(self):
		from apps.destinations.models import Destination
		Destination.objects.create(
			name="Empty Test Destination",
			slug="empty-test",
			province="Test",
			municipality="Test",
		)
		response = self._get("?destination=empty-test")
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(data, [])

	def test_destination_specific_listings_belong_to_that_destination(self):
		malay_data = self._json("?destination=malay-boracay")
		self.assertGreater(len(malay_data), 0)
		from apps.destinations.models import Destination
		malay = Destination.objects.get(slug="malay-boracay")
		for item in malay_data:
			self.assertEqual(item["destination"], malay.id,
				f"Listing {item['name']} has wrong destination ID")

	# ── existing category and verification filters ────────────────────────────

	def test_category_filter(self):
		data = self._json("?category=work_spot")
		self.assertGreater(len(data), 0)
		for item in data:
			self.assertEqual(item["category"], "work_spot")

	def test_category_filter_within_destination_scope(self):
		"""Category filter must only return Carles work spots (default destination)."""
		data = self._json("?category=work_spot")
		from apps.destinations.models import Destination
		carles = Destination.objects.get(slug="carles")
		for item in data:
			self.assertEqual(item["destination"], carles.id)
			self.assertEqual(item["category"], "work_spot")

	def test_verification_status_filter(self):
		data = self._json("?verification_status=lgu_verified")
		self.assertGreater(len(data), 0)
		for item in data:
			self.assertEqual(item["verification_status"], "lgu_verified")

	def test_combined_filters_within_destination(self):
		data = self._json("?destination=malay-boracay&category=accommodation&verification_status=lgu_verified")
		self.assertGreater(len(data), 0)
		from apps.destinations.models import Destination
		malay = Destination.objects.get(slug="malay-boracay")
		for item in data:
			self.assertEqual(item["destination"], malay.id)
			self.assertEqual(item["category"], "accommodation")
			self.assertEqual(item["verification_status"], "lgu_verified")

	# ── idempotency ───────────────────────────────────────────────────────────

	def test_seed_idempotent_no_duplicate_listings(self):
		from apps.listings.models import Listing
		before = Listing.objects.count()
		call_command("seed_demo_data", verbosity=0)
		after = Listing.objects.count()
		self.assertEqual(before, after, "seed_demo_data created duplicate listings")
