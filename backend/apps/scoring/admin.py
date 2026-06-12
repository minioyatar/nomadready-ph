from django.contrib import admin
from .models import ScoreSnapshot


@admin.register(ScoreSnapshot)
class ScoreSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        "destination",
        "overall_score",
        "score_label",
        "strongest_category",
        "weakest_category",
        "created_at",
    ]
    list_filter = ["destination", "score_label"]
    readonly_fields = ["created_at"]
