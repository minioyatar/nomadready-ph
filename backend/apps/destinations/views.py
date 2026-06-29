"""Views for the Destinations app.

Only a single read‑only endpoint is required: ``GET /api/destinations/carles/``.
The view simply looks up the destination named *Carles* (case‑insensitive)
and returns the serialized data.  If the destination does not exist a
``404`` is returned automatically by ``get_object_or_404``.
"""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Destination
from .serializers import DestinationSerializer


class DestinationDetailView(APIView):
    """Return a destination profile by name."""

    def get(self, request, name):
        # Use the unique name to fetch the destination; the uniqueness
        # constraint guarantees a single match.
        destination = get_object_or_404(Destination, name__iexact=name)
        serializer = DestinationSerializer(destination)
        return Response(serializer.data)
