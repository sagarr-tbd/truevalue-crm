from rest_framework import serializers
from .models import TagV2, EntityTagV2


class TagV2Serializer(serializers.ModelSerializer):
    usage_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = TagV2
        fields = [
            'id', 'name', 'color', 'entity_type', 'description',
            'usage_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Tag name cannot be empty.")
        return value


class TagV2MinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagV2
        fields = ['id', 'name', 'color']


class EntityTagV2Serializer(serializers.ModelSerializer):
    tag = TagV2MinimalSerializer(read_only=True)

    class Meta:
        model = EntityTagV2
        fields = ['id', 'tag', 'entity_type', 'entity_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class AssignTagSerializer(serializers.Serializer):
    tag_id = serializers.UUIDField()
    entity_type = serializers.ChoiceField(choices=['contact', 'company', 'deal', 'lead'])
    entity_id = serializers.UUIDField()


class BulkAssignTagSerializer(serializers.Serializer):
    tag_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    entity_type = serializers.ChoiceField(choices=['contact', 'company', 'deal', 'lead'])
    entity_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)


class EntityTagsQuerySerializer(serializers.Serializer):
    entity_type = serializers.ChoiceField(choices=['contact', 'company', 'deal', 'lead'])
    entity_id = serializers.UUIDField()
