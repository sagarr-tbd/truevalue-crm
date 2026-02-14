"""
CRM Service API URL Configuration.

All endpoints are prefixed with /api/v1/ in the main urls.py
"""
from django.urls import path

from . import views

urlpatterns = [
    # ==========================================================================
    # CONTACTS
    # ==========================================================================
    path('contacts', views.ContactListView.as_view(), name='contact-list'),
    path('contacts/bulk-delete', views.ContactBulkDeleteView.as_view(), name='contact-bulk-delete'),
    path('contacts/bulk-update', views.ContactBulkUpdateView.as_view(), name='contact-bulk-update'),
    path('contacts/import', views.ContactImportView.as_view(), name='contact-import'),
    path('contacts/merge', views.ContactMergeView.as_view(), name='contact-merge'),
    path('contacts/<uuid:contact_id>', views.ContactDetailView.as_view(), name='contact-detail'),
    path('contacts/<uuid:contact_id>/timeline', views.ContactTimelineView.as_view(), name='contact-timeline'),
    path('contacts/<uuid:contact_id>/companies', views.ContactCompaniesView.as_view(), name='contact-companies'),
    path('contacts/<uuid:contact_id>/companies/<uuid:company_id>', views.ContactCompanyDetailView.as_view(), name='contact-company-detail'),
    
    # ==========================================================================
    # COMPANIES
    # ==========================================================================
    path('companies', views.CompanyListView.as_view(), name='company-list'),
    path('companies/<uuid:company_id>', views.CompanyDetailView.as_view(), name='company-detail'),
    path('companies/<uuid:company_id>/contacts', views.CompanyContactsView.as_view(), name='company-contacts'),
    path('companies/<uuid:company_id>/contacts/<uuid:contact_id>', views.CompanyContactDetailView.as_view(), name='company-contact-detail'),
    path('companies/<uuid:company_id>/stats', views.CompanyStatsView.as_view(), name='company-stats'),
    
    # ==========================================================================
    # LEADS
    # ==========================================================================
    path('leads', views.LeadListView.as_view(), name='lead-list'),
    path('leads/bulk-delete', views.LeadBulkDeleteView.as_view(), name='lead-bulk-delete'),
    path('leads/bulk-update', views.LeadBulkUpdateView.as_view(), name='lead-bulk-update'),
    path('leads/web-form', views.LeadWebFormView.as_view(), name='lead-web-form'),
    path('leads/sources', views.LeadSourcesView.as_view(), name='lead-sources'),
    path('leads/<uuid:lead_id>', views.LeadDetailView.as_view(), name='lead-detail'),
    path('leads/<uuid:lead_id>/convert', views.LeadConvertView.as_view(), name='lead-convert'),
    path('leads/<uuid:lead_id>/disqualify', views.LeadDisqualifyView.as_view(), name='lead-disqualify'),
    path('leads/<uuid:lead_id>/status', views.LeadStatusUpdateView.as_view(), name='lead-status-update'),
    
    # ==========================================================================
    # DEALS
    # ==========================================================================
    path('deals', views.DealListView.as_view(), name='deal-list'),
    path('deals/bulk-delete', views.DealBulkDeleteView.as_view(), name='deal-bulk-delete'),
    path('deals/forecast', views.DealForecastView.as_view(), name='deal-forecast'),
    path('deals/<uuid:deal_id>', views.DealDetailView.as_view(), name='deal-detail'),
    path('deals/<uuid:deal_id>/move-stage', views.DealMoveStageView.as_view(), name='deal-move-stage'),
    path('deals/<uuid:deal_id>/win', views.DealWinView.as_view(), name='deal-win'),
    path('deals/<uuid:deal_id>/lose', views.DealLoseView.as_view(), name='deal-lose'),
    path('deals/<uuid:deal_id>/reopen', views.DealReopenView.as_view(), name='deal-reopen'),
    
    # ==========================================================================
    # PIPELINES
    # ==========================================================================
    path('pipelines', views.PipelineListView.as_view(), name='pipeline-list'),
    path('pipelines/<uuid:pipeline_id>', views.PipelineDetailView.as_view(), name='pipeline-detail'),
    path('pipelines/<uuid:pipeline_id>/stats', views.PipelineStatsView.as_view(), name='pipeline-stats'),
    path('pipelines/<uuid:pipeline_id>/kanban', views.DealKanbanView.as_view(), name='pipeline-kanban'),
    path('pipelines/<uuid:pipeline_id>/stages', views.PipelineStageListView.as_view(), name='stage-list'),
    path('pipelines/<uuid:pipeline_id>/stages/reorder', views.PipelineStageReorderView.as_view(), name='stage-reorder'),
    path('pipelines/<uuid:pipeline_id>/stages/<uuid:stage_id>', views.PipelineStageDetailView.as_view(), name='stage-detail'),
    
    # ==========================================================================
    # ACTIVITIES
    # ==========================================================================
    path('activities', views.ActivityListView.as_view(), name='activity-list'),
    path('activities/upcoming', views.ActivityUpcomingView.as_view(), name='activity-upcoming'),
    path('activities/overdue', views.ActivityOverdueView.as_view(), name='activity-overdue'),
    path('activities/stats', views.ActivityStatsView.as_view(), name='activity-stats'),
    path('activities/trend', views.ActivityTrendView.as_view(), name='activity-trend'),
    path('activities/<uuid:activity_id>', views.ActivityDetailView.as_view(), name='activity-detail'),
    path('activities/<uuid:activity_id>/complete', views.ActivityCompleteView.as_view(), name='activity-complete'),
    
    # ==========================================================================
    # TAGS
    # ==========================================================================
    path('tags', views.TagListView.as_view(), name='tag-list'),
    path('tags/<uuid:tag_id>', views.TagDetailView.as_view(), name='tag-detail'),
    
    # ==========================================================================
    # CUSTOM FIELDS
    # ==========================================================================
    path('custom-fields', views.CustomFieldListView.as_view(), name='custom-field-list'),
    path('custom-fields/<uuid:field_id>', views.CustomFieldDetailView.as_view(), name='custom-field-detail'),
    
    # ==========================================================================
    # SEARCH & UTILITIES
    # ==========================================================================
    path('search', views.GlobalSearchView.as_view(), name='global-search'),
    path('duplicates/check', views.DuplicateCheckView.as_view(), name='duplicate-check'),
]
