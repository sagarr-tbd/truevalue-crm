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
        self.stdout.write('  Creating Lead form with inline fields...')
        
        form_schema = {
            'version': '1.0.0',
            'sections': [
                {
                    'id': 'contact_info',
                    'title': 'Contact Information',
                    'description': 'Basic contact details',
                    'columns': 2,
                    'collapsible': False,
                    'fields': [
                        {
                            'name': 'first_name',
                            'label': 'First Name',
                            'field_type': 'text',
                            'is_required': True,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': 'Enter first name',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                        {
                            'name': 'last_name',
                            'label': 'Last Name',
                            'field_type': 'text',
                            'is_required': True,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': 'Enter last name',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                        {
                            'name': 'email',
                            'label': 'Email',
                            'field_type': 'email',
                            'is_required': True,
                            'is_unique': True,
                            'is_searchable': True,
                            'placeholder': 'email@example.com',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                        {
                            'name': 'phone',
                            'label': 'Phone',
                            'field_type': 'phone',
                            'is_required': False,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': '+1 (555) 123-4567',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                    ]
                },
                {
                    'id': 'company_info',
                    'title': 'Company Information',
                    'columns': 2,
                    'fields': [
                        {
                            'name': 'company_name',
                            'label': 'Company',
                            'field_type': 'text',
                            'is_required': False,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': 'Company name',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                        {
                            'name': 'title',
                            'label': 'Job Title',
                            'field_type': 'text',
                            'is_required': False,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': 'e.g., Sales Manager',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                    ]
                },
                {
                    'id': 'qualification',
                    'title': 'Lead Qualification',
                    'columns': 2,
                    'fields': [
                        {
                            'name': 'status',
                            'label': 'Status',
                            'field_type': 'select',
                            'is_required': True,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': '',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {
                                'options': [
                                    {'value': 'new', 'label': 'New', 'color': '#3b82f6'},
                                    {'value': 'contacted', 'label': 'Contacted', 'color': '#8b5cf6'},
                                    {'value': 'qualified', 'label': 'Qualified', 'color': '#10b981'},
                                    {'value': 'unqualified', 'label': 'Unqualified', 'color': '#ef4444'},
                                    {'value': 'converted', 'label': 'Converted', 'color': '#22c55e'},
                                ]
                            },
                            'default_value': 'new',
                            'width': 'half',
                            'readonly': False,
                        },
                        {
                            'name': 'source',
                            'label': 'Lead Source',
                            'field_type': 'select',
                            'is_required': False,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': '',
                            'help_text': '',
                            'validation_rules': {},
                            'options': {
                                'options': [
                                    {'value': 'website', 'label': 'Website'},
                                    {'value': 'referral', 'label': 'Referral'},
                                    {'value': 'cold_call', 'label': 'Cold Call'},
                                    {'value': 'trade_show', 'label': 'Trade Show'},
                                    {'value': 'social_media', 'label': 'Social Media'},
                                    {'value': 'advertisement', 'label': 'Advertisement'},
                                    {'value': 'partner', 'label': 'Partner'},
                                    {'value': 'other', 'label': 'Other'},
                                ]
                            },
                            'default_value': None,
                            'width': 'half',
                            'readonly': False,
                        },
                    ]
                },
                {
                    'id': 'additional',
                    'title': 'Additional Information',
                    'columns': 1,
                    'collapsible': True,
                    'fields': [
                        {
                            'name': 'description',
                            'label': 'Notes',
                            'field_type': 'textarea',
                            'is_required': False,
                            'is_unique': False,
                            'is_searchable': True,
                            'placeholder': 'Add notes about this lead...',
                            'help_text': 'Any additional information about the lead',
                            'validation_rules': {},
                            'options': {},
                            'default_value': None,
                            'width': 'full',
                            'readonly': False,
                        },
                    ]
                }
            ]
        }
        
        form, created = FormDefinition.objects.update_or_create(
            org_id=org_id,
            entity_type='lead',
            name='Default Lead Form',
            form_type='create',
            defaults={
                'description': 'Standard form for creating leads with inline field definitions',
                'is_default': True,
                'schema': form_schema,
            }
        )
        
        if created:
            self.stdout.write('    ✓ Created Default Lead Form with inline fields')
        else:
            self.stdout.write('    ✓ Updated Default Lead Form with inline fields')
    
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
