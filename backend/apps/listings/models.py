from django.db import models
from apps.destinations.models import Destination


class Listing(models.Model):
    class Category(models.TextChoices):
        WORK_SPOT = "work_spot", "Work Spot"
        ACCOMMODATION = "accommodation", "Accommodation"
        SERVICE = "service", "Service"
        TRANSPORT = "transport", "Transport"
        ATTRACTION = "attraction", "Attraction"

    class VerificationStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        LGU_VERIFIED = "lgu_verified", "LGU Verified"
        NEEDS_UPDATE = "needs_update", "Needs Update"

    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="listings"
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=Category.choices)
    type = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=500, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    details = models.JSONField(default=dict)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
