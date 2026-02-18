# Project Phases - Complete History & Current State

**Last Updated:** February 18, 2026
**Current Version:** 2.0.0

---

## PHASE 1: Frontend Scaffold (Completed Feb 9, 2026)

Phase 1 built the entire frontend UI with mock data — 21 module pages, forms, state management, charts, kanban, calendar, export, filters, and bulk operations.

### What Was Delivered

**21 Module Pages** (list + detail + form drawer each):
- Sales: Leads, Contacts, Accounts, Deals, Campaigns, Documents, Forecasts
- Inventory: Products, Vendors, Sales Orders, Quotes, Invoices, Purchase Orders, Price Books
- Activities: Tasks, Calls, Meetings
- Support: Cases, Solutions
- Other: Services, Projects

**Core Components:**
- DataTable with sorting, row selection, actions, pagination, mobile scroll
- FormDrawer slide-out forms with React Hook Form + Zod validation
- ExportButton (CSV, Excel, PDF, Clipboard)
- AdvancedFilter (15 operators, 6 field types, AND/OR logic, presets, localStorage)
- BulkActionsToolbar + BulkDeleteModal + BulkUpdateModal
- LoadingSkeletons (table, stats, detail, dashboard, card)
- PageHeader, ViewToggle (list/grid/kanban), ActionMenu

**Data Visualizations:**
- 5 Recharts components: SalesTrend, Pipeline, LeadSource, Activity, RevenueComparison
- Theme-aware colors via CSS variables
- Dashboard + Analytics page integration

**Kanban Board:**
- @dnd-kit drag & drop for deal pipeline
- 5 stages with gradient colors, deal cards, optimistic updates

**Calendar View:**
- react-big-calendar with month/week/day/agenda
- Color-coded events (tasks=teal, calls=coral, meetings=purple)
- Filter toggles, stats dashboard

**State Management:**
- React Query 5.40 (server state, caching, mutations)
- Zustand 4.5 (UI state, view modes, filters, localStorage persistence)
- Mock API layer with simulated network delays for all 21 modules

**Performance:**
- Removed unused packages (~135KB)
- Lazy loaded modals/forms (~80KB)
- Search debouncing (300ms)
- Bundle analyzer setup

---

## PHASE 2: Backend Integration (Feb 10 - Feb 18, 2026)

Phase 2 connected the frontend to real microservice backends, implemented authentication, RBAC, and activated the core CRM modules.

### What Was Delivered

**Backend Integration:**
- Django CRM backend with PostgreSQL, REST API at `/crm/api/v1/`
- All core CRUD operations using real database
- Service layer pattern (BaseService + entity-specific services)
- Multi-tenancy via `org_id` scoping on all models
- Soft delete on contacts, leads, deals
- Audit logging (CRMAuditLog)
- Custom fields infrastructure (model + API, frontend integration pending)

**Authentication:**
- JWT-based auth with TrueValueCRM platform shell
- Cross-subdomain cookie token storage
- Auto token refresh (5 min before expiry)
- Redirect to shell login when unauthenticated
- AuthContext providing user, org, claims, permissions

**Role-Based Access Control:**
- 5 system roles: super_admin (0), org_admin (10), manager (50), member (100), viewer (200)
- Permission format: `resource:action` (39 permission codes)
- `usePermission()` hook with `can()`, `roles`, `isAdmin`
- PermissionGate component for conditional UI rendering
- Backend CRMResourcePermission DRF class
- Admin roles bypass all permission checks
- Permission staleness detection (Redis version + JWT perm_version)

**Real API Endpoints (replacing mock):**

| Resource | Endpoints | Notes |
|----------|-----------|-------|
| Contacts | list, create, get, update, delete, timeline, companies, import, bulk-delete, bulk-update, merge, duplicate-check | Soft delete, M2M companies |
| Companies | list, create, get, update, delete, contacts, stats | Parent company support |
| Leads | list, create, get, update, delete, convert, disqualify, status, bulk-delete, bulk-update, web-form, sources | Conversion to contact+company+deal |
| Deals | list, create, get, update, delete, forecast, move-stage, win, lose, reopen, bulk-delete | Pipeline stages, stage history |
| Pipelines | list, create, get, update, delete, stats, kanban, stages CRUD, reorder | Cached (5 min), default pipeline |
| Activities | list, create, get, update, delete, complete, upcoming, overdue, stats, trend | Types: task, note, call, email, meeting |
| Tags | list, create, get, update, delete | Entity-type scoping, usage counts |
| Members | list, update role, remove, invite | Via Org Service |
| Roles | list, get, get permissions, set permissions | Via Permission Service |

**Settings Tabs (Active):**
- Sales Pipelines — pipeline and stage management
- Tags — tag CRUD with color and entity type
- Team Management — invite, edit role, remove members (with role hierarchy enforcement)
- Roles & Permissions — view roles, toggle permissions (admin only)

**Sidebar Reorganization:**
- Active: Dashboard, Reports, Analytics, Sales (Leads, Contacts, Accounts, Deals), Activities (Calendar, Tasks, Meetings, Calls, Emails, Notes), Settings
- Phase 2 modules commented out: Forecasts, Documents, Campaigns, Inventory (7 modules), Support (2), Services, Projects, Integrations

**UI/UX Improvements:**
- Fixed header positioning (sticky across all pages)
- Settings page fixed-height layout with inner scrolling
- ActionMenu portal-based dropdown (escapes overflow containers)
- Responsive team management and roles & permissions
- Dark mode CSS classes removed (light mode only)

---

## CURRENT FILE STRUCTURE

```
frontend/crm-app/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx                    # Main layout (sidebar, header)
│   │   ├── dashboard/page.tsx            # Dashboard
│   │   ├── reports/page.tsx              # Reports list
│   │   ├── reports/[id]/page.tsx         # Report detail
│   │   ├── analytics/page.tsx            # Analytics
│   │   ├── settings/page.tsx             # Settings (4 tabs)
│   │   ├── settings/profile/page.tsx     # Profile settings
│   │   ├── settings/billing/page.tsx     # Billing settings
│   │   ├── sales/
│   │   │   ├── leads/page.tsx            # Leads (real API)
│   │   │   ├── contacts/page.tsx         # Contacts (real API)
│   │   │   ├── accounts/page.tsx         # Companies (real API)
│   │   │   ├── deals/page.tsx            # Deals + Kanban (real API)
│   │   │   └── [forecasts, documents, campaigns] # Phase 3
│   │   ├── activities/
│   │   │   ├── calendar/page.tsx         # Calendar (real API)
│   │   │   ├── tasks/page.tsx            # Tasks (real API)
│   │   │   ├── meetings/page.tsx         # Meetings (real API)
│   │   │   ├── calls/page.tsx            # Calls (real API)
│   │   │   ├── emails/page.tsx           # Emails (real API)
│   │   │   └── notes/page.tsx            # Notes (real API)
│   │   └── [inventory, support, services, projects, integrations] # Phase 3
│   └── globals.css
├── components/
│   ├── ActionMenu/                       # Portal-based dropdown menu
│   ├── AdvancedFilter/                   # 15-operator filter system
│   ├── BulkDeleteModal/                  # Bulk delete confirmation
│   ├── BulkUpdateModal/                  # Bulk update modal
│   ├── Calendar/                         # ActivityCalendar
│   ├── Charts/                           # 5 Recharts components
│   ├── ConfirmationModal/                # Reusable confirmation
│   ├── DataTable/                        # Sortable table with selection
│   ├── DuplicateWarningModal/            # Duplicate detection UI
│   ├── ErrorBoundary/                    # Error boundary
│   ├── ExportButton/                     # CSV/Excel/PDF/Clipboard
│   ├── Forms/                            # FormDrawer + configs
│   │   ├── FormDrawer/                   # Slide-out form component
│   │   ├── Sales/                        # Account, Contact, Deal, Lead forms
│   │   └── Activities/                   # Task, Note, Meeting, Call, Email forms
│   ├── ImportModal/                      # Data import
│   ├── KanbanBoard/                      # Drag & drop pipeline
│   ├── LeadConversionModal/              # Lead → Contact+Company+Deal
│   ├── LinkContactModal/                 # Link contact to entity
│   ├── LinkCompanyModal/                 # Link company to entity
│   ├── LoadingSkeletons/                 # Skeleton components
│   ├── MergeContactModal/                # Contact merge
│   ├── NotificationPanel/                # Notification UI
│   ├── PageHeader/                       # Page header with stats toggle
│   ├── PermissionGate/                   # Permission-based rendering
│   ├── Settings/                         # Settings tab components
│   │   ├── PipelinesSettings.tsx         # Pipeline & stage management
│   │   ├── TagManagementSettings.tsx     # Tag CRUD
│   │   ├── TeamManagementSettings.tsx    # Member management with hierarchy
│   │   ├── RolesPermissionsSettings.tsx  # Role permission editing
│   │   └── IntegrationsSettings.tsx      # Integrations (Phase 3)
│   ├── ViewToggle/                       # List/Grid/Kanban toggle
│   ├── providers/                        # Provider composition
│   └── ui/                               # Primitives (button, input, card, etc.)
├── contexts/
│   ├── AuthContext.tsx                    # JWT auth, user, org, signout
│   └── UserContext.tsx                    # Profile data (localStorage)
├── lib/
│   ├── api/
│   │   ├── client.ts                     # API client, token management, refresh
│   │   ├── contacts.ts                   # Contacts API (real backend)
│   │   ├── companies.ts                  # Companies API (real backend)
│   │   ├── leads.ts                      # Leads API (real backend)
│   │   ├── deals.ts                      # Deals API (real backend)
│   │   ├── activities.ts                 # Activities API (real backend)
│   │   ├── tasks.ts                      # Tasks (via activities)
│   │   ├── notes.ts                      # Notes (via activities)
│   │   ├── meetings.ts                   # Meetings (via activities)
│   │   ├── calls.ts                      # Calls (via activities)
│   │   ├── emails.ts                     # Emails (via activities)
│   │   ├── tags.ts                       # Tags API (real backend)
│   │   ├── pipelines.ts                  # Pipelines API (real backend)
│   │   ├── members.ts                    # Org members API
│   │   ├── permissions-api.ts            # Permission Service API
│   │   ├── billing.ts                    # Billing Service API
│   │   ├── accounts.ts                   # Re-exports companiesApi
│   │   └── mock/                         # Mock APIs for Phase 3 modules
│   ├── queries/
│   │   ├── useContacts.ts                # Real backend hooks
│   │   ├── useCompanies.ts
│   │   ├── useLeads.ts
│   │   ├── useDeals.ts
│   │   ├── useActivities.ts
│   │   ├── useTasks.ts, useNotes.ts, useMeetings.ts, useCalls.ts, useEmails.ts
│   │   ├── useTags.ts, usePipelines.ts
│   │   ├── useMembers.ts
│   │   ├── useRolesPermissions.ts
│   │   ├── useBilling.ts, useAccounts.ts
│   │   └── [mock-backed hooks for Phase 3]
│   ├── permissions.ts                    # Permission constants, usePermission hook
│   ├── export/                           # CSV, Excel, PDF, Clipboard utilities
│   └── toast.ts                          # Toast helpers
├── stores/
│   └── useUIStore.ts                     # Zustand UI state
└── hooks/
    ├── useKeyboardShortcuts.ts
    ├── useFilterPresets.ts
    └── useDebounce.ts
```

---

## BACKEND STRUCTURE

```
backend/crm/
├── crm/
│   ├── models.py                         # All CRM models (Contact, Company, Lead, Deal, Pipeline, Activity, Tag, CustomField, AuditLog)
│   ├── views.py                          # All REST API views
│   ├── serializers.py                    # DRF serializers (full, list, minimal, special)
│   ├── permissions.py                    # CRMResourcePermission (resource:action checks)
│   ├── middleware.py                     # PermissionStalenessMiddleware
│   ├── urls.py                           # API URL routing (/api/v1/)
│   ├── internal_urls.py                  # Service-to-service (/internal/)
│   ├── internal_views.py                 # Internal views (org stats, usage, permission invalidation)
│   ├── exceptions.py                     # Custom exceptions
│   ├── services/
│   │   ├── base_service.py               # OrgScoped CRUD, audit, tags, billing sync
│   │   ├── contact_service.py            # Contacts + merge, import, bulk ops
│   │   ├── company_service.py            # Companies + contacts, stats
│   │   ├── lead_service.py               # Leads + convert, disqualify, bulk ops
│   │   ├── deal_service.py               # Deals + stage moves, win/lose, kanban, forecast
│   │   ├── pipeline_service.py           # Pipelines + stages, reorder, caching
│   │   ├── activity_service.py           # Activities + complete, upcoming, overdue, stats
│   │   └── tag_service.py                # Tags + counts, bulk tag, merge
│   └── management/commands/
│       ├── seed_tasks.py                 # Seed sample tasks
│       ├── seed_companies.py             # Seed sample companies
│       ├── sync_billing_usage.py         # Sync billing usage
│       └── clear_crm_data.py             # Clear all CRM data
├── crm_service/
│   ├── settings.py                       # Django settings (DB, middleware, Redis, JWT, service URLs)
│   └── urls.py                           # Root URL config
└── staticfiles/                          # DRF browsable API, Swagger
```

---

## INTEGRATION MATRIX

### Active Modules (Real Backend)

| Module | List | Detail | Create | Update | Delete | Bulk Ops | Special |
|--------|------|--------|--------|--------|--------|----------|---------|
| Contacts | Done | Done | Done | Done | Soft delete | Delete, Update | Merge, Import, Company links, Timeline |
| Companies | Done | Done | Done | Done | Done | — | Contact links, Stats |
| Leads | Done | Done | Done | Done | Soft delete | Delete, Update | Convert, Disqualify, Status, Sources, Web form |
| Deals | Done | Done | Done | Done | Soft delete | Delete | Stage move, Win/Lose/Reopen, Forecast, Kanban |
| Pipelines | Done | — | Done | Done | Done | — | Stages CRUD, Reorder, Stats, Kanban |
| Activities | Done | Done | Done | Done | Done | — | Complete, Upcoming, Overdue, Stats, Trend |
| Tags | Done | — | Done | Done | Done | — | Usage counts, Entity-type scoping |

### Settings (Real Backend)

| Tab | Component | API | Status |
|-----|-----------|-----|--------|
| Sales Pipelines | PipelinesSettings | `/crm/api/v1/pipelines` | Done |
| Tags | TagManagementSettings | `/crm/api/v1/tags` | Done |
| Team Management | TeamManagementSettings | `/org/api/v1/orgs/{id}/members` | Done (with role hierarchy) |
| Roles & Permissions | RolesPermissionsSettings | `/permission/api/v1/roles` | Done |

### Phase 3 Modules (Mock Data, Sidebar Commented Out)

| Module | Frontend | Mock API | Backend API | Status |
|--------|----------|----------|-------------|--------|
| Forecasts | Done | Done | Not built | Needs backend |
| Documents | Done | Done | Not built | Needs backend |
| Campaigns | Done | Done | Not built | Needs backend |
| Products | Done | Done | Not built | Needs backend |
| Vendors | Done | Done | Not built | Needs backend |
| Sales Orders | Done | Done | Not built | Needs backend |
| Quotes | Done | Done | Not built | Needs backend |
| Invoices | Done | Done | Not built | Needs backend |
| Purchase Orders | Done | Done | Not built | Needs backend |
| Price Books | Done | Done | Not built | Needs backend |
| Cases | Done | Done | Not built | Needs backend |
| Solutions | Done | Done | Not built | Needs backend |
| Services | Done | Done | Not built | Needs backend |
| Projects | Done | Done | Not built | Needs backend |

---

## TECHNOLOGY STACK

### Frontend
- Next.js 14.2 (App Router), React 18.3, TypeScript 5.4
- Tailwind CSS 3.4, Framer Motion 11.2
- React Query 5.40, Zustand 4.5
- React Hook Form 7.51, Zod 3.23
- Recharts 2.12, @dnd-kit, react-big-calendar
- Lucide React, Sonner, @radix-ui/*
- xlsx, jspdf, jspdf-autotable

### Backend
- Django 5.x, Django REST Framework
- PostgreSQL, Redis
- drf-yasg (API docs)
- truevalue-common (gateway auth)

### Platform (TrueValueCRM repo)
- Gateway: FastAPI (port 8000)
- Auth, Org, Permission, Billing, Audit-Log: Django (internal port 8000 each)
- Analytics: Python Kafka consumer
- Admin Panel: Django (port 8010)
- Infrastructure: PostgreSQL (5433), Redis (6379), Kafka (9092), Elasticsearch (9200)

---

## ESTABLISHED PATTERNS

| Pattern | Description |
|---------|-------------|
| **Service Layer** | Business logic in service classes, views are thin |
| **Org-Scoped Models** | All CRM models have `org_id` for multi-tenancy |
| **Soft Delete** | Contacts, leads, deals use `deleted_at` instead of hard delete |
| **Display Interface** | Schema-to-display field reconciliation for forms |
| **Filter Dropdown** | `useRef` + `AnimatePresence` + click-outside detection |
| **Field Mapping** | Prevents empty fields on create/update |
| **Permission Gate** | `can(PERMISSION_CODE)` for conditional UI |
| **Role Hierarchy** | Lower level = more privileged; prevent privilege escalation |
| **Portal Dropdown** | ActionMenu uses `createPortal` to escape overflow containers |
| **Token Refresh** | Auto-refresh 5 min before expiry; stale detection via Redis |
| **Audit Logging** | All CRM mutations logged with actor, action, changes |

---

## WHAT'S NEXT

### High Priority
- Custom fields frontend integration (backend API exists)
- Report builder and execution engine
- Dashboard widgets with real API data (some still mock)
- Notification system backend

### Medium Priority
- WebSocket/real-time updates
- 2FA in CRM frontend
- Command palette (Cmd+P)
- Profile settings backend integration

### Phase 3 (When Needed)
- Build backend APIs for remaining 14 modules
- Uncomment sidebar items and switch from mock to real APIs
- Inventory, Support, Services, Projects, Integrations

---

**Phase 1 (Feb 9):** Frontend scaffold complete — 21 modules, mock data, all UI components
**Phase 2 (Feb 18):** Backend integrated — auth, RBAC, real APIs for core Sales + Activities + Settings
**Phase 3:** Remaining 14 modules need backend APIs
