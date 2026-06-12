from django.db import models
from apps.destinations.models import Destination


class ScoreSnapshot(models.Model):
    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="score_snapshots"
    )
    overall_score = models.DecimalField(max_digits=5, decimal_places=2)
    score_label = models.CharField(max_length=100)
    internet_work_score = models.IntegerField()
    accommodation_score = models.IntegerField()
    safety_services_score = models.IntegerField()
    transport_score = models.IntegerField()
    tourism_lifestyle_score = models.IntegerField()
    strongest_category = models.CharField(max_length=100)
    weakest_category = models.CharField(max_length=100)
    top_gaps = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.destination.name} — {self.overall_score} ({self.created_at.date()})"
