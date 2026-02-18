# CRM Permissions & Authentication Flow

## Overview

Permissions and roles are **defined** in the Permission Service and **enforced** in the CRM backend. The CRM backend does not store or manage permission definitions — it reads JWT claims and makes allow/deny decisions.

---

## Architecture

```
Permission Service          Auth Service              CRM Backend
(source of truth)           (token issuer)            (consumer/enforcer)
                                                      
defines roles/perms  --->   stamps into JWT  --->     reads from JWT, enforces
```

---

## Authentication Flow

### Standard Flow (Gateway — all environments)

The CRM backend always runs behind the API Gateway (Docker). There is no fallback.

```
Browser --> API Gateway --> CRM Backend
```

1. Frontend sends request with `Authorization: Bearer <token>`
2. **API Gateway** validates JWT, signs request with HMAC, injects headers:
   - `X-User-ID`, `X-Org-ID`, `X-User-Roles`, `X-User-Permissions`
   - `X-Gateway-Timestamp`, `X-Gateway-Signature` (HMAC proof)
3. **`GatewayAuthMiddleware`** validates HMAC signature (rejects forged/direct requests with 401)
4. **`GatewayAuthentication`** (DRF auth class) reads `request.gateway_user` → creates `GatewayUser` with `.roles` and `.permissions`
5. **`CRMResourcePermission`** checks `request.user.permissions` against the view's `resource` attribute
6. Request is allowed or denied

Any request without a valid gateway HMAC signature is rejected at step 3.

### Service-to-Service Flow (Internal)

```
Permission Service --> CRM Internal Endpoints
```

- Uses separate HMAC authentication (per-service secrets)
- Defined in `internal_urls.py`
- Protected by `ServiceAuthMiddleware`
- Example: `POST /internal/users/{id}/invalidate-permissions`

---

## File Responsibilities

| File | Purpose |
|---|---|
| `permissions.py` | DRF permission class — reads `request.user.permissions` (from GatewayUser), enforces `resource:action` checks |
| `middleware.py` | Detects stale JWT permissions (after role change) and forces token refresh |
| `internal_urls.py` | Service-to-service endpoints (HMAC auth) |

---

## Permission Enforcement (`permissions.py`)

### How `CRMResourcePermission` Works

Each view declares a `resource`:
```python
class ContactListView(BaseAPIView):
    resource = 'contacts'
```

The permission class maps HTTP method to action:
```
GET    --> read
POST   --> write
PATCH  --> write
DELETE --> delete
```

Result: `GET /contacts` requires `contacts:read` in the user's JWT permissions.

Views can override with `permission_action`:
```python
class ContactImportView(BaseAPIView):
    resource = 'contacts'
    permission_action = 'import'  # requires contacts:import
```

### Admin Role Bypass

```python
ADMIN_ROLES = {'super_admin', 'org_admin', 'owner', 'admin'}
```

Admin roles skip individual permission checks. This is standard RBAC — admins have full access by definition, so you don't need to maintain 30+ explicit permission assignments for admin roles. If a new permission is added, admins automatically have it.

**What is NOT bypassed even for admins:**
- Authentication (still need a valid JWT)
- Org isolation (only see your org's data)

### Object-Level Permissions

For write/delete operations on specific records:
- Admins and managers → can modify any record in their org
- Regular users → can only modify records they own (`owner_id` match)

---

## Permission Staleness (`middleware.py`)

### Problem
When an admin changes a user's role, the user's JWT still has old permissions until it expires.

### Solution

```
1. Admin changes role
   --> Permission Service calls CRM: POST /internal/users/{id}/invalidate-permissions
   --> CRM stores new timestamp in Redis: perm_version:{user_id} = now()

2. User makes next request
   --> middleware.py compares JWT's perm_version vs Redis version
   --> JWT is older? Return 401 with X-Permission-Stale header
   --> Frontend catches this, triggers token refresh
   --> New token has updated permissions
```

---

## Dynamic Resource Resolution (Tasks vs Activities)

Tasks and activities share the same backend views. The `ActivityResourceMixin` dynamically resolves the resource:

```python
class ActivityResourceMixin:
    resource = 'activities'

    def get_resource(self, request):
        activity_type = request.query_params.get('type')
        return 'tasks' if activity_type == 'task' else 'activities'
```

- `GET /activities?type=task` → checks `tasks:read`
- `GET /activities?type=call` → checks `activities:read`
- `POST /activities` with `activity_type: "task"` → checks `tasks:write`

---

## Frontend Permission Constants (`lib/permissions.ts`)

Frontend mirrors the same permission codes for UI gating:

```typescript
export const CONTACTS_READ = 'contacts:read';
export const CONTACTS_WRITE = 'contacts:write';
```

Used via the `usePermission` hook:
```typescript
const { can } = usePermission();
if (can(CONTACTS_WRITE)) { /* show create button */ }
```

Same admin bypass logic applies on frontend — admin roles return `true` for all permission checks.

---

## Security Notes

- CRM backend is NOT publicly accessible — only the gateway is exposed
- `GatewayAuthMiddleware` validates HMAC on every request — direct access without gateway is rejected with 401
- No fallback authentication exists — gateway is the only auth path
- Internal endpoints use separate per-service HMAC auth
- Org isolation is enforced at the service layer, not just permissions
