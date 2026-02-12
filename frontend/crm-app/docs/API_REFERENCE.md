# CRM Service - API Reference

Complete API documentation for the TrueValueCRM CRM Service.

**Base URL**: `http://localhost:8000/crm` (via Gateway)  
**Direct URL**: `http://localhost:8003` (CRM Service)  
**Authentication**: Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Common Response Format](#common-response-format)
3. [Leads API](#leads-api)
4. [Contacts API](#contacts-api)
5. [Companies API](#companies-api)
6. [Deals API](#deals-api)
7. [Pipelines API](#pipelines-api)
8. [Activities API](#activities-api)
9. [Tags API](#tags-api)
10. [Custom Fields API](#custom-fields-api)
11. [Search API](#search-api)
12. [Health Endpoints](#health-endpoints)

---

## Authentication

All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

The token contains:
- `org_id`: Organization UUID (used for data isolation)
- `sub`: User UUID (used as owner_id)
- `permissions`: Array of permission strings

---

## Common Response Format

### Success Response (List)
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "page_size": 10,
    "total": 100
  }
}
```

### Success Response (Single)
```json
{
  "id": "uuid",
  "field1": "value",
  ...
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 10 | Items per page (max 100) |
| `order_by` | string | `-created_at` | Sort field (prefix `-` for descending) |
| `search` | string | - | Search across name/email fields |

---

## Leads API

### List Leads

```
GET /crm/api/v1/leads
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name, email, company |
| `status` | string | Filter by status: `new`, `contacted`, `qualified`, `unqualified` |
| `source` | string | Filter by lead source |
| `owner_id` | UUID | Filter by owner |
| `order_by` | string | Sort field (default: `-created_at`) |

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-uuid",
      "owner_id": "user-uuid",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "mobile": "+1987654321",
      "company_name": "Acme Inc",
      "title": "CTO",
      "website": "https://acme.com",
      "status": "new",
      "source": "website",
      "source_detail": "Contact form",
      "score": 75,
      "activity_count": 5,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T08:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 10,
    "total": 150
  }
}
```

---

### Get Lead

```
GET /crm/api/v1/leads/{lead_id}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-uuid",
  "owner_id": "user-uuid",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "mobile": "+1987654321",
  "company_name": "Acme Inc",
  "title": "CTO",
  "website": "https://acme.com",
  "address_line1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA",
  "status": "new",
  "source": "website",
  "source_detail": "Contact form",
  "score": 75,
  "description": "Interested in enterprise plan",
  "custom_fields": {
    "industry": "Technology",
    "budget": "50000"
  },
  "tags": ["hot-lead", "enterprise"],
  "tag_ids": ["tag-uuid-1", "tag-uuid-2"],
  "activity_count": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T08:00:00Z"
}
```

---

### Create Lead

```
POST /crm/api/v1/leads
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "mobile": "+1987654321",
  "company_name": "Acme Inc",
  "title": "CTO",
  "website": "https://acme.com",
  "address_line1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA",
  "status": "new",
  "source": "website",
  "source_detail": "Contact form",
  "score": 75,
  "description": "Interested in enterprise plan",
  "owner_id": "user-uuid",
  "custom_fields": {
    "industry": "Technology"
  },
  "tag_ids": ["tag-uuid-1"]
}
```

**Required Fields:** `first_name` OR `last_name` OR `email`

**Field Types:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | No* | First name |
| `last_name` | string | No* | Last name |
| `email` | string | No* | Email address |
| `phone` | string | No | Phone number |
| `mobile` | string | No | Mobile number |
| `company_name` | string | No | Company name |
| `title` | string | No | Job title |
| `website` | string | No | Website URL |
| `address_line1` | string | No | Street address |
| `city` | string | No | City |
| `state` | string | No | State/Province |
| `postal_code` | string | No | ZIP/Postal code |
| `country` | string | No | Country |
| `status` | string | No | `new`, `contacted`, `qualified`, `unqualified` |
| `source` | string | No | Lead source |
| `source_detail` | string | No | Source details |
| `score` | integer | No | Lead score (0-100) |
| `description` | string | No | Notes/description |
| `owner_id` | UUID | No | Assigned owner |
| `custom_fields` | object | No | Custom field values |
| `tag_ids` | array | No | Array of tag UUIDs |

*At least one of `first_name`, `last_name`, or `email` is required.

---

### Update Lead

```
PATCH /crm/api/v1/leads/{lead_id}
```

**Request Body:** (partial update - only include fields to change)
```json
{
  "status": "qualified",
  "score": 90
}
```

---

### Delete Lead

```
DELETE /crm/api/v1/leads/{lead_id}
```

**Response:** `204 No Content`

---

### Convert Lead

```
POST /crm/api/v1/leads/{lead_id}/convert
```

**Request Body:**
```json
{
  "create_contact": true,
  "create_company": true,
  "create_deal": false,
  "contact_owner_id": "user-uuid",
  "company_owner_id": "user-uuid",
  "company_name": "Acme Inc",
  "deal_name": "Acme Enterprise Deal",
  "deal_value": 50000.00,
  "deal_pipeline_id": "pipeline-uuid",
  "deal_stage_id": "stage-uuid",
  "deal_owner_id": "user-uuid"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `create_contact` | boolean | true | Create contact from lead |
| `create_company` | boolean | true | Create company from lead |
| `create_deal` | boolean | false | Create deal from lead |
| `contact_owner_id` | UUID | - | Contact owner |
| `company_owner_id` | UUID | - | Company owner |
| `company_name` | string | - | Override company name |
| `deal_name` | string | Required if `create_deal` | Deal name |
| `deal_value` | decimal | - | Deal value |
| `deal_pipeline_id` | UUID | - | Pipeline for deal |
| `deal_stage_id` | UUID | - | Stage for deal |
| `deal_owner_id` | UUID | - | Deal owner |

**Response:**
```json
{
  "lead_id": "lead-uuid",
  "contact_id": "contact-uuid",
  "company_id": "company-uuid",
  "deal_id": "deal-uuid"
}
```

---

### Disqualify Lead

```
POST /crm/api/v1/leads/{lead_id}/disqualify
```

**Request Body:**
```json
{
  "reason": "Budget too low"
}
```

---

## Contacts API

### List Contacts

```
GET /crm/api/v1/contacts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name, email |
| `status` | string | Filter by status |
| `owner_id` | UUID | Filter by owner |
| `company_id` | UUID | Filter by company |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "full_name": "Jane Smith",
      "email": "jane@acme.com",
      "phone": "+1234567890",
      "mobile": "+1987654321",
      "title": "VP Sales",
      "department": "Sales",
      "primary_company_id": "company-uuid",
      "primary_company": {
        "id": "company-uuid",
        "name": "Acme Inc"
      },
      "status": "active",
      "source": "referral",
      "deal_count": 3,
      "activity_count": 12,
      "last_activity_at": "2024-01-20T14:30:00Z",
      "last_contacted_at": "2024-01-19T10:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "page_size": 10, "total": 50 }
}
```

---

### Get Contact

```
GET /crm/api/v1/contacts/{contact_id}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Contact ID |
| `org_id` | UUID | Organization ID |
| `owner_id` | UUID | Assigned owner |
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `full_name` | string | Full name (read-only) |
| `email` | string | Primary email |
| `secondary_email` | string | Secondary email |
| `phone` | string | Phone number |
| `mobile` | string | Mobile number |
| `title` | string | Job title |
| `department` | string | Department |
| `primary_company_id` | UUID | Primary company |
| `primary_company` | object | Company details (read-only) |
| `address_line1` | string | Street address line 1 |
| `address_line2` | string | Street address line 2 |
| `city` | string | City |
| `state` | string | State/Province |
| `postal_code` | string | ZIP/Postal code |
| `country` | string | Country |
| `description` | string | Notes |
| `avatar_url` | string | Avatar URL |
| `linkedin_url` | string | LinkedIn profile |
| `twitter_url` | string | Twitter profile |
| `status` | string | Contact status |
| `source` | string | Lead source |
| `source_detail` | string | Source details |
| `custom_fields` | object | Custom field values |
| `tags` | array | Tag names (read-only) |
| `tag_ids` | array | Tag UUIDs |
| `do_not_call` | boolean | Do not call flag |
| `do_not_email` | boolean | Do not email flag |
| `deal_count` | integer | Number of deals (read-only) |
| `activity_count` | integer | Number of activities (read-only) |
| `last_activity_at` | datetime | Last activity timestamp |
| `last_contacted_at` | datetime | Last contact timestamp |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

---

### Create Contact

```
POST /crm/api/v1/contacts
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@acme.com",
  "phone": "+1234567890",
  "title": "VP Sales",
  "department": "Sales",
  "primary_company_id": "company-uuid",
  "status": "active",
  "source": "referral"
}
```

---

### Update Contact

```
PATCH /crm/api/v1/contacts/{contact_id}
```

---

### Delete Contact

```
DELETE /crm/api/v1/contacts/{contact_id}
```

---

### Get Contact Timeline

```
GET /crm/api/v1/contacts/{contact_id}/timeline
```

**Response:**
```json
{
  "data": [
    {
      "type": "activity",
      "activity_type": "call",
      "subject": "Follow-up call",
      "timestamp": "2024-01-20T14:30:00Z"
    },
    {
      "type": "deal",
      "deal_name": "Enterprise License",
      "action": "created",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Import Contacts

```
POST /crm/api/v1/contacts/import
```

**Request Body:**
```json
{
  "contacts": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    {
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com"
    }
  ],
  "skip_duplicates": true,
  "update_existing": false,
  "duplicate_check_field": "email"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `contacts` | array | Required | Array of contact objects (1-1000) |
| `skip_duplicates` | boolean | true | Skip duplicate records |
| `update_existing` | boolean | false | Update existing records |
| `duplicate_check_field` | string | "email" | Field to check: `email` or `phone` |

**Response:**
```json
{
  "total": 100,
  "created": 95,
  "updated": 0,
  "skipped": 5,
  "errors": [
    {
      "row": 3,
      "message": "Invalid email format"
    }
  ]
}
```

---

## Companies API

### List Companies

```
GET /crm/api/v1/companies
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name, website |
| `industry` | string | Filter by industry |

---

### Get Company

```
GET /crm/api/v1/companies/{company_id}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Company ID |
| `org_id` | UUID | Organization ID |
| `owner_id` | UUID | Assigned owner |
| `name` | string | Company name |
| `website` | string | Website URL |
| `industry` | string | Industry |
| `size` | string | Company size |
| `phone` | string | Phone number |
| `email` | string | Email address |
| `address_line1` | string | Street address line 1 |
| `address_line2` | string | Street address line 2 |
| `city` | string | City |
| `state` | string | State/Province |
| `postal_code` | string | ZIP/Postal code |
| `country` | string | Country |
| `description` | string | Description |
| `annual_revenue` | decimal | Annual revenue |
| `employee_count` | integer | Number of employees |
| `linkedin_url` | string | LinkedIn page |
| `twitter_url` | string | Twitter profile |
| `facebook_url` | string | Facebook page |
| `custom_fields` | object | Custom field values |
| `tags` | array | Tag names |
| `tag_ids` | array | Tag UUIDs |
| `parent_company` | UUID | Parent company ID |
| `contact_count` | integer | Number of contacts (read-only) |
| `deal_count` | integer | Number of deals (read-only) |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

---

### Create Company

```
POST /crm/api/v1/companies
```

**Request Body:**
```json
{
  "name": "Acme Inc",
  "website": "https://acme.com",
  "industry": "Technology",
  "size": "51-200",
  "phone": "+1234567890",
  "email": "info@acme.com",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "annual_revenue": 5000000,
  "employee_count": 150
}
```

---

### Get Company Contacts

```
GET /crm/api/v1/companies/{company_id}/contacts
```

---

### Get Company Stats

```
GET /crm/api/v1/companies/{company_id}/stats
```

---

## Deals API

### List Deals

```
GET /crm/api/v1/deals
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name |
| `status` | string | `open`, `won`, `lost` |
| `pipeline_id` | UUID | Filter by pipeline |
| `stage_id` | UUID | Filter by stage |

---

### Get Deal

```
GET /crm/api/v1/deals/{deal_id}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Deal ID |
| `org_id` | UUID | Organization ID |
| `owner_id` | UUID | Assigned owner |
| `name` | string | Deal name |
| `pipeline_id` | UUID | Pipeline ID |
| `stage_id` | UUID | Stage ID |
| `pipeline` | object | Pipeline details (read-only) |
| `stage` | object | Stage details (read-only) |
| `value` | decimal | Deal value |
| `currency` | string | Currency code |
| `probability` | integer | Win probability (0-100) |
| `weighted_value` | decimal | Value × Probability (read-only) |
| `expected_close_date` | date | Expected close date |
| `actual_close_date` | date | Actual close date (read-only) |
| `status` | string | `open`, `won`, `lost` |
| `loss_reason` | string | Reason for loss |
| `loss_notes` | string | Loss notes |
| `contact_id` | UUID | Primary contact |
| `company_id` | UUID | Primary company |
| `contact` | object | Contact details (read-only) |
| `company` | object | Company details (read-only) |
| `converted_from_lead_id` | UUID | Source lead ID |
| `description` | string | Description |
| `custom_fields` | object | Custom field values |
| `tags` | array | Tag names |
| `tag_ids` | array | Tag UUIDs |
| `line_items` | array | Line items (products) |
| `activity_count` | integer | Number of activities (read-only) |
| `stage_entered_at` | datetime | When entered current stage |
| `last_activity_at` | datetime | Last activity timestamp |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

---

### Create Deal

```
POST /crm/api/v1/deals
```

**Request Body:**
```json
{
  "name": "Enterprise License - Acme",
  "pipeline_id": "pipeline-uuid",
  "stage_id": "stage-uuid",
  "value": 50000.00,
  "currency": "USD",
  "probability": 60,
  "expected_close_date": "2024-03-31",
  "contact_id": "contact-uuid",
  "company_id": "company-uuid",
  "description": "Annual enterprise license deal",
  "line_items": [
    {
      "product_id": "product-uuid",
      "name": "Enterprise License",
      "quantity": 1,
      "unit_price": 50000.00
    }
  ]
}
```

**Required Fields:** `name`, `stage_id`

---

### Move Deal Stage

```
POST /crm/api/v1/deals/{deal_id}/move-stage
```

**Request Body:**
```json
{
  "stage_id": "new-stage-uuid"
}
```

---

### Win Deal

```
POST /crm/api/v1/deals/{deal_id}/win
```

---

### Lose Deal

```
POST /crm/api/v1/deals/{deal_id}/lose
```

**Request Body:**
```json
{
  "loss_reason": "Price too high",
  "loss_notes": "Competitor offered 20% less"
}
```

---

### Reopen Deal

```
POST /crm/api/v1/deals/{deal_id}/reopen
```

**Request Body:**
```json
{
  "stage_id": "stage-uuid"
}
```

---

### Get Deal Forecast

```
GET /crm/api/v1/deals/forecast
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 30 | Forecast period in days |

---

## Pipelines API

### List Pipelines

```
GET /crm/api/v1/pipelines
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `is_active` | boolean | Filter by active status |

---

### Get Pipeline

```
GET /crm/api/v1/pipelines/{pipeline_id}
```

**Response:**
```json
{
  "id": "pipeline-uuid",
  "org_id": "org-uuid",
  "name": "Sales Pipeline",
  "description": "Main sales pipeline",
  "is_default": true,
  "is_active": true,
  "currency": "USD",
  "order": 1,
  "stages": [
    {
      "id": "stage-uuid",
      "name": "Qualification",
      "probability": 20,
      "order": 1,
      "is_won": false,
      "is_lost": false,
      "color": "#3B82F6",
      "deal_count": 15,
      "deal_value": 150000
    }
  ],
  "total_deals": 50,
  "total_value": 500000,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### Create Pipeline

```
POST /crm/api/v1/pipelines
```

**Request Body:**
```json
{
  "name": "Enterprise Sales",
  "description": "Pipeline for enterprise deals",
  "is_default": false,
  "currency": "USD"
}
```

---

### Get Pipeline Kanban

```
GET /crm/api/v1/pipelines/{pipeline_id}/kanban
```

Returns deals grouped by stage for Kanban board display.

---

### Get Pipeline Stats

```
GET /crm/api/v1/pipelines/{pipeline_id}/stats
```

---

### List Pipeline Stages

```
GET /crm/api/v1/pipelines/{pipeline_id}/stages
```

---

### Create Pipeline Stage

```
POST /crm/api/v1/pipelines/{pipeline_id}/stages
```

**Request Body:**
```json
{
  "name": "Negotiation",
  "probability": 60,
  "order": 3,
  "rotting_days": 14,
  "color": "#F59E0B"
}
```

---

### Reorder Stages

```
POST /crm/api/v1/pipelines/{pipeline_id}/stages/reorder
```

**Request Body:**
```json
{
  "stage_order": [
    "stage-uuid-1",
    "stage-uuid-2",
    "stage-uuid-3"
  ]
}
```

---

## Activities API

### List Activities

```
GET /crm/api/v1/activities
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in subject |
| `type` | string | `call`, `email`, `meeting`, `task`, `note` |
| `status` | string | `pending`, `completed`, `cancelled` |
| `contact_id` | UUID | Filter by contact |
| `deal_id` | UUID | Filter by deal |
| `overdue` | boolean | Filter overdue activities |

---

### Get Activity

```
GET /crm/api/v1/activities/{activity_id}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Activity ID |
| `org_id` | UUID | Organization ID |
| `owner_id` | UUID | Creator |
| `activity_type` | string | `call`, `email`, `meeting`, `task`, `note` |
| `subject` | string | Activity subject |
| `description` | string | Description/notes |
| `status` | string | `pending`, `completed`, `cancelled` |
| `priority` | string | `low`, `medium`, `high` |
| `due_date` | datetime | Due date |
| `completed_at` | datetime | Completion timestamp (read-only) |
| `start_time` | datetime | Start time (for meetings) |
| `end_time` | datetime | End time (for meetings) |
| `duration_minutes` | integer | Duration in minutes |
| `call_direction` | string | `inbound`, `outbound` (for calls) |
| `call_outcome` | string | Call outcome (for calls) |
| `email_direction` | string | `inbound`, `outbound` (for emails) |
| `email_message_id` | string | Email message ID |
| `contact_id` | UUID | Related contact |
| `company_id` | UUID | Related company |
| `deal_id` | UUID | Related deal |
| `lead_id` | UUID | Related lead |
| `assigned_to` | UUID | Assigned user |
| `reminder_at` | datetime | Reminder time |
| `reminder_sent` | boolean | Reminder sent flag |
| `created_at` | datetime | Created timestamp |
| `updated_at` | datetime | Updated timestamp |

---

### Create Activity

```
POST /crm/api/v1/activities
```

**Request Body:**
```json
{
  "activity_type": "call",
  "subject": "Follow-up call with John",
  "description": "Discuss proposal details",
  "status": "pending",
  "priority": "high",
  "due_date": "2024-01-25T14:00:00Z",
  "contact_id": "contact-uuid",
  "deal_id": "deal-uuid",
  "call_direction": "outbound"
}
```

**Required:** At least one of `contact_id`, `company_id`, `deal_id`, or `lead_id`

---

### Complete Activity

```
POST /crm/api/v1/activities/{activity_id}/complete
```

---

### Get Upcoming Activities

```
GET /crm/api/v1/activities/upcoming
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 7 | Number of days ahead |

---

### Get Overdue Activities

```
GET /crm/api/v1/activities/overdue
```

---

### Get Activity Stats

```
GET /crm/api/v1/activities/stats
```

---

## Tags API

### List Tags

```
GET /crm/api/v1/tags
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity_type` | string | `contact`, `company`, `deal`, `lead` |

---

### Create Tag

```
POST /crm/api/v1/tags
```

**Request Body:**
```json
{
  "name": "VIP",
  "color": "#EF4444",
  "entity_type": "contact",
  "description": "VIP customers"
}
```

---

### Update Tag

```
PATCH /crm/api/v1/tags/{tag_id}
```

---

### Delete Tag

```
DELETE /crm/api/v1/tags/{tag_id}
```

---

## Custom Fields API

### List Custom Fields

```
GET /crm/api/v1/custom-fields
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity_type` | string | `contact`, `company`, `deal`, `lead` |

---

### Create Custom Field

```
POST /crm/api/v1/custom-fields
```

**Request Body:**
```json
{
  "entity_type": "contact",
  "name": "linkedin_connections",
  "label": "LinkedIn Connections",
  "field_type": "number",
  "is_required": false,
  "is_unique": false,
  "placeholder": "Enter number of connections",
  "help_text": "Number of LinkedIn connections",
  "order": 10
}
```

**Field Types:** `text`, `number`, `date`, `datetime`, `boolean`, `select`, `multiselect`, `url`, `email`, `phone`

For `select` and `multiselect`, include options:
```json
{
  "field_type": "select",
  "options": [
    {"value": "low", "label": "Low"},
    {"value": "medium", "label": "Medium"},
    {"value": "high", "label": "High"}
  ]
}
```

---

## Search API

### Global Search

```
GET /crm/api/v1/search
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `limit` | integer | No | Results per entity (default: 5) |

**Response:**
```json
{
  "contacts": [
    {"id": "uuid", "name": "John Doe", "email": "john@example.com"}
  ],
  "companies": [
    {"id": "uuid", "name": "Acme Inc", "website": "acme.com"}
  ],
  "deals": [
    {"id": "uuid", "name": "Enterprise Deal", "value": 50000}
  ],
  "leads": [
    {"id": "uuid", "name": "Jane Smith", "company": "Tech Corp"}
  ]
}
```

---

### Check Duplicates

```
POST /crm/api/v1/duplicates/check
```

**Request Body:**
```json
{
  "entity_type": "contact",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "has_duplicates": true,
  "match_field": "email",
  "duplicates": [
    {"id": "uuid", "name": "John Doe", "email": "john@example.com"}
  ]
}
```

---

## Health Endpoints

### Health Check

```
GET /crm/health/
```

**Response:**
```json
{
  "status": "healthy",
  "service": "crm",
  "version": "1.0.0"
}
```

### Liveness Check

```
GET /crm/health/live
```

### Readiness Check

```
GET /crm/health/ready
```

**Response:**
```json
{
  "status": "ready",
  "database": "connected"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Duplicate record exists |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

*Last updated: February 2025*
