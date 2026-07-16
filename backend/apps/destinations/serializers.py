"""Serializers for the Destinations app."""

from rest_framework import serializers
from .models import Destination


class DestinationSerializer(serializers.ModelSerializer):
	"""Read-only serializer for the single-destination detail endpoint.

	Fields intentionally match the original MVP contract so existing
	consumers and tests are not broken.
	"""

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


class DestinationListSerializer(serializers.ModelSerializer):
	"""Read-only serializer for GET /api/destinations/.

	Includes slug and map metadata needed by the frontend destination
	selector and map center/zoom logic.  ``display_name`` is computed
	from name + province so no extra DB column is required.
	"""

	display_name = serializers.SerializerMethodField()

	def get_display_name(self, obj):
		return f"{obj.name}, {obj.province}"

	class Meta:
		model = Destination
		fields = (
			"id",
			"slug",
			"name",
			"display_name",
			"municipality",
			"province",
			"latitude",
			"longitude",
			"default_zoom",
		)
		read_only_fields = fields
