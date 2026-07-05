"""Tests for the Destinations API.

The tests rely on the existing ``seed_demo_data`` management command
which creates the Carles destination.  They verify that the
``/api/destinations/carles/`` endpoint returns the correct payload and
that a missing destination results in a 404.
"""

from django.test import TestCase
from django.core.management import call_command
from django.urls import reverse
<<<<<<< HEAD
=======
from django.db import IntegrityError
>>>>>>> origin/main
import json


class DestinationAPITest(TestCase):
	@classmethod
	def setUpTestData(cls):
		# Ensure demo data is present
		call_command("seed_demo_data")

	def _get_response(self, path):
		response = self.client.get(path)
		return response

	def test_carles_profile(self):
		url = reverse("destination-detail", kwargs={"name": "Carles"})
		response = self._get_response(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		# Retrieve the actual destination id from the database to avoid
		# hard‑coding the primary key.
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
				"renowned for pristine beaches, rock formations, and rich marine "
				"life. The pilot destination for NomadReady PH."
			),
		}
		self.assertEqual(data, expected)

<<<<<<< HEAD
=======
	def test_duplicate_name_case_insensitive(self):
		from .models import Destination
		with self.assertRaises(IntegrityError):
			Destination.objects.create(
				name="carles",
				province="Iloilo",
				municipality="Carles",
				description="Duplicate lower-case name should be rejected.",
			)

>>>>>>> origin/main
	def test_missing_destination(self):
		# Temporarily delete the destination to test 404
		from .models import Destination
		Destination.objects.all().delete()
		url = reverse("destination-detail", kwargs={"name": "Carles"})
		response = self._get_response(url)
		self.assertEqual(response.status_code, 404)
