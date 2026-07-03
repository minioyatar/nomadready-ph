"""URL configuration for the AI Advisor app."""

from django.urls import path
from .views import AIAdvisorGenerateView

urlpatterns = [
    path("ai-advisor/generate/", AIAdvisorGenerateView.as_view(), name="ai-advisor-generate"),
]
