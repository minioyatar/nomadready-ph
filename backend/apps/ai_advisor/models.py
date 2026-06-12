from django.db import models
from apps.destinations.models import Destination
from apps.scoring.models import ScoreSnapshot


class AIRecommendation(models.Model):
    class Priority(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="ai_recommendations"
    )
    score_snapshot = models.ForeignKey(
        ScoreSnapshot, on_delete=models.CASCADE, related_name="recommendations"
    )
    title = models.CharField(max_length=255)
    affected_category = models.CharField(max_length=100)
    recommendation = models.TextField()
    priority = models.CharField(max_length=10, choices=Priority.choices)
    reason = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["priority", "-generated_at"]

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"
