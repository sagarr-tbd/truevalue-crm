"""
Contact Service - Business logic for Contact management.
"""
import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone

from ..models import Contact, Company, ContactCompany, CRMAuditLog
from ..exceptions import DuplicateEntityError, EntityNotFoundError
from .base_service import BaseService

logger = logging.getLogger(__name__)


class ContactService(BaseService[Contact]):
    """Service for Contact operations."""
    
    model = Contact
    entity_type = 'contact'
    
    # Field mapping for advanced filters (frontend field -> backend field)
    FILTER_FIELD_MAP = {
        'name': ['first_name', 'last_name'],  # Special handling for name
        'email': 'email',
        'company': 'primary_company__name',
        'stage': 'status',
        'status': 'status',
        'jobTitle': 'title',
        'title': 'title',
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
    }
    
    def _build_advanced_filter_q(self, conditions: List[Dict], logic: str = 'and') -> Q:
        """Build Q object from advanced filter conditions."""
        if not conditions:
            return Q()
        
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
        company_id: UUID = None,
        tag_ids: List[UUID] = None,
        advanced_filters: List[Dict] = None,
        filter_logic: str = 'and',
    ):
        """List contacts with advanced filtering."""
        qs = self.get_queryset()
        
        # Apply basic filters
        if filters:
            qs = qs.filter(**filters)
        
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        
        if status:
            qs = qs.filter(status=status)
        
        if company_id:
            qs = qs.filter(
                Q(primary_company_id=company_id) |
                Q(company_associations__company_id=company_id)
            ).distinct()
        
        if tag_ids:
            from ..models import EntityTag
            contact_ids = EntityTag.objects.filter(
                entity_type='contact',
                tag_id__in=tag_ids
            ).values_list('entity_id', flat=True)
            qs = qs.filter(id__in=contact_ids)
        
        # Apply search
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(title__icontains=search) |
                Q(primary_company__name__icontains=search)
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
    def create(self, data: Dict[str, Any], **kwargs) -> Contact:
        """
        Create a new contact.
        
        Args:
            data: Contact data
            **kwargs: Additional options
                - skip_duplicate_check: If True, skip the duplicate email check
        """
        skip_duplicate_check = kwargs.pop('skip_duplicate_check', False)
        
        # Check for duplicates (unless explicitly skipped)
        if not skip_duplicate_check:
            email = data.get('email')
            if email and self.get_queryset().filter(email=email).exists():
                raise DuplicateEntityError('Contact', 'email', email)
        
        # Check plan limits
        self.check_plan_limit('CONTACT_LIMITS')
        
        # Handle primary company
        primary_company_id = data.pop('primary_company_id', None)
        if primary_company_id:
            data['primary_company_id'] = primary_company_id
        
        # Create contact
        contact = super().create(data, **kwargs)
        
        # Create primary company association
        if primary_company_id:
            try:
                company = Company.objects.get(id=primary_company_id, org_id=self.org_id)
                ContactCompany.objects.create(
                    contact=contact,
                    company=company,
                    title=data.get('title'),
                    department=data.get('department'),
                    is_primary=True,
                    is_current=True,
                )
            except Company.DoesNotExist:
                pass
        
        return contact
    
    @transaction.atomic
    def update(self, entity_id: UUID, data: Dict[str, Any], **kwargs) -> Contact:
        """Update a contact."""
        contact = self.get_by_id(entity_id)
        
        # Check for duplicate email
        email = data.get('email')
        if email and email != contact.email:
            if self.get_queryset().filter(email=email).exclude(id=entity_id).exists():
                raise DuplicateEntityError('Contact', 'email', email)
        
        # Handle primary company change
        primary_company_id = data.pop('primary_company_id', None)
        if primary_company_id is not None:
            self._update_primary_company(contact, primary_company_id)
        
        return super().update(entity_id, data, **kwargs)
    
    def _update_primary_company(self, contact: Contact, company_id: UUID):
        """Update the primary company for a contact."""
        # Clear existing primary
        ContactCompany.objects.filter(
            contact=contact,
            is_primary=True
        ).update(is_primary=False)
        
        if company_id:
            try:
                company = Company.objects.get(id=company_id, org_id=self.org_id)
                
                # Check if association exists
                assoc, created = ContactCompany.objects.get_or_create(
                    contact=contact,
                    company=company,
                    defaults={
                        'is_primary': True,
                        'is_current': True,
                    }
                )
                
                if not created:
                    assoc.is_primary = True
                    assoc.save()
                
                # Update contact's primary_company
                contact.primary_company = company
                contact.save(update_fields=['primary_company', 'updated_at'])
                
            except Company.DoesNotExist:
                raise EntityNotFoundError('Company', str(company_id))
    
    def add_company(
        self,
        contact_id: UUID,
        company_id: UUID,
        title: str = None,
        department: str = None,
        is_primary: bool = False,
    ) -> ContactCompany:
        """Add a company association to a contact."""
        contact = self.get_by_id(contact_id)
        
        try:
            company = Company.objects.get(id=company_id, org_id=self.org_id)
        except Company.DoesNotExist:
            raise EntityNotFoundError('Company', str(company_id))
        
        # Check if already associated
        existing = ContactCompany.objects.filter(
            contact=contact,
            company=company
        ).first()
        
        if existing:
            # Update existing
            existing.title = title or existing.title
            existing.department = department or existing.department
            if is_primary:
                existing.is_primary = True
            existing.save()
            return existing
        
        # Clear existing primary if setting new primary
        if is_primary:
            ContactCompany.objects.filter(
                contact=contact,
                is_primary=True
            ).update(is_primary=False)
        
        # Create new association
        return ContactCompany.objects.create(
            contact=contact,
            company=company,
            title=title,
            department=department,
            is_primary=is_primary,
            is_current=True,
        )
    
    def remove_company(self, contact_id: UUID, company_id: UUID):
        """Remove a company association from a contact."""
        contact = self.get_by_id(contact_id)
        
        ContactCompany.objects.filter(
            contact=contact,
            company_id=company_id
        ).delete()
        
        # Clear primary_company if it was removed
        if contact.primary_company_id == company_id:
            contact.primary_company = None
            contact.save(update_fields=['primary_company', 'updated_at'])
    
    def get_timeline(self, contact_id: UUID, limit: int = 50) -> List[Dict]:
        """Get contact's activity timeline."""
        contact = self.get_by_id(contact_id)
        
        # Get activities
        activities = contact.activities.order_by('-created_at')[:limit]
        
        timeline = []
        for activity in activities:
            timeline.append({
                'type': 'activity',
                'activity_type': activity.activity_type,
                'id': str(activity.id),
                'subject': activity.subject,
                'description': activity.description,
                'status': activity.status,
                'created_at': activity.created_at.isoformat(),
            })
        
        # Sort by date
        timeline.sort(key=lambda x: x['created_at'], reverse=True)
        
        return timeline
    
    def check_duplicates(
        self,
        email: str = None,
        phone: str = None,
        name: str = None,
    ) -> List[Contact]:
        """Check for potential duplicates."""
        qs = self.get_queryset()
        
        conditions = Q()
        
        if email:
            conditions |= Q(email__iexact=email)
        
        if phone:
            # Normalize phone number comparison
            conditions |= Q(phone__icontains=phone[-10:]) | Q(mobile__icontains=phone[-10:])
        
        if name:
            parts = name.split()
            if len(parts) >= 2:
                conditions |= Q(first_name__iexact=parts[0], last_name__iexact=parts[-1])
        
        return list(qs.filter(conditions)[:10])
    
    def update_last_activity(self, contact_id: UUID):
        """Update last_activity_at timestamp."""
        Contact.objects.filter(id=contact_id).update(
            last_activity_at=timezone.now()
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get contact statistics by status."""
        qs = self.get_queryset()
        
        # Get counts by status
        status_counts = qs.values('status').annotate(count=Count('id'))
        
        by_status = {}
        total = 0
        for item in status_counts:
            status = item['status'] or 'Unknown'
            count = item['count']
            by_status[status] = count
            total += count
        
        return {
            'total': total,
            'by_status': by_status,
        }
    
    def bulk_import(
        self,
        contacts: List[Dict],
        skip_duplicates: bool = True,
        update_existing: bool = False,
        duplicate_check_field: str = 'email',
    ) -> Dict:
        """Bulk import contacts."""
        results = {
            'total': len(contacts),
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': [],
        }
        
        for i, contact_data in enumerate(contacts):
            try:
                # Check for required fields
                if not contact_data.get('first_name') or not contact_data.get('last_name'):
                    results['errors'].append({
                        'row': i + 1,
                        'error': 'first_name and last_name are required'
                    })
                    continue
                
                # Check for duplicate
                check_value = contact_data.get(duplicate_check_field)
                if check_value:
                    existing = self.get_queryset().filter(
                        **{duplicate_check_field: check_value}
                    ).first()
                    
                    if existing:
                        if update_existing:
                            self.update(existing.id, contact_data)
                            results['updated'] += 1
                        elif skip_duplicates:
                            results['skipped'] += 1
                        else:
                            results['errors'].append({
                                'row': i + 1,
                                'error': f'Duplicate {duplicate_check_field}: {check_value}'
                            })
                        continue
                
                # Create new contact
                self.create(contact_data)
                results['created'] += 1
                
            except Exception as e:
                results['errors'].append({
                    'row': i + 1,
                    'error': str(e)
                })
        
        return results

    @transaction.atomic
    def bulk_delete(self, ids: List[UUID]) -> Dict[str, Any]:
        """
        Bulk delete contacts by IDs.
        
        Args:
            ids: List of contact UUIDs to delete
            
        Returns:
            Dict with total, success, failed counts and errors
        """
        results = {
            'total': len(ids),
            'success': 0,
            'failed': 0,
            'errors': [],
        }
        
        for contact_id in ids:
            try:
                self.delete(contact_id)
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'id': str(contact_id),
                    'error': str(e)
                })
        
        return results

    @transaction.atomic
    def bulk_update(self, ids: List[UUID], data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Bulk update contacts with the same data.
        
        Args:
            ids: List of contact UUIDs to update
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
        allowed_fields = {'status', 'owner_id', 'first_name', 'last_name', 'email', 
                         'phone', 'mobile', 'title', 'department'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return {
                'total': len(ids),
                'success': 0,
                'failed': len(ids),
                'errors': [{'error': 'No valid fields to update'}]
            }
        
        for contact_id in ids:
            try:
                self.update(contact_id, update_data.copy())
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'id': str(contact_id),
                    'error': str(e)
                })
        
        return results

    @transaction.atomic
    def merge(
        self,
        primary_id: UUID,
        secondary_id: UUID,
        merge_strategy: str = 'keep_primary'
    ) -> Contact:
        """
        Merge two contacts into one.
        
        Args:
            primary_id: ID of the primary contact (will be kept)
            secondary_id: ID of the secondary contact (will be deleted)
            merge_strategy: 'keep_primary' or 'fill_empty'
                - keep_primary: Keep all primary values, ignore secondary
                - fill_empty: Fill empty primary fields with secondary values
        
        Returns:
            The merged primary contact
        """
        from ..models import Activity, Deal
        
        primary = self.get_by_id(primary_id)
        secondary = self.get_by_id(secondary_id)
        
        if not primary or not secondary:
            raise EntityNotFoundError('Contact', str(primary_id if not primary else secondary_id))
        
        # Fields that can be merged
        mergeable_fields = [
            'secondary_email', 'phone', 'mobile', 'title', 'department',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'description', 'linkedin_url', 'twitter_url', 'source', 'source_detail'
        ]
        
        # Merge field values if strategy is 'fill_empty'
        if merge_strategy == 'fill_empty':
            for field in mergeable_fields:
                primary_value = getattr(primary, field, None)
                secondary_value = getattr(secondary, field, None)
                
                # If primary field is empty and secondary has a value, copy it
                if not primary_value and secondary_value:
                    setattr(primary, field, secondary_value)
            
            # Handle email specially - secondary email can be set from secondary's primary email
            if not primary.secondary_email and secondary.email and secondary.email != primary.email:
                primary.secondary_email = secondary.email
            
            primary.save()
        
        # Move activities from secondary to primary
        Activity.objects.filter(contact=secondary).update(contact=primary)
        
        # Move deals from secondary to primary
        Deal.objects.filter(contact=secondary).update(contact=primary)
        
        # Move company associations
        for contact_company in ContactCompany.objects.filter(contact=secondary):
            # Check if primary already has this company association
            existing = ContactCompany.objects.filter(
                contact=primary, 
                company=contact_company.company
            ).exists()
            
            if not existing:
                contact_company.contact = primary
                contact_company.save()
            else:
                contact_company.delete()
        
        # Update primary company if secondary has one and primary doesn't
        if not primary.primary_company and secondary.primary_company:
            primary.primary_company = secondary.primary_company
            primary.save()
        
        # Merge tags
        for tag in secondary.tags.all():
            if not primary.tags.filter(id=tag.id).exists():
                primary.tags.add(tag)
        
        # Log the merge
        self._log_action(
            action=CRMAuditLog.Action.MERGE,
            entity=primary,
            changes={
                'merged_from': str(secondary_id),
                'merged_name': secondary.full_name,
                'merged_email': secondary.email,
                'strategy': merge_strategy,
            }
        )
        
        # Delete the secondary contact
        secondary.delete()
        
        # Refresh from database to get updated state
        primary.refresh_from_db()
        
        return primary
