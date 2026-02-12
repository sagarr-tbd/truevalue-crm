"""
Lead Service - Business logic for Lead management.
"""
import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ..models import Lead, Contact, Company, Deal, Pipeline, PipelineStage, CRMAuditLog
from ..exceptions import DuplicateEntityError, InvalidOperationError, EntityNotFoundError
from .base_service import BaseService

logger = logging.getLogger(__name__)


class LeadService(BaseService[Lead]):
    """Service for Lead operations."""
    
    model = Lead
    entity_type = 'lead'
    
    # Field mapping for advanced filters (frontend field -> backend field)
    FILTER_FIELD_MAP = {
        'name': ['first_name', 'last_name'],  # Special handling for name
        'firstName': 'first_name',
        'lastName': 'last_name',
        'email': 'email',
        'companyName': 'company_name',
        'company_name': 'company_name',
        'status': 'status',
        'source': 'source',
        'score': 'score',
        'phone': 'phone',
        'city': 'city',
        'state': 'state',
        'country': 'country',
    }
    
    # Operator mapping for advanced filters
    FILTER_OPERATOR_MAP = {
        'equals': '__iexact',  # case-insensitive exact match
        'not_equals': '__iexact',  # handled with exclude
        'contains': '__icontains',
        'not_contains': '__icontains',  # handled with exclude
        'starts_with': '__istartswith',
        'ends_with': '__iendswith',
        'is_empty': '__isnull',
        'is_not_empty': '__isnull',
        'greater_than': '__gt',
        'less_than': '__lt',
        'greater_than_or_equal': '__gte',
        'less_than_or_equal': '__lte',
    }
    
    def _build_advanced_filter_q(self, conditions: List[Dict], logic: str = 'and'):
        """Build Q object from advanced filter conditions."""
        if not conditions:
            return Q(), []
        
        q_objects = []
        exclude_objects = []
        
        for condition in conditions:
            field = condition.get('field')
            operator = condition.get('operator', 'contains')
            value = condition.get('value', '')
            
            # Get backend field name
            backend_field = self.FILTER_FIELD_MAP.get(field, field)
            
            # Handle special 'name' field (searches first_name OR last_name)
            if field == 'name':
                name_q = Q()
                django_op = self.FILTER_OPERATOR_MAP.get(operator, '__icontains')
                if operator in ['not_equals', 'not_contains']:
                    # Exclude both first_name and last_name containing value
                    exclude_objects.append(
                        Q(**{f'first_name{django_op}': value}) | 
                        Q(**{f'last_name{django_op}': value})
                    )
                else:
                    name_q = (
                        Q(**{f'first_name{django_op}': value}) | 
                        Q(**{f'last_name{django_op}': value})
                    )
                    q_objects.append(name_q)
                continue
            
            # Build the lookup
            django_op = self.FILTER_OPERATOR_MAP.get(operator, '__icontains')
            
            # Handle special operators
            if operator == 'is_empty':
                q = Q(**{f'{backend_field}__isnull': True}) | Q(**{f'{backend_field}': ''})
                q_objects.append(q)
            elif operator == 'is_not_empty':
                q = Q(**{f'{backend_field}__isnull': False}) & ~Q(**{f'{backend_field}': ''})
                q_objects.append(q)
            elif operator in ['not_equals', 'not_contains']:
                exclude_objects.append(Q(**{f'{backend_field}{django_op}': value}))
            else:
                q_objects.append(Q(**{f'{backend_field}{django_op}': value}))
        
        # Combine Q objects based on logic
        if logic == 'or':
            combined = Q()
            for q in q_objects:
                combined |= q
        else:  # 'and'
            combined = Q()
            for q in q_objects:
                combined &= q
        
        return combined, exclude_objects
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        search: str = None,
        order_by: str = '-created_at',
        limit: int = None,
        offset: int = 0,
        owner_id: UUID = None,
        status: str = None,
        source: str = None,
        tag_ids: List[UUID] = None,
        advanced_filters: List[Dict] = None,
        filter_logic: str = 'and',
    ):
        """List leads with advanced filtering."""
        qs = self.get_queryset()
        
        # Apply basic filters
        if filters:
            qs = qs.filter(**filters)
        
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        
        if status:
            qs = qs.filter(status=status)
        
        if source:
            qs = qs.filter(source=source)
        
        if tag_ids:
            from ..models import EntityTag
            lead_ids = EntityTag.objects.filter(
                entity_type='lead',
                tag_id__in=tag_ids
            ).values_list('entity_id', flat=True)
            qs = qs.filter(id__in=lead_ids)
        
        # Apply search
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(company_name__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Apply advanced filters
        if advanced_filters:
            filter_q, exclude_list = self._build_advanced_filter_q(advanced_filters, filter_logic)
            if filter_q:
                qs = qs.filter(filter_q)
            for exclude_q in exclude_list:
                qs = qs.exclude(exclude_q)
        
        # Apply ordering
        qs = qs.order_by(order_by)
        
        # Apply pagination
        if limit:
            qs = qs[offset:offset + limit]
        
        return qs
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Lead:
        """Create a new lead."""
        # Check for duplicates
        email = data.get('email')
        if email and self.get_queryset().filter(email=email).exists():
            raise DuplicateEntityError('Lead', 'email', email)
        
        return super().create(data, **kwargs)
    
    @transaction.atomic
    def convert(
        self,
        lead_id: UUID,
        create_contact: bool = True,
        create_company: bool = True,
        create_deal: bool = False,
        contact_owner_id: UUID = None,
        company_name: str = None,
        company_owner_id: UUID = None,
        deal_name: str = None,
        deal_value: Decimal = None,
        deal_pipeline_id: UUID = None,
        deal_stage_id: UUID = None,
        deal_owner_id: UUID = None,
    ) -> Dict:
        """Convert a lead to contact, company, and/or deal."""
        lead = self.get_by_id(lead_id)
        
        # Validate lead status
        if lead.status == Lead.Status.CONVERTED:
            raise InvalidOperationError('Lead is already converted')
        
        if lead.status == Lead.Status.UNQUALIFIED:
            raise InvalidOperationError('Cannot convert unqualified lead')
        
        result = {
            'lead_id': str(lead.id),
            'contact': None,
            'company': None,
            'deal': None,
        }
        
        company = None
        contact = None
        deal = None
        
        # Create company
        if create_company and lead.company_name:
            company_data = {
                'org_id': self.org_id,
                'owner_id': company_owner_id or self.user_id,
                'name': company_name or lead.company_name,
                'website': lead.website,
                'phone': lead.phone,
            }
            
            # Check for existing company
            existing_company = Company.objects.filter(
                org_id=self.org_id,
                name__iexact=company_data['name']
            ).first()
            
            if existing_company:
                company = existing_company
            else:
                company = Company.objects.create(**company_data)
            
            result['company'] = {
                'id': str(company.id),
                'name': company.name,
                'created': not bool(existing_company),
            }
        
        # Create contact
        if create_contact:
            contact_data = {
                'org_id': self.org_id,
                'owner_id': contact_owner_id or self.user_id,
                'first_name': lead.first_name,
                'last_name': lead.last_name,
                'email': lead.email,
                'phone': lead.phone,
                'mobile': lead.mobile,
                'title': lead.title,
                'address_line1': lead.address_line1,
                'city': lead.city,
                'state': lead.state,
                'postal_code': lead.postal_code,
                'country': lead.country,
                'source': lead.source,
                'source_detail': lead.source_detail,
                'custom_fields': lead.custom_fields,
                'converted_from_lead_id': lead.id,
                'converted_at': timezone.now(),
            }
            
            if company:
                contact_data['primary_company'] = company
            
            # Check for existing contact
            existing_contact = Contact.objects.filter(
                org_id=self.org_id,
                email=lead.email
            ).first()
            
            if existing_contact:
                contact = existing_contact
            else:
                contact = Contact.objects.create(**contact_data)
                
                # Create company association
                if company:
                    from ..models import ContactCompany
                    ContactCompany.objects.create(
                        contact=contact,
                        company=company,
                        title=lead.title,
                        is_primary=True,
                        is_current=True,
                    )
            
            result['contact'] = {
                'id': str(contact.id),
                'name': f"{contact.first_name} {contact.last_name}",
                'created': not bool(existing_contact),
            }
        
        # Create deal
        if create_deal and deal_name:
            # Get default pipeline if not specified
            pipeline = None
            stage = None
            
            if deal_pipeline_id:
                try:
                    pipeline = Pipeline.objects.get(id=deal_pipeline_id, org_id=self.org_id)
                except Pipeline.DoesNotExist:
                    raise EntityNotFoundError('Pipeline', str(deal_pipeline_id))
            else:
                pipeline = Pipeline.objects.filter(
                    org_id=self.org_id,
                    is_default=True,
                    is_active=True
                ).first()
                
                if not pipeline:
                    pipeline = Pipeline.objects.filter(
                        org_id=self.org_id,
                        is_active=True
                    ).first()
            
            if not pipeline:
                raise InvalidOperationError('No active pipeline found. Create a pipeline first.')
            
            # Get stage
            if deal_stage_id:
                try:
                    stage = PipelineStage.objects.get(id=deal_stage_id, pipeline=pipeline)
                except PipelineStage.DoesNotExist:
                    raise EntityNotFoundError('PipelineStage', str(deal_stage_id))
            else:
                stage = pipeline.stages.order_by('order').first()
            
            if not stage:
                raise InvalidOperationError('Pipeline has no stages. Create stages first.')
            
            deal = Deal.objects.create(
                org_id=self.org_id,
                owner_id=deal_owner_id or self.user_id,
                name=deal_name,
                pipeline=pipeline,
                stage=stage,
                value=deal_value or Decimal('0'),
                contact=contact,
                company=company,
                converted_from_lead_id=lead.id,
            )
            
            result['deal'] = {
                'id': str(deal.id),
                'name': deal.name,
                'value': str(deal.value),
            }
        
        # Update lead status
        lead.status = Lead.Status.CONVERTED
        lead.converted_at = timezone.now()
        lead.converted_by = self.user_id
        lead.converted_contact_id = contact.id if contact else None
        lead.converted_company_id = company.id if company else None
        lead.converted_deal_id = deal.id if deal else None
        lead.save()
        
        # Log conversion
        self._log_action(
            action=CRMAuditLog.Action.CONVERT,
            entity=lead,
            changes=result
        )
        
        return result
    
    @transaction.atomic
    def disqualify(self, lead_id: UUID, reason: str) -> Lead:
        """Mark a lead as unqualified."""
        lead = self.get_by_id(lead_id)
        
        if lead.status == Lead.Status.CONVERTED:
            raise InvalidOperationError('Cannot disqualify converted lead')
        
        lead.status = Lead.Status.UNQUALIFIED
        lead.disqualified_reason = reason
        lead.disqualified_at = timezone.now()
        lead.save()
        
        self._log_action(
            action=CRMAuditLog.Action.UPDATE,
            entity=lead,
            changes={'status': 'unqualified', 'reason': reason}
        )
        
        return lead
    
    def update_status(self, lead_id: UUID, status: str) -> Lead:
        """Update lead status."""
        lead = self.get_by_id(lead_id)
        
        if lead.status == Lead.Status.CONVERTED:
            raise InvalidOperationError('Cannot change status of converted lead')
        
        old_status = lead.status
        lead.status = status
        lead.save(update_fields=['status', 'updated_at'])
        
        self._log_action(
            action=CRMAuditLog.Action.UPDATE,
            entity=lead,
            changes={'status': {'old': old_status, 'new': status}}
        )
        
        return lead
    
    def get_sources(self) -> List[str]:
        """Get list of unique lead sources in this org."""
        return list(
            self.get_queryset()
            .values_list('source', flat=True)
            .distinct()
            .order_by('source')
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get lead statistics by status."""
        from django.db.models import Count
        
        qs = self.get_queryset()
        
        # Get counts by status
        status_counts = qs.values('status').annotate(count=Count('id'))
        
        by_status = {}
        total = 0
        for item in status_counts:
            status = item['status'] or 'unknown'
            count = item['count']
            by_status[status] = count
            total += count
        
        return {
            'total': total,
            'by_status': by_status,
        }
    
    def check_duplicates(
        self,
        email: str = None,
        phone: str = None,
    ) -> List[Lead]:
        """Check for potential duplicates."""
        qs = self.get_queryset()
        
        conditions = Q()
        
        if email:
            conditions |= Q(email__iexact=email)
        
        if phone:
            conditions |= Q(phone__icontains=phone[-10:]) | Q(mobile__icontains=phone[-10:])
        
        return list(qs.filter(conditions)[:10])
    
    def bulk_delete(self, ids: List[UUID]) -> Dict[str, Any]:
        """
        Bulk delete leads by IDs.
        
        Args:
            ids: List of lead UUIDs to delete
            
        Returns:
            Dict with total, success, failed counts and errors
        """
        results = {
            'total': len(ids),
            'success': 0,
            'failed': 0,
            'errors': [],
        }
        
        for lead_id in ids:
            try:
                self.delete(lead_id)
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'id': str(lead_id),
                    'error': str(e)
                })
        
        return results
    
    def bulk_update(self, ids: List[UUID], data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Bulk update leads with the same data.
        
        Args:
            ids: List of lead UUIDs to update
            data: Fields to update
            
        Returns:
            Dict with total, success, failed counts and errors
        """
        results = {
            'total': len(ids),
            'success': 0,
            'failed': 0,
            'errors': [],
        }
        
        # Validate the update data fields
        allowed_fields = {'status', 'owner_id', 'source', 'score'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return results
        
        for lead_id in ids:
            try:
                self.update(lead_id, update_data)
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'id': str(lead_id),
                    'error': str(e)
                })
        
        return results
