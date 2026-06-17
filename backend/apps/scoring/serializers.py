from rest_framework import serializers
from .models import ScoreSnapshot


class ScoreSnapshotSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source="destination.name", read_only=True)

    class Meta:
        model = ScoreSnapshot
        fields = [
            "id",
            "destination_name",
            "overall_score",
            "score_label",
            "internet_work_score",
            "accommodation_score",
            "safety_services_score",
            "transport_score",
            "tourism_lifestyle_score",
            "strongest_category",
            "weakest_category",
            "top_gaps",
            "created_at",
        ]
