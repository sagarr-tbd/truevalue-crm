"""
Kafka event publishing for CRM Service.

Publishes events to Kafka for:
- Audit logging
- Analytics
- Real-time notifications
- Workflow triggers (Phase 2)
"""
import json
import logging
from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from django.conf import settings

logger = logging.getLogger(__name__)

# Kafka producer (lazy-loaded)
_producer = None


def get_producer():
    """Get or create Kafka producer."""
    global _producer
    
    if _producer is None:
        try:
            from confluent_kafka import Producer
            
            _producer = Producer({
                'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
                'client.id': 'crm-service',
            })
            logger.info("Kafka producer initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Kafka producer: {e}")
            return None
    
    return _producer


def publish_event(
    topic: str,
    event_type: str,
    data: Dict[str, Any],
    org_id: UUID = None,
    user_id: UUID = None,
    entity_type: str = None,
    entity_id: UUID = None,
):
    """
    Publish an event to Kafka.
    
    Args:
        topic: Kafka topic name
        event_type: Type of event (e.g., 'contact.created')
        data: Event payload
        org_id: Organization ID
        user_id: User who triggered the event
        entity_type: Type of entity (contact, company, deal, etc.)
        entity_id: ID of the entity
    """
    producer = get_producer()
    if producer is None:
        logger.debug(f"Skipping event publish (no producer): {event_type}")
        return
    
    event = {
        'event_type': event_type,
        'source_service': 'crm-service',
        'timestamp': datetime.utcnow().isoformat(),
        'data': data,
    }
    
    if org_id:
        event['org_id'] = str(org_id)
    if user_id:
        event['user_id'] = str(user_id)
    if entity_type:
        event['entity_type'] = entity_type
    if entity_id:
        event['entity_id'] = str(entity_id)
    
    try:
        producer.produce(
            topic,
            key=str(org_id) if org_id else None,
            value=json.dumps(event).encode('utf-8'),
            callback=_delivery_callback,
        )
        producer.poll(0)  # Trigger delivery callbacks
    except Exception as e:
        logger.error(f"Failed to publish event {event_type}: {e}")


def _delivery_callback(err, msg):
    """Kafka delivery callback."""
    if err:
        logger.error(f"Message delivery failed: {err}")
    else:
        logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")


# =============================================================================
# CRM EVENT PUBLISHERS
# =============================================================================

def publish_contact_event(
    action: str,
    contact_id: UUID,
    org_id: UUID,
    user_id: UUID,
    data: Dict[str, Any] = None,
):
    """Publish contact-related event."""
    publish_event(
        topic='crm.contacts',
        event_type=f'contact.{action}',
        data=data or {},
        org_id=org_id,
        user_id=user_id,
        entity_type='contact',
        entity_id=contact_id,
    )


def publish_company_event(
    action: str,
    company_id: UUID,
    org_id: UUID,
    user_id: UUID,
    data: Dict[str, Any] = None,
):
    """Publish company-related event."""
    publish_event(
        topic='crm.companies',
        event_type=f'company.{action}',
        data=data or {},
        org_id=org_id,
        user_id=user_id,
        entity_type='company',
        entity_id=company_id,
    )


def publish_lead_event(
    action: str,
    lead_id: UUID,
    org_id: UUID,
    user_id: UUID,
    data: Dict[str, Any] = None,
):
    """Publish lead-related event."""
    publish_event(
        topic='crm.leads',
        event_type=f'lead.{action}',
        data=data or {},
        org_id=org_id,
        user_id=user_id,
        entity_type='lead',
        entity_id=lead_id,
    )


def publish_deal_event(
    action: str,
    deal_id: UUID,
    org_id: UUID,
    user_id: UUID,
    data: Dict[str, Any] = None,
):
    """Publish deal-related event."""
    publish_event(
        topic='crm.deals',
        event_type=f'deal.{action}',
        data=data or {},
        org_id=org_id,
        user_id=user_id,
        entity_type='deal',
        entity_id=deal_id,
    )


def publish_activity_event(
    action: str,
    activity_id: UUID,
    org_id: UUID,
    user_id: UUID,
    data: Dict[str, Any] = None,
):
    """Publish activity-related event."""
    publish_event(
        topic='crm.activities',
        event_type=f'activity.{action}',
        data=data or {},
        org_id=org_id,
        user_id=user_id,
        entity_type='activity',
        entity_id=activity_id,
    )


def publish_audit_event(
    action: str,
    entity_type: str,
    entity_id: UUID,
    org_id: UUID,
    user_id: UUID,
    changes: Dict[str, Any] = None,
):
    """Publish audit event to central audit log service."""
    publish_event(
        topic='audit.events',
        event_type=f'{entity_type}.{action}',
        data={
            'changes': changes or {},
            'entity_name': f'{entity_type}:{entity_id}',
        },
        org_id=org_id,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


def flush_events():
    """Flush pending events to Kafka."""
    producer = get_producer()
    if producer:
        producer.flush(timeout=5)
