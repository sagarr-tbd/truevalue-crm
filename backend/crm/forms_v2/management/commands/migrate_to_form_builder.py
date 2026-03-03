"""
OBSOLETE: This migration command has already been run.

The FieldDefinition model has been dropped. All FormDefinition schemas
now use inline field definitions. This command is kept for history only.
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = '(Obsolete) Migrate FormDefinition schemas — already completed.'
    
    def add_arguments(self, parser):
        parser.add_argument('--org-id', type=str, help='(unused)')
        parser.add_argument('--dry-run', action='store_true', help='(unused)')
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING(
            'This command is obsolete. The FieldDefinition model has been '
            'dropped and all FormDefinition schemas now use inline field '
            'definitions. No action needed.'
        ))
