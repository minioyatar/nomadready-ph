from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

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

        snapshot = ScoreSnapshot.objects.filter(destination=destination).first()
        if not snapshot:
            return Response(
                {"error": "No score snapshot found. POST /api/scores/recalculate/ to generate one."},
                status=status.HTTP_404_NOT_FOUND,
            )

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
