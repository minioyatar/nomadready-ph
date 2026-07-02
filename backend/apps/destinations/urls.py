"""URL configuration for the Destinations app."""

from django.urls import path
from .views import DestinationDetailView

urlpatterns = [
	path(
		"destinations/<str:name>/",
		DestinationDetailView.as_view(),
		name="destination-detail",
	),
]
