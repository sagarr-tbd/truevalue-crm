"""
Reports & Analytics V2

Unified reporting endpoints that aggregate across all V2 entities.
"""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Q, Avg, F
from django.db.models.functions import TruncDate, TruncMonth, Coalesce
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status


class DashboardV2View(APIView):
    """
    GET /api/v2/reports/dashboard/

    Org-wide overview: entity counts, deal pipeline summary,
    activity breakdown, recent trends.
    """

    def get(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        from contacts_v2.models import ContactV2
        from companies_v2.models import CompanyV2
        from leads_v2.models import LeadV2
        from deals_v2.models import DealV2
        from activities_v2.models import ActivityV2

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        contact_count = ContactV2.objects.filter(org_id=org_id, deleted_at__isnull=True).count()
        company_count = CompanyV2.objects.filter(org_id=org_id, deleted_at__isnull=True).count()
        lead_count = LeadV2.objects.filter(org_id=org_id, deleted_at__isnull=True).count()

        deals_qs = DealV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
        deal_agg = deals_qs.aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status='open')),
            won=Count('id', filter=Q(status='won')),
            lost=Count('id', filter=Q(status='lost')),
            total_value=Coalesce(Sum('value'), Decimal('0')),
            open_value=Coalesce(Sum('value', filter=Q(status='open')), Decimal('0')),
            won_value=Coalesce(Sum('value', filter=Q(status='won')), Decimal('0')),
        )

        activity_count = ActivityV2.objects.filter(org_id=org_id).count()
        overdue_activities = ActivityV2.objects.filter(
            org_id=org_id,
            due_date__lt=now,
            status__in=['pending', 'in_progress'],
        ).count()

        new_contacts_30d = ContactV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True,
            created_at__gte=thirty_days_ago,
        ).count()
        new_leads_30d = LeadV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True,
            created_at__gte=thirty_days_ago,
        ).count()
        won_deals_30d = deals_qs.filter(
            status='won', actual_close_date__gte=thirty_days_ago.date(),
        ).aggregate(
            count=Count('id'),
            value=Coalesce(Sum('value'), Decimal('0')),
        )

        return Response({
            'counts': {
                'contacts': contact_count,
                'companies': company_count,
                'leads': lead_count,
                'deals': deal_agg['total'],
                'activities': activity_count,
            },
            'deals': {
                'open': deal_agg['open'],
                'won': deal_agg['won'],
                'lost': deal_agg['lost'],
                'total_value': str(deal_agg['total_value']),
                'open_value': str(deal_agg['open_value']),
                'won_value': str(deal_agg['won_value']),
            },
            'activities': {
                'total': activity_count,
                'overdue': overdue_activities,
            },
            'last_30_days': {
                'new_contacts': new_contacts_30d,
                'new_leads': new_leads_30d,
                'deals_won': won_deals_30d['count'],
                'revenue_won': str(won_deals_30d['value']),
            },
        })


class SalesPipelineReportV2View(APIView):
    """
    GET /api/v2/reports/pipeline/?pipeline_id=<uuid>&days=90

    Pipeline performance: conversion funnel, velocity, stage distribution.
    """

    def get(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        from deals_v2.models import DealV2, DealStageHistoryV2
        from pipelines_v2.models import PipelineV2, PipelineStageV2

        pipeline_id = request.query_params.get('pipeline_id')
        try:
            days = int(request.query_params.get('days', 90))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 90

        cutoff = timezone.now() - timedelta(days=days)

        deals_qs = DealV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
        if pipeline_id:
            deals_qs = deals_qs.filter(pipeline_id=pipeline_id)

        by_stage = list(
            deals_qs.filter(status='open')
            .values('stage')
            .annotate(count=Count('id'), value=Sum('value'))
            .order_by('stage')
        )
        for row in by_stage:
            row['value'] = str(row['value'] or 0)

        recent = deals_qs.filter(created_at__gte=cutoff)
        total_created = recent.count()
        won = recent.filter(status='won')
        lost = recent.filter(status='lost')

        won_count = won.count()
        lost_count = lost.count()
        closed = won_count + lost_count
        win_rate = round(won_count / closed * 100, 1) if closed else 0

        avg_deal_value = won.aggregate(
            avg=Coalesce(Avg('value'), Decimal('0'))
        )['avg']

        avg_days_to_close = None
        won_with_dates = won.filter(actual_close_date__isnull=False)
        if won_with_dates.exists():
            total_days = sum(
                (d.actual_close_date - d.created_at.date()).days
                for d in won_with_dates.only('actual_close_date', 'created_at')
            )
            avg_days_to_close = round(total_days / won_with_dates.count(), 1)

        monthly_trend = list(
            recent
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                created=Count('id'),
                won=Count('id', filter=Q(status='won')),
                lost=Count('id', filter=Q(status='lost')),
                revenue=Coalesce(Sum('value', filter=Q(status='won')), Decimal('0')),
            )
            .order_by('month')
        )
        for row in monthly_trend:
            row['month'] = row['month'].strftime('%Y-%m')
            row['revenue'] = str(row['revenue'])

        return Response({
            'period_days': days,
            'stage_distribution': by_stage,
            'conversion': {
                'total_created': total_created,
                'won': won_count,
                'lost': lost_count,
                'win_rate': win_rate,
                'avg_deal_value': str(avg_deal_value),
                'avg_days_to_close': avg_days_to_close,
            },
            'monthly_trend': monthly_trend,
        })


class TeamActivityReportV2View(APIView):
    """
    GET /api/v2/reports/team-activity/?days=30

    Activity metrics broken down by owner/assignee.
    """

    def get(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        from activities_v2.models import ActivityV2

        try:
            days = int(request.query_params.get('days', 30))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 30

        cutoff = timezone.now() - timedelta(days=days)

        qs = ActivityV2.objects.filter(org_id=org_id, created_at__gte=cutoff)

        by_owner = list(
            qs.values('owner_id')
            .annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status='completed')),
                overdue=Count('id', filter=Q(
                    due_date__lt=timezone.now(),
                    status__in=['pending', 'in_progress'],
                )),
            )
            .order_by('-total')[:50]
        )
        for row in by_owner:
            row['owner_id'] = str(row['owner_id'])
            row['completion_rate'] = (
                round(row['completed'] / row['total'] * 100, 1)
                if row['total'] else 0
            )

        by_type = list(
            qs.values('activity_type')
            .annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status='completed')),
            )
            .order_by('-total')
        )

        summary = qs.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            overdue=Count('id', filter=Q(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress'],
            )),
        )

        return Response({
            'period_days': days,
            'summary': summary,
            'by_owner': by_owner,
            'by_type': by_type,
        })


class LeadConversionReportV2View(APIView):
    """
    GET /api/v2/reports/lead-conversion/?days=90

    Lead conversion funnel: created vs converted vs lost, by source.
    """

    def get(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        from leads_v2.models import LeadV2

        try:
            days = int(request.query_params.get('days', 90))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 90

        cutoff = timezone.now() - timedelta(days=days)
        qs = LeadV2.objects.filter(org_id=org_id, deleted_at__isnull=True, created_at__gte=cutoff)

        total = qs.count()
        by_status = dict(
            qs.values_list('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        converted = by_status.get('converted', 0)
        conversion_rate = round(converted / total * 100, 1) if total else 0

        by_source = list(
            qs.values('source')
            .annotate(
                total=Count('id'),
                converted=Count('id', filter=Q(status='converted')),
            )
            .order_by('-total')
        )
        for row in by_source:
            row['conversion_rate'] = (
                round(row['converted'] / row['total'] * 100, 1)
                if row['total'] else 0
            )

        monthly = list(
            qs.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                created=Count('id'),
                converted=Count('id', filter=Q(status='converted')),
                lost=Count('id', filter=Q(status='lost')),
            )
            .order_by('month')
        )
        for row in monthly:
            row['month'] = row['month'].strftime('%Y-%m')

        return Response({
            'period_days': days,
            'summary': {
                'total': total,
                'by_status': by_status,
                'conversion_rate': conversion_rate,
            },
            'by_source': by_source,
            'monthly_trend': monthly,
        })
