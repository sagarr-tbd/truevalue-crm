"""
Companies V2 Serializers

Hybrid Architecture Serializer:
- System fields (assigned_to, industry, size, status) → Database columns
- Custom fields → JSONB entity_data
- Validates dynamically against FormDefinition schema
"""

from rest_framework import serializers
from .models import CompanyV2
from forms_v2.models import FormDefinition
from django.db import transaction


class CompanyV2Serializer(serializers.ModelSerializer):

    id = serializers.UUIDField(read_only=True)
    org_id = serializers.UUIDField(read_only=True)
    owner_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    deleted_at = serializers.DateTimeField(read_only=True)
    last_activity_at = serializers.DateTimeField(read_only=True)

    status = serializers.ChoiceField(
        choices=CompanyV2.Status.choices,
        default=CompanyV2.Status.ACTIVE
    )

    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    parent_company_id = serializers.UUIDField(required=False, allow_null=True)

    entity_data = serializers.JSONField(required=True)

    display_name = serializers.SerializerMethodField()
    display_website = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_phone = serializers.SerializerMethodField()

    class Meta:
        model = CompanyV2
        fields = [
            'id', 'org_id', 'owner_id',
            'status', 'industry', 'size',
            'assigned_to_id', 'parent_company_id',
            'entity_data',
            'display_name', 'display_website', 'display_email', 'display_phone',
            'created_at', 'updated_at', 'deleted_at',
            'last_activity_at',
        ]
        read_only_fields = [
            'id', 'org_id', 'owner_id',
            'display_name', 'display_website', 'display_email', 'display_phone',
            'created_at', 'updated_at', 'deleted_at',
            'last_activity_at',
        ]

    def get_display_name(self, obj):
        return obj.get_name()

    def get_display_website(self, obj):
        return obj.get_website()

    def get_display_email(self, obj):
        return obj.get_email()

    def get_display_phone(self, obj):
        return obj.get_phone()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['entity_data'] = dict(representation['entity_data'])

        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        if instance.parent_company_id:
            representation['entity_data']['parent_company'] = str(instance.parent_company_id)
        if instance.industry:
            representation['entity_data']['industry'] = instance.industry
        if instance.size:
            representation['entity_data']['size'] = instance.size
        if instance.status:
            representation['entity_data']['status'] = instance.status

        return representation

    def validate(self, attrs):
        entity_data = attrs.get('entity_data', {})

        if 'status' in entity_data:
            status_value = entity_data.pop('status')
            if status_value and status_value in dict(CompanyV2.Status.choices):
                attrs['status'] = status_value

        if 'industry' in entity_data:
            attrs['industry'] = entity_data.pop('industry') or None

        if 'size' in entity_data:
            size_value = entity_data.pop('size')
            if size_value and size_value in dict(CompanyV2.Size.choices):
                attrs['size'] = size_value
            else:
                entity_data.pop('size', None)

        if 'assigned_to' in entity_data:
            assigned_to_value = entity_data.pop('assigned_to')
            if assigned_to_value:
                attrs['assigned_to_id'] = assigned_to_value

        if 'parent_company' in entity_data:
            parent_value = entity_data.pop('parent_company')
            if parent_value:
                attrs['parent_company_id'] = parent_value

        attrs['entity_data'] = entity_data
        return attrs

    def validate_entity_data(self, value):
        if not value or not isinstance(value, dict):
            raise serializers.ValidationError("entity_data must be a non-empty object")

        request = self.context.get('request')
        if not request:
            return value

        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            raise serializers.ValidationError("X-Org-Id header required")

        form = FormDefinition.objects.filter(
            org_id=org_id,
            entity_type='company',
            form_type='create',
            is_default=True,
            is_active=True
        ).first()

        if not form:
            from forms_v2.default_schemas import get_default_company_schema
            form = FormDefinition.objects.create(
                org_id=org_id,
                entity_type='company',
                form_type='create',
                name='Default Company Form',
                description='Auto-generated default form for companies.',
                is_default=True,
                is_active=True,
                schema=get_default_company_schema(),
                created_by=request.user.id
            )

        field_definitions = {}
        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                field_name = field.get('name')
                if field_name:
                    field_definitions[field_name] = field

        if not field_definitions:
            raise serializers.ValidationError("No field definitions found in form schema.")

        errors = {}

        for field_name, field_def in field_definitions.items():
            field_value = value.get(field_name)
            field_label = field_def.get('label', field_name)
            field_type = field_def.get('field_type')
            is_required = field_def.get('is_required', False)
            is_unique = field_def.get('is_unique', False)

            if is_required:
                if field_value is None or field_value == '':
                    errors[field_name] = f"{field_label} is required"
                    continue

            if field_value is None or field_value == '':
                continue

            if is_unique and field_value:
                from django.db.models import Q
                existing_query = Q(**{f'entity_data__{field_name}': field_value})
                existing = CompanyV2.objects.filter(
                    org_id=org_id, deleted_at__isnull=True
                ).filter(existing_query)

                if self.instance:
                    existing = existing.exclude(id=self.instance.id)

                if existing.exists():
                    errors[field_name] = f"{field_label} must be unique. This value already exists."
                    continue

            try:
                if field_type in ['number', 'decimal', 'currency']:
                    num_value = float(field_value) if not isinstance(field_value, (int, float)) else field_value
                    validation = field_def.get('validation_rules', {})
                    if 'min' in validation and num_value < validation['min']:
                        errors[field_name] = f"{field_label} must be at least {validation['min']}"
                    if 'max' in validation and num_value > validation['max']:
                        errors[field_name] = f"{field_label} must be at most {validation['max']}"

                elif field_type == 'email':
                    if '@' not in str(field_value) or '.' not in str(field_value):
                        errors[field_name] = f"{field_label} must be a valid email"

                elif field_type == 'url':
                    if not str(field_value).startswith(('http://', 'https://')):
                        errors[field_name] = f"{field_label} must be a valid URL"

                elif field_type == 'phone':
                    if len(str(field_value).strip()) < 10:
                        errors[field_name] = f"{field_label} must be a valid phone number"

                elif field_type in ['select', 'radio']:
                    options = field_def.get('options', {})
                    valid_values = [opt['value'] for opt in options.get('options', [])]
                    if valid_values and str(field_value) not in valid_values:
                        errors[field_name] = f"{field_label} must be one of: {', '.join(valid_values)}"

                elif field_type == 'multi_select':
                    if not isinstance(field_value, list):
                        errors[field_name] = f"{field_label} must be a list"
                    else:
                        options = field_def.get('options', {})
                        valid_values = [opt['value'] for opt in options.get('options', [])]
                        if valid_values:
                            invalid = [v for v in field_value if str(v) not in valid_values]
                            if invalid:
                                errors[field_name] = f"{field_label} contains invalid values: {', '.join(map(str, invalid))}"

                elif field_type == 'checkbox':
                    if not isinstance(field_value, bool):
                        errors[field_name] = f"{field_label} must be true or false"

                elif field_type == 'text':
                    validation = field_def.get('validation_rules', {})
                    text_len = len(str(field_value))
                    if 'min_length' in validation and text_len < validation['min_length']:
                        errors[field_name] = f"{field_label} must be at least {validation['min_length']} characters"
                    if 'max_length' in validation and text_len > validation['max_length']:
                        errors[field_name] = f"{field_label} must be at most {validation['max_length']} characters"
                    if 'pattern' in validation:
                        import re
                        if not re.match(validation['pattern'], str(field_value)):
                            errors[field_name] = f"{field_label} format is invalid"

            except Exception as e:
                errors[field_name] = f"{field_label} validation error: {str(e)}"

        if errors:
            raise serializers.ValidationError(errors)

        return value

    @transaction.atomic
    def create(self, validated_data):
        return CompanyV2.objects.create(**validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class CompanyV2ListSerializer(serializers.ModelSerializer):

    display_name = serializers.SerializerMethodField()
    display_website = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_phone = serializers.SerializerMethodField()
    display_industry = serializers.SerializerMethodField()

    class Meta:
        model = CompanyV2
        fields = [
            'id', 'status', 'industry', 'size',
            'entity_data', 'created_at',
            'last_activity_at',
            'display_name', 'display_website',
            'display_email', 'display_phone',
            'display_industry',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['entity_data'] = dict(representation['entity_data'])

        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        if instance.parent_company_id:
            representation['entity_data']['parent_company'] = str(instance.parent_company_id)
        if instance.industry:
            representation['entity_data']['industry'] = instance.industry
        if instance.size:
            representation['entity_data']['size'] = instance.size
        if instance.status:
            representation['entity_data']['status'] = instance.status

        return representation

    def get_display_name(self, obj):
        return obj.entity_data.get('name', 'N/A')

    def get_display_website(self, obj):
        return obj.entity_data.get('website', '')

    def get_display_email(self, obj):
        return obj.entity_data.get('email', '')

    def get_display_phone(self, obj):
        return obj.entity_data.get('phone', '')

    def get_display_industry(self, obj):
        return obj.industry or obj.entity_data.get('industry', '')
