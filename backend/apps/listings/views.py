"""Views for the Listings API.

Only a read‑only list endpoint is required.  The view uses DRF's
``ListAPIView`` and applies simple ``filter_backends`` to support the two
query‑string filters defined in the spec:

* ``category`` – exact match against ``Listing.category``
* ``verification_status`` – exact match against ``Listing.verification_status``

Both filters are optional; when omitted the full queryset is returned.
"""

from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing
from .serializers import ListingSerializer


class ListingListView(generics.ListAPIView):
    """GET /api/listings/ – returns all listings with optional filters.

    The view is deliberately read‑only; POST/PATCH/DELETE are out of scope.
    """

    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    # Use DjangoFilterBackend for simple exact filters
    # Use immutable tuples for class-level configuration to avoid mutable defaults.
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("category", "verification_status")
