# TrueValue CRM - Feature Analysis Report

**Analysis Date:** February 18, 2026
**Version:** 2.0.0
**Status:** Backend Integrated, Auth & RBAC Complete, Core Sales & Activities Live

---

## PLATFORM ARCHITECTURE

TrueValue CRM is a **product** within the TrueValueCRM **platform**, a microservice architecture with a single API gateway.

### Two Repositories

| Repo | Path | Purpose |
|------|------|---------|
| **TrueValueCRM** | `C:\Users\sagarr\Projects\TrueValueCRM` | Platform services (gateway, auth, org, permission, billing, audit-log, analytics, admin-panel, shell frontend) |
| **truevalue-crm** | `C:\Users\sagarr\Projects\truevalue-crm` | CRM product (Django backend + Next.js frontend) |

### Service Map

| Service | Stack | Port | Database | Purpose |
|---------|-------|------|----------|---------|
| **Gateway** | FastAPI | 8000 (public) | — | Single entry point, JWT validation, HMAC signing, rate limiting, org membership check |
| **Auth** | Django | 8000 (internal) | auth_db | Login, register, JWT tokens, MFA, sessions, password management |
| **Org** | Django | 8000 (internal) | org_db | Organizations, members, invites, teams, profiles |
| **Permission** | Django | 8000 (internal) | permission_db | Roles, permissions, role assignments, resource policies |
| **Billing** | Django | 8000 (internal) | billing_db | Plans, subscriptions, usage, credits, invoices, payments |
| **Audit-Log** | Django | 8000 (internal) | audit_db | Immutable audit trail for all services |
| **Analytics** | Python | — | — | Kafka consumer for event processing |
| **Admin Panel** | Django | 8010 | All DBs | Unified admin interface with 2FA |
| **CRM Backend** | Django | 8001 | crm_db | CRM business logic and REST API |
| **CRM Frontend** | Next.js | 3001 | — | CRM user interface |
| **Shell Frontend** | Next.js | 3000 | — | Platform landing, auth pages, onboarding |

### Infrastructure

| Component | Port | Purpose |
|-----------|------|---------|
| PostgreSQL | 5433 (host) | All databases |
| Redis | 6379 | Rate limiting, caching, session blacklist |
| Kafka | 9092 | Event streaming |
| Elasticsearch | 9200 | Search |
| Mailhog | 8025 | Dev email |

### Request Flow

```
Browser → Gateway (8000) → JWT validation → HMAC sign → Route to service
                         → Org membership check
                         → Rate limiting (Redis)
                         → Request tracing (X-Request-ID)
```

### Security

- **Zero trust:** Only gateway exposed publicly; services on internal Docker network
- **HMAC:** Gateway signs all forwarded requests; services validate via `truevalue_common.gateway_auth`
- **Service-to-service:** `X-Service-Name`, `X-Service-Timestamp`, `X-Service-Signature`
- **JWT:** HS256, session blacklist in Redis, permission staleness detection
- **Org validation:** Gateway checks org membership before proxying

---

## AUTHENTICATION & AUTHORIZATION

### Auth Flow

1. User logs in via Shell Frontend → `POST /auth/auth/login`
2. Auth Service validates credentials (Argon2), checks MFA
3. If multi-org: returns `org_selection_required` → user selects org → `POST /auth/auth/select-org`
4. Auth Service fetches roles/permissions from Permission Service
5. Issues JWT with claims: `sub`, `email`, `org_id`, `org_slug`, `org_name`, `roles`, `permissions`, `plan`, `session_id`, `perm_version`
6. Tokens stored in cookies (cross-subdomain sharing between shell and CRM)
7. CRM Frontend reads tokens, decodes JWT for user/org info
8. Token refresh: `POST /auth/auth/refresh` (auto-refresh 5 min before expiry)
9. Logout: `POST /auth/auth/logout` → blacklists session in Redis

### Role-Based Access Control (RBAC)

**System Roles** (from Permission Service, lower level = more privileged):

| Role | Code | Level | Permissions | Admin Bypass |
|------|------|-------|-------------|--------------|
| Super Admin | `super_admin` | 0 | ALL | Yes |
| Organization Admin | `org_admin` | 10 | ALL | Yes |
| Manager | `manager` | 50 | Full CRM CRUD + org:manage_members + org:manage_invites + roles:read/assign + audit:read | No |
| Member | `member` | 100 | CRM read/write (no delete) + org:read + reports:read + dashboards:read | No |
| Viewer | `viewer` | 200 | Read-only across all resources | No |

**Permission Format:** `resource:action` (e.g., `contacts:read`, `deals:write`, `org:manage_members`)

**Permission Categories:** Platform, CRM, Marketing, Analytics, Admin

**Frontend Enforcement:**
- `usePermission()` hook: `can(code)`, `roles`, `permissions`, `isAdmin`
- `PermissionGate` component for conditional rendering
- Admin roles (`super_admin`, `org_admin`, `owner`, `admin`) bypass all `can()` checks

**Backend Enforcement:**
- `CRMResourcePermission` DRF class checks `resource:action` against JWT permissions
- Admin roles bypass all checks
- Manager role can modify any org record; others only their own (`owner_id`)
- `PermissionStalenessMiddleware` compares JWT `perm_version` with Redis; returns 401 if stale

### Permission Staleness Detection

When roles/permissions change, the Permission Service bumps a version counter in Redis. The CRM backend middleware checks this against the JWT's `perm_version` and rejects stale tokens with `X-Permission-Stale` header, forcing a token refresh.

---

## CRM BACKEND

### Stack
- Django 5.x + Django REST Framework
- PostgreSQL (via `DATABASE_URL`)
- Redis (caching)
- drf-yasg (Swagger/ReDoc docs)

### Models

**Abstract Base Models:**
- `BaseModel` — UUID PK, `created_at`, `updated_at`
- `SoftDeleteModel` — Adds `deleted_at`, `deleted_by`
- `OrgScopedModel` — Multi-tenancy via `org_id`
- `OwnedModel` — Adds `owner_id` to org-scoped model

**Core Entities:**

| Model | Key Fields | Notes |
|-------|------------|-------|
| **Contact** | first_name, last_name, email, phone, status, source, custom_fields | Soft delete, M2M companies via ContactCompany, M2M tags |
| **Company** | name, website, industry, size, annual_revenue, custom_fields | Parent company (self-ref), M2M tags |
| **Lead** | first_name, last_name, email, status, source, company_name, custom_fields | Soft delete, convertible to contact/company/deal |
| **Deal** | name, pipeline, stage, value, status, contact, company, line_items | Soft delete, stage history tracking |
| **Pipeline** | name, is_default, is_active, currency | Org-scoped, has ordered stages |
| **PipelineStage** | name, probability, order, is_won, is_lost, color | Belongs to pipeline |
| **Activity** | activity_type (task/note/call/email/meeting), subject, status, priority, due_date | Links to contact, company, deal, lead |
| **Tag** | name, color, entity_type | Polymorphic tagging via EntityTag |
| **CustomFieldDefinition** | entity_type, name, field_type, options, validation | Extensible fields |
| **CRMAuditLog** | actor_id, action, entity_type, entity_id, changes | Audit trail |

### API Endpoints (`/crm/api/v1/`)

**Contacts:** list, create, get, update, delete, timeline, companies (link/unlink), import, bulk-delete, bulk-update, merge, duplicate-check

**Companies:** list, create, get, update, delete, contacts (link/unlink), stats

**Leads:** list, create, get, update, delete, convert, disqualify, status update, bulk-delete, bulk-update, web-form (public), sources

**Deals:** list, create, get, update, delete, forecast, move-stage, win, lose, reopen, bulk-delete

**Pipelines:** list, create, get, update, delete, stats, kanban, stages CRUD, stage reorder

**Activities:** list, create, get, update, delete, complete, upcoming, overdue, stats, trend

**Tags:** list, create, get, update, delete (with usage counts)

**Custom Fields:** list, create, update, delete

**Search:** Global search across contacts, companies, deals, leads

**Internal:** Service-to-service endpoints for contact/company/deal lookup, org stats, usage tracking, permission invalidation

### Services Layer

| Service | Responsibilities |
|---------|-----------------|
| **BaseService** | Org-scoped CRUD, audit logging, tags, plan limits, billing usage sync, scope filtering (mine/team/org) |
| **ContactService** | CRUD, duplicate check, merge, bulk import/delete/update, company associations, timeline |
| **CompanyService** | CRUD, duplicate check, contacts, stats |
| **LeadService** | CRUD, convert to contact/company/deal, disqualify, status, bulk ops, sources |
| **DealService** | CRUD, stage moves, win/lose/reopen, kanban, forecast, pipeline stats |
| **PipelineService** | CRUD, stages, reorder, caching (5 min), default pipeline |
| **ActivityService** | CRUD, complete, upcoming/overdue, stats, trend, log_call, log_email, add_note, create_task |
| **TagService** | CRUD, counts, add/remove, bulk tag, merge |

---

## CRM FRONTEND

### Stack
- Next.js 14.2 (App Router)
- React 18.3 + TypeScript 5.4
- Tailwind CSS 3.4
- React Query 5.40 (server state)
- Zustand 4.5 (client/UI state)
- React Hook Form 7.51 + Zod 3.23 (forms)
- Framer Motion 11.2 (animations)
- Recharts 2.12 (charts)
- @dnd-kit (drag & drop)
- react-big-calendar (calendar)
- Lucide React (icons)
- Sonner (toasts)

### Active Pages/Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/dashboard` | Dashboard with stats, charts, recent activities | Active |
| `/sales/leads` | Leads list with DataTable, filters, bulk ops | Active (real API) |
| `/sales/leads/[id]` | Lead detail page | Active (real API) |
| `/sales/contacts` | Contacts list | Active (real API) |
| `/sales/contacts/[id]` | Contact detail | Active (real API) |
| `/sales/accounts` | Companies list | Active (real API) |
| `/sales/accounts/[id]` | Company detail | Active (real API) |
| `/sales/deals` | Deals list + Kanban view | Active (real API) |
| `/sales/deals/[id]` | Deal detail | Active (real API) |
| `/activities/tasks` | Tasks list | Active (real API) |
| `/activities/tasks/[id]` | Task detail | Active (real API) |
| `/activities/calls` | Calls list | Active (real API) |
| `/activities/meetings` | Meetings list | Active (real API) |
| `/activities/emails` | Emails list | Active (real API) |
| `/activities/notes` | Notes list | Active (real API) |
| `/activities/calendar` | Calendar view (month/week/day/agenda) | Active (real API) |
| `/reports` | Reports list | Active |
| `/reports/[id]` | Report detail | Active |
| `/analytics` | Analytics with charts | Active |
| `/settings` | Settings hub (4 tabs) | Active |

### Phase 2 Pages (Sidebar Commented Out, Routes Exist)

| Route | Module |
|-------|--------|
| `/sales/forecasts`, `/sales/documents`, `/sales/campaigns` | Sales extensions |
| `/inventory/*` (products, vendors, purchase-orders, sales-orders, quotes, invoices, price-books) | Inventory module |
| `/support/cases`, `/support/solutions` | Support module |
| `/services`, `/projects` | Services & Projects |
| `/integrations/*` | Integrations |

### Settings Tabs

| Tab | Component | Required Permission |
|-----|-----------|-------------------|
| Sales Pipelines | PipelinesSettings | `deals:manage_pipeline` |
| Tags | TagManagementSettings | `contacts:write` |
| Team Management | TeamManagementSettings | `org:manage_members` or admin |
| Roles & Permissions | RolesPermissionsSettings | `roles:read` or admin |

**Commented out:** Notifications, Security & Privacy, API & Integrations, Data Management

### API Layer

All API calls go through `apiClient` (`lib/api/client.ts`) which:
- Reads base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- Attaches JWT token from cookies
- Auto-refreshes expired tokens
- Handles error responses with typed errors

**Real Backend APIs:**

| File | Base Path | Service |
|------|-----------|---------|
| `contacts.ts` | `/crm/api/v1/contacts` | CRM |
| `companies.ts` | `/crm/api/v1/companies` | CRM |
| `leads.ts` | `/crm/api/v1/leads` | CRM |
| `deals.ts` | `/crm/api/v1/deals` | CRM |
| `activities.ts` | `/crm/api/v1/activities` | CRM |
| `tasks.ts`, `notes.ts`, `meetings.ts`, `calls.ts`, `emails.ts` | via activities | CRM |
| `tags.ts` | `/crm/api/v1/tags` | CRM |
| `pipelines.ts` | `/crm/api/v1/pipelines` | CRM |
| `members.ts` | `/org/api/v1/orgs/{orgId}/members` | Org |
| `permissions-api.ts` | `/permission/api/v1` | Permission |
| `billing.ts` | `/billing/api/v1` | Billing |

**Mock APIs** (in `lib/api/mock/`): leads, deals, accounts, cases, projects, services, solutions, tasks, meetings, calls, salesOrders, quotes, purchaseOrders, priceBooks, invoices, forecasts, documents, vendors, products, campaigns

### React Query Hooks (`lib/queries/`)

Real backend hooks: `useContacts`, `useCompanies`, `useLeads`, `useDeals`, `useActivities`, `useTasks`, `useNotes`, `useMeetings`, `useCalls`, `useEmails`, `useTags`, `usePipelines`, `useMembers`, `useRolesPermissions`, `useBilling`, `useAccounts`

Mock-backed hooks (Phase 2): `useCases`, `useSolutions`, `useServices`, `useProjects`, `useSalesOrders`, `useQuotes`, `usePurchaseOrders`, `usePriceBooks`, `useInvoices`, `useDocuments`, `useForecasts`, `useVendors`, `useProducts`, `useCampaigns`

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **DataTable** | `components/DataTable/` | Sortable table with row selection, actions, pagination, mobile scroll |
| **ActionMenu** | `components/ActionMenu/` | 3-dot dropdown (portal-based to escape overflow) |
| **FormDrawer** | `components/Forms/FormDrawer/` | Slide-out forms with React Hook Form + Zod |
| **KanbanBoard** | `components/KanbanBoard/` | Drag & drop deal pipeline |
| **ActivityCalendar** | `components/Calendar/` | Month/week/day/agenda with color-coded events |
| **Charts** | `components/Charts/` | SalesTrend, Pipeline, LeadSource, Activity, RevenueComparison |
| **AdvancedFilter** | `components/AdvancedFilter/` | 15 operators, presets, persistence |
| **ExportButton** | `components/ExportButton/` | CSV, Excel, PDF, Clipboard export |
| **PermissionGate** | `components/PermissionGate/` | Permission-based UI rendering |
| **ConfirmationModal** | `components/ConfirmationModal/` | Reusable confirmation dialogs |
| **LoadingSkeletons** | `components/LoadingSkeletons/` | Table, stats, detail, dashboard, card skeletons |
| **Settings** | `components/Settings/` | PipelinesSettings, TagManagement, TeamManagement, RolesPermissions |

### Layout & Navigation

- Collapsible sidebar with nested sections
- Fixed header with search, notifications, user profile dropdown
- Sidebar active: Home, Reports, Analytics, Sales, Activities, Settings
- Sidebar commented out (Phase 2): Forecasts, Documents, Campaigns, Inventory, Support, Integrations, Services, Projects
- Mobile: hamburger menu, responsive padding, horizontal table scroll
- Settings: fixed-height desktop layout with inner scrolling

---

## FEATURE STATUS

### Implemented (Live with Real Backend)

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Authentication | Done | Cross-subdomain cookies, auto-refresh |
| Role-Based Access Control | Done | 5 system roles, permission gates, admin bypass |
| Team Management | Done | Invite, edit role, remove (with hierarchy enforcement) |
| Roles & Permissions UI | Done | View roles, edit permissions (admin only) |
| Contacts CRUD | Done | List, create, update, soft delete, merge, bulk ops, company links |
| Companies CRUD | Done | List, create, update, delete, contact links, stats |
| Leads CRUD | Done | List, create, update, soft delete, convert, disqualify, bulk ops |
| Deals CRUD | Done | List, create, update, soft delete, stage moves, win/lose/reopen |
| Pipelines & Stages | Done | CRUD, reorder, default pipeline, kanban view |
| Activities (tasks, notes, calls, emails, meetings) | Done | CRUD, complete, upcoming, overdue, stats, trend |
| Tags | Done | CRUD with entity-type scoping and usage counts |
| Calendar View | Done | Month/week/day/agenda with color-coded activity types |
| Kanban Board | Done | Drag & drop deal pipeline with @dnd-kit |
| Dashboard Charts | Done | 5 Recharts components (sales trend, pipeline, lead source, activity, revenue) |
| Analytics Page | Done | Chart-based analytics |
| Export | Done | CSV, Excel, PDF, Clipboard |
| Advanced Filters | Done | 15 operators, presets |
| Bulk Operations | Done | Delete, update, export |
| Global Search | Done | Backend search across contacts, companies, deals, leads |
| Permission Staleness | Done | Auto-detect stale JWT permissions |
| Audit Logging | Done | CRM-level audit trail |
| Custom Fields | Done | Backend API (frontend form integration pending) |
| Duplicate Detection | Done | Backend check + merge |
| Lead Conversion | Done | Convert lead to contact + company + deal |

### Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Settings | Partial | Sales Pipelines, Tags, Team Management, R&P active; Notifications, Security, API, Data Management commented out |
| Reports | Partial | List and detail pages exist; no report builder or execution engine |
| Profile Settings | Partial | Page exists, image upload UI but no backend |
| Billing | Partial | API integration exists, subscription/usage display |
| Dashboard | Partial | Charts use mock data in some widgets |

### Phase 2 (Scaffolded, Not Active)

| Module | Pages | Forms | Mock API | Notes |
|--------|-------|-------|----------|-------|
| Forecasts | Yes | Yes | Yes | Sidebar commented out |
| Documents | Yes | Yes | Yes | Sidebar commented out |
| Campaigns | Yes | Yes | Yes | Sidebar commented out |
| Products | Yes | Yes | Yes | Sidebar commented out |
| Vendors | Yes | Yes | Yes | Sidebar commented out |
| Purchase Orders | Yes | Yes | Yes | Sidebar commented out |
| Sales Orders | Yes | Yes | Yes | Sidebar commented out |
| Quotes | Yes | Yes | Yes | Sidebar commented out |
| Invoices | Yes | Yes | Yes | Sidebar commented out |
| Price Books | Yes | Yes | Yes | Sidebar commented out |
| Cases | Yes | Yes | Yes | Sidebar commented out |
| Solutions | Yes | Yes | Yes | Sidebar commented out |
| Services | Yes | Yes | Yes | Sidebar commented out |
| Projects | Yes | Yes | Yes | Sidebar commented out |
| Integrations | Yes | — | — | Sidebar commented out |

### Not Implemented

| Feature | Priority |
|---------|----------|
| Custom field frontend integration | High |
| Report builder & execution | High |
| Real-time updates (WebSocket) | Medium |
| Notification system (backend) | Medium |
| 2FA in CRM frontend | Medium |
| Command palette (Cmd+P) | Medium |
| Advanced DataTable (column resize, reorder, pin, expand) | Low |
| Multi-step forms | Low |
| Drag & drop dashboard widgets | Low |
| Offline mode / PWA | Low |
| Mobile bottom navigation | Low |

---

## DEPENDENCIES

### Frontend (`package.json`)

**Core:**
- `next` ^14.2.0, `react` ^18.3.0, `typescript` ^5.4.0
- `tailwindcss` ^3.4.0, `clsx`, `tailwind-merge`, `class-variance-authority`

**Data:**
- `@tanstack/react-query` ^5.40.0 (server state)
- `zustand` ^4.5.0 (client state)

**Forms:**
- `react-hook-form` ^7.51.0, `@hookform/resolvers` ^3.4.0, `zod` ^3.23.0

**UI:**
- `framer-motion` ^11.2.0 (animations)
- `lucide-react` ^0.400.0 (icons)
- `sonner` ^1.5.0 (toasts)
- `@radix-ui/*` (dialog, dropdown-menu, label, select, slot)
- `recharts` ^2.12.0 (charts)
- `react-big-calendar` ^1.19.4 (calendar)
- `@dnd-kit/*` (drag & drop)
- `react-phone-number-input` ^3.4.0

**Export:**
- `xlsx` ^0.18.0, `jspdf` ^4.1.0, `jspdf-autotable` ^5.0.0

**Utilities:**
- `date-fns` ^3.6.0, `axios` ^1.7.0

### Backend (`requirements.txt`)

- Django 5.x, djangorestframework, django-cors-headers, django-filter
- drf-yasg (API docs)
- psycopg2-binary (PostgreSQL)
- django-redis (caching)
- whitenoise (static files)
- truevalue-common (shared gateway auth package)

---

## NOTES

### Strengths
- Clean microservice architecture with proper separation of concerns
- Single API gateway with JWT validation, HMAC signing, rate limiting
- Comprehensive RBAC with role hierarchy and permission staleness detection
- Multi-tenancy via org_id scoping on all models
- Soft delete on critical entities (contacts, leads, deals)
- Audit logging at both CRM and platform level
- Real backend integration for all core CRM features
- Custom fields infrastructure ready
- Clean service layer pattern separating business logic from views

### Areas for Improvement
- Phase 2 modules need backend APIs (currently mock only)
- Custom fields need frontend form integration
- Reports need a builder/execution engine
- Dashboard partially uses mock data
- No WebSocket/real-time features yet
- No notification system backend

---

**Generated:** February 18, 2026
**Project:** TrueValue CRM v2.0.0
**Last Updated:** Backend integrated, RBAC complete, core Sales & Activities live with real API
