---
description: Forms V2 and Leads V2 architecture, models, APIs, and integration status
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

### API Endpoints: `/api/v2/forms/definitions/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List forms (filtered by org) |
| POST | `/` | Create form |
| GET | `/{id}/` | Retrieve form |
| PATCH | `/{id}/` | Update form |
| DELETE | `/{id}/` | Soft delete |
| GET | `/get-schema/` | Get schema (auto-creates default if missing) |
| GET | `/lookup-options/` | Lookup options (user, company, contact) |
| GET | `/entity_types/` | Entity type choices |
| GET | `/form_types/` | Form type choices |

### Default Schemas (`default_schemas.py`)
- `get_default_lead_schema()` — 5 sections, 20+ fields (FULL)
- `get_default_contact_schema()` — 1 section (BASIC placeholder)
- `get_default_company_schema()` — 1 section (BASIC placeholder)
- `get_default_deal_schema()` — 1 section (BASIC placeholder)

---

## Leads V2 (`leads_v2` app)

### Core Model: `LeadV2` (Hybrid Model)
- Table: `crm_leads_v2`
- System DB columns: `status`, `source`, `rating`, `assigned_to_id`, `company_id`, `contact_id`, `is_converted`
- Dynamic fields: `entity_data` (JSONB) — stores first_name, last_name, email, phone, etc.
- Soft delete: `deleted_at`, `deleted_by`
- Conversion tracking: `converted_at`, `converted_contact_id`, `converted_company_id`, `converted_deal_id`, `converted_by`

### Field Routing (Serializer)
- On WRITE: `status`, `source`, `rating`, `assigned_to`, `company` extracted from `entity_data` → saved to DB columns
- On READ: DB columns merged back into `entity_data` for form rendering
- Validation: `entity_data` validated against `FormDefinition` schema

### API Endpoints: `/api/v2/leads/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List/Create |
| GET/PATCH/DELETE | `/{id}/` | Retrieve/Update/Delete |
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

## Frontend Architecture

### API Clients
- `lib/api/formsV2.ts` — `getFormSchema()`, `updateFormSchema()`, `listForms()`, etc.
- `lib/api/leadsV2.ts` — Full CRUD, stats, bulk, export, convert, duplicate check

### Dynamic Form Rendering
- `DynamicForm` component fetches schema via `useFormSchema(entityType, formType)`
- `FieldRenderer` maps `field_type` to correct input (text, select, lookup, currency, date, etc.)
- Supports conditional visibility (`field.conditional.show_if`), validation rules, multi-column layouts
- `LeadV2FormDrawer` wraps `DynamicForm` with `react-hook-form` for lead create/edit

### Pages
- `/sales-v2/leads` — List with filters, stats, bulk actions
- `/sales-v2/leads/[id]` — Detail page with tabs
- `/sales-v2/leads/layout` — Drag-and-drop form layout editor

### React Query Hooks
- `lib/queries/useLeadsV2.ts` — `useLeadsV2`, `useLeadV2`, `useLeadsV2Stats`, mutations
- `lib/queries/useFormsV2.ts` — `useFormSchema`, `useFormDefinitions`, `useFieldTypes`

---

## Integration Status

| Entity | Backend V2 App | Default Schema | Frontend V2 Page | Status |
|--------|---------------|---------------|------------------|--------|
| Lead | `leads_v2` ✅ | Full (5 sections) | Full (list, detail, layout) | **COMPLETE** |
| Contact | None ❌ | Placeholder (1 section) | None | **NOT BUILT** |
| Company | None ❌ | Placeholder (1 section) | None | **NOT BUILT** |
| Deal | None ❌ | Placeholder (1 section) | None | **NOT BUILT** |

### Key Notes
- V2 navigation for contacts, accounts, deals is COMMENTED OUT in `app/(app)/layout.tsx`
- `DynamicForm` supports all entity types but only used for leads
- Lookups use V1 `crm` models (Contact, Company) for lead form fields
- Lead conversion creates V1 Contact/Company/Deal records
- Web form endpoint needs gateway public route config
