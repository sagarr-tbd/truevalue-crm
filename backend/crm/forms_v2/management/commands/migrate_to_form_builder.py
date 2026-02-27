"""
Management command to migrate FormDefinition schemas from field_id references to inline field definitions.

This command transforms the schema structure to support Form Builder Architecture.

Usage:
    python manage.py migrate_to_form_builder
    python manage.py migrate_to_form_builder --org-id <uuid>
    python manage.py migrate_to_form_builder --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from forms_v2.models import FormDefinition, FieldDefinition
import uuid
import json


class Command(BaseCommand):
    help = 'Migrate FormDefinition schemas from field_id references to inline field definitions'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Specific organization ID to migrate (optional)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without saving',
        )
    
    def handle(self, *args, **options):
        org_id_str = options.get('org_id')
        dry_run = options.get('dry_run', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be saved'))
        
        # Get FormDefinitions to migrate
        queryset = FormDefinition.objects.filter(is_active=True)
        
        if org_id_str:
            org_id = uuid.UUID(org_id_str)
            queryset = queryset.filter(org_id=org_id)
            self.stdout.write(f"Migrating forms for organization: {org_id_str}")
        else:
            self.stdout.write(f"Migrating forms for all organizations")
        
        forms_to_migrate = list(queryset)
        
        if not forms_to_migrate:
            self.stdout.write(self.style.WARNING('No forms found to migrate'))
            return
        
        self.stdout.write(f"Found {len(forms_to_migrate)} forms to migrate\n")
        
        # Statistics
        migrated_count = 0
        skipped_count = 0
        error_count = 0
        
        for form in forms_to_migrate:
            try:
                result = self.migrate_form(form, dry_run)
                if result == 'migrated':
                    migrated_count += 1
                elif result == 'skipped':
                    skipped_count += 1
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Error migrating form {form.id}: {str(e)}")
                )
        
        # Summary
        self.stdout.write(f"\n{'=' * 60}")
        self.stdout.write(f"Migration {'Preview' if dry_run else 'Complete'}:")
        self.stdout.write(f"  ✓ Migrated: {migrated_count}")
        self.stdout.write(f"  → Skipped: {skipped_count} (already using inline definitions)")
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"  ✗ Errors: {error_count}"))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nRun without --dry-run to apply changes'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ Migration completed!'))
    
    def migrate_form(self, form, dry_run=False):
        """
        Migrate a single FormDefinition from field_id references to inline definitions.
        
        Returns: 'migrated', 'skipped', or raises exception
        """
        self.stdout.write(f"\n📋 Form: {form.name} ({form.entity_type} - {form.form_type})")
        self.stdout.write(f"   ID: {form.id}")
        
        schema = form.schema
        
        # Check if already migrated (has inline field definitions)
        if self.is_already_migrated(schema):
            self.stdout.write(self.style.SUCCESS("   ✓ Already using inline field definitions, skipping"))
            return 'skipped'
        
        # Extract all field_ids from schema
        field_ids = self.extract_field_ids(schema)
        
        if not field_ids:
            self.stdout.write(self.style.WARNING("   → No field_ids found in schema, skipping"))
            return 'skipped'
        
        self.stdout.write(f"   Found {len(field_ids)} field references")
        
        # Fetch FieldDefinitions
        field_definitions = FieldDefinition.objects.filter(
            id__in=field_ids,
            is_active=True
        )
        
        # Create lookup map
        field_map = {str(field.id): field for field in field_definitions}
        
        # Check if all field_ids were found
        missing_ids = field_ids - set(field_map.keys())
        if missing_ids:
            self.stdout.write(
                self.style.WARNING(f"   ⚠ Warning: {len(missing_ids)} field(s) not found: {missing_ids}")
            )
        
        # Transform schema
        new_schema = self.transform_schema(schema, field_map)
        
        if dry_run:
            self.stdout.write("   Preview of transformed schema:")
            self.stdout.write(f"   {json.dumps(new_schema, indent=2)[:500]}...")
            self.stdout.write(self.style.SUCCESS("   ✓ Would migrate this form"))
        else:
            # Save transformed schema
            with transaction.atomic():
                form.schema = new_schema
                form.save(update_fields=['schema', 'updated_at'])
            self.stdout.write(self.style.SUCCESS("   ✓ Migrated successfully"))
        
        return 'migrated'
    
    def is_already_migrated(self, schema):
        """Check if schema already uses inline field definitions."""
        sections = schema.get('sections', [])
        
        for section in sections:
            fields = section.get('fields', [])
            for field in fields:
                # If any field has 'field_id', it's using old schema
                if 'field_id' in field:
                    return False
                # If any field has 'name', 'label', 'field_type', it's using new schema
                if 'name' in field and 'label' in field and 'field_type' in field:
                    return True
        
        return False
    
    def extract_field_ids(self, schema):
        """Extract all field_id references from schema."""
        field_ids = set()
        
        sections = schema.get('sections', [])
        for section in sections:
            fields = section.get('fields', [])
            for field in fields:
                field_id = field.get('field_id')
                if field_id:
                    field_ids.add(str(field_id))
        
        return field_ids
    
    def transform_schema(self, schema, field_map):
        """
        Transform schema from field_id references to inline field definitions.
        
        OLD format:
        {
          "field_id": "uuid",
          "width": "half",
          "required": true
        }
        
        NEW format:
        {
          "name": "email",
          "label": "Email",
          "field_type": "email",
          "is_required": true,
          "placeholder": "you@example.com",
          "validation_rules": {},
          "options": {},
          "width": "half",
          "readonly": false
        }
        """
        new_schema = {
            'version': schema.get('version', '1.0.0'),
            'sections': []
        }
        
        # Copy validation and metadata if present
        if 'validation' in schema:
            new_schema['validation'] = schema['validation']
        if 'metadata' in schema:
            new_schema['metadata'] = schema['metadata']
        
        # Transform sections
        for section in schema.get('sections', []):
            new_section = {
                'id': section['id'],
                'title': section.get('title', ''),
                'fields': []
            }
            
            # Copy optional section properties
            if 'description' in section:
                new_section['description'] = section['description']
            if 'columns' in section:
                new_section['columns'] = section['columns']
            if 'collapsible' in section:
                new_section['collapsible'] = section['collapsible']
            
            # Transform fields
            for field_config in section.get('fields', []):
                field_id = field_config.get('field_id')
                
                if not field_id or str(field_id) not in field_map:
                    # Skip if field not found
                    continue
                
                field_def = field_map[str(field_id)]
                
                # Create inline field definition
                inline_field = {
                    'name': field_def.name,
                    'label': field_def.label,
                    'field_type': field_def.field_type,
                    'is_required': field_def.is_required,
                    'is_unique': field_def.is_unique,
                    'is_searchable': field_def.is_searchable,
                    'placeholder': field_def.placeholder or '',
                    'help_text': field_def.help_text or '',
                    'validation_rules': field_def.validation_rules or {},
                    'options': field_def.options or {},
                    'default_value': field_def.default_value,
                    'width': field_config.get('width', 'half'),
                    'readonly': field_config.get('readonly', False),
                }
                
                # Override is_required if layout specifies required
                if 'required' in field_config:
                    inline_field['is_required'] = field_config['required']
                
                # Copy conditional logic if present
                if 'conditional' in field_config:
                    inline_field['conditional'] = field_config['conditional']
                
                new_section['fields'].append(inline_field)
            
            new_schema['sections'].append(new_section)
        
        return new_schema
