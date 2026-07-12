"""View for the AI Advisor API."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import AIAdvisorRequestSerializer, AIAdvisorResponseSerializer
from .services import generate_readiness_advice
from apps.destinations.models import Destination
from django.core.exceptions import MultipleObjectsReturned
from django.http import JsonResponse


class AIAdvisorGenerateView(APIView):
    """POST /api/ai-advisor/generate/ – returns structured AI advice."""

    def post(self, request, *args, **kwargs):
        """Accept a JSON payload with ``destination_id`` and return advice."""
        serializer = AIAdvisorRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        destination_id = serializer.validated_data.get("destination_id")
        destination_name = serializer.validated_data.get("destination_name")

        if destination_id is None and destination_name:
            try:
                destination = Destination.objects.get(name__iexact=destination_name)
                destination_id = destination.id
            except (Destination.DoesNotExist, MultipleObjectsReturned):
                return JsonResponse({"detail": "Destination not found."}, status=404)

        try:
            advice = generate_readiness_advice(destination_id)
        except Destination.DoesNotExist:
            return JsonResponse({"detail": "Destination not found."}, status=404)
        response_serializer = AIAdvisorResponseSerializer(advice)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
