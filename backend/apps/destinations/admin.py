from django.contrib import admin
from .models import Destination


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ["name", "municipality", "province", "created_at"]
    search_fields = ["name", "municipality", "province"]
    readonly_fields = ["created_at", "updated_at"]
