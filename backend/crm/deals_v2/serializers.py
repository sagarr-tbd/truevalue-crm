from rest_framework import serializers
from .models import DealV2
from forms_v2.models import FormDefinition
from django.db import transaction
from django.utils import timezone
from decimal import Decimal, InvalidOperation


class DealV2Serializer(serializers.ModelSerializer):

    id = serializers.UUIDField(read_only=True)
    org_id = serializers.UUIDField(read_only=True)
    owner_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    deleted_at = serializers.DateTimeField(read_only=True)
    last_activity_at = serializers.DateTimeField(read_only=True)
    stage_entered_at = serializers.DateTimeField(read_only=True)

    status = serializers.ChoiceField(
        choices=DealV2.Status.choices,
        default=DealV2.Status.OPEN
    )
    stage = serializers.CharField(
        max_length=50, default='qualification'
    )

    value = serializers.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0'),
        min_value=Decimal('0')
    )
    probability = serializers.IntegerField(
        required=False, allow_null=True,
        min_value=0, max_value=100
    )

    pipeline_id = serializers.UUIDField(required=False, allow_null=True)
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    company_id = serializers.UUIDField(required=False, allow_null=True)
    converted_from_lead_id = serializers.UUIDField(required=False, allow_null=True)

    entity_data = serializers.JSONField(required=True)

    display_name = serializers.SerializerMethodField()
    display_value = serializers.SerializerMethodField()
    display_stage = serializers.SerializerMethodField()
    display_pipeline = serializers.SerializerMethodField()
    display_owner = serializers.SerializerMethodField()
    display_contact = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()

    class Meta:
        model = DealV2
        fields = [
            'id', 'org_id', 'owner_id',
            'status', 'stage', 'value', 'currency', 'probability',
            'expected_close_date', 'actual_close_date',
            'loss_reason',
            'pipeline_id', 'assigned_to_id', 'contact_id', 'company_id',
            'converted_from_lead_id',
            'entity_data',
            'display_name', 'display_value', 'display_stage',
            'display_pipeline', 'display_owner', 'display_contact', 'display_company',
            'created_at', 'updated_at', 'deleted_at',
            'last_activity_at', 'stage_entered_at',
        ]
        read_only_fields = [
            'id', 'org_id', 'owner_id',
            'display_name', 'display_value', 'display_stage',
            'display_pipeline', 'display_owner', 'display_contact', 'display_company',
            'created_at', 'updated_at', 'deleted_at',
            'last_activity_at', 'stage_entered_at',
        ]

    def get_display_name(self, obj):
        return obj.get_name()

    def get_display_value(self, obj):
        return f"{obj.currency} {obj.value:,.2f}"

    def get_display_stage(self, obj):
        return obj.stage.replace('_', ' ').title() if obj.stage else ''

    def get_display_pipeline(self, obj):
        if not obj.pipeline_id:
            return ''
        try:
            from pipelines_v2.models import PipelineV2
            pipeline = PipelineV2.objects.filter(id=obj.pipeline_id, deleted_at__isnull=True).first()
            return pipeline.name if pipeline else ''
        except Exception:
            return ''

    def get_display_owner(self, obj):
        if not obj.assigned_to_id:
            return ''
        try:
            from crm.utils import fetch_member_names
            members = fetch_member_names(str(obj.org_id))
            return members.get(str(obj.assigned_to_id), '')
        except Exception:
            return ''

    def get_display_contact(self, obj):
        if not obj.contact_id:
            return ''
        try:
            from contacts_v2.models import ContactV2
            contact = ContactV2.objects.filter(id=obj.contact_id, deleted_at__isnull=True).first()
            if contact:
                first = contact.entity_data.get('first_name', '')
                last = contact.entity_data.get('last_name', '')
                return f"{first} {last}".strip() or contact.entity_data.get('email', '')
            return ''
        except Exception:
            return ''

    def get_display_company(self, obj):
        if not obj.company_id:
            return ''
        try:
            from companies_v2.models import CompanyV2
            company = CompanyV2.objects.filter(id=obj.company_id, deleted_at__isnull=True).first()
            if company:
                return company.entity_data.get('name', '')
            return ''
        except Exception:
            return ''

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['entity_data'] = dict(representation['entity_data'])

        if instance.pipeline_id:
            representation['entity_data']['pipeline'] = str(instance.pipeline_id)
        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        if instance.contact_id:
            representation['entity_data']['contact'] = str(instance.contact_id)
        if instance.company_id:
            representation['entity_data']['company'] = str(instance.company_id)
        if instance.stage:
            representation['entity_data']['stage'] = instance.stage
        if instance.status:
            representation['entity_data']['status'] = instance.status
        if instance.value is not None:
            representation['entity_data']['value'] = str(instance.value)
        if instance.currency:
            representation['entity_data']['currency'] = instance.currency
        if instance.probability is not None:
            representation['entity_data']['probability'] = instance.probability
        if instance.expected_close_date:
            representation['entity_data']['expected_close_date'] = str(instance.expected_close_date)
        if instance.actual_close_date:
            representation['entity_data']['actual_close_date'] = str(instance.actual_close_date)
        if instance.loss_reason:
            representation['entity_data']['loss_reason'] = instance.loss_reason

        return representation

    def validate(self, attrs):
        entity_data = attrs.get('entity_data', {})

        if 'status' in entity_data:
            status_value = entity_data.pop('status')
            if status_value and status_value in dict(DealV2.Status.choices):
                attrs['status'] = status_value

        if 'stage' in entity_data:
            stage_value = entity_data.pop('stage')
            if stage_value:
                attrs['stage'] = stage_value

        if 'value' in entity_data:
            try:
                attrs['value'] = Decimal(str(entity_data.pop('value')))
            except (InvalidOperation, TypeError, ValueError):
                entity_data.pop('value', None)

        if 'currency' in entity_data:
            attrs['currency'] = entity_data.pop('currency') or 'USD'

        if 'probability' in entity_data:
            prob = entity_data.pop('probability')
            if prob is not None and prob != '':
                try:
                    attrs['probability'] = int(prob)
                except (TypeError, ValueError):
                    pass

        if 'expected_close_date' in entity_data:
            attrs['expected_close_date'] = entity_data.pop('expected_close_date') or None

        if 'actual_close_date' in entity_data:
            attrs['actual_close_date'] = entity_data.pop('actual_close_date') or None

        if 'loss_reason' in entity_data:
            attrs['loss_reason'] = entity_data.pop('loss_reason') or None

        if 'pipeline' in entity_data:
            pipeline_value = entity_data.pop('pipeline')
            if pipeline_value:
                attrs['pipeline_id'] = pipeline_value
            else:
                attrs['pipeline_id'] = None

        if 'assigned_to' in entity_data:
            assigned_value = entity_data.pop('assigned_to')
            if assigned_value:
                attrs['assigned_to_id'] = assigned_value
            else:
                attrs['assigned_to_id'] = None

        if 'contact' in entity_data:
            contact_value = entity_data.pop('contact')
            if contact_value:
                attrs['contact_id'] = contact_value
            else:
                attrs['contact_id'] = None

        if 'company' in entity_data:
            company_value = entity_data.pop('company')
            if company_value:
                attrs['company_id'] = company_value
            else:
                attrs['company_id'] = None

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
            entity_type='deal',
            form_type='create',
            is_default=True,
            is_active=True
        ).first()

        if not form:
            from forms_v2.default_schemas import get_default_deal_schema
            form = FormDefinition.objects.create(
                org_id=org_id,
                entity_type='deal',
                form_type='create',
                name='Default Deal Form',
                description='Auto-generated default form for deals.',
                is_default=True,
                is_active=True,
                schema=get_default_deal_schema(),
                created_by=getattr(request.user, 'id', None)
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
                existing = DealV2.objects.filter(
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
        return DealV2.objects.create(**validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        old_stage = instance.stage
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if 'stage' in validated_data and validated_data['stage'] != old_stage:
            now = timezone.now()

            time_in_stage = None
            if instance.stage_entered_at:
                time_in_stage = int((now - instance.stage_entered_at).total_seconds())

            instance.stage_entered_at = now

            try:
                from deals_v2.models import DealStageHistoryV2
                request = self.context.get('request')
                changed_by = request.user.id if request and hasattr(request, 'user') else None
                DealStageHistoryV2.objects.create(
                    deal=instance,
                    from_stage=old_stage,
                    to_stage=validated_data['stage'],
                    changed_by=changed_by,
                    time_in_stage_seconds=time_in_stage,
                )
            except Exception:
                pass

        instance.save()
        return instance


class DealV2ListSerializer(serializers.ModelSerializer):

    display_name = serializers.SerializerMethodField()
    display_value = serializers.SerializerMethodField()
    display_stage = serializers.SerializerMethodField()
    display_contact = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()
    display_pipeline = serializers.SerializerMethodField()

    class Meta:
        model = DealV2
        fields = [
            'id', 'status', 'stage', 'value', 'currency', 'probability',
            'expected_close_date', 'actual_close_date', 'loss_reason',
            'pipeline_id',
            'entity_data', 'created_at',
            'last_activity_at',
            'display_name', 'display_value', 'display_stage',
            'display_contact', 'display_company', 'display_pipeline',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['entity_data'] = dict(representation['entity_data'])

        if instance.pipeline_id:
            representation['entity_data']['pipeline'] = str(instance.pipeline_id)
        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        if instance.contact_id:
            representation['entity_data']['contact'] = str(instance.contact_id)
        if instance.company_id:
            representation['entity_data']['company'] = str(instance.company_id)
        if instance.stage:
            representation['entity_data']['stage'] = instance.stage
        if instance.status:
            representation['entity_data']['status'] = instance.status
        if instance.value is not None:
            representation['entity_data']['value'] = str(instance.value)
        if instance.currency:
            representation['entity_data']['currency'] = instance.currency
        if instance.probability is not None:
            representation['entity_data']['probability'] = instance.probability
        if instance.expected_close_date:
            representation['entity_data']['expected_close_date'] = str(instance.expected_close_date)
        if instance.actual_close_date:
            representation['entity_data']['actual_close_date'] = str(instance.actual_close_date)
        if instance.loss_reason:
            representation['entity_data']['loss_reason'] = instance.loss_reason

        return representation

    def get_display_name(self, obj):
        return obj.entity_data.get('name', 'Unnamed Deal')

    def get_display_value(self, obj):
        return f"{obj.currency} {obj.value:,.2f}"

    def get_display_stage(self, obj):
        return obj.stage.replace('_', ' ').title() if obj.stage else ''

    def get_display_contact(self, obj):
        if not obj.contact_id:
            return ''
        try:
            from contacts_v2.models import ContactV2
            contact = ContactV2.objects.filter(id=obj.contact_id, deleted_at__isnull=True).first()
            if contact:
                first = contact.entity_data.get('first_name', '')
                last = contact.entity_data.get('last_name', '')
                return f"{first} {last}".strip() or contact.entity_data.get('email', '')
            return ''
        except Exception:
            return ''

    def get_display_company(self, obj):
        if not obj.company_id:
            return ''
        try:
            from companies_v2.models import CompanyV2
            company = CompanyV2.objects.filter(id=obj.company_id, deleted_at__isnull=True).first()
            if company:
                return company.entity_data.get('name', '')
            return ''
        except Exception:
            return ''

    def get_display_pipeline(self, obj):
        if not obj.pipeline_id:
            return ''
        try:
            from pipelines_v2.models import PipelineV2
            pipeline = PipelineV2.objects.filter(id=obj.pipeline_id, deleted_at__isnull=True).first()
            return pipeline.name if pipeline else ''
        except Exception:
            return ''
