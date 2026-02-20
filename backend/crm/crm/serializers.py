"""
CRM Service Serializers.

Serializers for all CRM entities with validation and nested representations.
"""
from decimal import Decimal
from rest_framework import serializers
from django.utils import timezone
import re

from .models import (
    Company, Contact, ContactCompany,
    Lead, Deal, Pipeline, PipelineStage, DealStageHistory,
    Activity, Tag, EntityTag,
    CustomFieldDefinition, CustomFieldValue,
    CRMAuditLog,
)


# =============================================================================
# SANITIZATION HELPERS
# =============================================================================

PHONE_REGEX = re.compile(r'^[\d\s\-\+\(\)]+$')


def sanitize_str(value):
    """Strip leading/trailing whitespace from strings."""
    if isinstance(value, str):
        return value.strip()
    return value


def normalize_email(value):
    """Lowercase and strip email."""
    if isinstance(value, str):
        return value.strip().lower()
    return value


def validate_phone_format(value):
    """Validate phone contains only digits, spaces, +, -, (, )."""
    if value and not PHONE_REGEX.match(value):
        raise serializers.ValidationError("Phone must contain only digits, spaces, +, -, (, )")
    return value


class SanitizedCharField(serializers.CharField):
    """CharField that auto-strips whitespace."""
    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        return sanitize_str(value)


class SanitizedEmailField(serializers.EmailField):
    """EmailField that auto-strips and lowercases."""
    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        return normalize_email(value)


# =============================================================================
# TAG SERIALIZERS
# =============================================================================

class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'color', 'entity_type', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TagMinimalSerializer(serializers.ModelSerializer):
    """Minimal tag serializer for embedding."""
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


# =============================================================================
# CUSTOM FIELD SERIALIZERS
# =============================================================================

class CustomFieldDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for CustomFieldDefinition model."""
    
    # Reserved field names for each entity type (built-in model fields)
    RESERVED_FIELDS = {
        'contact': [
            'id', 'org_id', 'owner_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'mobile', 'title', 'department', 'description',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'linkedin_url', 'twitter_url', 'facebook_url', 'birth_date', 'lead_source',
            'do_not_call', 'do_not_email', 'opt_out', 'custom_fields', 'tags',
            'created_at', 'updated_at', 'deleted_at', 'is_deleted'
        ],
        'company': [
            'id', 'org_id', 'owner_id', 'name', 'website', 'industry', 'size',
            'phone', 'email', 'address_line1', 'address_line2', 'city', 'state',
            'postal_code', 'country', 'description', 'annual_revenue', 'employee_count',
            'linkedin_url', 'twitter_url', 'facebook_url', 'custom_fields', 'tags',
            'parent_company', 'created_at', 'updated_at'
        ],
        'lead': [
            'id', 'org_id', 'owner_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'mobile', 'company_name', 'title', 'website',
            'address_line1', 'city', 'state', 'postal_code', 'country', 'status',
            'source', 'source_detail', 'score', 'description', 'custom_fields',
            'tags', 'converted_at', 'converted_contact_id', 'converted_company_id',
            'converted_deal_id', 'converted_by', 'disqualified_reason', 'disqualified_at',
            'last_activity_at', 'last_contacted_at', 'created_at', 'updated_at',
            'deleted_at', 'is_deleted'
        ],
        'deal': [
            'id', 'org_id', 'owner_id', 'name', 'pipeline', 'stage', 'value',
            'currency', 'probability', 'weighted_value', 'expected_close_date',
            'actual_close_date', 'stage_entered_at', 'status', 'loss_reason',
            'loss_notes', 'contact', 'company', 'converted_from_lead_id', 'description',
            'custom_fields', 'tags', 'line_items', 'last_activity_at', 'activity_count',
            'created_at', 'updated_at', 'deleted_at', 'is_deleted'
        ]
    }

    class Meta:
        model = CustomFieldDefinition
        fields = [
            'id', 'entity_type', 'name', 'label', 'field_type',
            'is_required', 'is_unique', 'default_value', 'placeholder',
            'help_text', 'options', 'validation', 'order', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        """Validate field name is a valid identifier and not reserved."""
        if not value.replace('_', '').isalnum():
            raise serializers.ValidationError(
                "Field name must contain only letters, numbers, and underscores"
            )
        return value.lower()
    
    def validate(self, attrs):
        """Validate that field name doesn't conflict with built-in fields."""
        entity_type = attrs.get('entity_type')
        field_name = attrs.get('name', '').lower()
        
        # Check if field name conflicts with reserved/built-in fields
        reserved_fields = self.RESERVED_FIELDS.get(entity_type, [])
        if field_name in reserved_fields:
            raise serializers.ValidationError({
                'name': f"Field name '{field_name}' is reserved and conflicts with a built-in field for {entity_type}. "
                        f"Please use a different name (e.g., '{field_name}_custom')."
            })
        
        return attrs


class CustomFieldValueSerializer(serializers.ModelSerializer):
    """Serializer for CustomFieldValue model."""
    field_name = serializers.CharField(source='field.name', read_only=True)
    field_type = serializers.CharField(source='field.field_type', read_only=True)
    
    class Meta:
        model = CustomFieldValue
        fields = [
            'id', 'field', 'field_name', 'field_type',
            'entity_type', 'entity_id',
            'value_text', 'value_number', 'value_date', 'value_boolean', 'value_json',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# COMPANY SERIALIZERS
# =============================================================================

class CompanySerializer(serializers.ModelSerializer):
    """Full serializer for Company model."""
    tags = TagMinimalSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    contact_count = serializers.SerializerMethodField()
    deal_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'org_id', 'owner_id', 'name', 'website', 'industry', 'size',
            'phone', 'email',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'description', 'annual_revenue', 'employee_count',
            'linkedin_url', 'twitter_url', 'facebook_url',
            'custom_fields', 'tags', 'tag_ids',
            'parent_company', 'contact_count', 'deal_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'org_id', 'created_at', 'updated_at']
        extra_kwargs = {
            'owner_id': {'required': False},
        }
    
    def validate_name(self, value):
        return sanitize_str(value)
    
    def validate_email(self, value):
        return normalize_email(value) if value else value
    
    def validate_phone(self, value):
        if value:
            value = sanitize_str(value)
            validate_phone_format(value)
        return value
    
    def get_contact_count(self, obj) -> int:
        if hasattr(obj, 'contact_count'):
            return obj.contact_count
        return obj.contact_associations.count()
    
    def get_deal_count(self, obj) -> int:
        if hasattr(obj, 'deal_count'):
            return obj.deal_count
        return obj.deals.count()


class CompanyListSerializer(serializers.ModelSerializer):
    """Minimal serializer for Company listings."""
    tags = TagMinimalSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'industry', 'size', 'phone', 'email',
            'city', 'state', 'country', 'annual_revenue', 'employee_count',
            'tags', 'owner_id', 'created_at'
        ]


class CompanyMinimalSerializer(serializers.ModelSerializer):
    """Minimal company serializer for embedding."""
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'industry', 'website']


# =============================================================================
# CONTACT SERIALIZERS
# =============================================================================

class ContactCompanySerializer(serializers.ModelSerializer):
    """Serializer for Contact-Company relationship (from contact perspective)."""
    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = ContactCompany
        fields = [
            'id', 'company', 'company_id', 'title', 'department',
            'is_primary', 'start_date', 'end_date', 'is_current',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContactSerializer(serializers.ModelSerializer):
    """Full serializer for Contact model."""
    full_name = serializers.CharField(read_only=True)
    primary_company = CompanyMinimalSerializer(read_only=True)
    primary_company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    companies = ContactCompanySerializer(source='company_associations', many=True, read_only=True)
    deal_count = serializers.SerializerMethodField()
    activity_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = [
            'id', 'org_id', 'owner_id',
            'first_name', 'last_name', 'full_name',
            'email', 'secondary_email', 'phone', 'mobile',
            'title', 'department',
            'primary_company', 'primary_company_id', 'companies',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'description', 'avatar_url',
            'linkedin_url', 'twitter_url',
            'status', 'source', 'source_detail',
            'converted_from_lead_id', 'converted_at',
            'custom_fields', 'tags', 'tag_ids',
            'last_activity_at', 'last_contacted_at',
            'do_not_call', 'do_not_email',
            'deal_count', 'activity_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'org_id', 'created_at', 'updated_at', 'converted_at']
        extra_kwargs = {
            'owner_id': {'required': False},
        }
    
    def validate_email(self, value):
        return normalize_email(value)
    
    def validate_secondary_email(self, value):
        return normalize_email(value) if value else value
    
    def validate_phone(self, value):
        if value:
            value = sanitize_str(value)
            validate_phone_format(value)
        return value
    
    def validate_mobile(self, value):
        if value:
            value = sanitize_str(value)
            validate_phone_format(value)
        return value
    
    def validate_first_name(self, value):
        return sanitize_str(value)
    
    def validate_last_name(self, value):
        return sanitize_str(value)
    
    def get_deal_count(self, obj) -> int:
        if hasattr(obj, 'deal_count'):
            return obj.deal_count
        return obj.deals.count()
    
    def get_activity_count(self, obj) -> int:
        if hasattr(obj, 'activity_count'):
            return obj.activity_count
        return obj.activities.count()


class ContactListSerializer(serializers.ModelSerializer):
    """Serializer for Contact listings with fields for list view and export."""
    full_name = serializers.CharField(read_only=True)
    primary_company = CompanyMinimalSerializer(read_only=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    deal_count = serializers.IntegerField(read_only=True, default=0)
    activity_count = serializers.IntegerField(read_only=True, default=0)
    
    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'mobile', 'title', 'department',
            'primary_company', 'status', 'source', 'tags',
            'owner_id', 'deal_count', 'activity_count',
            'last_activity_at', 'created_at'
        ]


class ContactMinimalSerializer(serializers.ModelSerializer):
    """Minimal contact serializer for embedding."""
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Contact
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email']


# =============================================================================
# PIPELINE SERIALIZERS
# =============================================================================

class PipelineStageWriteSerializer(serializers.Serializer):
    """
    Serializer for creating/updating pipeline stages.
    
    This is the WRITE serializer - only validates user input.
    Pipeline and order are handled by the service layer, not from request body.
    """
    name = serializers.CharField(max_length=100)
    probability = serializers.IntegerField(min_value=0, max_value=100, default=0)
    color = serializers.CharField(max_length=7, default='#6B7280')
    is_won = serializers.BooleanField(default=False)
    is_lost = serializers.BooleanField(default=False)
    rotting_days = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    order = serializers.IntegerField(min_value=0, required=False)  # Optional - auto-calculated if not provided
    
    def validate(self, data):
        """Validate is_won and is_lost are mutually exclusive."""
        if data.get('is_won') and data.get('is_lost'):
            raise serializers.ValidationError("A stage cannot be both 'won' and 'lost'")
        return data


class PipelineStageSerializer(serializers.ModelSerializer):
    """
    Serializer for PipelineStage model.
    
    This is the READ serializer - used for output/response.
    """
    is_closed = serializers.BooleanField(read_only=True)
    deal_count = serializers.IntegerField(read_only=True, default=0)
    deal_value = serializers.DecimalField(
        read_only=True, default=Decimal('0'),
        max_digits=15, decimal_places=2,
    )
    
    class Meta:
        model = PipelineStage
        fields = [
            'id', 'pipeline', 'name', 'probability', 'order',
            'is_won', 'is_lost', 'is_closed', 'rotting_days', 'color',
            'deal_count', 'deal_value',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pipeline', 'order', 'created_at', 'updated_at']


class PipelineSerializer(serializers.ModelSerializer):
    """Full serializer for Pipeline model."""
    stages = PipelineStageSerializer(many=True, read_only=True)
    total_deals = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Pipeline
        fields = [
            'id', 'org_id', 'name', 'description',
            'is_default', 'is_active', 'currency', 'order',
            'stages', 'total_deals', 'total_value',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'org_id', 'created_at', 'updated_at']
    
    def get_total_deals(self, obj) -> int:
        """Sum deal_count from prefetched annotated stages to avoid extra query."""
        if hasattr(obj, '_prefetched_objects_cache') and 'stages' in obj._prefetched_objects_cache:
            return sum(getattr(s, 'deal_count', 0) for s in obj.stages.all())
        return obj.deals.filter(status='open').count()
    
    def get_total_value(self, obj) -> Decimal:
        """Sum deal_value from prefetched annotated stages to avoid extra query."""
        if hasattr(obj, '_prefetched_objects_cache') and 'stages' in obj._prefetched_objects_cache:
            return sum(
                (getattr(s, 'deal_value', Decimal('0')) for s in obj.stages.all()),
                Decimal('0'),
            )
        from django.db.models import Sum
        return obj.deals.filter(status='open').aggregate(
            total=Sum('value')
        )['total'] or Decimal('0')


class PipelineListSerializer(serializers.ModelSerializer):
    """Minimal serializer for Pipeline listings."""
    stage_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Pipeline
        fields = [
            'id', 'name', 'is_default', 'is_active', 'currency',
            'stage_count', 'created_at'
        ]
    
    def get_stage_count(self, obj) -> int:
        """Use prefetched stages if available to avoid extra query."""
        if hasattr(obj, '_prefetched_objects_cache') and 'stages' in obj._prefetched_objects_cache:
            return len(obj.stages.all())
        return obj.stages.count()


class PipelineMinimalSerializer(serializers.ModelSerializer):
    """Minimal pipeline serializer for embedding."""
    
    class Meta:
        model = Pipeline
        fields = ['id', 'name', 'currency']


class PipelineStageMinimalSerializer(serializers.ModelSerializer):
    """Minimal stage serializer for embedding."""
    
    class Meta:
        model = PipelineStage
        fields = ['id', 'name', 'probability', 'order', 'is_won', 'is_lost', 'color']


# =============================================================================
# DEAL SERIALIZERS
# =============================================================================

class DealSerializer(serializers.ModelSerializer):
    """Full serializer for Deal model."""
    pipeline = PipelineMinimalSerializer(read_only=True)
    pipeline_id = serializers.UUIDField(write_only=True)
    stage = PipelineStageMinimalSerializer(read_only=True)
    stage_id = serializers.UUIDField(write_only=True)
    contact = ContactMinimalSerializer(read_only=True)
    contact_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    weighted_value = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    activity_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Deal
        fields = [
            'id', 'org_id', 'owner_id', 'name',
            'pipeline', 'pipeline_id', 'stage', 'stage_id',
            'value', 'currency', 'probability', 'weighted_value',
            'expected_close_date', 'actual_close_date',
            'status', 'loss_reason', 'loss_notes',
            'contact', 'contact_id', 'company', 'company_id',
            'converted_from_lead_id', 'description',
            'custom_fields', 'tags', 'tag_ids', 'line_items',
            'stage_entered_at', 'last_activity_at',
            'activity_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'org_id', 'actual_close_date', 'stage_entered_at',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'owner_id': {'required': False},
        }
    
    def get_activity_count(self, obj) -> int:
        if hasattr(obj, 'activity_count'):
            return obj.activity_count
        return obj.activities.count()
    
    def validate(self, data):
        """Validate stage belongs to pipeline."""
        pipeline_id = data.get('pipeline_id') or (self.instance.pipeline_id if self.instance else None)
        stage_id = data.get('stage_id') or (self.instance.stage_id if self.instance else None)
        
        if pipeline_id and stage_id:
            try:
                stage = PipelineStage.objects.get(id=stage_id)
                if str(stage.pipeline_id) != str(pipeline_id):
                    raise serializers.ValidationError({
                        'stage_id': 'Stage does not belong to the selected pipeline'
                    })
            except PipelineStage.DoesNotExist:
                raise serializers.ValidationError({
                    'stage_id': 'Stage not found'
                })
        
        return data


class DealListSerializer(serializers.ModelSerializer):
    """Minimal serializer for Deal listings (Kanban)."""
    stage = PipelineStageMinimalSerializer(read_only=True)
    contact = ContactMinimalSerializer(read_only=True)
    company = CompanyMinimalSerializer(read_only=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    weighted_value = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = Deal
        fields = [
            'id', 'name', 'stage', 'value', 'currency',
            'weighted_value', 'expected_close_date', 'status',
            'contact', 'company', 'tags', 'owner_id', 'description',
            'stage_entered_at', 'last_activity_at', 'created_at'
        ]


class DealMinimalSerializer(serializers.ModelSerializer):
    """Minimal deal serializer for embedding."""
    
    class Meta:
        model = Deal
        fields = ['id', 'name', 'value', 'currency', 'status']


class DealStageHistorySerializer(serializers.ModelSerializer):
    """Serializer for DealStageHistory model."""
    from_stage = PipelineStageMinimalSerializer(read_only=True)
    to_stage = PipelineStageMinimalSerializer(read_only=True)
    
    class Meta:
        model = DealStageHistory
        fields = [
            'id', 'deal', 'from_stage', 'to_stage',
            'changed_by', 'time_in_stage_seconds', 'created_at'
        ]


# =============================================================================
# LEAD SERIALIZERS
# =============================================================================

class LeadSerializer(serializers.ModelSerializer):
    """Full serializer for Lead model."""
    full_name = serializers.CharField(read_only=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    activity_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = [
            'id', 'org_id', 'owner_id',
            'first_name', 'last_name', 'full_name',
            'email', 'phone', 'mobile',
            'company_name', 'title', 'website',
            'address_line1', 'city', 'state', 'postal_code', 'country',
            'status', 'source', 'source_detail', 'score',
            'description', 'custom_fields', 'tags', 'tag_ids',
            'converted_at', 'converted_contact_id', 'converted_company_id',
            'converted_deal_id', 'converted_by',
            'disqualified_reason', 'disqualified_at',
            'last_activity_at', 'last_contacted_at',
            'activity_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'org_id', 'converted_at', 'converted_contact_id',
            'converted_company_id', 'converted_deal_id', 'converted_by',
            'disqualified_at', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'owner_id': {'required': False},
        }
    
    def validate_email(self, value):
        return normalize_email(value)
    
    def validate_phone(self, value):
        if value:
            value = sanitize_str(value)
            validate_phone_format(value)
        return value
    
    def validate_mobile(self, value):
        if value:
            value = sanitize_str(value)
            validate_phone_format(value)
        return value
    
    def validate_first_name(self, value):
        return sanitize_str(value)
    
    def validate_last_name(self, value):
        return sanitize_str(value)
    
    def validate_source(self, value):
        return sanitize_str(value)
    
    def get_activity_count(self, obj) -> int:
        if hasattr(obj, 'activity_count'):
            return obj.activity_count
        return obj.activities.count()


class LeadListSerializer(serializers.ModelSerializer):
    """Minimal serializer for Lead listings."""
    full_name = serializers.CharField(read_only=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    
    class Meta:
        model = Lead
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'company_name', 'status', 'source', 'score',
            'tags', 'owner_id', 'last_activity_at', 'created_at'
        ]


class LeadMinimalSerializer(serializers.ModelSerializer):
    """Minimal lead serializer for embedding."""
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Lead
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'status']


class LeadConvertSerializer(serializers.Serializer):
    """Serializer for lead conversion."""
    create_contact = serializers.BooleanField(default=True)
    create_company = serializers.BooleanField(default=True)
    create_deal = serializers.BooleanField(default=False)
    
    # Contact overrides
    contact_owner_id = serializers.UUIDField(required=False)
    
    # Company overrides
    company_name = serializers.CharField(max_length=255, required=False)
    company_owner_id = serializers.UUIDField(required=False)
    
    # Deal details (if create_deal=True)
    deal_name = serializers.CharField(max_length=255, required=False)
    deal_value = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    deal_pipeline_id = serializers.UUIDField(required=False)
    deal_stage_id = serializers.UUIDField(required=False)
    deal_owner_id = serializers.UUIDField(required=False)
    
    def validate(self, data):
        if data.get('create_deal'):
            if not data.get('deal_name'):
                raise serializers.ValidationError({
                    'deal_name': 'Deal name is required when creating a deal'
                })
        return data


# =============================================================================
# ACTIVITY SERIALIZERS
# =============================================================================

class ActivityValidationMixin:
    """Shared validation logic for Activity serializers."""
    
    # Fields that are only relevant to specific activity types
    CALL_ONLY_FIELDS = {'call_direction', 'call_outcome'}
    EMAIL_ONLY_FIELDS = {'email_direction', 'email_message_id'}
    TIME_RANGE_FIELDS = {'start_time', 'end_time', 'duration_minutes'}
    
    # Which types support which field groups
    TYPE_ALLOWED_FIELDS = {
        'task': {'due_date', 'reminder_at'},
        'note': set(),  # Notes: just subject + description + entity links
        'call': {'due_date', 'start_time', 'end_time', 'duration_minutes', 'call_direction', 'call_outcome', 'reminder_at'},
        'meeting': {'due_date', 'start_time', 'end_time', 'duration_minutes', 'reminder_at'},
        'email': {'due_date', 'email_direction', 'email_message_id', 'reminder_at'},
    }
    
    def _validate_activity(self, data):
        """Cross-field and type-specific validation for activities."""
        errors = {}
        activity_type = data.get('activity_type') or (
            self.instance.activity_type if self.instance else None
        )
        
        # --- Entity link required on create ---
        if not self.instance:
            has_entity = any([
                data.get('contact_id') or data.get('contact'),
                data.get('company_id') or data.get('company'),
                data.get('deal_id') or data.get('deal'),
                data.get('lead_id') or data.get('lead'),
            ])
            if not has_entity:
                raise serializers.ValidationError(
                    'Activity must be linked to at least one entity (contact, company, deal, or lead)'
                )
        
        # --- Cross-field: end_time > start_time ---
        start = data.get('start_time')
        end = data.get('end_time')
        if start and end and end <= start:
            errors['end_time'] = 'End time must be after start time.'
        
        # --- Cross-field: reminder_at < due_date ---
        reminder = data.get('reminder_at')
        due = data.get('due_date')
        if reminder and due and reminder >= due:
            errors['reminder_at'] = 'Reminder must be before the due date.'
        
        # --- Type-specific: strip irrelevant fields silently ---
        if activity_type and activity_type in self.TYPE_ALLOWED_FIELDS:
            allowed = self.TYPE_ALLOWED_FIELDS[activity_type]
            type_specific_fields = (
                self.CALL_ONLY_FIELDS | self.EMAIL_ONLY_FIELDS | self.TIME_RANGE_FIELDS |
                {'due_date', 'reminder_at'}
            )
            for field in type_specific_fields - allowed:
                data.pop(field, None)
        
        # --- Type-specific: call_direction required for calls ---
        if activity_type == 'call' and not self.instance:
            if not data.get('call_direction'):
                errors['call_direction'] = 'Call direction is required for calls.'
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data


class ActivitySerializer(ActivityValidationMixin, serializers.ModelSerializer):
    """Full serializer for Activity model."""
    contact = ContactMinimalSerializer(read_only=True)
    contact_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    deal = DealMinimalSerializer(read_only=True)
    deal_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    lead = LeadMinimalSerializer(read_only=True)
    lead_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'org_id', 'owner_id', 'activity_type',
            'subject', 'description', 'status', 'priority',
            'due_date', 'completed_at',
            'start_time', 'end_time', 'duration_minutes',
            'call_direction', 'call_outcome',
            'email_direction', 'email_message_id',
            'contact', 'contact_id',
            'company', 'company_id',
            'deal', 'deal_id',
            'lead', 'lead_id',
            'assigned_to', 'reminder_at', 'reminder_sent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'org_id', 'completed_at', 'created_at', 'updated_at']
        extra_kwargs = {
            'owner_id': {'required': False},
        }
    
    def validate_subject(self, value):
        return sanitize_str(value)
    
    def validate(self, data):
        return self._validate_activity(data)


class ActivityListSerializer(serializers.ModelSerializer):
    """Serializer for Activity listings — includes all fields needed by list views."""
    contact = ContactMinimalSerializer(read_only=True)
    company = CompanyMinimalSerializer(read_only=True)
    deal = DealMinimalSerializer(read_only=True)
    lead = LeadMinimalSerializer(read_only=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'activity_type', 'subject', 'description',
            'status', 'priority',
            'due_date', 'completed_at',
            'start_time', 'end_time', 'duration_minutes',
            'call_direction', 'call_outcome',
            'email_direction',
            'contact', 'company', 'deal', 'lead',
            'owner_id', 'assigned_to',
            'reminder_at', 'created_at',
        ]


class ActivityCreateSerializer(ActivityValidationMixin, serializers.ModelSerializer):
    """Serializer for creating activities (simplified)."""
    
    class Meta:
        model = Activity
        fields = [
            'activity_type', 'subject', 'description', 'status', 'priority',
            'due_date', 'start_time', 'end_time', 'duration_minutes',
            'call_direction', 'call_outcome',
            'email_direction',
            'contact', 'company', 'deal', 'lead',
            'assigned_to', 'reminder_at'
        ]
    
    def validate_subject(self, value):
        return sanitize_str(value)
    
    def validate(self, data):
        return self._validate_activity(data)


# =============================================================================
# AUDIT LOG SERIALIZER
# =============================================================================

class CRMAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for CRMAuditLog model."""
    
    class Meta:
        model = CRMAuditLog
        fields = [
            'id', 'org_id', 'actor_id', 'action',
            'entity_type', 'entity_id', 'entity_name',
            'changes', 'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# =============================================================================
# IMPORT/EXPORT SERIALIZERS
# =============================================================================

class ContactImportSerializer(serializers.Serializer):
    """Serializer for bulk contact import."""
    contacts = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=1000
    )
    skip_duplicates = serializers.BooleanField(default=True)
    update_existing = serializers.BooleanField(default=False)
    duplicate_check_field = serializers.ChoiceField(
        choices=['email', 'phone'],
        default='email'
    )


class ImportResultSerializer(serializers.Serializer):
    """Serializer for import results."""
    total = serializers.IntegerField()
    created = serializers.IntegerField()
    updated = serializers.IntegerField()
    skipped = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.DictField())


class BulkDeleteSerializer(serializers.Serializer):
    """Serializer for bulk delete operations."""
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100,
        help_text="List of UUIDs to delete (max 100)"
    )


class BulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk update operations."""
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100,
        help_text="List of UUIDs to update (max 100)"
    )
    data = serializers.DictField(
        help_text="Fields to update"
    )


class BulkResultSerializer(serializers.Serializer):
    """Serializer for bulk operation results."""
    total = serializers.IntegerField()
    success = serializers.IntegerField()
    failed = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.DictField(), required=False)


# =============================================================================
# SEARCH/FILTER SERIALIZERS
# =============================================================================

class GlobalSearchSerializer(serializers.Serializer):
    """Serializer for global search results."""
    contacts = ContactListSerializer(many=True)
    companies = CompanyListSerializer(many=True)
    deals = DealListSerializer(many=True)
    leads = LeadListSerializer(many=True)


class DuplicateCheckSerializer(serializers.Serializer):
    """Serializer for duplicate detection."""
    entity_type = serializers.ChoiceField(choices=['contact', 'company', 'lead'])
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    name = serializers.CharField(required=False)
    
    def validate(self, data):
        if not any([data.get('email'), data.get('phone'), data.get('name')]):
            raise serializers.ValidationError(
                'At least one of email, phone, or name is required'
            )
        return data


class DuplicateResultSerializer(serializers.Serializer):
    """Serializer for duplicate detection results."""
    has_duplicates = serializers.BooleanField()
    duplicates = serializers.ListField(child=serializers.DictField())
    match_field = serializers.CharField()


class ContactMergeSerializer(serializers.Serializer):
    """Serializer for merging two contacts."""
    primary_id = serializers.UUIDField(
        help_text="ID of the primary contact (will be kept)"
    )
    secondary_id = serializers.UUIDField(
        help_text="ID of the secondary contact (will be deleted after merge)"
    )
    merge_strategy = serializers.ChoiceField(
        choices=['keep_primary', 'fill_empty'],
        default='keep_primary',
        help_text="keep_primary: Keep all primary values; fill_empty: Fill empty primary fields with secondary values"
    )
    
    def validate(self, data):
        if data['primary_id'] == data['secondary_id']:
            raise serializers.ValidationError(
                'Primary and secondary contact IDs must be different'
            )
        return data


class ContactMergeResultSerializer(serializers.Serializer):
    """Serializer for merge operation result."""
    success = serializers.BooleanField()
    merged_contact = ContactSerializer(required=False)
    message = serializers.CharField()


# =============================================================================
# WEB FORM SERIALIZERS
# =============================================================================

class LeadWebFormSerializer(serializers.Serializer):
    """Serializer for public web form lead capture."""
    
    # Required fields
    org_id = serializers.UUIDField(
        help_text="Organization ID for the lead"
    )
    first_name = serializers.CharField(
        max_length=100,
        help_text="Lead's first name"
    )
    last_name = serializers.CharField(
        max_length=100,
        help_text="Lead's last name"
    )
    email = serializers.EmailField(
        help_text="Lead's email address"
    )
    
    # Optional fields
    phone = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text="Lead's phone number"
    )
    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Lead's company name"
    )
    message = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True,
        help_text="Message or inquiry from the form"
    )
    source_detail = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Which form or page the lead came from"
    )
    
    # UTM tracking fields
    utm_source = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    utm_medium = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    utm_campaign = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    
    # Optional form validation token
    form_token = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Optional token for form validation"
    )
    
    def validate_email(self, value):
        """Normalize email to lowercase."""
        return value.lower().strip()
    
    def validate_phone(self, value):
        """Basic phone validation and cleanup."""
        if not value:
            return value
        # Remove common formatting characters
        cleaned = ''.join(c for c in value if c.isdigit() or c == '+')
        return cleaned if cleaned else value
