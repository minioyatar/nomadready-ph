"""Serializers for the Destinations app.

Only a read‑only serializer is required for the MVP.  The API contract
specifies the following fields:

* ``id``
* ``name``
* ``province``
* ``municipality``
* ``description``

The serializer is intentionally read‑only – no create or update
operations are exposed.
"""

from rest_framework import serializers
from .models import Destination


class DestinationSerializer(serializers.ModelSerializer):
	"""Serializer for the Carles destination profile."""

	class Meta:
		model = Destination
		fields = (
			"id",
			"name",
			"province",
			"municipality",
			"description",
		)
		read_only_fields = fields
