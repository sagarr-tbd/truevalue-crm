"""
Pipeline V2 Serializers

Nested serialization — pipeline responses include their stages inline.
"""

from rest_framework import serializers
from .models import PipelineV2, PipelineStageV2


class PipelineStageV2Serializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineStageV2
        fields = [
            'id', 'name', 'probability', 'order',
            'is_won', 'is_lost', 'rotting_days', 'color',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PipelineV2Serializer(serializers.ModelSerializer):
    stages = PipelineStageV2Serializer(many=True, read_only=True)
    stage_count = serializers.SerializerMethodField()
    deal_count = serializers.SerializerMethodField()

    class Meta:
        model = PipelineV2
        fields = [
            'id', 'org_id', 'owner_id', 'name', 'description',
            'is_default', 'is_active', 'currency', 'order',
            'stages', 'stage_count', 'deal_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'org_id', 'owner_id', 'stages',
            'stage_count', 'deal_count',
            'created_at', 'updated_at',
        ]

    def get_stage_count(self, obj):
        return obj.stages.count()

    def get_deal_count(self, obj):
        try:
            from deals_v2.models import DealV2
            return DealV2.objects.filter(
                pipeline_id=obj.id, deleted_at__isnull=True
            ).count()
        except Exception:
            return 0


class PipelineV2ListSerializer(serializers.ModelSerializer):
    stage_count = serializers.SerializerMethodField()
    deal_count = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = PipelineV2
        fields = [
            'id', 'name', 'description',
            'is_default', 'is_active', 'currency', 'order',
            'stage_count', 'deal_count', 'total_value',
            'created_at',
        ]

    def get_stage_count(self, obj):
        return obj.stages.count()

    def get_deal_count(self, obj):
        try:
            from deals_v2.models import DealV2
            return DealV2.objects.filter(
                pipeline_id=obj.id, deleted_at__isnull=True
            ).count()
        except Exception:
            return 0

    def get_total_value(self, obj):
        try:
            from deals_v2.models import DealV2
            from django.db.models import Sum
            result = DealV2.objects.filter(
                pipeline_id=obj.id, deleted_at__isnull=True
            ).aggregate(total=Sum('value'))
            return str(result['total'] or 0)
        except Exception:
            return '0'


class PipelineV2CreateSerializer(serializers.ModelSerializer):
    stages = serializers.ListField(
        child=serializers.DictField(), required=False, write_only=True
    )

    class Meta:
        model = PipelineV2
        fields = [
            'name', 'description', 'is_default', 'is_active',
            'currency', 'order', 'stages',
        ]

    def create(self, validated_data):
        stages_data = validated_data.pop('stages', [])
        pipeline = PipelineV2.objects.create(**validated_data)

        if not stages_data:
            stages_data = [
                {'name': 'Prospecting', 'probability': 10, 'order': 0, 'color': '#6B7280'},
                {'name': 'Qualification', 'probability': 25, 'order': 1, 'color': '#3B82F6'},
                {'name': 'Proposal', 'probability': 50, 'order': 2, 'color': '#F59E0B'},
                {'name': 'Negotiation', 'probability': 75, 'order': 3, 'color': '#8B5CF6'},
                {'name': 'Closed Won', 'probability': 100, 'order': 4, 'is_won': True, 'color': '#10B981'},
                {'name': 'Closed Lost', 'probability': 0, 'order': 5, 'is_lost': True, 'color': '#EF4444'},
            ]

        for stage_data in stages_data:
            PipelineStageV2.objects.create(pipeline=pipeline, **stage_data)

        return pipeline
