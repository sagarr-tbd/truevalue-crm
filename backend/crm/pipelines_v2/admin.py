from django.contrib import admin
from .models import PipelineV2, PipelineStageV2


class PipelineStageV2Inline(admin.TabularInline):
    model = PipelineStageV2
    extra = 0
    ordering = ['order']
    fields = ['name', 'probability', 'order', 'is_won', 'is_lost', 'rotting_days', 'color']


@admin.register(PipelineV2)
class PipelineV2Admin(admin.ModelAdmin):
    list_display = ['name', 'org_id', 'is_default', 'is_active', 'currency', 'order', 'stage_count', 'created_at']
    list_filter = ['is_default', 'is_active', 'currency', 'deleted_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'deleted_at']
    inlines = [PipelineStageV2Inline]

    fieldsets = (
        ('Core', {
            'fields': ('id', 'org_id', 'owner_id', 'name', 'description')
        }),
        ('Configuration', {
            'fields': ('is_default', 'is_active', 'currency', 'order')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def stage_count(self, obj):
        return obj.stages.count()
    stage_count.short_description = 'Stages'

    def get_queryset(self, request):
        return PipelineV2.objects.all()
