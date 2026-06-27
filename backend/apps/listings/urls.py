"""URL configuration for the Listings app.

Only the list endpoint is required for this feature.  The view is
registered under the ``listings/`` prefix, which is included in the
project's root ``config/urls.py``.
"""

from django.urls import path
from .views import ListingListView

urlpatterns = [
	path("listings/", ListingListView.as_view(), name="listings-list"),
]
