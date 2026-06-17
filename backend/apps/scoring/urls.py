from django.urls import path
from .views import CurrentScoreView, RecalculateScoreView

urlpatterns = [
    path("scores/current/", CurrentScoreView.as_view(), name="current-score"),
    path("scores/recalculate/", RecalculateScoreView.as_view(), name="recalculate-score"),
]
