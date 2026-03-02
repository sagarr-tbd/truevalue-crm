import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ContactV2',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('org_id', models.UUIDField(db_index=True)),
                ('owner_id', models.UUIDField(db_index=True, help_text='User who created this contact')),
                ('assigned_to_id', models.UUIDField(blank=True, db_index=True, help_text='Currently assigned sales rep (UUID)', null=True)),
                ('company_id', models.UUIDField(blank=True, db_index=True, help_text='Primary company (UUID)', null=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('bounced', 'Bounced'), ('unsubscribed', 'Unsubscribed'), ('archived', 'Archived')], db_index=True, default='active', max_length=50)),
                ('source', models.CharField(blank=True, choices=[('website', 'Website'), ('referral', 'Referral'), ('cold_call', 'Cold Call'), ('trade_show', 'Trade Show'), ('social_media', 'Social Media'), ('advertisement', 'Advertisement'), ('partner', 'Partner'), ('webinar', 'Webinar'), ('email_campaign', 'Email Campaign'), ('lead_conversion', 'Lead Conversion'), ('import', 'Data Import'), ('other', 'Other')], db_index=True, help_text='How the contact was acquired', max_length=50, null=True)),
                ('entity_data', models.JSONField(blank=True, default=dict)),
                ('converted_from_lead_id', models.UUIDField(blank=True, null=True)),
                ('converted_at', models.DateTimeField(blank=True, null=True)),
                ('do_not_call', models.BooleanField(default=False)),
                ('do_not_email', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('deleted_by', models.UUIDField(blank=True, null=True)),
                ('created_by_id', models.UUIDField(blank=True, null=True)),
                ('updated_by_id', models.UUIDField(blank=True, null=True)),
                ('last_activity_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('last_contacted_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Contact V2 (Hybrid)',
                'verbose_name_plural': 'Contacts V2 (Hybrid)',
                'db_table': 'crm_contacts_v2',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['org_id', 'assigned_to_id', 'status'], name='contacts_v2_assigned_idx'),
                    models.Index(fields=['org_id', 'created_at'], name='contacts_v2_recent_idx'),
                    models.Index(fields=['org_id', 'status', 'created_at'], name='contacts_v2_status_idx'),
                    models.Index(fields=['org_id', 'source'], name='contacts_v2_source_idx'),
                    models.Index(fields=['org_id', 'company_id'], name='contacts_v2_company_idx'),
                    models.Index(fields=['org_id', 'owner_id'], name='contacts_v2_owner_idx'),
                    models.Index(fields=['org_id', 'deleted_at'], name='contacts_v2_deleted_idx'),
                ],
            },
        ),
    ]
