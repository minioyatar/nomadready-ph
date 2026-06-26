"""Tests for the Listings read‑only API.

The test suite verifies:
* The endpoint returns a 200 response and a list of objects.
* Each object contains all required fields.
* The ``category`` filter returns only listings of that category.
* The ``verification_status`` filter returns only listings with the given status.
* Combined filters apply an AND operation.

The project already ships a ``seed_demo_data`` management command that
creates a handful of listings for Carles.  The tests rely on that data
being present; the command is executed in ``setUpTestData`` to ensure a
consistent fixture across test runs.
"""

from django.urls import reverse
from django.test import TestCase
from django.core.management import call_command
import json


class ListingsAPITest(TestCase):
	@classmethod
	def setUpTestData(cls):
		# Populate the database with the demo seed data used by the UI.
		call_command("seed_demo_data")

	def _get_response(self, query=""):
		url = reverse("listings-list") + query
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		return json.loads(response.content)

	def test_list_returns_all_fields(self):
		data = self._get_response()
		self.assertTrue(isinstance(data, list))
		# Ensure at least one listing is present
		self.assertGreater(len(data), 0)
		required = {
			"id",
			"destination",
			"name",
			"category",
			"type",
			"address",
			"latitude",
			"longitude",
			"details",
			"verification_status",
			"created_at",
			"updated_at",
		}
		for item in data:
			self.assertTrue(required.issubset(set(item.keys())))

	def test_category_filter(self):
		data = self._get_response("?category=work_spot")
		for item in data:
			self.assertEqual(item["category"], "work_spot")

	def test_verification_status_filter(self):
		data = self._get_response("?verification_status=lgu_verified")
		for item in data:
			self.assertEqual(item["verification_status"], "lgu_verified")

	def test_combined_filters(self):
		data = self._get_response("?category=service&verification_status=lgu_verified")
		for item in data:
			self.assertEqual(item["category"], "service")
			self.assertEqual(item["verification_status"], "lgu_verified")
