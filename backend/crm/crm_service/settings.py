"""
Django settings for CRM Service.

Phase 1 MVP Features:
- Contact Management (Contacts, Companies, linking, tags, custom fields)
- Deal/Opportunity Management (Deals, Pipelines, Stages, Kanban)
- Activity Tracking (Tasks, Notes, Meetings, Calls, Emails)
- Lead Management (Leads, Sources, Status, Conversion)
- Basic Reporting (via API endpoints)

Designed for extensibility:
- Phase 2: Email sync, Workflows, Products/Quotes, Cases
- Phase 3: AI features, Mobile, Advanced customization
"""
import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file only if not running in Docker
if not os.getenv('DATABASE_URL'):
    load_dotenv(BASE_DIR / '.env')

# =============================================================================
# SECURITY
# =============================================================================
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# =============================================================================
# APPLICATION DEFINITION
# =============================================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_yasg',
    # Local
    'crm',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # TrueValue Platform Security Middleware
    'truevalue_common.gateway_auth.GatewayAuthMiddleware',
    'truevalue_common.gateway_auth.ServiceAuthMiddleware',
    'truevalue_common.middleware.RequestLoggingMiddleware',
    'crm.middleware.PermissionStalenessMiddleware',
]

ROOT_URLCONF = 'crm_service.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'crm_service.wsgi.application'

# =============================================================================
# DATABASE
# =============================================================================
database_url = os.getenv('DATABASE_URL')
if database_url:
    parsed = urlparse(database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': parsed.path[1:],
            'USER': parsed.username,
            'PASSWORD': parsed.password,
            'HOST': parsed.hostname,
            'PORT': parsed.port or 5433,
            'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'crm_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5433'),
            'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),
        }
    }

# =============================================================================
# PASSWORD VALIDATION
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =============================================================================
# STATIC FILES
# =============================================================================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =============================================================================
# DEFAULT PRIMARY KEY
# =============================================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# REST FRAMEWORK
# =============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'truevalue_common.gateway_auth.GatewayAuthentication',
        'crm.backends.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'crm.exceptions.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {
        'webform': '10/minute',
    },
}

# =============================================================================
# CORS
# =============================================================================
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()] if not DEBUG else []

# =============================================================================
# JWT SETTINGS
# =============================================================================
JWT_PUBLIC_KEY = os.getenv('JWT_PUBLIC_KEY', '')
JWT_ALGORITHM = 'RS256'

# =============================================================================
# SERVICE URLS
# =============================================================================
AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:8001')
ORG_SERVICE_URL = os.getenv('ORG_SERVICE_URL', 'http://localhost:8002')
PERMISSION_SERVICE_URL = os.getenv('PERMISSION_SERVICE_URL', 'http://localhost:8003')
BILLING_SERVICE_URL = os.getenv('BILLING_SERVICE_URL', 'http://localhost:8004')

# =============================================================================
# REDIS & CACHING
# =============================================================================
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/3')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'KEY_PREFIX': 'crm',
        'TIMEOUT': 300,
    }
}

# =============================================================================
# KAFKA
# =============================================================================
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')

# =============================================================================
# ELASTICSEARCH (for search - Phase 2+)
# =============================================================================
ELASTICSEARCH_URL = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')

# =============================================================================
# CRM SETTINGS
# =============================================================================
CRM_SETTINGS = {
    # Contact limits by plan (0 = unlimited)
    'CONTACT_LIMITS': {
        'free': 1000,
        'starter': 10000,
        'pro': 100000,
        'enterprise': 0,
    },
    # Pipeline limits by plan
    'PIPELINE_LIMITS': {
        'free': 5,
        'starter': 3,
        'pro': 10,
        'enterprise': 0,
    },
    # Custom field limits by plan
    'CUSTOM_FIELD_LIMITS': {
        'free': 5,
        'starter': 20,
        'pro': 50,
        'enterprise': 0,
    },
    # Default pipeline stages
    'DEFAULT_PIPELINE_STAGES': [
        {'name': 'Lead', 'probability': 10, 'order': 1},
        {'name': 'Qualified', 'probability': 25, 'order': 2},
        {'name': 'Proposal', 'probability': 50, 'order': 3},
        {'name': 'Negotiation', 'probability': 75, 'order': 4},
        {'name': 'Closed Won', 'probability': 100, 'order': 5, 'is_won': True},
        {'name': 'Closed Lost', 'probability': 0, 'order': 6, 'is_lost': True},
    ],
    # Activity types
    'ACTIVITY_TYPES': ['task', 'note', 'call', 'email', 'meeting'],
    # Lead sources
    'LEAD_SOURCES': [
        'website', 'referral', 'cold_call', 'trade_show',
        'social_media', 'advertisement', 'partner', 'other'
    ],
}

# =============================================================================
# LOGGING
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'crm': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# =============================================================================
# SECURITY: GATEWAY AUTHENTICATION
# =============================================================================
GATEWAY_TRUST_ENABLED = os.getenv("GATEWAY_TRUST_ENABLED", "true").lower() == "true"
GATEWAY_SECRET = os.getenv('GATEWAY_SECRET')
GATEWAY_ALLOWED_DRIFT = 30

GATEWAY_PUBLIC_PATHS = [
    '/health',
    '/health/',
    '/health/ready',
    '/health/ready/',
    '/health/live',
    '/health/live/',
]

GATEWAY_INTERNAL_PREFIXES = [
    '/internal/',
]

# =============================================================================
# SECURITY: SERVICE IDENTITY
# =============================================================================
SERVICE_NAME = os.getenv('SERVICE_NAME', 'crm-service')
SERVICE_SECRET = os.getenv('SERVICE_SECRET')
SERVICE_AUTH_TOKEN = os.getenv('SERVICE_AUTH_TOKEN', '')
SERVICE_AUTH_ALLOW_DEBUG = False
