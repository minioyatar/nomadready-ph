from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from apps.destinations.models import Destination
from .models import ScoreSnapshot
from .serializers import ScoreSnapshotSerializer
from .services import calculate_destination_score


class CurrentScoreView(APIView):
    def get(self, request):
        try:
            destination = Destination.objects.get(name="Carles")
        except Destination.DoesNotExist:
            return Response(
                {"error": "Carles destination not found. Run seed_demo_data first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # This endpoint can lazily create a snapshot on first access.
        # The transaction and row lock ensure only one request creates it.
        with transaction.atomic():
            destination_for_update = Destination.objects.select_for_update().get(pk=destination.pk)
            snapshot = (
                ScoreSnapshot.objects.filter(destination=destination_for_update)
                .order_by("-created_at")
                .first()
            )
            if not snapshot:
                snapshot = calculate_destination_score(destination_for_update.id)

        return Response(ScoreSnapshotSerializer(snapshot).data)


class RecalculateScoreView(APIView):
    def post(self, request):
        try:
            destination = Destination.objects.get(name="Carles")
        except Destination.DoesNotExist:
            return Response(
                {"error": "Carles destination not found. Run seed_demo_data first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        snapshot = calculate_destination_score(destination.id)
        return Response(ScoreSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)
