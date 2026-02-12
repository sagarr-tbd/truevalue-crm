"""
CRM Service Layer.

Business logic for CRM operations.
"""
from .contact_service import ContactService
from .company_service import CompanyService
from .lead_service import LeadService
from .deal_service import DealService
from .pipeline_service import PipelineService
from .activity_service import ActivityService
from .tag_service import TagService

__all__ = [
    'ContactService',
    'CompanyService',
    'LeadService',
    'DealService',
    'PipelineService',
    'ActivityService',
    'TagService',
]
