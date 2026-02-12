"""
Seed CRM Data Command

Creates sample data for testing the CRM:
- Pipeline with stages
- Companies
- Contacts
- Leads
- Deals
- Activities
- Tags

Usage:
    python manage.py seed_crm_data --org-id <uuid> --owner-id <uuid>
    
    # Or use environment variables:
    export ORG_ID=<uuid>
    export OWNER_ID=<uuid>
    python manage.py seed_crm_data
    
    # Clear existing data first:
    python manage.py seed_crm_data --org-id <uuid> --owner-id <uuid> --clear
"""

import os
import uuid
import random
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from crm.models import (
    Company, Contact, Lead, Deal, 
    Pipeline, PipelineStage, Activity, Tag
)


class Command(BaseCommand):
    help = 'Seed CRM database with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Organization UUID (or set ORG_ID env var)',
        )
        parser.add_argument(
            '--owner-id',
            type=str,
            help='Owner/User UUID (or set OWNER_ID env var)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of records to create per entity (default: 10)',
        )

    def handle(self, *args, **options):
        # Get org_id and owner_id
        org_id = options['org_id'] or os.environ.get('ORG_ID')
        owner_id = options['owner_id'] or os.environ.get('OWNER_ID')
        
        if not org_id:
            raise CommandError(
                'Organization ID is required. Use --org-id or set ORG_ID env var.\n'
                'You can get this from the JWT token (org_id claim) after logging in.'
            )
        
        if not owner_id:
            raise CommandError(
                'Owner ID is required. Use --owner-id or set OWNER_ID env var.\n'
                'You can get this from the JWT token (sub claim) after logging in.'
            )
        
        try:
            org_id = uuid.UUID(org_id)
            owner_id = uuid.UUID(owner_id)
        except ValueError as e:
            raise CommandError(f'Invalid UUID format: {e}')
        
        count = options['count']
        
        self.stdout.write(f'Seeding CRM data for org: {org_id}')
        self.stdout.write(f'Owner: {owner_id}')
        self.stdout.write(f'Count per entity: {count}')
        
        # Clear existing data if requested
        if options['clear']:
            self.clear_data(org_id)
        
        # Seed data
        tags = self.create_tags(org_id)
        pipeline, stages = self.create_pipeline(org_id)
        companies = self.create_companies(org_id, owner_id, tags, count)
        contacts = self.create_contacts(org_id, owner_id, companies, tags, count)
        leads = self.create_leads(org_id, owner_id, tags, count)
        deals = self.create_deals(org_id, owner_id, pipeline, stages, companies, contacts, count)
        activities = self.create_activities(org_id, owner_id, contacts, deals, leads, count)
        
        self.stdout.write(self.style.SUCCESS(f'\nCRM data seeded successfully!'))
        self.stdout.write(f'  - Tags: {len(tags)}')
        self.stdout.write(f'  - Pipeline: 1 with {len(stages)} stages')
        self.stdout.write(f'  - Companies: {len(companies)}')
        self.stdout.write(f'  - Contacts: {len(contacts)}')
        self.stdout.write(f'  - Leads: {len(leads)}')
        self.stdout.write(f'  - Deals: {len(deals)}')
        self.stdout.write(f'  - Activities: {len(activities)}')

    def clear_data(self, org_id):
        """Clear existing data for the organization."""
        self.stdout.write('Clearing existing data...')
        
        Activity.objects.filter(org_id=org_id).delete()
        Deal.objects.filter(org_id=org_id).delete()
        Lead.objects.filter(org_id=org_id).delete()
        Contact.objects.filter(org_id=org_id).delete()
        Company.objects.filter(org_id=org_id).delete()
        PipelineStage.objects.filter(pipeline__org_id=org_id).delete()
        Pipeline.objects.filter(org_id=org_id).delete()
        Tag.objects.filter(org_id=org_id).delete()
        
        self.stdout.write(self.style.WARNING('Existing data cleared'))

    def create_tags(self, org_id):
        """Create sample tags."""
        self.stdout.write('Creating tags...')
        
        tag_data = [
            {'name': 'VIP', 'color': '#EF4444', 'entity_type': 'contact'},
            {'name': 'Hot Lead', 'color': '#F97316', 'entity_type': 'lead'},
            {'name': 'Enterprise', 'color': '#8B5CF6', 'entity_type': 'company'},
            {'name': 'Partner', 'color': '#10B981', 'entity_type': 'company'},
            {'name': 'High Priority', 'color': '#EF4444', 'entity_type': 'deal'},
            {'name': 'Renewal', 'color': '#3B82F6', 'entity_type': 'deal'},
            {'name': 'Follow Up', 'color': '#F59E0B', 'entity_type': 'all'},
            {'name': 'Decision Maker', 'color': '#6366F1', 'entity_type': 'contact'},
        ]
        
        tags = []
        for data in tag_data:
            tag, created = Tag.objects.get_or_create(
                org_id=org_id,
                name=data['name'],
                entity_type=data['entity_type'],
                defaults={'color': data['color']}
            )
            tags.append(tag)
        
        return tags

    def create_pipeline(self, org_id):
        """Create default sales pipeline with stages."""
        self.stdout.write('Creating pipeline...')
        
        pipeline, created = Pipeline.objects.get_or_create(
            org_id=org_id,
            name='Sales Pipeline',
            defaults={
                'description': 'Main sales pipeline for tracking deals',
                'is_default': True,
                'is_active': True,
                'currency': 'USD',
            }
        )
        
        stage_data = [
            {'name': 'Qualification', 'probability': 10, 'order': 1, 'color': '#6B7280'},
            {'name': 'Discovery', 'probability': 20, 'order': 2, 'color': '#3B82F6'},
            {'name': 'Proposal', 'probability': 40, 'order': 3, 'color': '#8B5CF6'},
            {'name': 'Negotiation', 'probability': 60, 'order': 4, 'color': '#F59E0B'},
            {'name': 'Closed Won', 'probability': 100, 'order': 5, 'color': '#10B981', 'is_won': True},
            {'name': 'Closed Lost', 'probability': 0, 'order': 6, 'color': '#EF4444', 'is_lost': True},
        ]
        
        stages = []
        for data in stage_data:
            stage, created = PipelineStage.objects.get_or_create(
                pipeline=pipeline,
                name=data['name'],
                defaults={
                    'probability': data['probability'],
                    'order': data['order'],
                    'color': data['color'],
                    'is_won': data.get('is_won', False),
                    'is_lost': data.get('is_lost', False),
                    'rotting_days': 14 if not data.get('is_won') and not data.get('is_lost') else None,
                }
            )
            stages.append(stage)
        
        return pipeline, stages

    def create_companies(self, org_id, owner_id, tags, count):
        """Create sample companies."""
        self.stdout.write('Creating companies...')
        
        company_data = [
            {'name': 'Acme Corporation', 'industry': 'Technology', 'size': '201-500', 'website': 'https://acme.com'},
            {'name': 'TechStart Inc', 'industry': 'Technology', 'size': '11-50', 'website': 'https://techstart.io'},
            {'name': 'Global Finance Ltd', 'industry': 'Finance', 'size': '501-1000', 'website': 'https://globalfinance.com'},
            {'name': 'Healthcare Plus', 'industry': 'Healthcare', 'size': '51-200', 'website': 'https://healthcareplus.org'},
            {'name': 'RetailMax', 'industry': 'Retail', 'size': '1000+', 'website': 'https://retailmax.com'},
            {'name': 'Manufacturing Pro', 'industry': 'Manufacturing', 'size': '201-500', 'website': 'https://mfgpro.com'},
            {'name': 'EduTech Solutions', 'industry': 'Education', 'size': '11-50', 'website': 'https://edutech.io'},
            {'name': 'Green Energy Co', 'industry': 'Energy', 'size': '51-200', 'website': 'https://greenenergy.com'},
            {'name': 'MediaWorks', 'industry': 'Media', 'size': '11-50', 'website': 'https://mediaworks.tv'},
            {'name': 'LogiTrans', 'industry': 'Logistics', 'size': '201-500', 'website': 'https://logitrans.com'},
            {'name': 'DataDriven Analytics', 'industry': 'Technology', 'size': '2-10', 'website': 'https://datadriven.ai'},
            {'name': 'CloudScale Systems', 'industry': 'Technology', 'size': '51-200', 'website': 'https://cloudscale.io'},
        ]
        
        cities = ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Boston', 'Denver', 'Miami']
        states = ['NY', 'CA', 'IL', 'TX', 'WA', 'MA', 'CO', 'FL']
        
        companies = []
        for i, data in enumerate(company_data[:count]):
            city_idx = i % len(cities)
            company, created = Company.objects.get_or_create(
                org_id=org_id,
                name=data['name'],
                defaults={
                    'owner_id': owner_id,
                    'website': data['website'],
                    'industry': data['industry'],
                    'size': data['size'],
                    'phone': f'+1-555-{100+i:03d}-{1000+i:04d}',
                    'email': f'info@{data["name"].lower().replace(" ", "")}.com',
                    'city': cities[city_idx],
                    'state': states[city_idx],
                    'country': 'USA',
                    'annual_revenue': Decimal(random.randint(100000, 10000000)),
                    'employee_count': random.randint(10, 1000),
                }
            )
            companies.append(company)
        
        return companies

    def create_contacts(self, org_id, owner_id, companies, tags, count):
        """Create sample contacts."""
        self.stdout.write('Creating contacts...')
        
        first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Jennifer', 'William', 'Amanda']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor']
        titles = ['CEO', 'CTO', 'VP Sales', 'VP Marketing', 'Director', 'Manager', 'Engineer', 'Analyst', 'Consultant']
        departments = ['Executive', 'Sales', 'Marketing', 'Engineering', 'Finance', 'Operations', 'HR']
        sources = ['website', 'referral', 'linkedin', 'trade_show', 'cold_call']
        
        contacts = []
        for i in range(count):
            first_name = first_names[i % len(first_names)]
            last_name = last_names[i % len(last_names)]
            company = companies[i % len(companies)] if companies else None
            
            email = f'{first_name.lower()}.{last_name.lower()}{i}@example.com'
            
            contact, created = Contact.objects.get_or_create(
                org_id=org_id,
                email=email,
                defaults={
                    'owner_id': owner_id,
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': f'+1-555-{200+i:03d}-{2000+i:04d}',
                    'mobile': f'+1-555-{300+i:03d}-{3000+i:04d}',
                    'title': random.choice(titles),
                    'department': random.choice(departments),
                    'primary_company': company,
                    'status': 'active',
                    'source': random.choice(sources),
                }
            )
            contacts.append(contact)
        
        return contacts

    def create_leads(self, org_id, owner_id, tags, count):
        """Create sample leads."""
        self.stdout.write('Creating leads...')
        
        first_names = ['Alex', 'Chris', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake']
        last_names = ['Wilson', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis']
        companies = ['Tech Innovations', 'Digital Solutions', 'Smart Systems', 'Future Corp', 'NextGen Labs', 'Prime Tech', 'Alpha Industries', 'Beta Solutions']
        sources = ['website', 'google_ads', 'facebook', 'linkedin', 'referral', 'trade_show', 'webinar', 'cold_outreach']
        statuses = ['new', 'contacted', 'qualified']
        
        leads = []
        for i in range(count):
            first_name = first_names[i % len(first_names)]
            last_name = last_names[i % len(last_names)]
            email = f'{first_name.lower()}.{last_name.lower()}.lead{i}@example.com'
            
            lead, created = Lead.objects.get_or_create(
                org_id=org_id,
                email=email,
                defaults={
                    'owner_id': owner_id,
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': f'+1-555-{400+i:03d}-{4000+i:04d}',
                    'company_name': random.choice(companies),
                    'title': random.choice(['Manager', 'Director', 'VP', 'CEO', 'Founder']),
                    'website': f'https://{random.choice(companies).lower().replace(" ", "")}.com',
                    'status': random.choice(statuses),
                    'source': random.choice(sources),
                    'source_detail': f'Campaign Q{random.randint(1, 4)} 2024',
                    'score': random.randint(20, 95),
                    'description': f'Interested in our enterprise solution. Budget range: ${random.randint(10, 100)}k',
                }
            )
            leads.append(lead)
        
        return leads

    def create_deals(self, org_id, owner_id, pipeline, stages, companies, contacts, count):
        """Create sample deals."""
        self.stdout.write('Creating deals...')
        
        deal_names = [
            'Enterprise License', 'Annual Subscription', 'Professional Services',
            'Custom Development', 'Implementation Package', 'Support Contract',
            'Platform Upgrade', 'Integration Project', 'Consulting Engagement',
            'Training Program', 'Security Audit', 'Migration Project'
        ]
        
        # Filter to open stages only for new deals
        open_stages = [s for s in stages if not s.is_won and not s.is_lost]
        
        deals = []
        for i in range(count):
            deal_name = f'{deal_names[i % len(deal_names)]} - {companies[i % len(companies)].name if companies else f"Deal {i+1}"}'
            stage = open_stages[i % len(open_stages)]
            value = Decimal(random.randint(5000, 150000))
            
            deal, created = Deal.objects.get_or_create(
                org_id=org_id,
                name=deal_name,
                pipeline=pipeline,
                defaults={
                    'owner_id': owner_id,
                    'stage': stage,
                    'value': value,
                    'currency': 'USD',
                    'probability': stage.probability,
                    'expected_close_date': (timezone.now() + timedelta(days=random.randint(7, 90))).date(),
                    'status': 'open',
                    'contact': contacts[i % len(contacts)] if contacts else None,
                    'company': companies[i % len(companies)] if companies else None,
                    'description': f'Deal for {deal_names[i % len(deal_names)].lower()}',
                }
            )
            deals.append(deal)
        
        return deals

    def create_activities(self, org_id, owner_id, contacts, deals, leads, count):
        """Create sample activities with realistic timeline data."""
        self.stdout.write('Creating activities...')
        
        activity_types = ['task', 'call', 'email', 'meeting', 'note']
        
        # Rich subjects and descriptions for realistic timeline
        activity_data = {
            'task': [
                {'subject': 'Follow up on proposal', 'description': 'Review the proposal feedback and address any concerns raised during the last meeting.'},
                {'subject': 'Send contract', 'description': 'Prepare and send the service agreement for review by legal team.'},
                {'subject': 'Review requirements', 'description': 'Analyze the requirements document and prepare questions for clarification.'},
                {'subject': 'Prepare demo', 'description': 'Create a customized demo environment showcasing relevant features for the client.'},
                {'subject': 'Update CRM records', 'description': 'Update contact information and add notes from recent interactions.'},
                {'subject': 'Schedule follow-up meeting', 'description': 'Coordinate calendars and set up the next touchpoint with the prospect.'},
                {'subject': 'Research company background', 'description': 'Gather insights about the company, recent news, and key decision makers.'},
            ],
            'call': [
                {'subject': 'Discovery call', 'description': 'Initial call to understand business challenges, current solutions, and potential fit.'},
                {'subject': 'Follow-up call', 'description': 'Discussed outstanding questions from previous meeting. Client interested in Q2 implementation.'},
                {'subject': 'Demo call', 'description': 'Walked through key features including dashboard, reporting, and integrations. Good engagement.'},
                {'subject': 'Negotiation call', 'description': 'Reviewed pricing options and discussed contract terms. Moving forward with annual plan.'},
                {'subject': 'Check-in call', 'description': 'Quarterly check-in to review satisfaction and discuss upcoming needs.'},
                {'subject': 'Technical consultation', 'description': 'Addressed integration questions with their IT team. All concerns resolved.'},
                {'subject': 'Pricing discussion', 'description': 'Reviewed enterprise pricing and volume discounts. Awaiting budget approval.'},
            ],
            'email': [
                {'subject': 'Introduction email sent', 'description': 'Sent personalized introduction highlighting relevant case studies and ROI data.'},
                {'subject': 'Proposal sent', 'description': 'Delivered comprehensive proposal with pricing, timeline, and implementation details.'},
                {'subject': 'Follow-up email', 'description': 'Following up on last week\'s demo. Attached additional resources as requested.'},
                {'subject': 'Thank you email', 'description': 'Sent thank you note after productive meeting. Included next steps and action items.'},
                {'subject': 'Meeting recap sent', 'description': 'Summarized key discussion points, decisions made, and agreed-upon timeline.'},
                {'subject': 'Case study shared', 'description': 'Sent relevant customer success story showcasing 40% efficiency improvement.'},
                {'subject': 'Contract follow-up', 'description': 'Gentle reminder about contract review. Offered to address any remaining questions.'},
            ],
            'meeting': [
                {'subject': 'Initial meeting', 'description': 'First face-to-face meeting with stakeholders. Presented company overview and product capabilities.'},
                {'subject': 'Product demo', 'description': 'Comprehensive product demonstration covering core features and customization options.'},
                {'subject': 'Contract review meeting', 'description': 'Joint session with legal teams to review and finalize contract terms.'},
                {'subject': 'Kickoff meeting', 'description': 'Project kickoff with implementation team. Defined scope, timeline, and success criteria.'},
                {'subject': 'Quarterly business review', 'description': 'QBR to assess progress, review metrics, and plan for next quarter objectives.'},
                {'subject': 'Executive presentation', 'description': 'Strategic presentation to C-suite covering business value and implementation roadmap.'},
                {'subject': 'Technical workshop', 'description': 'Deep-dive session with technical team on API integrations and data migration.'},
            ],
            'note': [
                {'subject': 'Meeting notes', 'description': 'Key takeaways: Budget approved for Q2, decision maker is VP of Operations, timeline is 3-6 months.'},
                {'subject': 'Call summary', 'description': 'Client expressed strong interest. Main concerns are data security and training requirements.'},
                {'subject': 'Requirements gathered', 'description': 'Documented detailed requirements including user count, integrations needed, and custom workflows.'},
                {'subject': 'Decision maker identified', 'description': 'Confirmed that final approval rests with CFO. Direct contact established.'},
                {'subject': 'Budget confirmed', 'description': 'Annual budget of $50K allocated. Looking for Q1 implementation to hit fiscal targets.'},
                {'subject': 'Competitive analysis', 'description': 'Client currently evaluating 3 vendors. Our differentiators: support quality and customization.'},
                {'subject': 'Internal champion identified', 'description': 'Project Manager is internal advocate. Schedule regular syncs to maintain momentum.'},
            ],
        }
        
        priorities = ['low', 'normal', 'high']
        statuses = ['pending', 'completed']
        call_directions = ['inbound', 'outbound']
        call_outcomes = ['answered', 'voicemail', 'no_answer', 'busy']
        
        activities = []
        for i in range(count * 3):  # Create more activities for rich timeline
            activity_type = random.choice(activity_types)
            activity_info = random.choice(activity_data[activity_type])
            
            # Link to contact, deal, or lead
            contact = contacts[i % len(contacts)] if contacts and random.random() > 0.3 else None
            deal = deals[i % len(deals)] if deals and random.random() > 0.5 else None
            lead = leads[i % len(leads)] if leads and not contact and random.random() > 0.5 else None
            
            # Ensure at least one relation
            if not contact and not deal and not lead:
                contact = contacts[0] if contacts else None
            
            # Varied timing - some past, some future
            days_offset = random.randint(-30, 14)
            due_date = timezone.now() + timedelta(days=days_offset)
            status = 'completed' if days_offset < -2 else random.choice(statuses)
            
            # Build activity with rich data
            activity_kwargs = {
                'org_id': org_id,
                'owner_id': owner_id,
                'activity_type': activity_type,
                'subject': activity_info['subject'],
                'description': activity_info['description'],
                'status': status,
                'priority': random.choice(priorities),
                'due_date': due_date,
                'completed_at': timezone.now() - timedelta(days=random.randint(0, 5)) if status == 'completed' else None,
                'contact': contact,
                'deal': deal,
                'lead': lead,
            }
            
            # Add call-specific fields
            if activity_type == 'call':
                activity_kwargs['call_direction'] = random.choice(call_directions)
                activity_kwargs['call_outcome'] = random.choice(call_outcomes) if status == 'completed' else None
                activity_kwargs['duration_minutes'] = random.choice([5, 10, 15, 20, 30, 45, 60]) if status == 'completed' else None
            
            # Add meeting-specific fields
            if activity_type == 'meeting':
                meeting_start = due_date.replace(hour=random.choice([9, 10, 11, 14, 15, 16]), minute=0)
                duration = random.choice([30, 45, 60, 90])
                activity_kwargs['start_time'] = meeting_start
                activity_kwargs['end_time'] = meeting_start + timedelta(minutes=duration)
                activity_kwargs['duration_minutes'] = duration
            
            activity = Activity.objects.create(**activity_kwargs)
            activities.append(activity)
        
        return activities
