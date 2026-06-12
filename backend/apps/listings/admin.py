from django.contrib import admin
from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "type", "verification_status", "destination"]
    list_filter = ["category", "verification_status", "destination"]
    search_fields = ["name", "address", "type"]
    readonly_fields = ["created_at", "updated_at"]
