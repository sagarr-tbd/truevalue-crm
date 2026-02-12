"""
Health check views for CRM Service.
"""
from django.http import JsonResponse
from django.db import connection


def health_check(request):
    """Basic health check."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'crm-service',
        'version': '1.0.0',
    })


def liveness_check(request):
    """Kubernetes liveness probe."""
    return JsonResponse({'status': 'alive'})


def readiness_check(request):
    """Kubernetes readiness probe - checks database connection."""
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'
        return JsonResponse({
            'status': 'not_ready',
            'database': db_status,
        }, status=503)
    
    return JsonResponse({
        'status': 'ready',
        'database': db_status,
    })
