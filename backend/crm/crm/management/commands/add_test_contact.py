"""
Add Test Contact Command

Creates a specific test contact for testing advanced filters.

Usage:
    python manage.py add_test_contact --org-id <uuid> --owner-id <uuid>
"""

import os
import uuid
from django.core.management.base import BaseCommand, CommandError
from crm.models import Contact


class Command(BaseCommand):
    help = 'Add test contact for filter testing'

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

    def handle(self, *args, **options):
        # Get org_id and owner_id
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
        
        # Test contacts to add
        test_contacts = [
            {
                'first_name': 'Michael',
                'last_name': 'Williams',
                'email': 'michael.williams14@example.com',
                'phone': '+1-555-999-1414',
                'mobile': '+1-555-888-1414',
                'title': 'Senior Developer',
                'status': 'active',
            },
            {
                'first_name': 'Emily',
                'last_name': 'Davis',
                'email': 'emily.davis@oldcompany.com',
                'phone': '',
                'title': 'Former Manager',
                'status': 'inactive',
            },
            {
                'first_name': 'John',
                'last_name': 'Smith',
                'email': 'bounced@invalid-domain.xyz',
                'phone': '+1-555-000-0000',
                'title': '',
                'status': 'bounced',
            },
            {
                'first_name': 'Mike',
                'last_name': 'Johnson',
                'email': 'mike.johnson@example.com',
                'phone': '+1-555-123-4567',
                'mobile': '+1-555-765-4321',
                'title': 'Product Manager',
                'status': 'active',
            },
        ]
        
        created_count = 0
        for contact_data in test_contacts:
            email = contact_data['email']
            
            # Check if already exists
            if Contact.objects.filter(org_id=org_id, email=email).exists():
                self.stdout.write(f'Contact already exists: {email}')
                continue
            
            # Create contact
            contact = Contact.objects.create(
                org_id=org_id,
                owner_id=owner_id,
                **contact_data
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'Created: {contact.first_name} {contact.last_name} ({email})')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal created: {created_count} contacts')
        )
