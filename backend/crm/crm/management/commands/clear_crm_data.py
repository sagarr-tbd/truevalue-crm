"""
Clear CRM Data Command

Removes entity data while preserving infrastructure (Pipeline, Stages, Tags).
Use this to start fresh for testing.

Usage:
    python manage.py clear_crm_data --org-id <uuid>
    
    # Or use environment variable:
    export ORG_ID=<uuid>
    python manage.py clear_crm_data
    
    # Clear tags too:
    python manage.py clear_crm_data --org-id <uuid> --include-tags
    
    # Clear everything including pipeline:
    python manage.py clear_crm_data --org-id <uuid> --include-all
"""

import os
import uuid
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from crm.models import (
    Company, Contact, ContactCompany, Lead, Deal, DealStageHistory,
    Pipeline, PipelineStage, Activity, Tag, EntityTag,
    CustomFieldValue, CRMAuditLog
)


class Command(BaseCommand):
    help = 'Clear CRM data while preserving infrastructure'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Organization UUID (or set ORG_ID env var)',
        )
        parser.add_argument(
            '--include-tags',
            action='store_true',
            help='Also clear Tag definitions (not just assignments)',
        )
        parser.add_argument(
            '--include-all',
            action='store_true',
            help='Clear everything including Pipeline and Stages',
        )
        parser.add_argument(
            '--yes',
            action='store_true',
            help='Skip confirmation prompt',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        # Get org_id
        org_id = options['org_id'] or os.environ.get('ORG_ID')
        
        if not org_id:
            raise CommandError(
                'Organization ID is required. Use --org-id or set ORG_ID env var.'
            )
        
        try:
            org_id = uuid.UUID(org_id)
        except ValueError as e:
            raise CommandError(f'Invalid UUID format: {e}')
        
        include_tags = options['include_tags'] or options['include_all']
        include_pipeline = options['include_all']
        
        # Show what will be deleted
        self.stdout.write(self.style.WARNING(f'\nThis will DELETE data for org: {org_id}'))
        self.stdout.write('')
        
        counts = self._get_counts(org_id)
        self.stdout.write('Data to be cleared:')
        self.stdout.write(f'  - Activities: {counts["activities"]}')
        self.stdout.write(f'  - Deals: {counts["deals"]}')
        self.stdout.write(f'  - Deal Stage History: {counts["deal_history"]}')
        self.stdout.write(f'  - Leads: {counts["leads"]}')
        self.stdout.write(f'  - Contacts: {counts["contacts"]}')
        self.stdout.write(f'  - Contact-Company links: {counts["contact_companies"]}')
        self.stdout.write(f'  - Companies: {counts["companies"]}')
        self.stdout.write(f'  - Entity Tag assignments: {counts["entity_tags"]}')
        self.stdout.write(f'  - Custom Field Values: {counts["custom_values"]}')
        self.stdout.write(f'  - Audit Logs: {counts["audit_logs"]}')
        
        if include_tags:
            self.stdout.write(f'  - Tags: {counts["tags"]}')
        
        if include_pipeline:
            self.stdout.write(f'  - Pipeline Stages: {counts["stages"]}')
            self.stdout.write(f'  - Pipelines: {counts["pipelines"]}')
        
        self.stdout.write('')
        self.stdout.write('Will KEEP:')
        if not include_tags:
            self.stdout.write(f'  - Tags: {counts["tags"]} (use --include-tags to clear)')
        if not include_pipeline:
            self.stdout.write(f'  - Pipelines: {counts["pipelines"]} (use --include-all to clear)')
            self.stdout.write(f'  - Pipeline Stages: {counts["stages"]}')
        
        # Confirm
        if not options['yes']:
            self.stdout.write('')
            confirm = input('Proceed? [y/N]: ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.ERROR('Aborted.'))
                return
        
        # Clear data in correct order (respecting FK constraints)
        self.stdout.write('')
        self.stdout.write('Clearing data...')
        
        # 1. Junction/history tables first
        deleted = EntityTag.objects.filter(tag__org_id=org_id).delete()[0]
        self.stdout.write(f'  - EntityTag: {deleted} deleted')
        
        deleted = DealStageHistory.objects.filter(deal__org_id=org_id).delete()[0]
        self.stdout.write(f'  - DealStageHistory: {deleted} deleted')
        
        deleted = ContactCompany.objects.filter(contact__org_id=org_id).delete()[0]
        self.stdout.write(f'  - ContactCompany: {deleted} deleted')
        
        deleted = CustomFieldValue.objects.filter(field__org_id=org_id).delete()[0]
        self.stdout.write(f'  - CustomFieldValue: {deleted} deleted')
        
        deleted = CRMAuditLog.objects.filter(org_id=org_id).delete()[0]
        self.stdout.write(f'  - CRMAuditLog: {deleted} deleted')
        
        # 2. Activities
        deleted = Activity.objects.filter(org_id=org_id).delete()[0]
        self.stdout.write(f'  - Activity: {deleted} deleted')
        
        # 3. Main entities
        deleted = Deal.objects.filter(org_id=org_id).delete()[0]
        self.stdout.write(f'  - Deal: {deleted} deleted')
        
        deleted = Lead.objects.filter(org_id=org_id).delete()[0]
        self.stdout.write(f'  - Lead: {deleted} deleted')
        
        deleted = Contact.objects.filter(org_id=org_id).delete()[0]
        self.stdout.write(f'  - Contact: {deleted} deleted')
        
        deleted = Company.objects.filter(org_id=org_id).delete()[0]
        self.stdout.write(f'  - Company: {deleted} deleted')
        
        # 4. Tags (if requested)
        if include_tags:
            deleted = Tag.objects.filter(org_id=org_id).delete()[0]
            self.stdout.write(f'  - Tag: {deleted} deleted')
        
        # 5. Pipeline (if requested)
        if include_pipeline:
            deleted = PipelineStage.objects.filter(pipeline__org_id=org_id).delete()[0]
            self.stdout.write(f'  - PipelineStage: {deleted} deleted')
            
            deleted = Pipeline.objects.filter(org_id=org_id).delete()[0]
            self.stdout.write(f'  - Pipeline: {deleted} deleted')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Done! Data cleared successfully.'))
        
        if not include_pipeline:
            self.stdout.write('')
            self.stdout.write('Infrastructure preserved:')
            pipelines = Pipeline.objects.filter(org_id=org_id)
            for p in pipelines:
                stages = PipelineStage.objects.filter(pipeline=p).order_by('order')
                self.stdout.write(f'  - Pipeline: {p.name}')
                for s in stages:
                    self.stdout.write(f'      Stage: {s.name} ({s.probability}%)')

    def _get_counts(self, org_id):
        """Get counts of records that will be affected."""
        return {
            'activities': Activity.objects.filter(org_id=org_id).count(),
            'deals': Deal.objects.filter(org_id=org_id).count(),
            'deal_history': DealStageHistory.objects.filter(deal__org_id=org_id).count(),
            'leads': Lead.objects.filter(org_id=org_id).count(),
            'contacts': Contact.objects.filter(org_id=org_id).count(),
            'contact_companies': ContactCompany.objects.filter(contact__org_id=org_id).count(),
            'companies': Company.objects.filter(org_id=org_id).count(),
            'entity_tags': EntityTag.objects.filter(tag__org_id=org_id).count(),
            'tags': Tag.objects.filter(org_id=org_id).count(),
            'stages': PipelineStage.objects.filter(pipeline__org_id=org_id).count(),
            'pipelines': Pipeline.objects.filter(org_id=org_id).count(),
            'custom_values': CustomFieldValue.objects.filter(field__org_id=org_id).count(),
            'audit_logs': CRMAuditLog.objects.filter(org_id=org_id).count(),
        }
