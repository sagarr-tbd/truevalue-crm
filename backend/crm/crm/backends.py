"""
Authentication backends for CRM Service.
"""
import logging
from typing import Optional, Tuple, Any

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)


class JWTUser:
    """Simple user object for JWT-authenticated requests."""
    
    def __init__(self, user_id: str, email: str, org_id: str = None, org_slug: str = None, **kwargs):
        self.id = user_id
        self.user_id = user_id
        self.email = email
        self.org_id = org_id
        self.org_slug = org_slug
        self.is_authenticated = True
        self.is_active = True
        
        # Store additional claims
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def __str__(self):
        return f"JWTUser({self.email})"
    
    @property
    def pk(self):
        return self.user_id


class JWTAuthentication(authentication.BaseAuthentication):
    """
    JWT Authentication for direct API access.
    
    Used as fallback when gateway authentication is not available.
    In production, most requests come through the gateway which
    handles JWT validation and injects user context.
    """
    
    keyword = 'Bearer'
    
    def authenticate(self, request) -> Optional[Tuple[JWTUser, str]]:
        """Authenticate request using JWT token."""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header:
            return None
        
        parts = auth_header.split()
        
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            return None
        
        token = parts[1]
        
        try:
            # Decode JWT token
            payload = self._decode_token(token)
            
            # Extract user info
            user_id = payload.get('sub') or payload.get('user_id')
            email = payload.get('email', '')
            org_id = payload.get('org_id')
            org_slug = payload.get('org_slug')
            
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token: missing user_id')
            
            user = JWTUser(
                user_id=user_id,
                email=email,
                org_id=org_id,
                org_slug=org_slug,
                roles=payload.get('roles', []),
                permissions=payload.get('permissions', []),
                perm_version=payload.get('perm_version'),
            )
            
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            raise exceptions.AuthenticationFailed('Invalid token')
    
    def _decode_token(self, token: str) -> dict:
        """Decode and validate JWT token."""
        # Try HS256 first (symmetric key)
        try:
            return jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256'],
                options={'verify_aud': False}
            )
        except jwt.InvalidTokenError:
            pass
        
        # Try RS256 if public key is configured
        if settings.JWT_PUBLIC_KEY:
            return jwt.decode(
                token,
                settings.JWT_PUBLIC_KEY,
                algorithms=['RS256'],
                options={'verify_aud': False}
            )
        
        raise jwt.InvalidTokenError('Unable to decode token')
    
    def authenticate_header(self, request) -> str:
        """Return WWW-Authenticate header value."""
        return self.keyword
