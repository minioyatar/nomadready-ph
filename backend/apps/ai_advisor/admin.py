from django.contrib import admin
from .models import AIRecommendation


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "priority",
        "affected_category",
        "destination",
        "generated_at",
    ]
    list_filter = ["priority", "affected_category", "destination"]
    search_fields = ["title", "recommendation", "reason"]
    readonly_fields = ["generated_at"]
