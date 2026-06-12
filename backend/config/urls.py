from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok", "service": "nomadready-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/", include("apps.destinations.urls")),
    path("api/", include("apps.listings.urls")),
    path("api/", include("apps.scoring.urls")),
    path("api/", include("apps.ai_advisor.urls")),
]
