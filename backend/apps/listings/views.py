"""Views for the Listings API."""

from rest_framework import generics
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend

from apps.destinations.models import Destination
from .models import Listing
from .serializers import ListingSerializer

_DEFAULT_SLUG = "carles"


class ListingListView(generics.ListAPIView):
    """GET /api/listings/ — listings scoped to a single destination.

    Query parameters:
      destination       slug (default: "carles")
      category          exact match
      verification_status  exact match

    category and verification_status are applied as AND filters on top of
    the destination scope.  An invalid destination slug returns 404.  A
    valid destination with no listings returns 200 with an empty list.
    """

    serializer_class = ListingSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("category", "verification_status")

    def get_queryset(self):
        slug = (
            self.request.query_params.get("destination", _DEFAULT_SLUG)
            or _DEFAULT_SLUG
        )
        try:
            destination = Destination.objects.get(slug=slug)
        except Destination.DoesNotExist:
            raise NotFound(detail=f"Destination '{slug}' not found.")

        return (
            Listing.objects.filter(destination=destination)
            .select_related("destination")
            .order_by("category", "name")
        )
