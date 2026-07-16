"""Views for the Destinations app."""

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Destination
from .serializers import DestinationSerializer, DestinationListSerializer


class DestinationListView(generics.ListAPIView):
    """GET /api/destinations/ — list all destinations with map metadata."""

    serializer_class = DestinationListSerializer
    queryset = Destination.objects.all().order_by("name")


class DestinationDetailView(APIView):
    """GET /api/destinations/<name>/ — single destination profile by name."""

    def get(self, request, name):
        destination = get_object_or_404(Destination, name__iexact=name)
        serializer = DestinationSerializer(destination)
        return Response(serializer.data)
