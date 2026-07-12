"""Serializers for the AI Advisor API."""

from rest_framework import serializers


class AIAdvisorRequestSerializer(serializers.Serializer):
    """Request payload for generating AI readiness advice."""

    destination_id = serializers.IntegerField(required=False, allow_null=True)
    destinationId = serializers.IntegerField(required=False, allow_null=True)
    destination_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        destination_id = attrs.get("destination_id")
        destination_id_alt = attrs.get("destinationId")
        destination_name = attrs.get("destination_name")

        if destination_id is None and destination_id_alt is None and not destination_name:
            raise serializers.ValidationError(
                {"destination_id": "Provide destination_id, destinationId, or destination_name."}
            )

        if destination_id is None:
            attrs["destination_id"] = destination_id_alt
        return attrs


class RecommendationSerializer(serializers.Serializer):
    title = serializers.CharField()
    affected_category = serializers.CharField()
    priority = serializers.CharField()
    reason = serializers.CharField()
    suggested_next_step = serializers.CharField()


class AIAdvisorResponseSerializer(serializers.Serializer):
    summary = serializers.CharField()
    strengths = serializers.ListField(child=serializers.CharField())
    weaknesses = serializers.ListField(child=serializers.CharField())
    recommendations = serializers.ListField(child=RecommendationSerializer())