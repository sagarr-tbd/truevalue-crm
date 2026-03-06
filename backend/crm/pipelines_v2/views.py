from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from collections import defaultdict
from django.db.models import Count, Sum, Q, Max
from django.utils import timezone

from .models import PipelineV2, PipelineStageV2
from .serializers import (
    PipelineV2Serializer,
    PipelineV2ListSerializer,
    PipelineV2CreateSerializer,
    PipelineStageV2Serializer,
)
from crm.permissions import CRMResourcePermission
from crm_service.audit_v2 import AuditLogV2Mixin


class PipelineV2Pagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class PipelineV2ViewSet(AuditLogV2Mixin, viewsets.ModelViewSet):
    resource = 'pipelines'
    permission_classes = [CRMResourcePermission]
    audit_tracked_fields = ['name', 'is_default', 'is_active', 'owner_id']
    queryset = PipelineV2.objects.filter(deleted_at__isnull=True)
    serializer_class = PipelineV2Serializer
    pagination_class = PipelineV2Pagination

    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return PipelineV2.objects.none()

        queryset = PipelineV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True
        ).prefetch_related('stages')

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset.order_by('order', 'name')

    def get_serializer_class(self):
        if self.action == 'list':
            return PipelineV2ListSerializer
        if self.action == 'create':
            return PipelineV2CreateSerializer
        return PipelineV2Serializer

    def perform_create(self, serializer):
        org_id = self.request.headers.get('X-Org-Id')
        user_id = self.request.user.id if hasattr(self.request, 'user') else None
        serializer.save(
            org_id=org_id,
            owner_id=user_id or org_id,
            created_by_id=user_id,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        deleted_by = request.user.id if hasattr(request, 'user') else None
        instance.soft_delete(deleted_by=deleted_by)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        try:
            org_id = request.headers.get('X-Org-Id')
            pipeline = PipelineV2.objects.filter(
                id=pk, org_id=org_id, deleted_at__isnull=False
            ).first()
            if not pipeline:
                return Response(
                    {'error': 'Pipeline not found or not deleted'},
                    status=status.HTTP_404_NOT_FOUND
                )
            pipeline.restore()
            serializer = PipelineV2Serializer(pipeline)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pipeline = self.get_object()

        PipelineV2.objects.filter(
            org_id=org_id, is_default=True, deleted_at__isnull=True
        ).update(is_default=False)

        pipeline.is_default = True
        pipeline.save(update_fields=['is_default', 'updated_at'])

        serializer = PipelineV2Serializer(pipeline)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='stages')
    def add_stage(self, request, pk=None):
        pipeline = self.get_object()
        data = request.data

        max_order = pipeline.stages.aggregate(
            max_order=Max('order')
        )['max_order'] or -1

        stage = PipelineStageV2.objects.create(
            pipeline=pipeline,
            name=data.get('name', 'New Stage'),
            probability=data.get('probability', 0),
            order=data.get('order', max_order + 1),
            is_won=data.get('is_won', False),
            is_lost=data.get('is_lost', False),
            rotting_days=data.get('rotting_days'),
            color=data.get('color', '#6B7280'),
        )

        serializer = PipelineStageV2Serializer(stage)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='stages/(?P<stage_id>[^/.]+)')
    def update_stage(self, request, pk=None, stage_id=None):
        pipeline = self.get_object()
        try:
            stage = pipeline.stages.get(id=stage_id)
        except PipelineStageV2.DoesNotExist:
            return Response(
                {'error': 'Stage not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        allowed_fields = ['name', 'probability', 'order', 'is_won', 'is_lost', 'rotting_days', 'color']
        for field in allowed_fields:
            if field in request.data:
                setattr(stage, field, request.data[field])
        stage.save()

        serializer = PipelineStageV2Serializer(stage)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='stages/(?P<stage_id>[^/.]+)/delete')
    def delete_stage(self, request, pk=None, stage_id=None):
        pipeline = self.get_object()
        try:
            stage = pipeline.stages.get(id=stage_id)
        except PipelineStageV2.DoesNotExist:
            return Response(
                {'error': 'Stage not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if pipeline.stages.count() <= 1:
            return Response(
                {'error': 'Pipeline must have at least one stage'},
                status=status.HTTP_400_BAD_REQUEST
            )

        stage.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def reorder_stages(self, request, pk=None):
        pipeline = self.get_object()
        stage_order = request.data.get('stage_ids', [])

        if not stage_order:
            return Response(
                {'error': 'stage_ids list required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for index, stage_id in enumerate(stage_order):
            pipeline.stages.filter(id=stage_id).update(order=index)

        pipeline.refresh_from_db()
        serializer = PipelineV2Serializer(pipeline)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        pipeline = self.get_object()

        try:
            from deals_v2.models import DealV2

            deals = DealV2.objects.filter(
                pipeline_id=pipeline.id, deleted_at__isnull=True
            )

            total_deals = deals.count()
            total_value = deals.aggregate(total=Sum('value'))['total'] or 0
            by_stage = {}

            for stage in pipeline.stages.all().order_by('order'):
                stage_deals = deals.filter(stage=stage.name)
                by_stage[stage.name] = {
                    'count': stage_deals.count(),
                    'value': str(stage_deals.aggregate(total=Sum('value'))['total'] or 0),
                    'probability': stage.probability,
                    'color': stage.color,
                }

            return Response({
                'pipeline_id': str(pipeline.id),
                'pipeline_name': pipeline.name,
                'total_deals': total_deals,
                'total_value': str(total_value),
                'by_stage': by_stage,
            })

        except Exception:
            return Response({
                'pipeline_id': str(pipeline.id),
                'pipeline_name': pipeline.name,
                'total_deals': 0,
                'total_value': '0',
                'by_stage': {},
            })

    @action(detail=True, methods=['get'])
    def kanban(self, request, pk=None):
        pipeline = self.get_object()

        try:
            from deals_v2.models import DealV2
            from contacts_v2.models import ContactV2
            from companies_v2.models import CompanyV2

            stages = list(pipeline.stages.order_by('order'))

            all_deals = list(
                DealV2.objects.filter(
                    pipeline_id=pipeline.id,
                    deleted_at__isnull=True,
                ).order_by('stage_entered_at')
            )

            contact_ids = {d.contact_id for d in all_deals if d.contact_id}
            company_ids = {d.company_id for d in all_deals if d.company_id}

            contact_names = {}
            if contact_ids:
                for c in ContactV2.objects.filter(id__in=contact_ids).only('id', 'entity_data'):
                    contact_names[c.id] = c.get_full_name()

            company_names = {}
            if company_ids:
                for c in CompanyV2.objects.filter(id__in=company_ids).only('id', 'entity_data'):
                    company_names[c.id] = c.get_name()

            deals_by_stage = defaultdict(list)
            for deal in all_deals:
                deals_by_stage[deal.stage].append(deal)

            now = timezone.now()
            kanban_stages = []

            for stage in stages:
                stage_deals = deals_by_stage.get(stage.name, [])
                stage_value = sum(d.value for d in stage_deals)

                kanban_stages.append({
                    'id': str(stage.id),
                    'name': stage.name,
                    'order': stage.order,
                    'probability': stage.probability,
                    'is_won': stage.is_won,
                    'is_lost': stage.is_lost,
                    'color': stage.color,
                    'deal_count': len(stage_deals),
                    'total_value': str(stage_value),
                    'deals': [
                        {
                            'id': str(d.id),
                            'name': d.get_name(),
                            'value': str(d.value),
                            'status': d.status,
                            'contact_name': contact_names.get(d.contact_id),
                            'company_name': company_names.get(d.company_id),
                            'expected_close_date': d.expected_close_date.isoformat() if d.expected_close_date else None,
                            'owner_id': str(d.owner_id),
                            'days_in_stage': (now - d.stage_entered_at).days if d.stage_entered_at else 0,
                        }
                        for d in stage_deals
                    ]
                })

            return Response({
                'pipeline': {
                    'id': str(pipeline.id),
                    'name': pipeline.name,
                    'currency': pipeline.currency,
                },
                'stages': kanban_stages,
            })

        except Exception as e:
            return Response({
                'pipeline': {
                    'id': str(pipeline.id),
                    'name': pipeline.name,
                    'currency': pipeline.currency,
                },
                'stages': [],
                'error': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
