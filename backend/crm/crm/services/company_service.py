"""
Company Service - Business logic for Company management.
"""
import logging
from typing import List, Dict, Any
from uuid import UUID

from django.db import transaction
from django.db.models import Q, Count, Sum

from ..models import Company, Contact, Deal, CRMAuditLog
from ..exceptions import DuplicateEntityError, EntityNotFoundError
from .base_service import BaseService, AdvancedFilterMixin

logger = logging.getLogger(__name__)


class CompanyService(AdvancedFilterMixin, BaseService[Company]):
    """Service for Company operations."""
    
    model = Company
    entity_type = 'company'
    billing_feature_code = 'companies'
    
    # Field mapping for advanced filters (frontend field -> backend field)
    FILTER_FIELD_MAP = {
        'accountName': 'name',
        'name': 'name',
        'industry': 'industry',
        'type': 'size',
        'size': 'size',
        'email': 'email',
        'phone': 'phone',
        'website': 'website',
        'city': 'city',
        'state': 'state',
        'country': 'country',
        'employees': 'employee_count',
        'employee_count': 'employee_count',
        'annualRevenue': 'annual_revenue',
        'annual_revenue': 'annual_revenue',
    }
    
    def get_by_id(self, entity_id):
        """Get company by ID with annotated counts for detail serialization."""
        try:
            return self.get_queryset().prefetch_related('tags').annotate(
                contact_count=Count('contact_associations', distinct=True),
                deal_count=Count('deals', distinct=True),
            ).get(id=entity_id)
        except self.model.DoesNotExist:
            raise EntityNotFoundError(self.entity_type, str(entity_id))

    def get_optimized_queryset(self):
        """
        Get queryset with prefetch_related for performance.
        Prevents N+1 queries when serializing companies.
        """
        return self.get_queryset().prefetch_related('tags')
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        search: str = None,
        order_by: str = '-created_at',
        limit: int = None,
        offset: int = 0,
        owner_id: UUID = None,
        industry: str = None,
        size: str = None,
        tag_ids: List[UUID] = None,
        advanced_filters: List[Dict] = None,
        filter_logic: str = 'and',
    ):
        """List companies with advanced filtering."""
        # Use optimized queryset to prevent N+1 queries
        qs = self.get_optimized_queryset()
        
        # Apply basic filters
        if filters:
            qs = qs.filter(**filters)
        
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        
        if industry:
            qs = qs.filter(industry__iexact=industry)
        
        if size:
            qs = qs.filter(size=size)
        
        if tag_ids:
            from ..models import EntityTag
            company_ids = EntityTag.objects.filter(
                entity_type='company',
                tag_id__in=tag_ids
            ).values_list('entity_id', flat=True)
            qs = qs.filter(id__in=company_ids)
        
        # Apply search
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(website__icontains=search) |
                Q(industry__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Apply advanced filters using mixin
        qs = self.apply_advanced_filters(qs, advanced_filters, filter_logic)
        
        # Apply ordering
        qs = qs.order_by(order_by)
        
        # Apply pagination
        if limit:
            qs = qs[offset:offset + limit]
        
        return qs
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Company:
        """Create a new company."""
        # Check plan limits via billing service
        self.check_plan_limit('companies')
        
        # Check for duplicates by name
        name = data.get('name')
        if name and self.get_queryset().filter(name__iexact=name).exists():
            raise DuplicateEntityError('Company', 'name', name)
        
        company = super().create(data, **kwargs)
        
        # Sync usage to billing
        self.sync_usage_to_billing('companies')
        
        return company
    
    @transaction.atomic
    def update(self, entity_id: UUID, data: Dict[str, Any], **kwargs) -> Company:
        """Update a company."""
        company = self.get_by_id(entity_id)
        
        # Check for duplicate name
        name = data.get('name')
        if name and name.lower() != company.name.lower():
            if self.get_queryset().filter(name__iexact=name).exclude(id=entity_id).exists():
                raise DuplicateEntityError('Company', 'name', name)
        
        return super().update(entity_id, data, **kwargs)
    
    def get_contacts(self, company_id: UUID, limit: int = 50) -> List[Contact]:
        """Get contacts associated with a company (optimized for ContactListSerializer)."""
        company = self.get_by_id(company_id)

        from ..models import ContactCompany

        primary_ids = set(
            company.primary_contacts.values_list('id', flat=True)[:limit]
        )
        associated_ids = set(
            ContactCompany.objects.filter(company=company)
            .values_list('contact_id', flat=True)
        )

        all_ids = list(primary_ids | associated_ids)[:limit]

        return list(
            Contact.objects.filter(id__in=all_ids, org_id=self.org_id)
            .select_related('primary_company')
            .prefetch_related('tags')
            .annotate(
                deal_count=Count('deals', distinct=True),
                activity_count=Count('activities', distinct=True),
            )
        )
    
    def get_deals(self, company_id: UUID, status: str = None) -> List[Deal]:
        """Get deals for a company."""
        company = self.get_by_id(company_id)
        
        qs = company.deals.all()
        if status:
            qs = qs.filter(status=status)
        
        return list(qs.order_by('-created_at'))
    
    def get_stats(self, company_id: UUID) -> Dict:
        """Get company statistics using aggregation (single query for deal stats)."""
        company = self.get_by_id(company_id)

        contact_count = company.contact_associations.count()

        deal_agg = company.deals.aggregate(
            deal_count=Count('id'),
            open_deals=Count('id', filter=Q(status='open')),
            won_deals=Count('id', filter=Q(status='won')),
            lost_deals=Count('id', filter=Q(status='lost')),
            total_deal_value=Sum('value'),
            won_deal_value=Sum('value', filter=Q(status='won')),
        )

        return {
            'contact_count': contact_count,
            'deal_count': deal_agg['deal_count'] or 0,
            'open_deals': deal_agg['open_deals'] or 0,
            'won_deals': deal_agg['won_deals'] or 0,
            'lost_deals': deal_agg['lost_deals'] or 0,
            'total_deal_value': deal_agg['total_deal_value'] or 0,
            'won_deal_value': deal_agg['won_deal_value'] or 0,
        }
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Get aggregate statistics for all companies in the org."""
        qs = self.get_queryset()
        
        # Get counts by industry
        industry_counts = qs.values('industry').annotate(count=Count('id'))
        by_industry = {}
        for item in industry_counts:
            industry = item['industry'] or 'Unknown'
            by_industry[industry] = item['count']
        
        # Get counts by size
        size_counts = qs.values('size').annotate(count=Count('id'))
        by_size = {}
        for item in size_counts:
            size = item['size'] or 'Unknown'
            by_size[size] = item['count']
        
        # Get totals
        total = qs.count()
        totals = qs.aggregate(
            total_revenue=Sum('annual_revenue'),
            total_employees=Sum('employee_count'),
        )
        
        return {
            'total': total,
            'by_industry': by_industry,
            'by_size': by_size,
            'total_revenue': float(totals['total_revenue'] or 0),
            'total_employees': totals['total_employees'] or 0,
        }
    
    def check_duplicates(
        self,
        name: str = None,
        website: str = None,
        email: str = None,
    ) -> List[Company]:
        """Check for potential duplicates."""
        qs = self.get_queryset()
        
        conditions = Q()
        
        if name:
            conditions |= Q(name__iexact=name)
        
        if website:
            # Normalize website comparison
            domain = website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            conditions |= Q(website__icontains=domain)
        
        if email:
            # Check email domain
            domain = email.split('@')[-1]
            conditions |= Q(email__icontains=domain)
        
        return list(qs.filter(conditions)[:10])
    
    def get_industries(self) -> List[str]:
        """Get list of unique industries in this org."""
        return list(
            self.get_queryset()
            .exclude(industry__isnull=True)
            .exclude(industry='')
            .values_list('industry', flat=True)
            .distinct()
            .order_by('industry')
        )
    
    def merge(self, primary_id: UUID, secondary_id: UUID) -> Company:
        """Merge two companies."""
        primary = self.get_by_id(primary_id)
        secondary = self.get_by_id(secondary_id)
        
        with transaction.atomic():
            # Move contacts
            from ..models import ContactCompany
            ContactCompany.objects.filter(company=secondary).update(company=primary)
            Contact.objects.filter(primary_company=secondary).update(primary_company=primary)
            
            # Move deals
            Deal.objects.filter(company=secondary).update(company=primary)
            
            # Move activities
            from ..models import Activity
            Activity.objects.filter(company=secondary).update(company=primary)
            
            # Log merge
            self._log_action(
                action=CRMAuditLog.Action.MERGE,
                entity=primary,
                changes={
                    'merged_from': str(secondary_id),
                    'merged_name': secondary.name,
                }
            )
            
            # Delete secondary
            secondary.delete()
        
        return primary
