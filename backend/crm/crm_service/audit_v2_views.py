"""
API endpoint to query V2 audit logs.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from crm.models import CRMAuditLog

V2_ENTITY_TYPES = {
    'contact_v2', 'company_v2', 'deal_v2', 'lead_v2', 'activity_v2',
    'pipeline_v2', 'tag_v2',
}


class AuditLogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AuditLogV2View(APIView):
    pagination_class = AuditLogPagination

    def get(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = CRMAuditLog.objects.filter(
            org_id=org_id,
            entity_type__in=V2_ENTITY_TYPES,
        ).order_by('-created_at')

        entity_type = request.query_params.get('entity_type')
        if entity_type and entity_type in V2_ENTITY_TYPES:
            qs = qs.filter(entity_type=entity_type)

        entity_id = request.query_params.get('entity_id')
        if entity_id:
            qs = qs.filter(entity_id=entity_id)

        action_filter = request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action=action_filter)

        actor_id = request.query_params.get('actor_id')
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        paginator = AuditLogPagination()
        page = paginator.paginate_queryset(qs, request)

        results = [
            {
                'id': str(log.id),
                'action': log.action,
                'entity_type': log.entity_type,
                'entity_id': str(log.entity_id),
                'entity_name': log.entity_name,
                'actor_id': str(log.actor_id),
                'changes': log.changes,
                'created_at': log.created_at.isoformat(),
            }
            for log in page
        ]

        return paginator.get_paginated_response(results)
