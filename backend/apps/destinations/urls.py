"""URL configuration for the Destinations app."""

from django.urls import path
from .views import DestinationListView, DestinationDetailView

urlpatterns = [
	path(
		"destinations/",
		DestinationListView.as_view(),
		name="destination-list",
	),
	path(
		"destinations/<str:name>/",
		DestinationDetailView.as_view(),
		name="destination-detail",
	),
]
