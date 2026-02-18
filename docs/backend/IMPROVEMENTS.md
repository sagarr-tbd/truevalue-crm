# Backend Improvements Documentation

**Date:** February 2026  
**Version:** 1.0  

---

## Overview

This document outlines the backend performance, security, and architecture improvements made to the CRM service.

---

## Table of Contents

1. [N+1 Query Fixes](#1-n1-query-fixes)
2. [AdvancedFilterMixin](#2-advancedfiltermixin)
3. [Database Aggregations](#3-database-aggregations)
4. [Kanban Query Optimization](#4-kanban-query-optimization)
5. [Pipeline Caching](#5-pipeline-caching)
6. [Soft Delete Support](#6-soft-delete-support)
7. [Database Constraints](#7-database-constraints)
8. [Text Search Indexes](#8-text-search-indexes)
9. [Exception Handling](#9-exception-handling)
10. [Query Parameter Validation](#10-query-parameter-validation)

---

## 1. N+1 Query Fixes

### Problem
List endpoints were making separate database queries for each related object (company, tags, pipeline, stage, etc.), causing performance degradation.

### Solution
Added `get_optimized_queryset()` method to services with `select_related` and `prefetch_related`.

### Files Modified
- `services/contact_service.py`
- `services/lead_service.py`
- `services/deal_service.py`

### Example

```python
def get_optimized_queryset(self):
    return self.get_queryset().select_related(
        'pipeline',
        'stage',
        'contact',
        'company'
    ).prefetch_related('tags')
```

### Impact
- ~80% reduction in database queries on list endpoints
- Faster API response times

---

## 2. AdvancedFilterMixin

### Problem
Duplicate filter logic (~100 lines) copied across ContactService, LeadService, and DealService.

### Solution
Created reusable `AdvancedFilterMixin` in `base_service.py`.

### Files Modified
- `services/base_service.py` (new mixin)
- `services/contact_service.py`
- `services/lead_service.py`
- `services/deal_service.py`

### Usage

```python
class ContactService(AdvancedFilterMixin, BaseService[Contact]):
    FILTER_FIELD_MAP = {
        'name': ['first_name', 'last_name'],  # Compound field
        'email': 'email',
        'company': 'primary_company__name',
        # ...
    }
```

### Features
- Whitelist-based field mapping (prevents SQL injection)
- Support for compound fields (e.g., name → first_name OR last_name)
- UUID field validation
- Multiple operators: equals, contains, startsWith, isEmpty, greaterThan, etc.
- AND/OR logic support

---

## 3. Database Aggregations

### Problem
`get_pipeline_stats()` and `get_forecast()` were fetching all deals into Python and calculating sums/averages in loops.

### Solution
Replaced with single database aggregation queries using Django ORM.

### Files Modified
- `services/deal_service.py`

### Before (Inefficient)

```python
weighted_value = sum(d.weighted_value for d in open_deals)  # N+1 queries
```

### After (Optimized)

```python
stats = Deal.objects.filter(...).aggregate(
    weighted_value=Coalesce(
        Sum(
            Case(
                When(status='open', then=F('value') * F('probability') / 100),
                default=Decimal('0'),
                output_field=DecimalField()
            )
        ),
        Decimal('0')
    ),
)
```

### Impact
- Single database roundtrip instead of N+1
- Calculation done at database level (faster)

---

## 4. Kanban Query Optimization

### Problem
`get_kanban()` made separate query for each pipeline stage (N+1 problem).

### Solution
Single query fetches all deals, then groups by stage in Python.

### Files Modified
- `services/deal_service.py`

### Before

```python
for stage in stages:
    deals = Deal.objects.filter(stage=stage)  # N queries
```

### After

```python
# Single query for ALL deals
all_deals = Deal.objects.filter(pipeline=pipeline).select_related('contact', 'company', 'stage')

# Group in Python (O(n))
deals_by_stage = defaultdict(list)
for deal in all_deals:
    deals_by_stage[deal.stage_id].append(deal)
```

---

## 5. Pipeline Caching

### Problem
Pipeline and stage data rarely changes but is fetched frequently.

### Solution
Added Django cache with 5-minute TTL and proper invalidation.

### Files Modified
- `services/pipeline_service.py`

### Implementation

```python
PIPELINE_CACHE_TIMEOUT = 300  # 5 minutes

def list(self, ...):
    cache_key = f"pipelines:org:{self.org_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    result = list(self.get_queryset().prefetch_related('stages'))
    cache.set(cache_key, result, PIPELINE_CACHE_TIMEOUT)
    return result

def _invalidate_pipeline_cache(self, pipeline_id=None):
    cache.delete(self._get_pipeline_list_cache_key())
    # ... invalidate all variants
```

### Cache Invalidation
Automatically invalidated on:
- Pipeline create/update/delete
- Stage create/update/delete/reorder
- Set default pipeline

---

## 6. Soft Delete Support

### Problem
Hard deletes permanently remove data, making recovery impossible.

### Solution
Added soft delete with `deleted_at` timestamp for Contact, Lead, and Deal.

### Files Modified
- `models.py` (new `SoftDeleteModel`, `SoftDeleteManager`)
- `services/base_service.py` (updated `delete()`, added `restore()`)

### Model Hierarchy

```
BaseModel
├── SoftDeleteModel (deleted_at, deleted_by)
│   └── SoftDeleteOwnedModel
│       ├── Contact
│       ├── Lead
│       └── Deal
└── OrgScopedModel
    └── OwnedModel
        ├── Company
        ├── Activity
        └── ...
```

### Usage

```python
# Soft delete (default)
service.delete(entity_id)

# Hard delete (permanent)
service.delete(entity_id, hard=True)

# Restore soft-deleted record
service.restore(entity_id)

# Query deleted records
Contact.all_objects.filter(deleted_at__isnull=False)
```

### Manager Behavior

```python
Contact.objects.all()           # Excludes deleted
Contact.all_objects.all()       # Includes deleted
Contact.objects.deleted_only()  # Only deleted
```

---

## 7. Database Constraints

### Problem
Data integrity enforced only at application level, not database level.

### Solution
Added database-level constraints.

### Files Modified
- `models.py`

### Constraints Added

| Model | Constraint | Purpose |
|-------|-----------|---------|
| Pipeline | `unique_default_pipeline_per_org` | Only one default pipeline per org |
| PipelineStage | `unique_won_stage_per_pipeline` | Only one "won" stage per pipeline |
| PipelineStage | `unique_lost_stage_per_pipeline` | Only one "lost" stage per pipeline |
| PipelineStage | `stage_not_both_won_and_lost` | Stage can't be both won and lost |
| Deal | `deal_value_non_negative` | Deal value >= 0 |
| Deal | `deal_probability_valid_range` | Probability between 0-100 |

### Example

```python
class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=['org_id'],
            condition=models.Q(is_default=True),
            name='unique_default_pipeline_per_org'
        ),
    ]
```

---

## 8. Text Search Indexes

### Problem
Text search on names/emails uses `LIKE '%term%'` which can't use B-tree indexes.

### Solution
Added PostgreSQL GIN indexes with trigram support for fuzzy text search.

### Files Modified
- `models.py`

### Prerequisite

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Indexes Added

| Model | Index Name | Fields |
|-------|-----------|--------|
| Company | `company_name_search_idx` | name |
| Contact | `contact_name_search_idx` | first_name, last_name |
| Contact | `contact_email_search_idx` | email |
| Deal | `deal_name_search_idx` | name |
| Lead | `lead_name_search_idx` | first_name, last_name |
| Lead | `lead_email_search_idx` | email |
| Lead | `lead_company_search_idx` | company_name |

### Example

```python
from django.contrib.postgres.indexes import GinIndex

class Meta:
    indexes = [
        GinIndex(
            name='contact_name_search_idx',
            fields=['first_name', 'last_name'],
            opclasses=['gin_trgm_ops', 'gin_trgm_ops'],
        ),
    ]
```

---

## 9. Exception Handling

### Problem
- Generic `except Exception` blocks leaking internal error messages
- Inconsistent error response formats

### Solution
- Catch specific `CRMException` types and re-raise
- Log full traceback for unexpected errors
- Return generic message to client

### Files Modified
- `views.py`

### Before (Security Risk)

```python
except Exception as e:
    return Response({'message': str(e)})  # Leaks internal details
```

### After (Secure)

```python
except CRMException:
    raise  # Let custom_exception_handler format it
except Exception as e:
    logger.exception(f"Operation failed: {e}")
    return Response({
        'success': False,
        'message': 'Operation failed. Please try again.'
    }, status=500)
```

---

## 10. Query Parameter Validation

### Problem
Integer/UUID query parameters parsed without validation, causing crashes on invalid input.

### Solution
Added safe helper methods to `BaseAPIView`.

### Files Modified
- `views.py`

### Helpers Added

```python
def get_int_param(self, param_name, default=None, min_value=None, max_value=None) -> int:
    """Safely parse integer query parameter with bounds checking."""
    
def get_uuid_param(self, param_name) -> Optional[UUID]:
    """Safely parse UUID query parameter."""
```

### Usage

```python
# Before (unsafe)
page = int(request.query_params.get('page', 1))  # Crashes on "page=abc"

# After (safe)
page = self.get_int_param('page', default=1, min_value=1)
owner_id = self.get_uuid_param('owner_id')
```

---

## Migration

Migration `0002_contact_deleted_at_contact_deleted_by_and_more` includes:

- 6 new columns (deleted_at, deleted_by on Contact, Lead, Deal)
- 7 GIN indexes for text search
- 5 database constraints

### Apply Migration

```bash
# Enable pg_trgm extension first
docker exec crm-backend python manage.py shell -c \
  "from django.db import connection; cursor = connection.cursor(); cursor.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;')"

# Apply migration
docker exec crm-backend python manage.py migrate crm
```

---

## 11. Activity N+1 Query Fix

### Problem
`ActivityListSerializer` and `ActivitySerializer` nest `contact`, `company`, `deal`, and `lead` sub-serializers. Without `select_related`, every activity in a list triggers 4 extra DB queries (e.g., 25 activities = 100 extra queries).

### Solution
Added `get_optimized_queryset()` to `ActivityService` with `select_related` on all FK relations. Updated `list()`, `get_upcoming()`, `get_overdue()`, and `get_timeline()` to use it.

### Files Modified
- `services/activity_service.py`

### Implementation

```python
def get_optimized_queryset(self):
    return self.get_queryset().select_related(
        'contact', 'company', 'deal', 'lead'
    )
```

### Impact
- ~100 extra queries → 1 JOIN query per activity list

---

## 12. Contact List Count Annotations

### Problem
`ContactListSerializer` used `SerializerMethodField` for `deal_count` and `activity_count`, calling `obj.deals.count()` and `obj.activities.count()` per row. For 25 contacts, that's 50 extra queries.

### Solution
Replaced `SerializerMethodField` with DB-level `annotate(Count(...))` on the queryset, and changed serializer fields to `IntegerField(read_only=True, default=0)`.

### Files Modified
- `services/contact_service.py`
- `serializers.py`

### Service Change

```python
def get_optimized_queryset(self, annotate_counts=False):
    qs = self.get_queryset().select_related('primary_company').prefetch_related('tags', ...)
    if annotate_counts:
        qs = qs.annotate(
            deal_count=Count('deals', distinct=True),
            activity_count=Count('activities', distinct=True),
        )
    return qs
```

### Serializer Change

```python
# Before (N+1)
deal_count = serializers.SerializerMethodField()
def get_deal_count(self, obj) -> int:
    return obj.deals.count()

# After (annotation)
deal_count = serializers.IntegerField(read_only=True, default=0)
```

### Impact
- 50 extra queries → 0 (counts come from single annotated query)

---

## 13. Pipeline Stage Annotation

### Problem
`PipelineStageSerializer` used `SerializerMethodField` for `deal_count` and `deal_value`, querying the DB per stage. A pipeline with 6 stages = 12 extra queries. `PipelineSerializer` also had N+1 for `total_deals` and `total_value`.

### Solution
- Created `_get_annotated_stages_prefetch()` that returns a `Prefetch` object with annotated stages.
- Updated `get_stages()` to use annotated queryset directly.
- Changed `PipelineStageSerializer` to read from annotated fields.
- Updated `PipelineSerializer` to sum from prefetched annotated stages.

### Files Modified
- `services/pipeline_service.py`
- `serializers.py`

### Service Change

```python
@staticmethod
def _get_annotated_stages_prefetch():
    annotated_qs = PipelineStage.objects.annotate(
        deal_count=Count('deals', filter=Q(deals__status='open')),
        deal_value=Coalesce(
            Sum('deals__value', filter=Q(deals__status='open')),
            Decimal('0'),
        ),
    ).order_by('order')
    return Prefetch('stages', queryset=annotated_qs)
```

### Serializer Change

```python
# Before (N+1)
deal_count = serializers.SerializerMethodField()
deal_value = serializers.SerializerMethodField()

# After (annotation)
deal_count = serializers.IntegerField(read_only=True, default=0)
deal_value = serializers.DecimalField(read_only=True, default=Decimal('0'), ...)
```

### Impact
- ~12 extra queries → 1 annotated prefetch query per pipeline load

---

## 14. Activity Stats Aggregation + Cache

### Problem
`ActivityService.get_stats()` fired 12 separate `.count()` queries (status counts, type counts, time-based counts). Called on every dashboard load.

### Solution
Consolidated into a single `aggregate()` call with conditional `Count` filters. Added 60-second Redis cache.

### Files Modified
- `services/activity_service.py`

### Before (12 queries)

```python
return {
    'total': qs.count(),
    'pending': qs.filter(status='pending').count(),
    'in_progress': qs.filter(status='in_progress').count(),
    # ... 9 more .count() calls
}
```

### After (1 query + cache)

```python
cache_key = f"activity_stats:{self.org_id}:{user_id or 'all'}"
cached = cache.get(cache_key)
if cached is not None:
    return cached

stats_agg = qs.aggregate(
    total=Count('id'),
    pending=Count('id', filter=Q(status='pending')),
    in_progress=Count('id', filter=Q(status='in_progress')),
    completed=Count('id', filter=Q(status='completed')),
    overdue=Count('id', filter=Q(status__in=['pending', 'in_progress'], due_date__lt=now)),
    # ... all counts in single aggregate()
)

cache.set(cache_key, result, 60)
```

### Impact
- 12 DB queries → 1 aggregation query
- 60s cache eliminates repeated calls on dashboard refresh

---

## 15. Company Stats Aggregation

### Problem
`CompanyService.get_stats()` fired 7 separate queries (6 deal count/sum queries + 1 contact count).

### Solution
Consolidated deal queries into a single `aggregate()` call with conditional filters.

### Files Modified
- `services/company_service.py`

### Before (7 queries)

```python
deals = company.deals.all()
return {
    'deal_count': deals.count(),
    'open_deals': deals.filter(status='open').count(),
    'total_deal_value': deals.aggregate(Sum('value'))['value__sum'] or 0,
    # ... 4 more queries
}
```

### After (2 queries)

```python
contact_count = company.contact_associations.count()
deal_agg = company.deals.aggregate(
    deal_count=Count('id'),
    open_deals=Count('id', filter=Q(status='open')),
    won_deals=Count('id', filter=Q(status='won')),
    lost_deals=Count('id', filter=Q(status='lost')),
    total_deal_value=Sum('value'),
    won_deal_value=Sum('value', filter=Q(status='won')),
)
```

### Impact
- 7 queries → 2 queries per company stats view

---

## 16. Internal Views — Single SQL Stats

### Problem
`get_org_stats()` fired 5 separate queries (2 aggregates + 3 counts) to build dashboard stats for another service. `record_usage()` fired 5 separate ORM `.count()` calls.

### Solution
Both consolidated into single raw SQL with subselects — 1 DB roundtrip each.

### Files Modified
- `internal_views.py`

### Implementation

```python
def get_org_stats(request, org_id):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM crm_contact WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_company WHERE org_id = %s),
                (SELECT COUNT(*) FROM crm_activity WHERE org_id = %s),
                (SELECT COUNT(*) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL),
                -- ... deal status counts, sums, lead counts in same query
        """, [str(org_uuid)] * 14)
        r = cursor.fetchone()
```

### Impact
- `get_org_stats`: 5 queries → 1
- `record_usage`: 5 queries → 1

---

## 17. Activity Type Stats — Single Aggregate

### Problem
`ActivityService.get_type_stats()` used 3 queries: 1 `aggregate()` for totals + 2 `values().annotate()` for status/priority breakdowns.

### Solution
Consolidated into single `aggregate()` with conditional `Count` for each known status and priority value.

### Files Modified
- `services/activity_service.py`

### Before (3 queries)

```python
totals = qs.aggregate(total=Count('id'), overdue=Count(...))
by_status = qs.values('status').annotate(count=Count('id'))
by_priority = qs.values('priority').annotate(count=Count('id'))
```

### After (1 query)

```python
agg = qs.aggregate(
    total=Count('id'),
    overdue=Count('id', filter=Q(status__in=[...], due_date__lt=now)),
    s_pending=Count('id', filter=Q(status='pending')),
    s_in_progress=Count('id', filter=Q(status='in_progress')),
    s_completed=Count('id', filter=Q(status='completed')),
    s_cancelled=Count('id', filter=Q(status='cancelled')),
    p_low=Count('id', filter=Q(priority='low')),
    p_medium=Count('id', filter=Q(priority='medium')),
    p_high=Count('id', filter=Q(priority='high')),
    p_urgent=Count('id', filter=Q(priority='urgent')),
)
```

### Impact
- 3 queries → 1 aggregate query

---

## 18. Company Contacts Optimization

### Problem
`CompanyService.get_contacts()` returned contacts without `select_related` or `prefetch_related`. When serialized with `ContactListSerializer` (which needs `primary_company`, `tags`, `deal_count`, `activity_count`), each contact triggered 4+ extra queries.

### Solution
Single optimized query with `select_related('primary_company')`, `prefetch_related('tags')`, and `annotate(deal_count, activity_count)`.

### Files Modified
- `services/company_service.py`

### Before

```python
primary = list(company.primary_contacts.all()[:limit])
associated = Contact.objects.filter(id__in=associated_ids)
# No select_related, no prefetch, no annotations → N+1
```

### After

```python
Contact.objects.filter(id__in=all_ids, org_id=self.org_id)
    .select_related('primary_company')
    .prefetch_related('tags')
    .annotate(
        deal_count=Count('deals', distinct=True),
        activity_count=Count('activities', distinct=True),
    )
```

### Impact
- ~50 queries → 3 per company contacts view

---

## 19. Module-Level Imports

### Problem
`import json`, `from django.db.models import Sum, Count, Q`, `import httpx`, `from django.conf import settings` were imported inside view methods, causing per-request import overhead.

### Solution
Moved all imports to module level in `views.py`.

### Files Modified
- `views.py`

### Impact
- Eliminates per-request import lookups (minor but consistent)

---

## Summary

| Improvement | Type | Impact |
|-------------|------|--------|
| N+1 Query Fixes | Performance | ~80% fewer DB queries |
| AdvancedFilterMixin | Architecture | ~200 lines code reduction |
| Database Aggregations | Performance | Single query for stats |
| Kanban Optimization | Performance | 1 query vs N+1 |
| Pipeline Caching | Performance | 5min cache, fewer DB hits |
| Soft Delete | Data Safety | Recoverable deletions |
| DB Constraints | Data Integrity | Database-level validation |
| GIN Indexes | Performance | Fast fuzzy text search |
| Exception Handling | Security | No info leakage |
| Param Validation | Security/Stability | Safe input parsing |
| Activity select_related | Performance | ~100 queries → 1 |
| Contact Count Annotations | Performance | ~50 queries → 0 |
| Pipeline Stage Annotations | Performance | ~12 queries → 1 |
| Activity Stats Aggregation | Performance | 12 queries → 1 + 60s cache |
| Company Stats Aggregation | Performance | 7 queries → 2 |
| Internal Views Raw SQL | Performance | 10 queries → 2 |
| Activity Type Stats | Performance | 3 queries → 1 |
| Company Contacts Optimization | Performance | ~50 queries → 3 |
| Module-Level Imports | Code Quality | Cleaner, no per-request overhead |
