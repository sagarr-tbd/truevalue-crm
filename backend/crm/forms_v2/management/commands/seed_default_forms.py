from django.core.management.base import BaseCommand
from forms_v2.models import FormDefinition
import uuid


class Command(BaseCommand):
    help = 'Seed default forms with inline field definitions for organizations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Specific organization ID to seed (optional)',
        )
    
    def handle(self, *args, **options):
        org_id_str = options.get('org_id')
        
        if org_id_str:
            org_ids = [uuid.UUID(org_id_str)]
            self.stdout.write(f"Seeding forms for organization: {org_id_str}")
        else:
            from leads_v2.models import LeadV2
            from contacts_v2.models import ContactV2
            from companies_v2.models import CompanyV2
            from deals_v2.models import DealV2

            org_id_set = set()
            for model in [LeadV2, ContactV2, CompanyV2, DealV2]:
                org_id_set.update(
                    model.objects.order_by().values_list('org_id', flat=True).distinct()
                )

            org_ids = list(org_id_set)

            if not org_ids:
                self.stdout.write(self.style.WARNING('No organizations found. Please provide --org-id'))
                return

            self.stdout.write(f"Found {len(org_ids)} organizations")
        
        for org_id in org_ids:
            self.stdout.write(f"\nProcessing org: {org_id}")
            self.seed_lead_forms(org_id)
            self.seed_contact_forms(org_id)
            self.seed_company_forms(org_id)
            self.seed_deal_forms(org_id)
        
        self.stdout.write(self.style.SUCCESS('\n✅ Default forms seeded successfully!'))
    
    def seed_lead_forms(self, org_id):
        from forms_v2.default_schemas import get_default_lead_schema
        form, created = FormDefinition.objects.update_or_create(
            org_id=org_id,
            entity_type='lead',
            name='Default Lead Form',
            form_type='create',
            defaults={
                'description': 'Standard form for creating leads with inline field definitions',
                'is_default': True,
                'schema': get_default_lead_schema(),
            }
        )
        if created:
            self.stdout.write('    ✓ Created Default Lead Form')
        else:
            self.stdout.write('    ✓ Updated Default Lead Form')
    
    def seed_contact_forms(self, org_id):
        from forms_v2.default_schemas import get_default_contact_schema
        form, created = FormDefinition.objects.update_or_create(
            org_id=org_id,
            entity_type='contact',
            name='Default Contact Form',
            form_type='create',
            defaults={
                'description': 'Standard form for creating contacts with inline field definitions',
                'is_default': True,
                'schema': get_default_contact_schema(),
            }
        )
        if created:
            self.stdout.write('    ✓ Created Default Contact Form')
        else:
            self.stdout.write('    ✓ Updated Default Contact Form')

    def seed_company_forms(self, org_id):
        from forms_v2.default_schemas import get_default_company_schema
        form, created = FormDefinition.objects.update_or_create(
            org_id=org_id,
            entity_type='company',
            name='Default Company Form',
            form_type='create',
            defaults={
                'description': 'Standard form for creating companies with inline field definitions',
                'is_default': True,
                'schema': get_default_company_schema(),
            }
        )
        if created:
            self.stdout.write('    ✓ Created Default Company Form')
        else:
            self.stdout.write('    ✓ Updated Default Company Form')

    def seed_deal_forms(self, org_id):
        from forms_v2.default_schemas import get_default_deal_schema
        form, created = FormDefinition.objects.update_or_create(
            org_id=org_id,
            entity_type='deal',
            name='Default Deal Form',
            form_type='create',
            defaults={
                'description': 'Standard form for creating deals with inline field definitions',
                'is_default': True,
                'schema': get_default_deal_schema(),
            }
        )
        if created:
            self.stdout.write('    ✓ Created Default Deal Form')
        else:
            self.stdout.write('    ✓ Updated Default Deal Form')
