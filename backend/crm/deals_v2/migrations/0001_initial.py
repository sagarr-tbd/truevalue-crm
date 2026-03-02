import uuid
import django.core.validators
from decimal import Decimal
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='DealV2',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('org_id', models.UUIDField(db_index=True)),
                ('owner_id', models.UUIDField(db_index=True, help_text='User who created this deal')),
                ('assigned_to_id', models.UUIDField(blank=True, db_index=True, help_text='Currently assigned sales rep (UUID)', null=True)),
                ('contact_id', models.UUIDField(blank=True, db_index=True, help_text='Primary contact (UUID)', null=True)),
                ('company_id', models.UUIDField(blank=True, db_index=True, help_text='Associated company (UUID)', null=True)),
                ('status', models.CharField(choices=[('open', 'Open'), ('won', 'Won'), ('lost', 'Lost'), ('abandoned', 'Abandoned')], db_index=True, default='open', max_length=20)),
                ('stage', models.CharField(choices=[('prospecting', 'Prospecting'), ('qualification', 'Qualification'), ('proposal', 'Proposal'), ('negotiation', 'Negotiation'), ('closed_won', 'Closed Won'), ('closed_lost', 'Closed Lost')], db_index=True, default='prospecting', max_length=50)),
                ('value', models.DecimalField(db_index=True, decimal_places=2, default=Decimal('0'), max_digits=15, validators=[django.core.validators.MinValueValidator(Decimal('0'))])),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('probability', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('expected_close_date', models.DateField(blank=True, db_index=True, null=True)),
                ('actual_close_date', models.DateField(blank=True, null=True)),
                ('loss_reason', models.CharField(blank=True, max_length=100, null=True)),
                ('converted_from_lead_id', models.UUIDField(blank=True, null=True)),
                ('entity_data', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('deleted_by', models.UUIDField(blank=True, null=True)),
                ('created_by_id', models.UUIDField(blank=True, null=True)),
                ('updated_by_id', models.UUIDField(blank=True, null=True)),
                ('last_activity_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('stage_entered_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                'verbose_name': 'Deal V2 (Hybrid)',
                'verbose_name_plural': 'Deals V2 (Hybrid)',
                'db_table': 'crm_deals_v2',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['org_id', 'status', 'stage'], name='deals_v2_pipeline_idx'),
                    models.Index(fields=['org_id', 'created_at'], name='deals_v2_recent_idx'),
                    models.Index(fields=['org_id', 'status', 'created_at'], name='deals_v2_status_idx'),
                    models.Index(fields=['org_id', 'value'], name='deals_v2_value_idx'),
                    models.Index(fields=['org_id', 'expected_close_date'], name='deals_v2_close_idx'),
                    models.Index(fields=['org_id', 'owner_id'], name='deals_v2_owner_idx'),
                    models.Index(fields=['org_id', 'assigned_to_id'], name='deals_v2_assigned_idx'),
                    models.Index(fields=['org_id', 'contact_id'], name='deals_v2_contact_idx'),
                    models.Index(fields=['org_id', 'company_id'], name='deals_v2_company_idx'),
                    models.Index(fields=['org_id', 'deleted_at'], name='deals_v2_deleted_idx'),
                ],
            },
        ),
    ]
