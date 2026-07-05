"""Seed AI recommendations for demo data.

This command creates a single ``AIRecommendation`` for the demo destination
Carles using the placeholder data from the service.  It is intended for
development and demo purposes only.
"""

from django.core.management.base import BaseCommand, CommandError
from apps.destinations.models import Destination
from apps.scoring.models import ScoreSnapshot
from apps.ai_advisor.models import AIRecommendation
from apps.ai_advisor.services import generate_readiness_advice


class Command(BaseCommand):
    help = "Seed AI recommendations for demo destination"

    def handle(self, *args, **options):
        try:
            destination = Destination.objects.get(name__iexact="Carles")
        except Destination.DoesNotExist:
            raise CommandError('Destination "Carles" does not exist. Ensure demo data is seeded correctly.')
        try:
            snapshot = ScoreSnapshot.objects.filter(destination=destination).latest("created_at")
        except ScoreSnapshot.DoesNotExist:
            raise CommandError('No ScoreSnapshot found for destination "Carles". Run scoring steps before seeding advice.')
        advice = generate_readiness_advice(destination.id, snapshot.id)
        for rec in advice["recommendations"]:
            AIRecommendation.objects.update_or_create(
                destination=destination,
                title=rec["title"],
                defaults={
                    "score_snapshot": snapshot,
                    "affected_category": rec["affected_category"],
                    "priority": rec["priority"],
                    "recommendation": rec["suggested_next_step"],
                    "reason": rec["reason"],
                },
            )
        self.stdout.write(self.style.SUCCESS("AI recommendations seeded."))