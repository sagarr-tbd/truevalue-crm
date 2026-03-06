import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='CompanyV2',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('org_id', models.UUIDField(db_index=True)),
                ('owner_id', models.UUIDField(db_index=True, help_text='User who created this company')),
                ('assigned_to_id', models.UUIDField(blank=True, db_index=True, help_text='Currently assigned account manager (UUID)', null=True)),
                ('parent_company_id', models.UUIDField(blank=True, db_index=True, help_text='Parent company (UUID, self-referencing)', null=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('prospect', 'Prospect'), ('customer', 'Customer'), ('partner', 'Partner'), ('archived', 'Archived')], db_index=True, default='active', max_length=50)),
                ('industry', models.CharField(blank=True, db_index=True, help_text='Company industry for filtering', max_length=100, null=True)),
                ('size', models.CharField(blank=True, choices=[('1', '1'), ('2-10', '2-10'), ('11-50', '11-50'), ('51-200', '51-200'), ('201-500', '201-500'), ('501-1000', '501-1000'), ('1000+', '1000+')], db_index=True, help_text='Company size range', max_length=20, null=True)),
                ('entity_data', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('deleted_by', models.UUIDField(blank=True, null=True)),
                ('created_by_id', models.UUIDField(blank=True, null=True)),
                ('updated_by_id', models.UUIDField(blank=True, null=True)),
                ('last_activity_at', models.DateTimeField(blank=True, db_index=True, null=True)),
            ],
            options={
                'verbose_name': 'Company V2 (Hybrid)',
                'verbose_name_plural': 'Companies V2 (Hybrid)',
                'db_table': 'crm_companies_v2',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['org_id', 'assigned_to_id', 'status'], name='companies_v2_assigned_idx'),
                    models.Index(fields=['org_id', 'created_at'], name='companies_v2_recent_idx'),
                    models.Index(fields=['org_id', 'status', 'created_at'], name='companies_v2_status_idx'),
                    models.Index(fields=['org_id', 'industry'], name='companies_v2_industry_idx'),
                    models.Index(fields=['org_id', 'size'], name='companies_v2_size_idx'),
                    models.Index(fields=['org_id', 'owner_id'], name='companies_v2_owner_idx'),
                    models.Index(fields=['org_id', 'deleted_at'], name='companies_v2_deleted_idx'),
                    models.Index(fields=['org_id', 'parent_company_id'], name='companies_v2_parent_idx'),
                ],
            },
        ),
    ]
