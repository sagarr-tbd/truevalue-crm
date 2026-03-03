"""
Activity V2 Views

CRUD + complete, calendar, stats, upcoming, overdue, mine, bulk ops.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from .models import ActivityV2
from .serializers import ActivityV2Serializer, ActivityV2ListSerializer


class ActivityV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class ActivityV2ViewSet(viewsets.ModelViewSet):
    queryset = ActivityV2.objects.all()
    serializer_class = ActivityV2Serializer
    pagination_class = ActivityV2Pagination

    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return ActivityV2.objects.none()

        queryset = ActivityV2.objects.filter(org_id=org_id)

        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)

        activity_status = self.request.query_params.get('status')
        if activity_status:
            queryset = queryset.filter(status=activity_status)

        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)

        contact_id = self.request.query_params.get('contact_id')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)

        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        deal_id = self.request.query_params.get('deal_id')
        if deal_id:
            queryset = queryset.filter(deal_id=deal_id)

        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) | Q(description__icontains=search)
            )

        email_direction = self.request.query_params.get('email_direction')
        if email_direction:
            queryset = queryset.filter(email_direction=email_direction)

        ALLOWED_ORDERING = {
            'created_at', '-created_at', 'due_date', '-due_date',
            'subject', '-subject', 'status', '-status',
            'priority', '-priority', 'updated_at', '-updated_at',
            'start_time', '-start_time',
        }
        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering not in ALLOWED_ORDERING:
            ordering = '-created_at'
        queryset = queryset.order_by(ordering)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivityV2ListSerializer
        return ActivityV2Serializer

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
            activity = ActivityV2.all_objects.get(id=pk, deleted_at__isnull=False)
            activity.restore()
            serializer = self.get_serializer(activity)
            return Response(serializer.data)
        except ActivityV2.DoesNotExist:
            return Response(
                {'error': 'Activity not found or not deleted'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        activity = self.get_object()
        activity.complete()
        serializer = self.get_serializer(activity)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        qs = ActivityV2.objects.filter(org_id=org_id)

        activity_type = request.query_params.get('activity_type')
        if activity_type:
            qs = qs.filter(activity_type=activity_type)

        by_type = dict(qs.values_list('activity_type').annotate(count=Count('id')).values_list('activity_type', 'count'))
        by_status = dict(qs.values_list('status').annotate(count=Count('id')).values_list('status', 'count'))
        by_priority = dict(qs.values_list('priority').annotate(count=Count('id')).values_list('priority', 'count'))

        now = timezone.now()
        overdue_count = qs.filter(
            due_date__lt=now,
            status__in=['pending', 'in_progress']
        ).count()

        return Response({
            'total': qs.count(),
            'by_type': by_type,
            'by_status': by_status,
            'by_priority': by_priority,
            'overdue': overdue_count,
        })

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        start = request.query_params.get('start')
        end = request.query_params.get('end')

        qs = ActivityV2.objects.filter(org_id=org_id)

        if start:
            qs = qs.filter(
                Q(due_date__gte=start) | Q(start_time__gte=start)
            )
        if end:
            qs = qs.filter(
                Q(due_date__lte=end) | Q(end_time__lte=end)
            )

        serializer = ActivityV2ListSerializer(qs[:200], many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        try:
            days = int(request.query_params.get('days', 7))
            if days < 1 or days > 365:
                days = 7
        except (ValueError, TypeError):
            days = 7

        qs = ActivityV2.objects.filter(
            org_id=org_id,
            due_date__gte=now,
            due_date__lte=now + timedelta(days=days),
            status__in=['pending', 'in_progress'],
        ).order_by('due_date')[:50]

        serializer = ActivityV2ListSerializer(qs, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        qs = ActivityV2.objects.filter(
            org_id=org_id,
            due_date__lt=now,
            status__in=['pending', 'in_progress'],
        ).order_by('due_date')[:50]

        serializer = ActivityV2ListSerializer(qs, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def mine(self, request):
        user_id = request.user.id if hasattr(request, 'user') else None
        if not user_id:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        qs = ActivityV2.objects.filter(
            org_id=org_id
        ).filter(
            Q(owner_id=user_id) | Q(assigned_to_id=user_id)
        ).order_by('-created_at')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ActivityV2ListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ActivityV2ListSerializer(qs, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'ids list required'}, status=status.HTTP_400_BAD_REQUEST)

        org_id = request.headers.get('X-Org-Id')
        deleted_by = request.user.id if hasattr(request, 'user') else None
        now = timezone.now()

        count = ActivityV2.objects.filter(
            id__in=ids, org_id=org_id
        ).update(
            deleted_at=now,
            deleted_by=deleted_by,
        )

        return Response({'deleted': count})

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        ids = request.data.get('ids', [])
        updates = request.data.get('updates', {})
        if not ids or not updates:
            return Response(
                {'error': 'ids and updates required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        org_id = request.headers.get('X-Org-Id')
        allowed = {'status', 'priority', 'assigned_to_id'}
        safe_updates = {k: v for k, v in updates.items() if k in allowed}

        if not safe_updates:
            return Response(
                {'error': f'No allowed fields in updates. Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        count = ActivityV2.objects.filter(
            id__in=ids, org_id=org_id
        ).update(**safe_updates)

        return Response({'updated': count})
