from uuid import UUID
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q

from .models import TagV2, EntityTagV2
from .serializers import (
    TagV2Serializer,
    TagV2MinimalSerializer,
    AssignTagSerializer,
    BulkAssignTagSerializer,
    EntityTagV2Serializer,
)
from crm.permissions import CRMResourcePermission
from crm_service.audit_v2 import AuditLogV2Mixin


class TagV2Pagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class TagV2ViewSet(AuditLogV2Mixin, viewsets.ModelViewSet):
    resource = 'tags'
    permission_classes = [CRMResourcePermission]
    audit_tracked_fields = ['name', 'color', 'entity_type']
    serializer_class = TagV2Serializer
    pagination_class = TagV2Pagination
    lookup_field = 'pk'

    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return TagV2.objects.none()

        qs = TagV2.objects.filter(org_id=org_id)

        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            qs = qs.filter(
                Q(entity_type=entity_type) | Q(entity_type=TagV2.EntityType.ALL)
            )

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)

        qs = qs.annotate(usage_count=Count('assignments'))
        return qs

    def perform_create(self, serializer):
        org_id = self.request.headers.get('X-Org-Id')
        serializer.save(
            org_id=org_id,
            created_by_id=self.request.user.id,
        )

    @action(detail=False, methods=['post'])
    def assign(self, request):
        serializer = AssignTagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_id = request.headers.get('X-Org-Id')
        tag_id = serializer.validated_data['tag_id']
        entity_type = serializer.validated_data['entity_type']
        entity_id = serializer.validated_data['entity_id']

        try:
            tag = TagV2.objects.get(id=tag_id, org_id=org_id)
        except TagV2.DoesNotExist:
            return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)

        if tag.entity_type != TagV2.EntityType.ALL and tag.entity_type != entity_type:
            return Response(
                {'error': f'Tag "{tag.name}" cannot be applied to {entity_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        assignment, created = EntityTagV2.objects.get_or_create(
            tag=tag,
            entity_type=entity_type,
            entity_id=entity_id,
            defaults={'created_by_id': request.user.id},
        )

        result_serializer = EntityTagV2Serializer(assignment)
        return Response(
            result_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def unassign(self, request):
        serializer = AssignTagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_id = request.headers.get('X-Org-Id')
        tag_id = serializer.validated_data['tag_id']
        entity_type = serializer.validated_data['entity_type']
        entity_id = serializer.validated_data['entity_id']

        deleted, _ = EntityTagV2.objects.filter(
            tag_id=tag_id,
            tag__org_id=org_id,
            entity_type=entity_type,
            entity_id=entity_id,
        ).delete()

        if not deleted:
            return Response({'error': 'Tag assignment not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        serializer = BulkAssignTagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_id = request.headers.get('X-Org-Id')
        tag_ids = serializer.validated_data['tag_ids']
        entity_type = serializer.validated_data['entity_type']
        entity_ids = serializer.validated_data['entity_ids']

        tags = TagV2.objects.filter(id__in=tag_ids, org_id=org_id)
        valid_tags = [
            t for t in tags
            if t.entity_type == TagV2.EntityType.ALL or t.entity_type == entity_type
        ]

        created_count = 0
        for tag in valid_tags:
            for eid in entity_ids:
                _, created = EntityTagV2.objects.get_or_create(
                    tag=tag,
                    entity_type=entity_type,
                    entity_id=eid,
                    defaults={'created_by_id': request.user.id},
                )
                if created:
                    created_count += 1

        return Response({
            'assigned': created_count,
            'tags': len(valid_tags),
            'entities': len(entity_ids),
        })

    @action(detail=False, methods=['post'])
    def bulk_unassign(self, request):
        serializer = BulkAssignTagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_id = request.headers.get('X-Org-Id')
        tag_ids = serializer.validated_data['tag_ids']
        entity_type = serializer.validated_data['entity_type']
        entity_ids = serializer.validated_data['entity_ids']

        deleted, _ = EntityTagV2.objects.filter(
            tag_id__in=tag_ids,
            tag__org_id=org_id,
            entity_type=entity_type,
            entity_id__in=entity_ids,
        ).delete()

        return Response({'removed': deleted})

    @action(detail=False, methods=['get'])
    def for_entity(self, request):
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')

        if not entity_type or not entity_id:
            return Response(
                {'error': 'entity_type and entity_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        org_id = request.headers.get('X-Org-Id')

        try:
            entity_id = UUID(entity_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid entity_id'}, status=status.HTTP_400_BAD_REQUEST)

        assignments = EntityTagV2.objects.filter(
            tag__org_id=org_id,
            entity_type=entity_type,
            entity_id=entity_id,
        ).select_related('tag')

        serializer = EntityTagV2Serializer(assignments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def for_entities(self, request):
        """
        Batch-fetch tags for multiple entities.
        Request: { "entity_type": "contact", "entity_ids": ["uuid1", "uuid2"] }
        Response: { "uuid1": [tag1, tag2], "uuid2": [tag3] }
        """
        entity_type = request.data.get('entity_type')
        entity_ids = request.data.get('entity_ids', [])

        if not entity_type or not entity_ids:
            return Response(
                {'error': 'entity_type and entity_ids are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        org_id = request.headers.get('X-Org-Id')

        assignments = EntityTagV2.objects.filter(
            tag__org_id=org_id,
            entity_type=entity_type,
            entity_id__in=entity_ids,
        ).select_related('tag')

        result = {}
        for a in assignments:
            eid = str(a.entity_id)
            if eid not in result:
                result[eid] = []
            result[eid].append(TagV2MinimalSerializer(a.tag).data)

        return Response(result)
