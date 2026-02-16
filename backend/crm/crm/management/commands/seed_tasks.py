"""
Seed Activities Command

Creates 25 tasks, 20 calls, and 20 meetings for testing the Activities module.

Usage:
    python manage.py seed_tasks --org-id <uuid> --owner-id <uuid>
    
    # Or use environment variables:
    export ORG_ID=<uuid>
    export OWNER_ID=<uuid>
    python manage.py seed_tasks
    
    # Clear existing activities first:
    python manage.py seed_tasks --org-id <uuid> --owner-id <uuid> --clear
"""

import os
import uuid
import random
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
from crm.models import Activity, Contact, Company, Deal, Lead


CALL_DATA = [
    {
        'subject': 'Discovery call with Acme Corp',
        'description': 'Initial call to understand their current CRM pain points and requirements for the sales team.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'high',
        'duration_minutes': 35,
    },
    {
        'subject': 'Follow-up call with TechStart CEO',
        'description': 'Discuss pricing concerns raised in the proposal. Address ROI questions.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'urgent',
        'duration_minutes': 22,
    },
    {
        'subject': 'Inbound inquiry from Global Finance',
        'description': 'Prospect called about enterprise plan features. Interested in API access and SSO.',
        'call_direction': 'inbound',
        'call_outcome': 'answered',
        'priority': 'high',
        'duration_minutes': 18,
    },
    {
        'subject': 'Check-in with RetailMax account manager',
        'description': 'Monthly account review. Discuss upsell opportunity for analytics module.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'normal',
        'duration_minutes': 45,
    },
    {
        'subject': 'Cold call to HealthPlus Corp',
        'description': 'Outreach to decision maker in healthcare vertical. Left voicemail with callback number.',
        'call_direction': 'outbound',
        'call_outcome': 'voicemail',
        'priority': 'normal',
        'duration_minutes': 3,
    },
    {
        'subject': 'Support escalation call with EduTech',
        'description': 'Customer reported data sync issues. Escalated to engineering team during the call.',
        'call_direction': 'inbound',
        'call_outcome': 'answered',
        'priority': 'urgent',
        'duration_minutes': 28,
    },
    {
        'subject': 'Scheduled call with CloudScale CTO',
        'description': 'Technical deep-dive on integration capabilities. Prepare architecture diagrams.',
        'call_direction': 'outbound',
        'call_outcome': 'no_answer',
        'priority': 'high',
        'duration_minutes': None,
    },
    {
        'subject': 'Partner onboarding call with BizConnect',
        'description': 'Walk through partner portal, commission structure, and co-marketing opportunities.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'normal',
        'duration_minutes': 40,
    },
    {
        'subject': 'Renewal negotiation with MediaWorks',
        'description': 'Contract renewal discussion. They want a 15% discount; authorized up to 10%.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'urgent',
        'duration_minutes': 32,
    },
    {
        'subject': 'Inbound lead qualification call',
        'description': 'Website form submission from manufacturing company. 200+ employees, looking for CRM.',
        'call_direction': 'inbound',
        'call_outcome': 'answered',
        'priority': 'high',
        'duration_minutes': 15,
    },
    {
        'subject': 'Call back request from DataDrive Inc',
        'description': 'Prospect requested callback after attending webinar. Interested in analytics features.',
        'call_direction': 'outbound',
        'call_outcome': 'busy',
        'priority': 'normal',
        'duration_minutes': None,
    },
    {
        'subject': 'Quarterly review with Apex Solutions',
        'description': 'Review usage metrics, satisfaction scores, and roadmap alignment.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'normal',
        'duration_minutes': 50,
    },
    {
        'subject': 'Demo feedback call with NovaTech',
        'description': 'Follow up on yesterday\'s product demo. Address questions about workflow automation.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'high',
        'duration_minutes': 20,
    },
    {
        'subject': 'Urgent escalation from Prime Industries',
        'description': 'Billing discrepancy reported. Need to resolve before month-end close.',
        'call_direction': 'inbound',
        'call_outcome': 'answered',
        'priority': 'urgent',
        'duration_minutes': 12,
    },
    {
        'subject': 'Referral introduction call',
        'description': 'Warm introduction from existing customer to their business partner. Logistics company, 50 users.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'normal',
        'duration_minutes': 25,
    },
    {
        'subject': 'Technical requirements call with SmartBuild',
        'description': 'Discuss API integration needs for their custom ERP system. Involve solutions engineer.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'high',
        'duration_minutes': 55,
    },
    {
        'subject': 'Customer success check-in with FutureTech',
        'description': 'Monthly NPS check-in. Discuss new feature adoption and upcoming training needs.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'normal',
        'duration_minutes': 30,
    },
    {
        'subject': 'Contract negotiation with Strategic Partners',
        'description': 'Multi-year deal discussion. They want custom SLA terms.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'urgent',
        'duration_minutes': 42,
    },
    {
        'subject': 'Missed call from InnovateLabs',
        'description': 'Prospect called while unavailable. Need to return call tomorrow morning.',
        'call_direction': 'inbound',
        'call_outcome': 'no_answer',
        'priority': 'normal',
        'duration_minutes': None,
    },
    {
        'subject': 'Pre-sales technical assessment call',
        'description': 'Security and compliance review with prospect\'s IT team. SOC2 and GDPR questions.',
        'call_direction': 'outbound',
        'call_outcome': 'answered',
        'priority': 'high',
        'duration_minutes': 38,
    },
]

MEETING_DATA = [
    {
        'subject': 'Q2 Pipeline Review',
        'description': 'Review current pipeline health, deal progression, and forecast accuracy with the sales team.',
        'priority': 'high',
        'duration_minutes': 60,
    },
    {
        'subject': 'Product demo for Acme Corp',
        'description': 'Live demo of CRM platform tailored to their manufacturing use case. 5 stakeholders attending.',
        'priority': 'urgent',
        'duration_minutes': 90,
    },
    {
        'subject': 'Weekly sales standup',
        'description': 'Team sync on weekly targets, blockers, and key activities for the week ahead.',
        'priority': 'normal',
        'duration_minutes': 30,
    },
    {
        'subject': 'Strategy session with VP Sales',
        'description': 'Discuss territory realignment and new vertical expansion strategy for Q3.',
        'priority': 'high',
        'duration_minutes': 60,
    },
    {
        'subject': 'Technical workshop with CloudScale',
        'description': 'Deep-dive into integration architecture. Solutions engineer leading API walkthrough.',
        'priority': 'high',
        'duration_minutes': 120,
    },
    {
        'subject': 'Customer onboarding kickoff — EduTech',
        'description': 'Implementation kickoff with customer success and their project team. Define milestones.',
        'priority': 'urgent',
        'duration_minutes': 60,
    },
    {
        'subject': 'Partner program review',
        'description': 'Quarterly review of partner performance metrics and co-marketing results.',
        'priority': 'normal',
        'duration_minutes': 45,
    },
    {
        'subject': 'Board meeting prep',
        'description': 'Align on key metrics, talking points, and Q&A preparation for next week\'s board meeting.',
        'priority': 'urgent',
        'duration_minutes': 90,
    },
    {
        'subject': 'Competitive analysis presentation',
        'description': 'Present market landscape analysis to product and sales leadership.',
        'priority': 'normal',
        'duration_minutes': 45,
    },
    {
        'subject': 'Contract review with legal — Global Finance',
        'description': 'Review redlined MSA with legal team before sending final version to prospect.',
        'priority': 'high',
        'duration_minutes': 60,
    },
    {
        'subject': 'Training session: New analytics features',
        'description': 'Internal training for sales team on recently launched reporting and dashboard features.',
        'priority': 'normal',
        'duration_minutes': 60,
    },
    {
        'subject': 'Executive briefing with RetailMax CEO',
        'description': 'C-level meeting to discuss strategic partnership and enterprise agreement.',
        'priority': 'urgent',
        'duration_minutes': 45,
    },
    {
        'subject': 'Sprint retrospective — CRM team',
        'description': 'Review completed sprint, discuss what went well, and identify improvements.',
        'priority': 'normal',
        'duration_minutes': 60,
    },
    {
        'subject': 'Customer advisory board meeting',
        'description': 'Quarterly meeting with top 8 customers to gather product feedback and roadmap input.',
        'priority': 'high',
        'duration_minutes': 120,
    },
    {
        'subject': 'Sales enablement planning',
        'description': 'Plan content, tooling, and training initiatives for the next quarter.',
        'priority': 'normal',
        'duration_minutes': 60,
    },
    {
        'subject': 'Pricing committee meeting',
        'description': 'Review proposed pricing changes for enterprise tier. Analyze competitive positioning.',
        'priority': 'high',
        'duration_minutes': 45,
    },
    {
        'subject': 'Integration planning with SmartBuild',
        'description': 'Technical planning session for ERP-CRM integration. Map data flows and endpoints.',
        'priority': 'high',
        'duration_minutes': 90,
    },
    {
        'subject': 'Quarterly business review — MediaWorks',
        'description': 'Present account health, usage trends, and upcoming feature roadmap to customer.',
        'priority': 'normal',
        'duration_minutes': 60,
    },
    {
        'subject': 'New hire onboarding — Sales team',
        'description': 'Onboard 2 new SDRs. Cover CRM workflow, pitch deck, and sales methodology.',
        'priority': 'normal',
        'duration_minutes': 120,
    },
    {
        'subject': 'Deal review: Strategic Partners proposal',
        'description': 'Review multi-year deal structure, custom terms, and pricing with sales ops.',
        'priority': 'urgent',
        'duration_minutes': 45,
    },
]

TASK_DATA = [
    {
        'subject': 'Follow up on Q2 proposal',
        'description': 'Review the proposal feedback from Acme Corp and address pricing concerns raised during the last meeting.',
        'priority': 'high',
    },
    {
        'subject': 'Send contract to Global Finance',
        'description': 'Prepare and send the service agreement for review by their legal team. Include NDA.',
        'priority': 'urgent',
    },
    {
        'subject': 'Review requirements document',
        'description': 'Analyze the 15-page requirements doc and prepare questions for the technical workshop next week.',
        'priority': 'normal',
    },
    {
        'subject': 'Prepare demo environment',
        'description': 'Create a customized demo with sample data matching the healthcare industry vertical.',
        'priority': 'high',
    },
    {
        'subject': 'Update CRM records for TechStart',
        'description': 'Add notes from last 3 interactions and update deal stage to Negotiation.',
        'priority': 'low',
    },
    {
        'subject': 'Schedule executive presentation',
        'description': 'Coordinate calendars with VP of Sales and CTO for the strategic roadmap presentation.',
        'priority': 'high',
    },
    {
        'subject': 'Research CloudScale competitive landscape',
        'description': 'Gather insights on competitor offerings, pricing, and recent product launches.',
        'priority': 'normal',
    },
    {
        'subject': 'Draft implementation timeline',
        'description': 'Create a detailed 90-day implementation plan with milestones and resource allocation.',
        'priority': 'high',
    },
    {
        'subject': 'Collect customer testimonials',
        'description': 'Reach out to 5 existing customers for video testimonials and written case studies.',
        'priority': 'low',
    },
    {
        'subject': 'Prepare quarterly report',
        'description': 'Compile pipeline metrics, conversion rates, and revenue forecasts for the board meeting.',
        'priority': 'urgent',
    },
    {
        'subject': 'Onboard new partner account',
        'description': 'Set up access credentials, schedule kickoff call, and send partner welcome package.',
        'priority': 'normal',
    },
    {
        'subject': 'Review pricing model',
        'description': 'Analyze current tier structure against market benchmarks. Propose adjustments for enterprise tier.',
        'priority': 'high',
    },
    {
        'subject': 'Follow up on trial expiration',
        'description': 'Contact 8 trial accounts expiring this week. Offer 20% discount for annual commitment.',
        'priority': 'urgent',
    },
    {
        'subject': 'Update sales playbook',
        'description': 'Add new objection handling scripts and competitive battle cards based on recent wins.',
        'priority': 'low',
    },
    {
        'subject': 'Coordinate product training session',
        'description': 'Organize a 2-hour training for the sales team on new analytics features launching next month.',
        'priority': 'normal',
    },
    {
        'subject': 'Prepare RFP response',
        'description': 'Draft comprehensive response to RetailMax RFP. Deadline is end of next week.',
        'priority': 'urgent',
    },
    {
        'subject': 'Clean up stale pipeline deals',
        'description': 'Review 12 deals with no activity in 30+ days. Update stages or archive as needed.',
        'priority': 'normal',
    },
    {
        'subject': 'Set up integration test environment',
        'description': 'Configure sandbox with Salesforce and HubSpot connectors for the EduTech demo.',
        'priority': 'high',
    },
    {
        'subject': 'Send post-meeting recap to stakeholders',
        'description': 'Summarize decisions from Thursday\'s strategy session and assign action items.',
        'priority': 'normal',
    },
    {
        'subject': 'Verify data migration checklist',
        'description': 'Cross-check 50-point migration checklist before the Manufacturing Pro go-live.',
        'priority': 'high',
    },
    {
        'subject': 'Create ROI calculator spreadsheet',
        'description': 'Build an interactive Excel template that prospects can use to estimate cost savings.',
        'priority': 'normal',
    },
    {
        'subject': 'Renew annual support contract',
        'description': 'MediaWorks contract expires in 15 days. Prepare renewal proposal with 10% uplift.',
        'priority': 'urgent',
    },
    {
        'subject': 'Audit user permissions',
        'description': 'Review team member access levels and remove ex-employee accounts from the workspace.',
        'priority': 'low',
    },
    {
        'subject': 'Plan customer appreciation event',
        'description': 'Book venue, finalize guest list, and send invitations for the Q3 client dinner.',
        'priority': 'normal',
    },
    {
        'subject': 'Benchmark API performance metrics',
        'description': 'Run load tests on the reporting API and document response times for the SLA review.',
        'priority': 'high',
    },
]


class Command(BaseCommand):
    help = 'Seed 25 tasks, 20 calls, and 20 meetings for testing the Activities module'

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
            help='Clear existing activities before seeding',
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['task', 'call', 'meeting', 'all'],
            default='all',
            help='Which activity type to seed (default: all)',
        )

    def handle(self, *args, **options):
        org_id = options['org_id'] or os.environ.get('ORG_ID')
        owner_id = options['owner_id'] or os.environ.get('OWNER_ID')

        if not org_id:
            raise CommandError(
                'Organization ID is required. Use --org-id or set ORG_ID env var.'
            )

        if not owner_id:
            raise CommandError(
                'Owner ID is required. Use --owner-id or set OWNER_ID env var.'
            )

        try:
            org_id = uuid.UUID(org_id)
            owner_id = uuid.UUID(owner_id)
        except ValueError as e:
            raise CommandError(f'Invalid UUID format: {e}')

        seed_type = options['type']

        # Clear existing activities if requested
        if options['clear']:
            if seed_type == 'all':
                deleted, _ = Activity.objects.filter(
                    org_id=org_id, activity_type__in=['task', 'call', 'meeting']
                ).delete()
                self.stdout.write(self.style.WARNING(f'Cleared {deleted} existing activities'))
            else:
                deleted, _ = Activity.objects.filter(
                    org_id=org_id, activity_type=seed_type
                ).delete()
                self.stdout.write(self.style.WARNING(f'Cleared {deleted} existing {seed_type}s'))

        # Get related entities (optional — works even if none exist)
        contacts = list(Contact.objects.filter(org_id=org_id)[:10])
        companies = list(Company.objects.filter(org_id=org_id)[:10])
        deals = list(Deal.objects.filter(org_id=org_id)[:10])
        leads = list(Lead.objects.filter(org_id=org_id)[:10])

        # Use owner_id as the assignee UUID (assigned_to is a raw UUIDField)
        assignee_ids = [owner_id]

        if seed_type in ('task', 'all'):
            count = self._seed_tasks(org_id, owner_id, contacts, companies, deals, leads, assignee_ids)
            self.stdout.write(self.style.SUCCESS(f'Created {count} tasks'))

        if seed_type in ('call', 'all'):
            count = self._seed_calls(org_id, owner_id, contacts, companies, deals, leads, assignee_ids)
            self.stdout.write(self.style.SUCCESS(f'Created {count} calls'))

        if seed_type in ('meeting', 'all'):
            count = self._seed_meetings(org_id, owner_id, contacts, companies, deals, leads, assignee_ids)
            self.stdout.write(self.style.SUCCESS(f'Created {count} meetings'))

        # Print summary
        self._print_summary(org_id, seed_type)

    def _get_related_entities(self, index, contacts, companies, deals, leads):
        """Pick related entities for a given index — shared across all activity types."""
        contact = contacts[index % len(contacts)] if contacts else None
        company = companies[index % len(companies)] if companies else None
        deal = deals[index % len(deals)] if deals and random.random() > 0.5 else None
        lead = None

        if not contacts and leads:
            lead = leads[index % len(leads)]
        elif leads and random.random() > 0.7:
            contact = None
            company = None
            lead = leads[index % len(leads)]

        return contact, company, deal, lead

    def _seed_tasks(self, org_id, owner_id, contacts, companies, deals, leads, assignee_ids):
        statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        status_weights = [0.35, 0.25, 0.30, 0.10]
        created = 0

        for i, data in enumerate(TASK_DATA):
            status = random.choices(statuses, weights=status_weights, k=1)[0]
            days_offset = random.randint(-14, 30)
            due_date = timezone.now() + timedelta(days=days_offset)

            completed_at = None
            if status == 'completed':
                completed_at = timezone.now() - timedelta(
                    days=random.randint(0, 7), hours=random.randint(0, 12),
                )

            contact, company, deal, lead = self._get_related_entities(
                i, contacts, companies, deals, leads
            )

            # ~70% of tasks have an assignee
            assigned_to = assignee_ids[i % len(assignee_ids)] if assignee_ids and random.random() > 0.3 else None

            # ~50% have a reminder (1-24 hours before due date)
            reminder_at = None
            if random.random() > 0.5:
                reminder_at = due_date - timedelta(hours=random.choice([1, 2, 4, 8, 24]))

            Activity.objects.create(
                org_id=org_id,
                owner_id=owner_id,
                activity_type='task',
                subject=data['subject'],
                description=data['description'],
                priority=data['priority'],
                status=status,
                due_date=due_date,
                completed_at=completed_at,
                contact=contact,
                company=company,
                deal=deal,
                lead=lead,
                assigned_to=assigned_to,
                reminder_at=reminder_at,
            )
            created += 1

        return created

    def _seed_calls(self, org_id, owner_id, contacts, companies, deals, leads, assignee_ids):
        statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        status_weights = [0.20, 0.10, 0.60, 0.10]  # most calls are completed
        created = 0

        for i, data in enumerate(CALL_DATA):
            status = random.choices(statuses, weights=status_weights, k=1)[0]

            # Calls are typically recent — within the past 2 weeks or upcoming
            days_offset = random.randint(-10, 7)
            due_date = timezone.now() + timedelta(days=days_offset)

            # Start/end times for completed calls
            start_time = None
            end_time = None
            completed_at = None
            if status == 'completed' and data.get('duration_minutes'):
                start_time = due_date.replace(
                    hour=random.randint(8, 17),
                    minute=random.choice([0, 15, 30, 45]),
                )
                end_time = start_time + timedelta(minutes=data['duration_minutes'])
                completed_at = end_time

            contact, company, deal, lead = self._get_related_entities(
                i, contacts, companies, deals, leads
            )

            # ~60% of calls have an assignee
            assigned_to = assignee_ids[i % len(assignee_ids)] if assignee_ids and random.random() > 0.4 else None

            # ~40% have a reminder (15min to 2 hours before)
            reminder_at = None
            if status == 'pending' and random.random() > 0.6:
                reminder_at = due_date - timedelta(minutes=random.choice([15, 30, 60, 120]))

            Activity.objects.create(
                org_id=org_id,
                owner_id=owner_id,
                activity_type='call',
                subject=data['subject'],
                description=data['description'],
                priority=data['priority'],
                status=status,
                due_date=due_date,
                start_time=start_time,
                end_time=end_time,
                duration_minutes=data.get('duration_minutes'),
                call_direction=data.get('call_direction'),
                call_outcome=data.get('call_outcome') if status == 'completed' else None,
                completed_at=completed_at,
                contact=contact,
                company=company,
                deal=deal,
                lead=lead,
                assigned_to=assigned_to,
                reminder_at=reminder_at,
            )
            created += 1

        return created

    def _seed_meetings(self, org_id, owner_id, contacts, companies, deals, leads, assignee_ids):
        statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        status_weights = [0.30, 0.10, 0.50, 0.10]
        created = 0

        for i, data in enumerate(MEETING_DATA):
            status = random.choices(statuses, weights=status_weights, k=1)[0]

            # Meetings spread across past and future weeks
            days_offset = random.randint(-14, 21)
            due_date = timezone.now() + timedelta(days=days_offset)

            # Start/end times
            start_time = due_date.replace(
                hour=random.randint(8, 16),
                minute=random.choice([0, 30]),
            )
            end_time = start_time + timedelta(minutes=data['duration_minutes'])

            completed_at = None
            if status == 'completed':
                completed_at = end_time

            contact, company, deal, lead = self._get_related_entities(
                i, contacts, companies, deals, leads
            )

            # ~80% of meetings have an assignee (organizer)
            assigned_to = assignee_ids[i % len(assignee_ids)] if assignee_ids and random.random() > 0.2 else None

            # ~60% have a reminder (15min to 24 hours before start)
            reminder_at = None
            if status in ('pending', 'in_progress') and random.random() > 0.4:
                reminder_at = start_time - timedelta(minutes=random.choice([15, 30, 60, 120, 1440]))

            Activity.objects.create(
                org_id=org_id,
                owner_id=owner_id,
                activity_type='meeting',
                subject=data['subject'],
                description=data['description'],
                priority=data['priority'],
                status=status,
                due_date=due_date,
                start_time=start_time,
                end_time=end_time,
                duration_minutes=data['duration_minutes'],
                completed_at=completed_at,
                contact=contact,
                company=company,
                deal=deal,
                lead=lead,
                assigned_to=assigned_to,
                reminder_at=reminder_at,
            )
            created += 1

        return created

    def _print_summary(self, org_id, seed_type):
        statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        priorities = ['urgent', 'high', 'normal', 'low']
        types_to_show = ['task', 'call', 'meeting'] if seed_type == 'all' else [seed_type]

        self.stdout.write('')
        for atype in types_to_show:
            qs = Activity.objects.filter(org_id=org_id, activity_type=atype)
            total = qs.count()
            by_status = {s: qs.filter(status=s).count() for s in statuses}
            by_priority = {p: qs.filter(priority=p).count() for p in priorities}
            self.stdout.write(f'  {atype.capitalize()}s — Total: {total}')
            self.stdout.write(f'    By status:   {by_status}')
            self.stdout.write(f'    By priority: {by_priority}')
