"""
Contacts V2 Serializers

Hybrid Architecture Serializer:
- System fields (assigned_to, company, source, status) → Database columns
- Custom fields → JSONB entity_data
- Validates dynamically against FormDefinition schema
"""

from rest_framework import serializers
from .models import ContactV2, ContactCompanyV2
from forms_v2.models import FormDefinition
from companies_v2.models import CompanyV2
from django.db import transaction


class ContactV2Serializer(serializers.ModelSerializer):

    id = serializers.UUIDField(read_only=True)
    org_id = serializers.UUIDField(read_only=True)
    owner_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    deleted_at = serializers.DateTimeField(read_only=True)
    last_activity_at = serializers.DateTimeField(read_only=True)
    last_contacted_at = serializers.DateTimeField(read_only=True)

    status = serializers.ChoiceField(
        choices=ContactV2.Status.choices,
        default=ContactV2.Status.ACTIVE
    )
    source = serializers.ChoiceField(
        choices=ContactV2.Source.choices,
        required=False, allow_null=True
    )

    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    company_id = serializers.UUIDField(required=False, allow_null=True)

    entity_data = serializers.JSONField(required=True)

    converted_from_lead_id = serializers.UUIDField(read_only=True)
    converted_at = serializers.DateTimeField(read_only=True)

    full_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = ContactV2
        fields = [
            'id', 'org_id', 'owner_id',
            'status', 'source',
            'assigned_to_id', 'company_id',
            'entity_data',
            'full_name', 'display_name', 'display_company',
            'email', 'phone',
            'do_not_call', 'do_not_email',
            'converted_from_lead_id', 'converted_at',
            'created_at', 'updated_at', 'deleted_at',
            'last_activity_at', 'last_contacted_at',
        ]
        read_only_fields = [
            'id', 'org_id', 'owner_id',
            'full_name', 'display_name', 'display_company',
            'email', 'phone',
            'converted_from_lead_id', 'converted_at',
            'created_at', 'updated_at', 'deleted_at',
            'last_activity_at', 'last_contacted_at',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_display_name(self, obj):
        return obj.get_full_name()

    def get_display_company(self, obj):
        if obj.company_id:
            company = CompanyV2.objects.filter(id=obj.company_id).only('entity_data').first()
            return company.get_name() if company else None
        return None

    def get_email(self, obj):
        return obj.get_email()

    def get_phone(self, obj):
        return obj.get_phone()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['entity_data'] = dict(representation['entity_data'])

        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        if instance.company_id:
            representation['entity_data']['company'] = str(instance.company_id)
        if instance.source:
            representation['entity_data']['source'] = instance.source
        if instance.status:
            representation['entity_data']['status'] = instance.status

        representation['entity_data']['do_not_call'] = instance.do_not_call
        representation['entity_data']['do_not_email'] = instance.do_not_email

        return representation

    def validate(self, attrs):
        entity_data = attrs.get('entity_data', {})

        if 'source' in entity_data:
            source_value = entity_data.pop('source')
            if source_value and source_value in dict(ContactV2.Source.choices):
                attrs['source'] = source_value

        if 'status' in entity_data:
            status_value = entity_data.pop('status')
            if status_value and status_value in dict(ContactV2.Status.choices):
                attrs['status'] = status_value

        if 'assigned_to' in entity_data:
            assigned_to_value = entity_data.pop('assigned_to')
            if assigned_to_value:
                attrs['assigned_to_id'] = assigned_to_value

        if 'company' in entity_data:
            company_value = entity_data.pop('company')
            if company_value:
                attrs['company_id'] = company_value

        if 'do_not_call' in entity_data:
            attrs['do_not_call'] = bool(entity_data.pop('do_not_call'))

        if 'do_not_email' in entity_data:
            attrs['do_not_email'] = bool(entity_data.pop('do_not_email'))

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
            entity_type='contact',
            form_type='create',
            is_default=True,
            is_active=True
        ).first()

        if not form:
            from forms_v2.default_schemas import get_default_contact_schema

            form = FormDefinition.objects.create(
                org_id=org_id,
                entity_type='contact',
                form_type='create',
                name='Default Contact Form',
                description='Auto-generated default form for contacts.',
                is_default=True,
                is_active=True,
                schema=get_default_contact_schema(),
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
                existing = ContactV2.objects.filter(
                    org_id=org_id, deleted_at__isnull=True
                ).filter(existing_query)

                if self.instance:
                    existing = existing.exclude(id=self.instance.id)

                if existing.exists():
                    errors[field_name] = f"{field_label} must be unique. This value already exists."
                    continue

            try:
                if field_type in ['number', 'decimal']:
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
        return ContactV2.objects.create(**validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ContactV2ListSerializer(serializers.ModelSerializer):

    display_name = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()
    display_phone = serializers.SerializerMethodField()

    _company_cache = None

    class Meta:
        model = ContactV2
        fields = [
            'id', 'status', 'source',
            'entity_data', 'created_at',
            'last_activity_at', 'last_contacted_at',
            'display_name', 'display_email',
            'display_company', 'display_phone',
        ]

    def _get_company_cache(self):
        """Batch-load company names once per serializer invocation to avoid N+1."""
        if self._company_cache is None:
            if hasattr(self.instance, '__iter__') and not isinstance(self.instance, dict):
                company_ids = {obj.company_id for obj in self.instance if obj.company_id}
            else:
                company_ids = {self.instance.company_id} if self.instance and self.instance.company_id else set()
            if company_ids:
                companies = CompanyV2.objects.filter(id__in=company_ids).only('id', 'entity_data')
                self._company_cache = {c.id: c.get_name() for c in companies}
            else:
                self._company_cache = {}
        return self._company_cache

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['entity_data'] = dict(representation['entity_data'])

        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        if instance.company_id:
            representation['entity_data']['company'] = str(instance.company_id)
        if instance.source:
            representation['entity_data']['source'] = instance.source
        if instance.status:
            representation['entity_data']['status'] = instance.status

        representation['entity_data']['do_not_call'] = instance.do_not_call
        representation['entity_data']['do_not_email'] = instance.do_not_email

        return representation

    def get_display_name(self, obj):
        first = obj.entity_data.get('first_name', '')
        last = obj.entity_data.get('last_name', '')
        return f"{first} {last}".strip() or obj.entity_data.get('email', 'N/A')

    def get_display_email(self, obj):
        return obj.entity_data.get('email', 'N/A')

    def get_display_company(self, obj):
        if obj.company_id:
            return self._get_company_cache().get(obj.company_id, 'N/A')
        return 'N/A'

    def get_display_phone(self, obj):
        return obj.entity_data.get('phone', '') or obj.entity_data.get('mobile', 'N/A')


class ContactCompanyV2Serializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = ContactCompanyV2
        fields = [
            'id', 'contact_id', 'company_id', 'company_name',
            'title', 'department', 'is_primary', 'is_current',
            'start_date', 'end_date', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_company_name(self, obj):
        company = CompanyV2.objects.filter(id=obj.company_id).only('entity_data').first()
        return company.get_name() if company else None


class ContactCompanyV2WriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactCompanyV2
        fields = [
            'company_id', 'title', 'department',
            'is_primary', 'is_current', 'start_date', 'end_date',
        ]
