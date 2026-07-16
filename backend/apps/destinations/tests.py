"""Tests for the Destinations API.

Covers:
  - Original carles detail endpoint (backward-compat)
  - New list endpoint (both destinations, required fields, display_name, slug uniqueness)
  - Multi-destination isolation at the data level
"""

from django.test import TestCase
from django.core.management import call_command
from django.urls import reverse
from django.db import IntegrityError
import json


class DestinationAPITest(TestCase):
	@classmethod
	def setUpTestData(cls):
		call_command("seed_demo_data", verbosity=0)

	# ── original detail endpoint ──────────────────────────────────────────────

	def test_carles_profile(self):
		url = reverse("destination-detail", kwargs={"name": "Carles"})
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		from apps.destinations.models import Destination
		destination = Destination.objects.get(name__iexact="Carles")
		expected = {
			"id": destination.id,
			"name": "Carles",
			"province": "Iloilo",
			"municipality": "Carles",
			"description": (
				"Carles is a municipality in the northern tip of Iloilo province, "
				"known for the Gigantes Islands — a group of islands and islets "
				"renowned for pristine beaches, rock formations, and rich marine life. "
				"The pilot destination for NomadReady PH."
			),
		}
		self.assertEqual(data, expected)

	def test_missing_destination_returns_404(self):
		url = reverse("destination-detail", kwargs={"name": "Nowhere"})
		response = self.client.get(url)
		self.assertEqual(response.status_code, 404)

	def test_duplicate_name_case_insensitive(self):
		from .models import Destination
		with self.assertRaises(IntegrityError):
			Destination.objects.create(
				name="carles",
				slug="carles-dup",
				province="Iloilo",
				municipality="Carles",
				description="Duplicate lower-case name should be rejected.",
			)

	# ── new list endpoint ─────────────────────────────────────────────────────

	def test_destinations_list_returns_200(self):
		url = reverse("destination-list")
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)

	def test_destinations_list_includes_both_slugs(self):
		url = reverse("destination-list")
		data = json.loads(self.client.get(url).content)
		slugs = {d["slug"] for d in data}
		self.assertIn("carles", slugs)
		self.assertIn("malay-boracay", slugs)

	def test_destinations_list_required_fields(self):
		url = reverse("destination-list")
		data = json.loads(self.client.get(url).content)
		required = {"id", "slug", "name", "display_name", "municipality", "province",
		            "latitude", "longitude", "default_zoom"}
		for item in data:
			self.assertTrue(required.issubset(set(item.keys())),
				f"Missing fields in: {item.keys()}")

	def test_destinations_list_display_names(self):
		url = reverse("destination-list")
		data = json.loads(self.client.get(url).content)
		by_slug = {d["slug"]: d for d in data}
		self.assertEqual(by_slug["carles"]["display_name"], "Carles, Iloilo")
		self.assertEqual(by_slug["malay-boracay"]["display_name"], "Malay / Boracay, Aklan")

	def test_destinations_list_slugs_are_unique(self):
		url = reverse("destination-list")
		data = json.loads(self.client.get(url).content)
		slugs = [d["slug"] for d in data]
		self.assertEqual(len(slugs), len(set(slugs)))

	def test_destinations_list_carles_coordinates(self):
		url = reverse("destination-list")
		data = json.loads(self.client.get(url).content)
		by_slug = {d["slug"]: d for d in data}
		carles = by_slug["carles"]
		self.assertAlmostEqual(float(carles["latitude"]), 11.572, places=3)
		self.assertAlmostEqual(float(carles["longitude"]), 123.134, places=3)
		self.assertEqual(carles["default_zoom"], 13)

	def test_destinations_list_malay_coordinates(self):
		url = reverse("destination-list")
		data = json.loads(self.client.get(url).content)
		by_slug = {d["slug"]: d for d in data}
		malay = by_slug["malay-boracay"]
		self.assertAlmostEqual(float(malay["latitude"]), 11.980, places=3)
		self.assertAlmostEqual(float(malay["longitude"]), 121.919, places=3)
		self.assertEqual(malay["default_zoom"], 13)

	def test_no_destination_has_null_slug(self):
		from .models import Destination
		null_slug_count = Destination.objects.filter(slug__isnull=True).count()
		empty_slug_count = Destination.objects.filter(slug="").count()
		self.assertEqual(null_slug_count, 0, "Some destinations have null slug")
		self.assertEqual(empty_slug_count, 0, "Some destinations have empty slug")

	def test_seed_idempotent_no_duplicate_destinations(self):
		from .models import Destination
		before = Destination.objects.count()
		call_command("seed_demo_data", verbosity=0)
		after = Destination.objects.count()
		self.assertEqual(before, after, "seed_demo_data created duplicate destinations")
