"""
Management command: migrate V1 CRM data into V2 tables.

Usage:
    py manage.py migrate_v1_to_v2                        # migrate everything
    py manage.py migrate_v1_to_v2 --entity contacts      # single entity
    py manage.py migrate_v1_to_v2 --dry-run              # preview only
    py manage.py migrate_v1_to_v2 --org-id <uuid>        # single org
    py manage.py migrate_v1_to_v2 --batch-size 500       # custom batch

Migration order (respects FK dependencies):
    1. pipelines  2. pipeline_stages  3. tags
    4. companies  5. contacts  6. leads
    7. deals  8. activities  9. entity_tags
"""
import logging
from collections import defaultdict
from datetime import timezone as dt_tz

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

ENTITY_ORDER = [
    'pipelines', 'pipeline_stages', 'tags',
    'companies', 'contacts', 'leads',
    'deals', 'activities', 'entity_tags',
]


class Command(BaseCommand):
    help = 'Migrate V1 CRM data into V2 tables. Idempotent — skips existing IDs.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--entity', type=str, default=None,
            choices=ENTITY_ORDER,
            help='Migrate only this entity type',
        )
        parser.add_argument(
            '--org-id', type=str, default=None,
            help='Migrate only this org',
        )
        parser.add_argument(
            '--batch-size', type=int, default=1000,
            help='Batch size for inserts (default 1000)',
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Preview counts, don\'t write anything',
        )

    def handle(self, *args, **options):
        self.batch_size = options['batch_size']
        self.dry_run = options['dry_run']
        self.org_id = options['org_id']
        self.stats = defaultdict(lambda: {'total': 0, 'migrated': 0, 'skipped': 0})

        entities = [options['entity']] if options['entity'] else ENTITY_ORDER

        if self.dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no data will be written'))

        for entity in entities:
            handler = getattr(self, f'_migrate_{entity}')
            self.stdout.write(f'\n{"="*60}')
            self.stdout.write(f'Migrating: {entity}')
            self.stdout.write(f'{"="*60}')
            handler()

        self.stdout.write(f'\n{"="*60}')
        self.stdout.write('SUMMARY')
        self.stdout.write(f'{"="*60}')
        for entity in entities:
            s = self.stats[entity]
            self.stdout.write(
                f'  {entity:20s}  total={s["total"]:>6}  '
                f'migrated={s["migrated"]:>6}  skipped={s["skipped"]:>6}'
            )

    def _org_filter(self, qs):
        if self.org_id:
            return qs.filter(org_id=self.org_id)
        return qs

    def _existing_ids(self, model_class):
        qs = model_class.objects.all()
        if hasattr(model_class, 'all_objects'):
            qs = model_class.all_objects.all()
        return set(qs.values_list('id', flat=True))

    # ------------------------------------------------------------------
    # Pipelines
    # ------------------------------------------------------------------
    def _migrate_pipelines(self):
        from crm.models import Pipeline
        from pipelines_v2.models import PipelineV2

        v1_qs = self._org_filter(Pipeline.objects.all())
        total = v1_qs.count()
        self.stats['pipelines']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} pipelines')
            return

        existing = self._existing_ids(PipelineV2)
        batch = []

        for p in v1_qs.iterator(chunk_size=self.batch_size):
            if p.id in existing:
                self.stats['pipelines']['skipped'] += 1
                continue

            batch.append(PipelineV2(
                id=p.id,
                org_id=p.org_id,
                owner_id=p.org_id,
                name=p.name,
                description=p.description or '',
                is_default=p.is_default,
                is_active=p.is_active,
                currency=p.currency,
                order=p.order,
            ))

            if len(batch) >= self.batch_size:
                PipelineV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['pipelines']['migrated'] += len(batch)
                batch = []

        if batch:
            PipelineV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['pipelines']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Pipelines: {self.stats["pipelines"]["migrated"]} migrated, '
            f'{self.stats["pipelines"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Pipeline Stages
    # ------------------------------------------------------------------
    def _migrate_pipeline_stages(self):
        from crm.models import PipelineStage
        from pipelines_v2.models import PipelineStageV2, PipelineV2

        v1_qs = PipelineStage.objects.all()
        if self.org_id:
            v1_qs = v1_qs.filter(pipeline__org_id=self.org_id)
        total = v1_qs.count()
        self.stats['pipeline_stages']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} pipeline stages')
            return

        migrated_pipeline_ids = set(
            PipelineV2.objects.values_list('id', flat=True)
        )
        existing = self._existing_ids(PipelineStageV2)
        batch = []

        for s in v1_qs.select_related('pipeline').iterator(chunk_size=self.batch_size):
            if s.id in existing:
                self.stats['pipeline_stages']['skipped'] += 1
                continue
            if s.pipeline_id not in migrated_pipeline_ids:
                self.stats['pipeline_stages']['skipped'] += 1
                continue

            batch.append(PipelineStageV2(
                id=s.id,
                pipeline_id=s.pipeline_id,
                name=s.name,
                probability=s.probability,
                order=s.order,
                is_won=s.is_won,
                is_lost=s.is_lost,
                rotting_days=s.rotting_days,
                color=s.color,
            ))

            if len(batch) >= self.batch_size:
                PipelineStageV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['pipeline_stages']['migrated'] += len(batch)
                batch = []

        if batch:
            PipelineStageV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['pipeline_stages']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Pipeline Stages: {self.stats["pipeline_stages"]["migrated"]} migrated, '
            f'{self.stats["pipeline_stages"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Tags
    # ------------------------------------------------------------------
    def _migrate_tags(self):
        from crm.models import Tag
        from tags_v2.models import TagV2

        v1_qs = self._org_filter(Tag.objects.all())
        total = v1_qs.count()
        self.stats['tags']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} tags')
            return

        existing = self._existing_ids(TagV2)
        batch = []

        for t in v1_qs.iterator(chunk_size=self.batch_size):
            if t.id in existing:
                self.stats['tags']['skipped'] += 1
                continue

            batch.append(TagV2(
                id=t.id,
                org_id=t.org_id,
                name=t.name,
                color=t.color,
                entity_type=t.entity_type or 'all',
                description=t.description or '',
            ))

            if len(batch) >= self.batch_size:
                TagV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['tags']['migrated'] += len(batch)
                batch = []

        if batch:
            TagV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['tags']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Tags: {self.stats["tags"]["migrated"]} migrated, '
            f'{self.stats["tags"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Companies
    # ------------------------------------------------------------------
    def _migrate_companies(self):
        from crm.models import Company
        from companies_v2.models import CompanyV2

        v1_qs = self._org_filter(Company.objects.all())
        total = v1_qs.count()
        self.stats['companies']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} companies')
            return

        existing = self._existing_ids(CompanyV2)
        batch = []

        for c in v1_qs.iterator(chunk_size=self.batch_size):
            if c.id in existing:
                self.stats['companies']['skipped'] += 1
                continue

            entity_data = {
                'name': c.name or '',
                'website': c.website or '',
                'phone': c.phone or '',
                'email': c.email or '',
                'address_line1': c.address_line1 or '',
                'address_line2': c.address_line2 or '',
                'city': c.city or '',
                'state': c.state or '',
                'postal_code': c.postal_code or '',
                'country': c.country or '',
                'description': c.description or '',
                'linkedin_url': c.linkedin_url or '',
                'twitter_url': c.twitter_url or '',
                'facebook_url': c.facebook_url or '',
            }

            if c.annual_revenue is not None:
                entity_data['annual_revenue'] = str(c.annual_revenue)
            if c.employee_count is not None:
                entity_data['employee_count'] = c.employee_count

            if c.custom_fields:
                entity_data.update(c.custom_fields)

            entity_data = {k: v for k, v in entity_data.items() if v not in (None, '', 0)}

            batch.append(CompanyV2(
                id=c.id,
                org_id=c.org_id,
                owner_id=c.owner_id,
                parent_company_id=c.parent_company_id,
                industry=c.industry or '',
                size=c.size or '',
                status='active',
                entity_data=entity_data,
            ))

            if len(batch) >= self.batch_size:
                CompanyV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['companies']['migrated'] += len(batch)
                batch = []

        if batch:
            CompanyV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['companies']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Companies: {self.stats["companies"]["migrated"]} migrated, '
            f'{self.stats["companies"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Contacts
    # ------------------------------------------------------------------
    def _migrate_contacts(self):
        from crm.models import Contact
        from contacts_v2.models import ContactV2

        v1_qs = self._org_filter(Contact.objects.all())
        total = v1_qs.count()
        self.stats['contacts']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} contacts')
            return

        existing = self._existing_ids(ContactV2)
        batch = []

        for c in v1_qs.iterator(chunk_size=self.batch_size):
            if c.id in existing:
                self.stats['contacts']['skipped'] += 1
                continue

            entity_data = {
                'first_name': c.first_name or '',
                'last_name': c.last_name or '',
                'email': c.email or '',
                'secondary_email': c.secondary_email or '',
                'phone': c.phone or '',
                'mobile': c.mobile or '',
                'title': c.title or '',
                'department': c.department or '',
                'address_line1': c.address_line1 or '',
                'address_line2': c.address_line2 or '',
                'city': c.city or '',
                'state': c.state or '',
                'postal_code': c.postal_code or '',
                'country': c.country or '',
                'description': c.description or '',
                'avatar_url': c.avatar_url or '',
                'linkedin_url': c.linkedin_url or '',
                'twitter_url': c.twitter_url or '',
                'source_detail': c.source_detail or '',
            }

            if c.custom_fields:
                entity_data.update(c.custom_fields)

            entity_data = {k: v for k, v in entity_data.items() if v not in (None, '', 0)}

            source = c.source or ''
            valid_sources = {s[0] for s in ContactV2.Source.choices}
            if source not in valid_sources:
                source = 'other'

            status = c.status or 'active'
            valid_statuses = {s[0] for s in ContactV2.Status.choices}
            if status not in valid_statuses:
                status = 'active'

            batch.append(ContactV2(
                id=c.id,
                org_id=c.org_id,
                owner_id=c.owner_id,
                company_id=c.primary_company_id,
                status=status,
                source=source,
                converted_from_lead_id=c.converted_from_lead_id,
                converted_at=c.converted_at,
                do_not_call=c.do_not_call,
                do_not_email=c.do_not_email,
                deleted_at=c.deleted_at,
                deleted_by=c.deleted_by,
                last_activity_at=c.last_activity_at,
                last_contacted_at=c.last_contacted_at,
                entity_data=entity_data,
            ))

            if len(batch) >= self.batch_size:
                ContactV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['contacts']['migrated'] += len(batch)
                batch = []

        if batch:
            ContactV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['contacts']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Contacts: {self.stats["contacts"]["migrated"]} migrated, '
            f'{self.stats["contacts"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Leads
    # ------------------------------------------------------------------
    def _migrate_leads(self):
        from crm.models import Lead
        from leads_v2.models import LeadV2

        v1_qs = self._org_filter(Lead.objects.all())
        total = v1_qs.count()
        self.stats['leads']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} leads')
            return

        existing = self._existing_ids(LeadV2)
        batch = []

        for l in v1_qs.iterator(chunk_size=self.batch_size):
            if l.id in existing:
                self.stats['leads']['skipped'] += 1
                continue

            entity_data = {
                'first_name': l.first_name or '',
                'last_name': l.last_name or '',
                'email': l.email or '',
                'phone': l.phone or '',
                'mobile': l.mobile or '',
                'company_name': l.company_name or '',
                'title': l.title or '',
                'website': l.website or '',
                'address_line1': l.address_line1 or '',
                'city': l.city or '',
                'state': l.state or '',
                'postal_code': l.postal_code or '',
                'country': l.country or '',
                'description': l.description or '',
                'source_detail': l.source_detail or '',
            }

            if l.score is not None:
                entity_data['score'] = l.score
            if l.disqualified_reason:
                entity_data['disqualified_reason'] = l.disqualified_reason
            if l.disqualified_at:
                entity_data['disqualified_at'] = l.disqualified_at.isoformat()
            if l.last_contacted_at:
                entity_data['last_contacted_at'] = l.last_contacted_at.isoformat()

            if l.custom_fields:
                entity_data.update(l.custom_fields)

            entity_data = {k: v for k, v in entity_data.items() if v not in (None, '', 0)}

            status = l.status or 'new'
            valid_statuses = {s[0] for s in LeadV2.Status.choices}
            if status not in valid_statuses:
                status = 'new'

            source = l.source or 'other'
            valid_sources = {s[0] for s in LeadV2.Source.choices}
            if source not in valid_sources:
                source = 'other'

            is_converted = (
                status == 'converted'
                or l.converted_at is not None
            )

            batch.append(LeadV2(
                id=l.id,
                org_id=l.org_id,
                owner_id=l.owner_id,
                status=status,
                source=source,
                is_converted=is_converted,
                converted_at=l.converted_at,
                converted_contact_id=l.converted_contact_id,
                converted_company_id=l.converted_company_id,
                converted_deal_id=l.converted_deal_id,
                converted_by=l.converted_by,
                deleted_at=l.deleted_at,
                deleted_by=l.deleted_by,
                last_activity_at=l.last_activity_at,
                entity_data=entity_data,
            ))

            if len(batch) >= self.batch_size:
                LeadV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['leads']['migrated'] += len(batch)
                batch = []

        if batch:
            LeadV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['leads']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Leads: {self.stats["leads"]["migrated"]} migrated, '
            f'{self.stats["leads"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Deals
    # ------------------------------------------------------------------
    def _migrate_deals(self):
        from crm.models import Deal
        from deals_v2.models import DealV2

        v1_qs = self._org_filter(Deal.objects.select_related('stage').all())
        total = v1_qs.count()
        self.stats['deals']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} deals')
            return

        existing = self._existing_ids(DealV2)
        batch = []

        for d in v1_qs.iterator(chunk_size=self.batch_size):
            if d.id in existing:
                self.stats['deals']['skipped'] += 1
                continue

            stage_name = d.stage.name if d.stage else 'qualification'

            entity_data = {}
            if d.name:
                entity_data['name'] = d.name
            if d.description:
                entity_data['description'] = d.description
            if hasattr(d, 'loss_notes') and d.loss_notes:
                entity_data['loss_notes'] = d.loss_notes
            if hasattr(d, 'line_items') and d.line_items:
                entity_data['line_items'] = d.line_items

            if d.custom_fields:
                entity_data.update(d.custom_fields)

            status = d.status or 'open'
            valid_statuses = {s[0] for s in DealV2.Status.choices}
            if status not in valid_statuses:
                status = 'open'

            batch.append(DealV2(
                id=d.id,
                org_id=d.org_id,
                owner_id=d.owner_id,
                pipeline_id=d.pipeline_id,
                contact_id=d.contact_id,
                company_id=d.company_id,
                status=status,
                stage=stage_name,
                value=d.value or 0,
                currency=d.currency or 'USD',
                probability=d.probability,
                expected_close_date=d.expected_close_date,
                actual_close_date=d.actual_close_date,
                loss_reason=d.loss_reason or '',
                converted_from_lead_id=d.converted_from_lead_id,
                stage_entered_at=d.stage_entered_at or timezone.now(),
                deleted_at=d.deleted_at,
                deleted_by=d.deleted_by,
                last_activity_at=d.last_activity_at,
                entity_data=entity_data,
            ))

            if len(batch) >= self.batch_size:
                DealV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['deals']['migrated'] += len(batch)
                batch = []

        if batch:
            DealV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['deals']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Deals: {self.stats["deals"]["migrated"]} migrated, '
            f'{self.stats["deals"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Activities
    # ------------------------------------------------------------------
    def _migrate_activities(self):
        from crm.models import Activity
        from activities_v2.models import ActivityV2

        v1_qs = self._org_filter(Activity.objects.all())
        total = v1_qs.count()
        self.stats['activities']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} activities')
            return

        existing = self._existing_ids(ActivityV2)
        batch = []

        for a in v1_qs.iterator(chunk_size=self.batch_size):
            if a.id in existing:
                self.stats['activities']['skipped'] += 1
                continue

            batch.append(ActivityV2(
                id=a.id,
                org_id=a.org_id,
                owner_id=a.owner_id,
                activity_type=a.activity_type,
                subject=a.subject,
                description=a.description or '',
                status=a.status or 'pending',
                priority=a.priority or 'normal',
                due_date=a.due_date,
                completed_at=a.completed_at,
                start_time=a.start_time,
                end_time=a.end_time,
                duration_minutes=a.duration_minutes,
                call_direction=a.call_direction,
                call_outcome=a.call_outcome,
                email_direction=a.email_direction,
                email_message_id=a.email_message_id or '',
                contact_id=a.contact_id,
                company_id=a.company_id,
                deal_id=a.deal_id,
                lead_id=a.lead_id,
                assigned_to_id=getattr(a, 'assigned_to_id', None) or getattr(a, 'assigned_to', None),
                reminder_at=a.reminder_at,
                reminder_sent=a.reminder_sent,
            ))

            if len(batch) >= self.batch_size:
                ActivityV2.all_objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['activities']['migrated'] += len(batch)
                batch = []

        if batch:
            ActivityV2.all_objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['activities']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Activities: {self.stats["activities"]["migrated"]} migrated, '
            f'{self.stats["activities"]["skipped"]} skipped'
        ))

    # ------------------------------------------------------------------
    # Entity Tags
    # ------------------------------------------------------------------
    def _migrate_entity_tags(self):
        from crm.models import EntityTag
        from tags_v2.models import EntityTagV2, TagV2

        v1_qs = EntityTag.objects.all()
        if self.org_id:
            v1_qs = v1_qs.filter(tag__org_id=self.org_id)
        total = v1_qs.count()
        self.stats['entity_tags']['total'] = total

        if self.dry_run:
            self.stdout.write(f'  Would migrate {total} entity tags')
            return

        migrated_tag_ids = set(TagV2.objects.values_list('id', flat=True))
        existing = self._existing_ids(EntityTagV2)
        batch = []

        for et in v1_qs.iterator(chunk_size=self.batch_size):
            if et.id in existing:
                self.stats['entity_tags']['skipped'] += 1
                continue
            if et.tag_id not in migrated_tag_ids:
                self.stats['entity_tags']['skipped'] += 1
                continue

            batch.append(EntityTagV2(
                id=et.id,
                tag_id=et.tag_id,
                entity_type=et.entity_type,
                entity_id=et.entity_id,
            ))

            if len(batch) >= self.batch_size:
                EntityTagV2.objects.bulk_create(batch, ignore_conflicts=True)
                self.stats['entity_tags']['migrated'] += len(batch)
                batch = []

        if batch:
            EntityTagV2.objects.bulk_create(batch, ignore_conflicts=True)
            self.stats['entity_tags']['migrated'] += len(batch)

        self.stdout.write(self.style.SUCCESS(
            f'  Entity Tags: {self.stats["entity_tags"]["migrated"]} migrated, '
            f'{self.stats["entity_tags"]["skipped"]} skipped'
        ))
