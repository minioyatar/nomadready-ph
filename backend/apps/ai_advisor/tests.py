"""Tests for the AI Advisor API endpoint."""

from django.test import TestCase
from django.urls import reverse
from django.core.management import call_command
from apps.destinations.models import Destination
import json


class AIAdvisorAPITest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo_data")

    def test_generate(self):
        url = reverse("ai-advisor-generate")
        response = self.client.post(url, {"destination_id": Destination.objects.get(name__iexact="Carles").id}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn("summary", data)
        self.assertIn("strengths", data)
        self.assertIn("weaknesses", data)
        self.assertIn("recommendations", data)
        self.assertIsInstance(data["recommendations"], list)

    def test_generate_accepts_destination_name(self):
        url = reverse("ai-advisor-generate")
        response = self.client.post(url, {"destination_name": "Carles"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn("summary", data)
        self.assertIn("recommendations", data)
from django.test import TestCase
