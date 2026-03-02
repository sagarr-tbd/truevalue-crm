from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('deals_v2', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dealv2',
            name='pipeline_id',
            field=models.UUIDField(
                blank=True, db_index=True,
                help_text='Pipeline this deal belongs to (UUID referencing V1 Pipeline)',
                null=True,
            ),
        ),
        migrations.AddIndex(
            model_name='dealv2',
            index=models.Index(
                fields=['org_id', 'pipeline_id'],
                name='deals_v2_pipeline_fk_idx',
            ),
        ),
    ]
