"""Tests for the AI Advisor API endpoint."""

from django.test import TestCase
from django.urls import reverse
from django.core.management import call_command
import json


class AIAdvisorAPITest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo_data")

    def test_generate(self):
        url = reverse("ai-advisor-generate")
        response = self.client.post(url, {"destination_id": 1}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn("summary", data)
        self.assertIn("strengths", data)
        self.assertIn("weaknesses", data)
        self.assertIn("recommendations", data)
        self.assertIsInstance(data["recommendations"], list)# Placeholder — AI advisor tests will be implemented in feature/ai-readiness-advisor
from django.test import TestCase
