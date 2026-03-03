"""
Drop the deprecated FieldDefinition model.

Field definitions are now stored inline in FormDefinition.schema.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('forms_v2', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(
            name='FieldDefinition',
        ),
    ]
