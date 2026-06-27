"""Serializers for the Listings app.

The API contract requires the following fields to be returned for each
listing:

* id
* destination (FK id)
* name
* category
* type
* address
* latitude
* longitude
* details (JSON field)
* verification_status
* created_at
* updated_at

All of these map directly to the ``Listing`` model, so a simple
``ModelSerializer`` is sufficient.  The serializer is deliberately
read‑only – the write endpoints are out of scope for this feature.
"""

from rest_framework import serializers
from .models import Listing


class ListingSerializer(serializers.ModelSerializer):
	"""Read‑only serializer exposing the fields required by the API contract."""

	class Meta:
		model = Listing
		# Explicit field list to guarantee ordering and avoid accidental exposure
		# Use immutable tuples to prevent accidental mutation at runtime and satisfy linting.
		fields = (
			"id",
			"destination",
			"name",
			"category",
			"type",
			"address",
			"latitude",
			"longitude",
			"details",
			"verification_status",
			"created_at",
			"updated_at",
		)
		read_only_fields = fields
