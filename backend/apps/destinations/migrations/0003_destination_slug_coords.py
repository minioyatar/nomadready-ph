"""
Migration 0003 — add slug, latitude, longitude, default_zoom to Destination.

Strategy:
  1. Add slug as nullable (allows existing rows to remain valid during migration).
  2. Add latitude, longitude (nullable), default_zoom (with default 13).
  3. RunPython: populate slugs for all existing rows.
     - Carles row gets the canonical slug "carles" and approved coordinates.
     - Any other existing rows get a slug derived from their name via slugify().
     - Collisions are resolved deterministically by appending "-<pk>".
     - Empty slugify() results (non-ASCII names) fall back to "destination-<pk>".
  4. AlterField: make slug NOT NULL and unique.

Using the historical model via apps.get_model() throughout — never importing
the live Destination class inside a migration.
"""

from django.db import migrations, models
from django.utils.text import slugify


# ── Data migration ──────────────────────────────────────────────────────────

_CARLES_DATA = {
    "slug": "carles",
    "latitude": "11.572000",
    "longitude": "123.134000",
    "default_zoom": 13,
}


def populate_slugs(apps, schema_editor):
    Destination = apps.get_model("destinations", "Destination")
    used_slugs = set()

    # Process Carles first so the canonical slug is always reserved.
    for dest in Destination.objects.order_by("id"):
        if dest.name.strip().lower() == "carles":
            dest.slug = _CARLES_DATA["slug"]
            dest.latitude = _CARLES_DATA["latitude"]
            dest.longitude = _CARLES_DATA["longitude"]
            dest.default_zoom = _CARLES_DATA["default_zoom"]
        else:
            base = slugify(dest.name) or f"destination-{dest.pk}"
            candidate = base
            suffix = 1
            while candidate in used_slugs:
                candidate = f"{base}-{suffix}"
                suffix += 1
            dest.slug = candidate
            # Unknown destinations retain null lat/lng.

        used_slugs.add(dest.slug)
        dest.save()


def reverse_populate_slugs(apps, schema_editor):
    # Nullify slugs — valid because the field is nullable at this migration step.
    Destination = apps.get_model("destinations", "Destination")
    Destination.objects.update(slug=None)


# ── Migration ────────────────────────────────────────────────────────────────

class Migration(migrations.Migration):

    dependencies = [
        ("destinations", "0002_alter_destination_name"),
    ]

    operations = [
        # Step 1 — add slug as nullable, no index yet (db_index=False prevents the
        # PostgreSQL varchar_pattern_ops/_like index from being created here;
        # the final AlterField in step 4 will create both the unique and _like
        # indexes in one pass, avoiding a DuplicateTable collision).
        migrations.AddField(
            model_name="destination",
            name="slug",
            field=models.SlugField(max_length=100, null=True, blank=True, db_index=False),
        ),
        # Step 2 — add geographic metadata
        migrations.AddField(
            model_name="destination",
            name="latitude",
            field=models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="destination",
            name="longitude",
            field=models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="destination",
            name="default_zoom",
            field=models.PositiveSmallIntegerField(default=13),
        ),
        # Step 3 — populate slugs for all existing rows
        migrations.RunPython(populate_slugs, reverse_populate_slugs),
        # Step 4 — make slug NOT NULL and unique
        migrations.AlterField(
            model_name="destination",
            name="slug",
            field=models.SlugField(max_length=100, unique=True),
        ),
    ]
