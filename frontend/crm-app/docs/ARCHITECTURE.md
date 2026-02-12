# CRM Frontend - Architecture & Integration Guide

This document explains how the CRM frontend integrates with the TrueValueCRM platform, including authentication, API communication, and the micro frontend architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Authentication Flow](#authentication-flow)
4. [API Integration](#api-integration)
5. [Micro Frontend Pattern](#micro-frontend-pattern)
6. [Project Structure](#project-structure)
7. [Environment Configuration](#environment-configuration)
8. [Development Workflow](#development-workflow)
9. [Key Files Reference](#key-files-reference)

---

## Overview

The CRM is a **micro frontend application** that runs as a separate Next.js app, integrated with the TrueValueCRM platform via:

- **Shared Authentication**: Cookie-based token sharing with the main shell
- **API Gateway**: All API calls go through the TrueValueCRM gateway
- **CRM Microservice**: Backend business logic for leads, contacts, deals, etc.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| State Management | TanStack Query (server state), Zustand (UI state) |
| Styling | Tailwind CSS, shadcn/ui components |
| HTTP Client | Axios with interceptors |
| Backend | Django REST Framework (CRM microservice) |
| Database | PostgreSQL (dedicated CRM database) |
| Gateway | FastAPI (TrueValueCRM API Gateway) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐         ┌─────────────────────┐                   │
│   │   TrueValueCRM      │         │   CRM Frontend      │                   │
│   │   Shell (Main App)  │         │   (This Project)    │                   │
│   │   localhost:3000    │         │   localhost:3001    │                   │
│   │                     │         │                     │                   │
│   │   - Login/Register  │ ──────► │   - Leads           │                   │
│   │   - Onboarding      │ Cookies │   - Contacts        │                   │
│   │   - Product Select  │ Shared  │   - Deals           │                   │
│   │                     │         │   - Dashboard       │                   │
│   └─────────────────────┘         └──────────┬──────────┘                   │
│                                              │                               │
└──────────────────────────────────────────────┼───────────────────────────────┘
                                               │ API Calls
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (localhost:8000)                         │
│                                                                              │
│   - JWT Validation        - Rate Limiting       - Request Routing            │
│   - HMAC Signing          - CORS Handling       - Service Discovery          │
│                                                                              │
└────────────┬────────────────────┬────────────────────┬───────────────────────┘
             │                    │                    │
             ▼                    ▼                    ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│   Auth Service     │ │   CRM Service      │ │   Other Services   │
│   localhost:8001   │ │   localhost:8003   │ │   (Org, Billing..) │
│                    │ │                    │ │                    │
│   - Login/Logout   │ │   - Leads CRUD     │ │                    │
│   - Token Refresh  │ │   - Contacts CRUD  │ │                    │
│   - User Mgmt      │ │   - Deals CRUD     │ │                    │
│                    │ │   - Activities     │ │                    │
└────────────────────┘ └─────────┬──────────┘ └────────────────────┘
                                 │
                                 ▼
                      ┌────────────────────┐
                      │   PostgreSQL       │
                      │   CRM Database     │
                      │                    │
                      │   - leads          │
                      │   - contacts       │
                      │   - deals          │
                      │   - accounts       │
                      └────────────────────┘
```

---

## Authentication Flow

### How Auth Works (Cookie-Based SSO)

```
1. User logs in on Shell (localhost:3000)
   │
   ▼
2. Shell stores tokens in cookies:
   - access_token (JWT, 7 days)
   - refresh_token (30 days)
   - expires_at (timestamp)
   │
   │  Cookies are shared across localhost ports
   │  (In production: shared via domain=.truevaluecrm.com)
   │
   ▼
3. User clicks "Activate CRM" → Opens localhost:3001/dashboard
   │
   ▼
4. CRM Frontend reads cookies automatically
   │
   ▼
5. AuthContext decodes JWT → Sets user/organization state
   │
   ▼
6. API calls include Authorization: Bearer <token>
```

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "org_id": "org-uuid",
  "org_slug": "acme-corp",
  "org_name": "Acme Corporation",
  "roles": ["admin", "sales_manager"],
  "permissions": ["leads.create", "leads.read", "deals.manage"],
  "plan": "professional",
  "exp": 1699999999,
  "iat": 1699900000
}
```

### Token Refresh Flow

```
1. Before each API call, check if token expires in < 5 minutes
   │
   ▼
2. If expiring soon → Call /auth/auth/refresh with refresh_token
   │
   ▼
3. Receive new tokens → Update cookies
   │
   ▼
4. Continue with original API call
```

---

## API Integration

### API Client Architecture

```
lib/api/
├── client.ts          # Axios client with interceptors, TokenManager
├── leads.ts           # Leads API facade (switches mock/real)
├── mock/
│   └── leads.ts       # Mock implementation for development
├── real/
│   └── leads.ts       # Real API calls to backend
└── adapters/
    └── leadAdapter.ts # Transform backend ↔ frontend data formats
```

### Request Flow

```
Component
    │
    ▼
useLeads() hook (TanStack Query)
    │
    ▼
leadsApi.getAll() (lib/api/leads.ts)
    │
    ▼
realLeadsApi.getAll() (lib/api/real/leads.ts)
    │
    ▼
apiClient.get('/crm/api/v1/leads') (lib/api/client.ts)
    │
    │  Interceptor adds: Authorization: Bearer <token>
    │
    ▼
API Gateway (localhost:8000)
    │
    │  Validates JWT, adds HMAC signature
    │
    ▼
CRM Service (localhost:8003)
    │
    ▼
Response → leadAdapter.toFrontendLead() → Component
```

### API Endpoints (via Gateway)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/crm/api/v1/leads` | GET | List all leads |
| `/crm/api/v1/leads` | POST | Create lead |
| `/crm/api/v1/leads/{id}` | GET | Get lead by ID |
| `/crm/api/v1/leads/{id}` | PUT | Update lead |
| `/crm/api/v1/leads/{id}` | DELETE | Delete lead |
| `/crm/api/v1/leads/{id}/convert` | POST | Convert lead to contact |
| `/crm/api/v1/contacts` | GET/POST | Contacts CRUD |
| `/crm/api/v1/deals` | GET/POST | Deals CRUD |
| `/crm/api/v1/accounts` | GET/POST | Accounts CRUD |

### Data Transformation

Backend uses `snake_case` and UUIDs. Frontend uses `camelCase` and numeric IDs for UI.

```typescript
// Backend (Python/Django)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "lead_status": "new",
  "created_at": "2024-01-15T10:30:00Z"
}

// Frontend (TypeScript/React)
{
  id: 1,
  backendId: "550e8400-e29b-41d4-a716-446655440000",
  firstName: "John",
  lastName: "Doe",
  status: "new",
  createdAt: "2024-01-15T10:30:00Z"
}
```

See `lib/api/adapters/leadAdapter.ts` for transformation logic.

---

## Micro Frontend Pattern

### Why Micro Frontends?

- **Independent Deployment**: CRM can be deployed without affecting other products
- **Team Autonomy**: CRM team can choose their own tech stack/versions
- **Scalability**: Each product scales independently
- **Isolation**: Bugs in CRM don't crash the main shell

### How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                    Production Setup                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   app.truevaluecrm.com (Shell)                               │
│       │                                                       │
│       ├── Login/Register                                      │
│       ├── Onboarding                                          │
│       └── Product Selection → Redirect to:                    │
│                                                               │
│   crm.truevaluecrm.com (This App)                            │
│       │                                                       │
│       ├── /dashboard                                          │
│       ├── /sales/leads                                        │
│       ├── /sales/contacts                                     │
│       └── /sales/deals                                        │
│                                                               │
│   billing.truevaluecrm.com (Future)                          │
│   analytics.truevaluecrm.com (Future)                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Cookie Sharing (SSO)

```javascript
// Cookies set with domain=.truevaluecrm.com
// Automatically shared across all subdomains

document.cookie = `access_token=${token}; domain=.truevaluecrm.com; path=/; SameSite=Lax; Secure`;
```

---

## Project Structure

```
CRM/
├── app/                      # Next.js App Router
│   ├── (app)/               # Authenticated routes (with sidebar/header)
│   │   ├── layout.tsx       # Dashboard layout
│   │   ├── dashboard/       # Dashboard page
│   │   ├── sales/           # Sales module
│   │   │   ├── leads/       # Leads pages
│   │   │   ├── contacts/    # Contacts pages
│   │   │   └── deals/       # Deals pages
│   │   └── settings/        # Settings pages
│   ├── layout.tsx           # Root layout (providers)
│   └── globals.css          # Global styles
│
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── providers.tsx        # QueryClient + AuthProvider
│   └── ...
│
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication state
│
├── lib/                     # Utilities and API
│   ├── api/                 # API layer
│   │   ├── client.ts        # Axios client + TokenManager
│   │   ├── leads.ts         # Leads API facade
│   │   ├── mock/            # Mock implementations
│   │   ├── real/            # Real API implementations
│   │   └── adapters/        # Data transformers
│   ├── queries/             # TanStack Query hooks
│   │   └── useLeads.ts      # Leads query hooks
│   └── utils.ts             # Utility functions
│
├── stores/                  # Zustand stores
│   └── uiStore.ts           # UI state (sidebar, modals)
│
├── types/                   # TypeScript types
│   └── index.ts             # Shared types
│
├── .env.local               # Local environment variables
├── .env.example             # Environment template
└── package.json             # Dependencies
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.local

# API Gateway URL (TrueValueCRM backend)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Shell/Main App URL (for redirects after logout)
NEXT_PUBLIC_SHELL_URL=http://localhost:3000

# Use mock API instead of real backend (development only)
NEXT_PUBLIC_USE_MOCK_API=false
```

### Production Environment

```bash
# .env.production

NEXT_PUBLIC_API_URL=https://api.truevaluecrm.com
NEXT_PUBLIC_SHELL_URL=https://app.truevaluecrm.com
NEXT_PUBLIC_USE_MOCK_API=false
```

---

## Development Workflow

### Starting Development

```bash
# 1. Start TrueValueCRM backend (from TrueValueCRM directory)
docker-compose up -d

# 2. Start TrueValueCRM shell (from TrueValueCRM/frontend)
cd ../TrueValueCRM/frontend
npm run dev  # Runs on localhost:3000

# 3. Start CRM frontend (from this directory)
npm run dev  # Runs on localhost:3001
```

### Development Flow

```
1. Login on Shell (localhost:3000)
   │
2. Go to Onboarding → Select CRM → Click "Activate"
   │
3. CRM opens in new tab (localhost:3001/dashboard)
   │
4. Make changes in CRM codebase
   │
5. Hot reload updates the page
```

### Switching Between Mock and Real API

```bash
# Use mock data (no backend needed)
NEXT_PUBLIC_USE_MOCK_API=true

# Use real backend
NEXT_PUBLIC_USE_MOCK_API=false
```

### Adding a New API Endpoint

1. **Create real API function** in `lib/api/real/`
2. **Create adapter** in `lib/api/adapters/` if data transformation needed
3. **Create mock** in `lib/api/mock/` for development
4. **Create facade** in `lib/api/` that switches based on env
5. **Create query hook** in `lib/queries/`
6. **Use in component** via the hook

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/api/client.ts` | Axios client, TokenManager, CookieUtils |
| `contexts/AuthContext.tsx` | User/org state, JWT decoding, auth checks |
| `components/providers.tsx` | QueryClient + AuthProvider setup |
| `app/(app)/layout.tsx` | Dashboard layout with sidebar/header |
| `lib/api/leads.ts` | Leads API facade (mock/real switching) |
| `lib/queries/useLeads.ts` | TanStack Query hooks for leads |
| `lib/api/adapters/leadAdapter.ts` | Backend ↔ Frontend data transformation |

---

## Troubleshooting

### "No auth token found, redirecting to login"

- Cookies not set. Login on Shell (localhost:3000) first.
- Check browser DevTools → Application → Cookies for `access_token`.

### API calls returning 401

- Token expired. Refresh the page or re-login.
- Check if `NEXT_PUBLIC_API_URL` is correct.

### CORS errors

- Ensure API Gateway has CORS configured for `localhost:3001`.
- Check `docker-compose.yml` for gateway CORS settings.

### Data not showing

- Check if `NEXT_PUBLIC_USE_MOCK_API` is set correctly.
- Check browser console for API errors.
- Verify the CRM service is running (`docker ps`).

---

## Related Documentation

- [TrueValueCRM Backend Architecture](../TrueValueCRM/README.md)
- [API Gateway Documentation](../TrueValueCRM/services/gateway/README.md)
- [CRM Service API Docs](../TrueValueCRM/services/crm/README.md)

---

*Last updated: February 2025*
