"""Serializers for the AI Advisor API."""

from rest_framework import serializers


class AIAdvisorRequestSerializer(serializers.Serializer):
    """Request payload for generating AI readiness advice."""

    destination_id = serializers.IntegerField()


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