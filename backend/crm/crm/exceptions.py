"""
Custom exceptions for CRM Service.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


class CRMException(Exception):
    """Base exception for CRM service."""
    
    def __init__(self, message: str, code: str = 'CRM_ERROR', status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class EntityNotFoundError(CRMException):
    """Entity not found."""
    
    def __init__(self, entity_type: str, entity_id: str):
        super().__init__(
            message=f"{entity_type} with id {entity_id} not found",
            code='ENTITY_NOT_FOUND',
            status_code=404
        )


class DuplicateEntityError(CRMException):
    """Duplicate entity detected."""
    
    def __init__(self, entity_type: str, field: str, value: str):
        super().__init__(
            message=f"{entity_type} with {field}={value} already exists",
            code='DUPLICATE_ENTITY',
            status_code=409
        )


class LimitExceededError(CRMException):
    """Plan limit exceeded."""
    
    def __init__(self, resource: str, limit: int, current: int):
        super().__init__(
            message=f"{resource} limit exceeded. Current: {current}, Limit: {limit}. Please upgrade your plan.",
            code='LIMIT_EXCEEDED',
            status_code=403
        )


class InvalidOperationError(CRMException):
    """Invalid operation."""
    
    def __init__(self, message: str):
        super().__init__(
            message=message,
            code='INVALID_OPERATION',
            status_code=400
        )


class PermissionDeniedError(CRMException):
    """Permission denied."""
    
    def __init__(self, action: str, resource: str):
        super().__init__(
            message=f"Permission denied: cannot {action} {resource}",
            code='PERMISSION_DENIED',
            status_code=403
        )


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    
    Converts exceptions to consistent error response format.
    """
    # Call DRF's default exception handler first
    response = exception_handler(exc, context)
    
    # If DRF handled it, format the response
    if response is not None:
        error_code = 'VALIDATION_ERROR'
        if response.status_code == 401:
            error_code = 'AUTHENTICATION_FAILED'
        elif response.status_code == 403:
            error_code = 'PERMISSION_DENIED'
        elif response.status_code == 404:
            error_code = 'NOT_FOUND'
        elif response.status_code == 405:
            error_code = 'METHOD_NOT_ALLOWED'
        elif response.status_code == 429:
            error_code = 'RATE_LIMIT_EXCEEDED'
        
        response.data = {
            'error': {
                'code': error_code,
                'message': _extract_error_message(response.data),
                'details': response.data if isinstance(response.data, dict) else None,
            }
        }
        return response
    
    # Handle CRM exceptions
    if isinstance(exc, CRMException):
        return Response(
            {
                'error': {
                    'code': exc.code,
                    'message': exc.message,
                }
            },
            status=exc.status_code
        )
    
    # Handle Django validation errors
    if isinstance(exc, DjangoValidationError):
        return Response(
            {
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': str(exc.message) if hasattr(exc, 'message') else str(exc),
                    'details': exc.message_dict if hasattr(exc, 'message_dict') else None,
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle 404
    if isinstance(exc, Http404):
        return Response(
            {
                'error': {
                    'code': 'NOT_FOUND',
                    'message': str(exc) or 'Resource not found',
                }
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Log unhandled exceptions
    logger.exception(f"Unhandled exception: {exc}")
    
    # Return generic error for unhandled exceptions
    return Response(
        {
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An internal error occurred',
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def _extract_error_message(data) -> str:
    """Extract a readable error message from DRF error data."""
    if isinstance(data, str):
        return data
    
    if isinstance(data, list):
        return data[0] if data else 'Validation error'
    
    if isinstance(data, dict):
        # Check for 'detail' key (DRF standard)
        if 'detail' in data:
            return str(data['detail'])
        
        # Get first field error
        for field, errors in data.items():
            if isinstance(errors, list) and errors:
                return f"{field}: {errors[0]}"
            elif isinstance(errors, str):
                return f"{field}: {errors}"
        
        return 'Validation error'
    
    return str(data)
