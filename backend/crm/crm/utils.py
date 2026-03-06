import hashlib
import hmac as hmac_mod
import logging
import time as time_mod
from typing import Optional

import httpx
from django.conf import settings as django_settings

logger = logging.getLogger(__name__)


def get_user_email_from_org_service(user_id: str, org_id: str) -> Optional[str]:
    try:
        org_service_url = getattr(django_settings, 'ORG_SERVICE_URL', 'http://org-service:8000')
        service_name = getattr(django_settings, 'SERVICE_NAME', 'crm-service')
        service_secret = getattr(django_settings, 'ORG_SERVICE_SECRET', '')
        path = f"/internal/orgs/{org_id}/members/{user_id}"
        ts = str(int(time_mod.time()))
        sig = hmac_mod.new(
            service_secret.encode(),
            f"{service_name}:{ts}:{path}".encode(),
            hashlib.sha256,
        ).hexdigest()
        
        resp = httpx.get(
            f"{org_service_url}{path}",
            headers={
                'X-Service-Name': service_name,
                'X-Service-Timestamp': ts,
                'X-Service-Signature': sig,
            },
            timeout=5.0,
        )
        
        if resp.status_code == 200:
            data = resp.json()
            return data.get('email')
        else:
            logger.warning(f"Failed to fetch user {user_id} from org service: {resp.status_code}")
            return None
            
    except Exception as e:
        logger.exception(f"Error fetching user email from org service: {e}")
        return None


def fetch_member_names(org_id: str) -> dict:
    """Resolve owner UUIDs to names for export."""
    try:
        org_service_url = getattr(django_settings, 'ORG_SERVICE_URL', 'http://org-service:8000')
        service_name = getattr(django_settings, 'SERVICE_NAME', 'crm-service')
        service_secret = getattr(django_settings, 'ORG_SERVICE_SECRET', '')
        path = f"/internal/orgs/{org_id}/members/names"
        ts = str(int(time_mod.time()))
        sig = hmac_mod.new(
            service_secret.encode(),
            f"{service_name}:{ts}:{path}".encode(),
            hashlib.sha256,
        ).hexdigest()
        resp = httpx.get(
            f"{org_service_url}{path}",
            headers={
                'X-Service-Name': service_name,
                'X-Service-Timestamp': ts,
                'X-Service-Signature': sig,
            },
            timeout=5.0,
        )
        if resp.status_code == 200:
            return resp.json().get('members', {})
        else:
            logger.warning(f"Failed to fetch member names: {resp.status_code}")
            return {}
    except Exception as e:
        logger.exception(f"Error fetching member names: {e}")
        return {}


def fetch_org_owner(org_id: str) -> Optional[str]:
    """Assign default owner for web form submissions."""
    try:
        org_service_url = getattr(django_settings, 'ORG_SERVICE_URL', 'http://org-service:8000')
        service_name = getattr(django_settings, 'SERVICE_NAME', 'crm-service')
        service_secret = getattr(django_settings, 'ORG_SERVICE_SECRET', '')
        path = f"/internal/orgs/{org_id}/owner"
        ts = str(int(time_mod.time()))
        sig = hmac_mod.new(
            service_secret.encode(),
            f"{service_name}:{ts}:{path}".encode(),
            hashlib.sha256,
        ).hexdigest()
        
        resp = httpx.get(
            f"{org_service_url}{path}",
            headers={
                'X-Service-Name': service_name,
                'X-Service-Timestamp': ts,
                'X-Service-Signature': sig,
            },
            timeout=5.0,
        )
        
        if resp.status_code == 200:
            data = resp.json()
            return data.get('user_id')
        else:
            logger.warning(f"Failed to fetch org owner: {resp.status_code}")
            return None
            
    except Exception as e:
        logger.exception(f"Error fetching org owner: {e}")
        return None
