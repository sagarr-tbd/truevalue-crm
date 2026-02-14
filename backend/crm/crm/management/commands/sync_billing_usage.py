"""
Sync actual CRM entity counts to the Billing Service.

This command reads the real counts from the CRM database and sets them
as absolute usage values in the Billing Service. Run this:
- After initial billing integration setup
- After data imports/migrations
- Periodically as a reconciliation check

Usage:
    python manage.py sync_billing_usage
    python manage.py sync_billing_usage --org-id <uuid>
    python manage.py sync_billing_usage --dry-run
"""
import os
from uuid import UUID

from django.conf import settings
from django.core.management.base import BaseCommand

from crm.models import Contact, Company, Deal, Lead, Pipeline


# Feature code -> Model mapping
FEATURE_MODEL_MAP = {
    'contacts': Contact,
    'companies': Company,
    'deals': Deal,
    'leads': Lead,
    'pipelines': Pipeline,
}


class Command(BaseCommand):
    help = 'Sync CRM entity counts to the Billing Service'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            default=None,
            help='Sync for a specific org only (UUID)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show counts without syncing to billing',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        specific_org = options['org_id']

        # Get billing client
        client = self._get_billing_client()
        if not client and not dry_run:
            self.stderr.write(self.style.ERROR(
                'Cannot connect to Billing Service. '
                'Check BILLING_SERVICE_URL in settings.'
            ))
            return

        # Find all orgs that have CRM data
        if specific_org:
            org_ids = [UUID(specific_org)]
        else:
            org_ids = self._get_all_org_ids()

        if not org_ids:
            self.stdout.write('No organizations found with CRM data.')
            return

        self.stdout.write(f'Syncing usage for {len(org_ids)} organization(s)...')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be made'))

        total_synced = 0
        errors = 0

        for org_id in org_ids:
            self.stdout.write(f'\n  Org: {org_id}')

            for feature_code, model in FEATURE_MODEL_MAP.items():
                count = model.objects.filter(org_id=org_id).count()
                self.stdout.write(f'    {feature_code}: {count}')

                if not dry_run and client:
                    try:
                        client.sync_usage(
                            org_id=org_id,
                            service_code='crm',
                            feature_code=feature_code,
                            quantity=count,
                        )
                        total_synced += 1
                    except Exception as e:
                        self.stderr.write(
                            self.style.ERROR(f'    ERROR syncing {feature_code}: {e}')
                        )
                        errors += 1

        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run complete. No changes made.'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Synced {total_synced} feature counts. Errors: {errors}'
            ))

    def _get_billing_client(self):
        """Create a BillingClient instance."""
        try:
            from truevalue_common.clients import BillingClient

            billing_url = getattr(settings, 'BILLING_SERVICE_URL', None)
            if not billing_url:
                return None

            return BillingClient(
                base_url=billing_url,
                service_name=os.getenv('SERVICE_NAME', 'crm-service'),
                service_secret=os.getenv('SERVICE_SECRET', ''),
                timeout=10.0,
            )
        except Exception as e:
            self.stderr.write(f'Failed to create BillingClient: {e}')
            return None

    def _get_all_org_ids(self):
        """Get all unique org IDs that have CRM data."""
        org_ids = set()
        for model in FEATURE_MODEL_MAP.values():
            ids = model.objects.values_list('org_id', flat=True).distinct()
            org_ids.update(ids)
        return list(org_ids)
