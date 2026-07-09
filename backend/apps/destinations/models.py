from django.db import models

from django.db.models.functions import Lower


class Destination(models.Model):
    name = models.CharField(max_length=255, unique=True)
    province = models.CharField(max_length=255)
    municipality = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(Lower("name"), name="destination_name_ci_unique"),
        ]

    def __str__(self):
        return f"{self.name}, {self.province}"
