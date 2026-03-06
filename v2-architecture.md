---
description: V2 system architecture — Forms, Leads, Contacts, Companies, Deals
alwaysApply: true
---

# V2 System Architecture

## Forms V2 (`forms_v2` app)

### Core Model: `FormDefinition`
- Table: `crm_form_definitions`
- Fields: `id` (UUID), `org_id`, `entity_type`, `name`, `description`, `is_default`, `form_type`, `schema` (JSONField), `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`
- Unique constraint: `(org_id, entity_type, name)`
- Entity types: `lead`, `contact`, `company`, `deal`
- Form types: `create`, `edit`, `quick_add`, `web_form`, `detail_view`
- `FieldDefinition` model is DEPRECATED — all field definitions are inline in `schema`

### Schema Structure
```json
{
  "version": "1.0.0",
  "sections": [{
    "id": "section_id",
    "title": "Section Title",
    "columns": 2,
    "fields": [{
      "name": "field_name",
      "label": "Display Label",
      "field_type": "text|email|phone|select|currency|lookup|...",
      "is_required": true,
      "is_searchable": true,
      "validation_rules": {},
      "options": {},
      "default_value": null,
      "width": "half|full",
      "readonly": false
    }]
  }]
}
```

### Lookup Field Options Format
Lookup fields (`field_type: 'lookup'`) require these keys in `options`:
```json
{
  "entity": "user|contact|company|pipeline",
  "api_endpoint": "/crm/api/v2/forms/definitions/lookup-options/?entity=contact",
  "display_field": "label",
  "value_field": "id",
  "data_path": "options",
  "searchable": true,
  "allow_create": true
}
```
- `entity` — entity type (NOT `entity_type`)
- `api_endpoint` — required, the URL to fetch options from
- `data_path` — JSON path to the array in the API response (e.g. `members`, `pipelines`, `options`)
- User lookups use: `/org/api/v1/orgs/__ORG_ID__/members?page_size=100&status=active` with `data_path: 'members'`
- Contact/Company lookups use: `/crm/api/v2/forms/definitions/lookup-options/?entity=contact|company`
- Pipeline lookups use: `/crm/api/v2/deals/pipelines/` with `data_path: 'pipelines'`

### Lookup Options Endpoint
- `GET /api/v2/forms/definitions/lookup-options/?entity=user|contact|company`
- Contact/Company queries use **V2 models only** (`ContactV2`, `CompanyV2`) — no V1 mixing
- User queries use `fetch_member_names()` utility (service-to-service call to org service)

### API Endpoints: `/api/v2/forms/definitions/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List forms (filtered by org) |
| POST | `/` | Create form |
| GET | `/{id}/` | Retrieve form |
| PATCH | `/{id}/` | Update form |
| DELETE | `/{id}/` | Soft delete |
| GET | `/get-schema/` | Get schema (auto-creates default if missing) |
| GET | `/lookup-options/` | Lookup options (user, company, contact — V2 only) |
| GET | `/entity_types/` | Entity type choices |
| GET | `/form_types/` | Form type choices |

### Default Schemas (`default_schemas.py`)
- `get_default_lead_schema()` — 5 sections, 20+ fields
- `get_default_contact_schema()` — 8 sections, 24 fields
- `get_default_company_schema()` — 5 sections (Company Details, Financials, Address, Social & Web, Additional)
- `get_default_deal_schema()` — 5 sections (Deal Information, Relationships, Timeline, Loss Details, Description)

---

## Hybrid Model Pattern (All V2 Entities)

All V2 models follow the same architecture:
- **System DB columns** — indexed fields for filtering, sorting, aggregation (status, stage, value, etc.)
- **`entity_data` (JSONB)** — dynamic/custom fields from FormDefinition schema
- **Soft delete** — `deleted_at`, `deleted_by` fields; `soft_delete()`, `restore()`, `hard_delete()` methods
- **Field routing (serializer)** — on WRITE, system fields extracted from `entity_data` → saved to DB columns; on READ, DB columns merged back into `entity_data`

### Delete Behavior (All V2 ViewSets)
| Operation | Method | Behavior |
|-----------|--------|----------|
| Single delete | `DELETE /{id}/` | Soft delete (sets `deleted_at`) |
| Bulk delete | `POST /bulk_delete/` | Soft delete per record |
| Restore | `POST /{id}/restore/` | Clears `deleted_at`, brings record back |
| Default queryset | `get_queryset()` | Filters `deleted_at__isnull=True` |
| Admin queryset | `get_queryset()` | Returns `all()` (includes soft-deleted for admin visibility) |

---

## Leads V2 (`leads_v2` app)

### Core Model: `LeadV2`
- Table: `crm_leads_v2`
- System DB columns: `status`, `source`, `rating`, `assigned_to_id`, `company_id`, `contact_id`, `is_converted`
- Dynamic fields: `entity_data` (JSONB) — first_name, last_name, email, phone, etc.
- Soft delete: `deleted_at`, `deleted_by`
- Conversion tracking: `converted_at`, `converted_contact_id`, `converted_company_id`, `converted_deal_id`, `converted_by`

### API Endpoints: `/api/v2/leads/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List/Create |
| GET/PATCH/DELETE | `/{id}/` | Retrieve/Update/Soft Delete |
| POST | `/{id}/restore/` | Restore soft-deleted lead |
| GET | `/stats/` | Statistics by status |
| GET | `/sources/` | Distinct sources |
| GET | `/mine/` | Current user's leads |
| POST | `/{id}/update_status/` | Update status |
| POST | `/check_duplicate/` | Check email duplicates |
| POST | `/bulk_update/` | Bulk update |
| POST | `/bulk_delete/` | Bulk soft delete |
| GET | `/export/` | CSV export (dynamic columns from FormDefinition) |
| POST | `/{id}/convert/` | Convert to Contact/Company/Deal (uses V1 crm models) |
| POST | `/web_form/` | Public submission (AllowAny, rate limited) |
| POST | `/{id}/disqualify/` | Disqualify lead |

---

## Contacts V2 (`contacts_v2` app)

### Core Model: `ContactV2`
- Table: `crm_contacts_v2`
- System DB columns: `status`, `source`, `assigned_to_id`, `company_id`, `do_not_call`, `do_not_email`, `converted_from_lead_id`, `converted_at`
- Dynamic fields: `entity_data` (JSONB) — first_name, last_name, email, phone, address, social, etc.
- Soft delete: `deleted_at`, `deleted_by`

### API Endpoints: `/api/v2/contacts/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List/Create |
| GET/PATCH/DELETE | `/{id}/` | Retrieve/Update/Soft Delete |
| POST | `/{id}/restore/` | Restore soft-deleted contact |
| GET | `/stats/` | Statistics by status |
| GET | `/sources/` | Distinct sources |
| GET | `/mine/` | Current user's contacts |
| POST | `/{id}/update_status/` | Update status |
| POST | `/check_duplicate/` | Check email duplicates |
| POST | `/bulk_update/` | Bulk update |
| POST | `/bulk_delete/` | Bulk soft delete |
| GET | `/export/` | CSV export |

---

## Companies V2 (`companies_v2` app)

### Core Model: `CompanyV2`
- Table: `crm_companies_v2`
- System DB columns: `status`, `industry`, `size`, `assigned_to_id`, `parent_company_id`
- Dynamic fields: `entity_data` (JSONB) — name, website, email, phone, address, social, etc.
- Soft delete: `deleted_at`, `deleted_by`

### API Endpoints: `/api/v2/companies/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List/Create |
| GET/PATCH/DELETE | `/{id}/` | Retrieve/Update/Soft Delete |
| POST | `/{id}/restore/` | Restore soft-deleted company |
| GET | `/stats/` | Statistics by status |
| GET | `/sources/` | Distinct industries |
| GET | `/mine/` | Current user's companies |
| POST | `/{id}/update_status/` | Update status |
| POST | `/check_duplicate/` | Check name duplicates |
| POST | `/bulk_update/` | Bulk update |
| POST | `/bulk_delete/` | Bulk soft delete |
| GET | `/export/` | CSV export |

---

## Deals V2 (`deals_v2` app)

### Core Model: `DealV2`
- Table: `crm_deals_v2`
- System DB columns: `status`, `stage`, `value`, `currency`, `probability`, `expected_close_date`, `actual_close_date`, `loss_reason`, `pipeline_id`, `assigned_to_id`, `contact_id`, `company_id`, `converted_from_lead_id`, `stage_entered_at`
- Dynamic fields: `entity_data` (JSONB) — name, description, loss_notes, etc.
- Soft delete: `deleted_at`, `deleted_by`
- Status choices: `open`, `won`, `lost`, `abandoned`
- Stage choices: `prospecting`, `qualification`, `proposal`, `negotiation`, `closed_won`, `closed_lost`

### Display Fields (Detail & List Serializers)
Both serializers resolve UUIDs to human-readable names:
- `display_pipeline` — from V1 `Pipeline` model
- `display_owner` — from org members API (`fetch_member_names`)
- `display_contact` — from `ContactV2` (first_name + last_name)
- `display_company` — from `CompanyV2` (name)

### API Endpoints: `/api/v2/deals/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List/Create |
| GET/PATCH/DELETE | `/{id}/` | Retrieve/Update/Soft Delete |
| POST | `/{id}/restore/` | Restore soft-deleted deal |
| GET | `/stats/` | Statistics (by status, stage, pipeline value, averages) |
| GET | `/sources/` | Distinct stages |
| GET | `/mine/` | Current user's deals |
| GET | `/pipelines/` | Active V1 pipelines for lookup |
| POST | `/{id}/update_status/` | Update status |
| POST | `/{id}/update_stage/` | Update stage |
| POST | `/check_duplicate/` | Check name duplicates |
| POST | `/bulk_update/` | Bulk update |
| POST | `/bulk_delete/` | Bulk soft delete |
| GET | `/export/` | CSV export |

---

## Frontend Architecture

### Reusable Factory Functions
- `lib/api/entityV2Api.ts` — `createEntityV2Api()` generates typed CRUD API client for any entity
- `lib/queries/useEntityV2.ts` — `createEntityV2Hooks()` generates React Query hooks for any entity

### API Clients
- `lib/api/formsV2.ts` — `getFormSchema()`, `updateFormSchema()`, `listForms()`, etc.
- `lib/api/leadsV2.ts` — Full CRUD, stats, bulk, export, convert, duplicate check
- `lib/api/contactsV2.ts` — Full CRUD, stats, bulk, export, duplicate check
- `lib/api/companiesV2.ts` — Full CRUD, stats, bulk, export, duplicate check
- `lib/api/dealsV2.ts` — Full CRUD, stats, bulk, export, duplicate check, pipelines

### React Query Hooks
- `lib/queries/useLeadsV2.ts` — `useLeadsV2`, `useLeadV2`, `useLeadsV2Stats`, mutations
- `lib/queries/useContactsV2.ts` — `useContactsV2`, `useContactV2`, `useContactsV2Stats`, mutations
- `lib/queries/useCompaniesV2.ts` — `useCompaniesV2`, `useCompanyV2`, `useCompaniesV2Stats`, mutations
- `lib/queries/useDealsV2.ts` — `useDealsV2`, `useDealV2`, `useDealsV2Stats`, mutations
- `lib/queries/useFormsV2.ts` — `useFormSchema`, `useFormDefinitions`, `useFieldTypes`

### Dynamic Form Rendering
- `DynamicForm` component fetches schema via `useFormSchema(entityType, formType)`
- `FieldRenderer` maps `field_type` to correct input (text, select, lookup, currency, date, etc.)
- Supports conditional visibility (`field.conditional.show_if`), validation rules, multi-column layouts
- `EntityV2FormDrawer` — generic wrapper with section sidebar, used by all entity-specific drawers
- `LeadV2FormDrawer`, `ContactV2FormDrawer`, `CompanyV2FormDrawer`, `DealV2FormDrawer` — thin wrappers

### Pages
- `/sales-v2/leads` — List with filters, stats, bulk actions
- `/sales-v2/leads/[id]` — Detail page with tabs
- `/sales-v2/leads/layout` — Drag-and-drop form layout editor
- `/sales-v2/contacts` — List with filters, stats, bulk actions
- `/sales-v2/contacts/[id]` — Detail page with tabs
- `/sales-v2/contacts/layout` — Drag-and-drop form layout editor
- `/sales-v2/companies` — List with filters, stats, bulk actions
- `/sales-v2/companies/[id]` — Detail page with tabs
- `/sales-v2/companies/layout` — Drag-and-drop form layout editor
- `/sales-v2/deals` — List with filters, stats, bulk actions
- `/sales-v2/deals/[id]` — Detail page with tabs (details, notes)
- `/sales-v2/deals/layout` — Drag-and-drop form layout editor

### Navigation
All V2 entities are enabled in `app/(app)/layout.tsx` under the "Sales V2" sidebar section:
- Leads → `/sales-v2/leads`
- Contacts → `/sales-v2/contacts`
- Companies → `/sales-v2/companies`
- Deals → `/sales-v2/deals`

---

## Integration Status

| Entity | Backend V2 App | Default Schema | Frontend V2 Page | Status |
|--------|---------------|---------------|------------------|--------|
| Lead | `leads_v2` ✅ | Full (5 sections, 20+ fields) | Full (list, detail, layout) | **COMPLETE** |
| Contact | `contacts_v2` ✅ | Full (8 sections, 24 fields) | Full (list, detail, layout) | **COMPLETE** |
| Company | `companies_v2` ✅ | Full (5 sections) | Full (list, detail, layout) | **COMPLETE** |
| Deal | `deals_v2` ✅ | Full (5 sections, 15+ fields) | Full (list, detail, layout) | **COMPLETE** |

### Key Notes
- All V2 navigation is ENABLED in `app/(app)/layout.tsx`
- All V2 viewsets use soft delete for single and bulk delete, with restore support
- Lookups use V2 models (`ContactV2`, `CompanyV2`) — no V1 mixing for contact/company data
- Deal pipeline lookup uses V1 `Pipeline` model (no V2 pipeline model exists yet)
- Lead conversion creates V1 Contact/Company/Deal records (conversion to V2 entities not yet implemented)
- Web form endpoint needs gateway public route config
- Display fields (detail/list serializers) resolve UUIDs to names for pipeline, owner, contact, company
