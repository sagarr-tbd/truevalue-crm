"""
CRM Admin Configuration.
"""
from django.contrib import admin
from .models import (
    Company, Contact, ContactCompany,
    Lead, Deal, Pipeline, PipelineStage, DealStageHistory,
    Activity, Tag, EntityTag,
    CustomFieldDefinition, CustomFieldValue,
    CRMAuditLog,
)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'org_id', 'owner_id', 'created_at']
    list_filter = ['industry', 'size', 'created_at']
    search_fields = ['name', 'email', 'website']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'primary_company', 'status', 'org_id', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['first_name', 'last_name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ContactCompany)
class ContactCompanyAdmin(admin.ModelAdmin):
    list_display = ['contact', 'company', 'title', 'is_primary', 'is_current']
    list_filter = ['is_primary', 'is_current']
    raw_id_fields = ['contact', 'company']


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'company_name', 'status', 'source', 'org_id', 'created_at']
    list_filter = ['status', 'source', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'company_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    list_display = ['name', 'org_id', 'is_default', 'is_active', 'currency']
    list_filter = ['is_default', 'is_active']
    search_fields = ['name']


@admin.register(PipelineStage)
class PipelineStageAdmin(admin.ModelAdmin):
    list_display = ['name', 'pipeline', 'order', 'probability', 'is_won', 'is_lost']
    list_filter = ['pipeline', 'is_won', 'is_lost']
    ordering = ['pipeline', 'order']


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ['name', 'pipeline', 'stage', 'value', 'status', 'owner_id', 'created_at']
    list_filter = ['status', 'pipeline', 'stage', 'created_at']
    search_fields = ['name']
    raw_id_fields = ['contact', 'company', 'pipeline', 'stage']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(DealStageHistory)
class DealStageHistoryAdmin(admin.ModelAdmin):
    list_display = ['deal', 'from_stage', 'to_stage', 'changed_by', 'created_at']
    list_filter = ['created_at']
    raw_id_fields = ['deal', 'from_stage', 'to_stage']


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['subject', 'activity_type', 'status', 'due_date', 'owner_id', 'created_at']
    list_filter = ['activity_type', 'status', 'priority', 'created_at']
    search_fields = ['subject', 'description']
    raw_id_fields = ['contact', 'company', 'deal', 'lead']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'entity_type', 'color', 'org_id']
    list_filter = ['entity_type']
    search_fields = ['name']


@admin.register(EntityTag)
class EntityTagAdmin(admin.ModelAdmin):
    list_display = ['tag', 'entity_type', 'entity_id', 'created_at']
    list_filter = ['entity_type']
    raw_id_fields = ['tag']


@admin.register(CustomFieldDefinition)
class CustomFieldDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'entity_type', 'field_type', 'is_active', 'org_id']
    list_filter = ['entity_type', 'field_type', 'is_active']
    search_fields = ['name', 'label']


@admin.register(CustomFieldValue)
class CustomFieldValueAdmin(admin.ModelAdmin):
    list_display = ['field', 'entity_type', 'entity_id', 'created_at']
    list_filter = ['entity_type']
    raw_id_fields = ['field']


@admin.register(CRMAuditLog)
class CRMAuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'entity_type', 'entity_id', 'actor_id', 'org_id', 'created_at']
    list_filter = ['action', 'entity_type', 'created_at']
    search_fields = ['entity_name']
    readonly_fields = ['id', 'created_at']
