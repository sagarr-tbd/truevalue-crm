# CRM V2 — Status Update

> Last updated: 2026-03-03

---

## V1 — Agenda & Purpose

V1 is the original monolithic CRM app (`crm/` app) built with a traditional fixed-schema approach.

- Full-featured CRM: Contacts, Companies (Accounts), Leads, Deals, Pipelines, Activities, Tags, Custom Fields
- Custom fields handled via `CustomFieldDefinition` + `CustomFieldValue` (EAV pattern)
- API: Hand-written class-based views under `/api/v1/`
- Includes: Export, Import, Merge, Bulk Ops, Lead Conversion, Web Forms, Deal Forecasting, Win/Loss Analysis, Pipeline Kanban, Activity Reminders (Celery), Global Search, Duplicate Detection, Timeline, Company Stats
- Service layer in `crm/services/`
- **Status: Complete**

---

## V2 — Agenda & Purpose

V2 is a ground-up rewrite split into separate Django apps (`leads_v2`, `contacts_v2`, `companies_v2`, `deals_v2`, `pipelines_v2`, `activities_v2`, `forms_v2`, `tags_v2`).

- Dynamic, form-builder-driven CRM — orgs customize fields per entity type via Form Layout Editor
- Hybrid storage: System/relationship fields as DB columns; custom fields in `entity_data` JSONB
- "Accounts" renamed to "Companies"
- API: DRF ViewSets with routers under `/api/v2/`
- Richer pipeline stages: win/loss flags, rotting days, colors, probability

---

## V2 — What's Complete

| Area | Status |
|------|--------|
| Contacts CRUD (hybrid model) | Done |
| Companies CRUD (hybrid model) | Done |
| Leads CRUD (hybrid model) | Done |
| Deals CRUD (hybrid model) | Done |
| Pipelines + Stages CRUD | Done |
| Activities CRUD (fixed-column) | Done |
| Form Builder / Layout Editor | Done |
| Lead Web Form (public, throttled) | Done |
| Bulk Delete / Update (all entities) | Done |
| Deal Stage History | Done |
| Export (CSV, all entities) | Done |
| Lead Convert + Disqualify | Done |
| Seed Commands (`seed_default_forms`) | Done |
| Tags V2 (polymorphic tagging) | Done |
| Global Search V2 (cross-entity) | Done |
| Contact–Company M2M associations | Done |
| Internal Service API V2 | Done |
| Pipeline Stage Reorder | Done |
| Pipeline Kanban View | Done |
| Pipeline Stats | Done |
| Contact Timeline | Done |
| Duplicate Detection (email + phone + name) | Done |
| Contact Import (bulk JSON) | Done |
| Contact Merge | Done |
| Deal Forecast | Done |
| Deal Win/Loss Analysis | Done |
| Activity Reminders V2 (Celery beat) | Done |
| Company Stats (detail) & Contact Listing | Done |
| Activity Trend | Done |
| Audit Logging V2 (mixin + query endpoint) | Done |

---

## Bugs Fixed

### Bug 1 — Internal Views: Wrong Table Names in Raw SQL — FIXED

**File:** `crm/internal_views.py` (lines 119–135, 179–186)

**What was wrong:** Raw SQL used singular table names (`crm_contact`, `crm_company`, etc.) but actual `db_table` values are plural (`crm_contacts`, `crm_companies`, etc.). Hard 500 on any call.

**Fix applied:** All 19 table references corrected to plural names in both `get_org_stats` and `record_usage`.

### Bug 2 — ContactV2 Serializer Queries V1 Company Model — FIXED

**File:** `contacts_v2/serializers.py`

**What was wrong:** `display_company` queried V1 `Company` model. Returns `None`/`N/A` when companies only exist in V2 tables.

**Fix applied:** Import changed to `CompanyV2`, queries updated to use `get_name()` (reads from `entity_data` JSONB).

### Bug 3 — All V2 Code Used V1 Models (7 workarounds) — FIXED

**Files:** `contacts_v2/views.py`, `leads_v2/views.py`, `forms_v2/.../seed_default_forms.py`

**What was wrong:** V2 export, web form, and lead conversion all created/queried V1 models instead of V2 models.

**Fix applied:** All 7 cross-version dependencies removed. V2 code now exclusively uses V2 models.

### Bug 4 — Pipeline add_stage used unimported `models.Max` — FIXED

**File:** `pipelines_v2/views.py`

**Fix applied:** Added `Max` to the import from `django.db.models`.

---

## P0 Features Built

### Tags V2 (`tags_v2/`)

New app: `/api/v2/tags/`

- **Models:** `TagV2` + `EntityTagV2` (polymorphic UUID-based)
- **Endpoints:** CRUD + `assign`, `unassign`, `bulk_assign`, `bulk_unassign`, `for_entity`, `for_entities`
- **Migration:** `0001_initial`

### Global Search V2

`GET /api/v2/search/?q=<query>&limit=5&types=contact,company`

### Contact–Company M2M

`ContactCompanyV2` model + endpoints on ContactV2ViewSet: `companies/`, `companies/<assoc_id>/`
- **Migration:** `0002_add_contact_company_m2m`

### Internal Service API V2

V1 preserved. New at `/internal/v2/`: contacts, companies, deals, stats, usage.

---

## P1 Features Built

### Pipeline Stage Reorder + Kanban + Stats

- `POST /api/v2/pipelines/<id>/reorder_stages/` — Already existed, fixed `Max` import bug
- `GET /api/v2/pipelines/<id>/kanban/` — Deals grouped by stage, batch-loaded contact/company names, days-in-stage
- `GET /api/v2/pipelines/<id>/stats/` — Already existed, deal counts + values per stage

### Contact Timeline

`GET /api/v2/contacts/<id>/timeline/?limit=50` — Activity history from ActivityV2

### Duplicate Detection (Enhanced)

`POST /api/v2/contacts/check_duplicate/` — Enhanced to support email + phone + name matching (was email-only)

### Contact Import

`POST /api/v2/contacts/import/` — Bulk import with configurable duplicate check, skip/update strategies, auto-sets `source=IMPORT`

### Contact Merge

`POST /api/v2/contacts/merge/` — `keep_primary` or `fill_empty` strategy, reassigns activities, deals, company associations, tags. Soft-deletes secondary.

### Deal Forecast

`GET /api/v2/deals/forecast/?days=30&pipeline_id=<uuid>` — Open deals with expected close, weighted values by probability

### Deal Win/Loss Analysis

`GET /api/v2/deals/analysis/?days=90&pipeline_id=<uuid>` — Summary (win rate, avg values, avg time to close), monthly trend, loss reason breakdown

---

## P2 Features Built

### Activity Reminders V2

- **File:** `activities_v2/tasks.py`
- **Celery Beat:** `activities_v2.tasks.send_activity_reminders_v2` — runs every 5 min alongside V1 task
- Queries `ActivityV2.all_objects` (bypasses soft-delete manager), batch-loads contact/company names from V2 models

### Company Stats & Contact Listing

- `GET /api/v2/companies/<id>/stats/` — contact count, deal counts (total/open/won/lost), deal values (total/won), activity count
- `GET /api/v2/companies/<id>/contacts/` — paginated contact list with search, uses `ContactV2ListSerializer`

### Activity Trend

`GET /api/v2/activities/trend/?days=30&activity_type=call` — daily counts, breakdown by type, total count

### Audit Logging V2

- **Mixin:** `AuditLogV2Mixin` in `crm_service/audit_v2.py` — auto-logs create/update/delete for all V2 ViewSets
- **Wired into:** ContactV2, CompanyV2, DealV2, LeadV2, ActivityV2 ViewSets
- **Query API:** `GET /api/v2/audit-log/?entity_type=contact_v2&entity_id=<uuid>&action=update&actor_id=<uuid>` — paginated, filters by entity/action/actor
- Reuses existing `CRMAuditLog` model with `entity_type` suffixed `_v2` (e.g. `contact_v2`, `deal_v2`)
- Tracks `entity_data` JSONB diffs + system field changes (status, stage, owner, etc.)

---

## P3 Features Built

### V1 → V2 Data Migration

Management command: `py manage.py migrate_v1_to_v2`

- **Options:** `--entity <name>`, `--org-id <uuid>`, `--batch-size 500`, `--dry-run`
- **Order:** pipelines → pipeline_stages → tags → companies → contacts → leads → deals → activities → entity_tags
- Idempotent — skips already-migrated IDs via `bulk_create(ignore_conflicts=True)`
- Maps V1 fixed columns to V2 `entity_data` JSONB + V2 system columns
- Merges V1 `custom_fields` into V2 `entity_data`
- Resolves Deal stage FK → stage name (CharField)
- Validates status/source values against V2 choices, falls back to defaults

### Reports & Analytics V2

| Endpoint | What it does |
|----------|-------------|
| `GET /api/v2/reports/dashboard/` | Org-wide overview: entity counts, deal pipeline summary, 30-day trends |
| `GET /api/v2/reports/pipeline/?pipeline_id=<uuid>&days=90` | Conversion funnel (win rate, avg deal value, avg days to close), stage distribution, monthly trend |
| `GET /api/v2/reports/team-activity/?days=30` | Activity metrics by owner (completion rate, overdue), by type |
| `GET /api/v2/reports/lead-conversion/?days=90` | Lead funnel: by status, by source with conversion rates, monthly trend |

### FieldDefinition Cleanup

- **Removed:** `FieldDefinition` model class from `forms_v2/models.py`
- **Migration:** `forms_v2/0002_remove_fielddefinition` — drops `crm_field_definitions` table
- **Obsoleted:** `migrate_to_form_builder` management command (exits with notice)
- **Fixed:** Stale docstrings in `leads_v2/views.py`

---

## Frontend V2 Integration — Complete

### API Layers Created

| File | What it covers |
|------|---------------|
| `lib/api/tagsV2.ts` | Tags CRUD, assign/unassign, bulk ops, `for_entity`, `for_entities`, options helper |
| `lib/api/reportsV2.ts` | Dashboard, Pipeline Report, Lead Conversion Report |
| `lib/api/searchV2.ts` | Global search (contacts, companies, deals, leads) |
| `lib/api/dealsV2.ts` (extended) | Added `dealsV2ExtApi.forecast()` + `analysis()` |
| `lib/api/activitiesV2.ts` (extended) | Added `trend()` endpoint |
| `lib/api/contactsV2.ts` (extended) | Added `contactsV2ExtApi.merge()`, `importContacts()`, `timeline()` |

### React Query Hooks Created

| File | Hooks |
|------|-------|
| `lib/queries/useTagsV2.ts` | `useTagsV2`, `useTagV2Options`, `useEntityTagsV2`, `useCreateTagV2`, `useUpdateTagV2`, `useDeleteTagV2`, `useAssignTagV2`, `useUnassignTagV2` |
| `lib/queries/useReportsV2.ts` | `useDashboardV2`, `usePipelineReportV2`, `useLeadConversionReportV2` |
| `lib/queries/useSearchV2.ts` | `useSearchV2`, `flattenSearchResults` |
| `lib/queries/useDealsV2.ts` (extended) | Added `useDealV2Forecast`, `useDealV2Analysis` |
| `lib/queries/useActivitiesV2.ts` (extended) | Added `useActivityV2Trend` |
| `lib/queries/usePipelinesV2.ts` (extended) | Added `useDefaultPipelineV2` |
| `lib/queries/useContactsV2.ts` (extended) | Added `useMergeContactsV2`, `useContactV2Timeline` |

### Pages Switched to V2

| Page | Previous State | Current State |
|------|---------------|---------------|
| `/dashboard` | 5 V1 hooks (contacts, leads, deals, pipelines, activities) | All V2: `useDashboardV2`, `useDealV2Forecast/Analysis`, `useActivityV2Trend`, `useActivitiesV2`, `useDefaultPipelineV2`, `usePipelineV2Stats`, `useLeadConversionReportV2` |
| `/analytics` | 5 V1 hooks | All V2: same pattern as dashboard + `useActivitiesV2Stats` |
| App Layout (search bar) | Non-functional placeholder | Live V2 global search with debounced input and results dropdown |

### Navigation Links Updated

- Dashboard quick actions now point to `/sales-v2/*` and `/activities-v2/*`
- Activity type links use `/activities-v2/*` paths

---

## Frontend V2 — UI/UX Consistency Fixes

### Page Titles & Labels

- Removed "(V2)" and "V2 Dynamic Forms" suffix from all V2 page titles (Sales + Activities)
- Removed "(V2)" from Form Layout Editor title
- Settings: "Sales Pipelines V2" label kept intentionally to distinguish from V1 tab
- Pipeline settings component: "V2" labels kept for same reason

### Sales V2 List Pages

- Export filenames: removed "-v2" suffix (`leads-v2` → `leads`, etc.) across all list pages
- Deals subtitle: restored "in pipeline" suffix to match V1 (`X deals` → `X deals in pipeline`)
- Companies: added "View Website" to row action menu (via shared `getCompanyActionMenuItems` utility)

### Activities V2 List Pages

- Column headers: changed generic "Subject" to entity-specific labels (Task, Meeting, Call, Email, Note)
- Button labels: "Add Call" → "Log Call", "Add Email" → "Log Email", "Add Note" → "New Note"
- Calls: added Duration column, removed extra Created column, fixed Date label, reordered Status before Outcome
- Notes: added Priority column with color-coded badges
- Emails: added Date column, fixed stats cards, added "Mark Complete" row action
- Meetings: page icon Calendar → Users, added Clock icon to Duration column, fixed grid card date label
- All pages: export filenames and bulk download filenames cleaned (removed "-v2" suffix)

### Activities V2 Detail Pages

- Meetings: overview cards reordered (Priority, Date, Status, Duration), section icon → Users, added Timestamps section
- Calls: overview cards reordered (Direction, Date, Status, Duration), section title → "Schedule & Duration"
- Notes: added Priority badge in header, expanded to 4 overview cards (Status, Priority, Created, Assigned To)

### Sales V2 Detail Pages

- Contacts: header action reordering, deals tab icon/label changes
- Companies: overview cards replaced with V1's four-card pattern, removed quick actions, contact linking via modal, tab reordering
- Deals: overview cards replaced with V1's four-card pattern, won/lost banners, company link icon
- Leads: converted/disqualified banner styling, header button styling, quick stats changes

### Bug Fixes

- V1 deals detail: fixed broken route `/sales/companies/` → `/sales/accounts/` (2 occurrences)
- Landing page: updated links from V1 routes to V2 (`/sales-v2/*`, `/activities-v2/*`)
- `BulkUpdateModal`: replaced `next/dynamic()` with standard import across all 9 V2 list pages — `dynamic()` erases generic type parameters, causing TS2558 errors
- Fixed `formatCurrency` type errors in companies detail (explicit `Number()` cast)

### Navigation

- Sidebar: both V1 ("Sales", "Activities") and V2 ("Sales V2", "Activities V2") sections visible during transition
- Dashboard, analytics, landing page, and global search all point to V2 routes
- V1 sections remain accessible for comparison

---

## V2 — Remaining Work

### Backend

No remaining backend features from the original P0–P3 list. All items complete.

### Frontend

| Item | Priority | Status |
|------|----------|--------|
| Sidebar: both V1 and V2 sections visible (labeled "Sales"/"Sales V2", "Activities"/"Activities V2") | — | Done |
| Remove or redirect V1 pages (`/sales/*`, `/activities/*`) to V2 equivalents | Medium | Pending — blocked until V2 sign-off |
| V2 pages (`/sales-v2/*`, `/activities-v2/*`) fully functional and UI-consistent with V1 | — | Done |
| All V2 page titles, labels, columns, buttons aligned with V1 conventions | — | Done |
| BulkUpdateModal generic types working correctly (standard import) | — | Done |

---

## Architecture Summary

| Aspect | V1 | V2 |
|--------|----|----|
| App structure | Single `crm/` app | 8 separate apps |
| Data model | Fixed columns | Hybrid (columns + JSONB) |
| Custom fields | EAV (`CustomFieldDefinition` + `CustomFieldValue`) | `entity_data` JSONB + `FormDefinition` schema |
| API style | Class-based views | DRF ViewSets + Routers |
| URL prefix | `/api/v1/` | `/api/v2/` |
| Form customization | None | Form Layout Editor |
| Pipeline stages | Basic | Win/loss flags, rotting days, colors, probability |
| Tagging | `Tag` + `EntityTag` (FKs to entities) | `TagV2` + `EntityTagV2` (UUID references, decoupled) |
| Contact–Company | `ContactCompany` M2M (FKs) | `ContactCompanyV2` M2M (UUID reference to company) |
| Internal API | `/internal/` (V1 tables) | `/internal/v2/` (V2 tables) |
| Search | `/api/v1/search` | `/api/v2/search/` |
| "Accounts" | "Accounts" | Renamed to "Companies" |
