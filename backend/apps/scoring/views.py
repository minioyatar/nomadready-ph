from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from apps.destinations.models import Destination
from .models import ScoreSnapshot
from .serializers import ScoreSnapshotSerializer
from .services import calculate_destination_score

_DEFAULT_SLUG = "carles"


def _resolve_destination(slug):
    """Return (Destination, error_Response_or_None).

    Looks up the destination by slug.  Returns a 404 Response when the slug
    is not found so callers can return it immediately.
    """
    try:
        return Destination.objects.get(slug=slug), None
    except Destination.DoesNotExist:
        return None, Response(
            {"error": f"Destination '{slug}' not found."},
            status=status.HTTP_404_NOT_FOUND,
        )


class CurrentScoreView(APIView):
    def get(self, request):
        slug = request.query_params.get("destination", _DEFAULT_SLUG) or _DEFAULT_SLUG
        destination, err = _resolve_destination(slug)
        if err:
            return err

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
        slug = (request.data.get("destination") or _DEFAULT_SLUG).strip() or _DEFAULT_SLUG
        destination, err = _resolve_destination(slug)
        if err:
            return err

        snapshot = calculate_destination_score(destination.id)
        return Response(ScoreSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)
