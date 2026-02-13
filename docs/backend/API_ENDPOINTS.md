# TrueValue CRM - Complete API Endpoints Reference

**Last Updated**: February 5, 2026  
**Gateway URL**: `http://localhost:8000`

---

## Table of Contents

1. [API Gateway](#api-gateway)
2. [Auth Service](#auth-service)
3. [Organization Service](#organization-service)
4. [Permission Service](#permission-service)
5. [Billing Service](#billing-service)
6. [Audit Log Service](#audit-log-service)
7. [Admin Panel Service](#admin-panel-service)
8. [Internal APIs (Service-to-Service)](#internal-apis-service-to-service)

---

## Request Format

All requests through the API Gateway follow this pattern:

```
{GATEWAY_URL}/{service}/{endpoint_path}
```

### Example:
- Frontend calls: `http://localhost:8000/auth/auth/login`
- Gateway routes to: `http://auth-service:8000/auth/login`

### Authentication:
Most endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

### Organization Context:
Multi-tenant endpoints require org context:
```
X-Org-ID: <organization_uuid>
```

---

## API Gateway

**Base URL**: `http://localhost:8000`

### Gateway Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Root endpoint, gateway info | No |
| GET | `/health` | Gateway health check | No |
| GET | `/health/detailed` | Detailed health of all services | No |
| GET | `/health/ready` | Kubernetes readiness probe | No |
| GET | `/health/live` | Kubernetes liveness probe | No |

### Gateway Routing Pattern

All service requests are proxied through:
```
/{service}/{path}
```

**Security Features**:
- JWT validation via middleware
- HMAC request signing to backend services
- Organization membership validation
- Rate limiting (per user/IP)
- Request tracing (X-Request-ID header)

---

## Auth Service

**Service Prefix**: `/auth`  
**Full Gateway Path**: `http://localhost:8000/auth/auth/*`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/auth/login` | User login (credentials) | No |
| POST | `/auth/auth/select-org` | Select organization after login | No |
| POST | `/auth/auth/mfa/verify` | Verify MFA code | No |
| POST | `/auth/auth/refresh` | Refresh access token | No |
| POST | `/auth/auth/logout` | Logout current session | Yes |
| POST | `/auth/auth/logout-all` | Logout all sessions | Yes |
| POST | `/auth/auth/switch-org` | Switch active organization | Yes |

### Registration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/auth/register` | Register new user (Step 1) | No |
| POST | `/auth/auth/setup-organization` | Create organization (Step 2) | No |

**Registration Flow**:
1. `/register` - Creates user with `PENDING_ORG` status (email, password, first_name, last_name)
2. `/setup-organization` - Creates organization and auto-login (user_id, password, company_name, company_size)

### Password Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/auth/password/reset-request` | Request password reset email | No |
| POST | `/auth/auth/password/reset` | Reset password with token | No |
| POST | `/auth/auth/password/change` | Change password | Yes |

### Session Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/auth/sessions` | List active sessions | Yes |
| DELETE | `/auth/auth/sessions/<session_id>` | Revoke specific session | Yes |

### MFA Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/auth/mfa/methods` | List MFA methods | Yes |
| POST | `/auth/auth/mfa/totp/enroll` | Enroll TOTP authenticator | Yes |
| POST | `/auth/auth/mfa/totp/verify-enrollment` | Verify TOTP enrollment | Yes |
| DELETE | `/auth/auth/mfa/<method_id>` | Remove MFA method | Yes |
| POST | `/auth/auth/mfa/backup-codes/regenerate` | Regenerate backup codes | Yes |

### Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/health/` | Health check | No |
| GET | `/auth/health/ready` | Readiness probe | No |
| GET | `/auth/health/live` | Liveness probe | No |

---

## Organization Service

**Service Prefix**: `/org`  
**Full Gateway Path**: `http://localhost:8000/org/api/v1/*`

### Organizations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/org/api/v1/orgs` | List user's organizations | Yes |
| POST | `/org/api/v1/orgs` | Create new organization | Yes |
| GET | `/org/api/v1/orgs/<org_id>` | Get organization details | Yes |
| PATCH | `/org/api/v1/orgs/<org_id>` | Update organization | Yes |
| DELETE | `/org/api/v1/orgs/<org_id>` | Delete organization | Yes |

### Members

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/org/api/v1/orgs/<org_id>/members` | List organization members | Yes |
| GET | `/org/api/v1/orgs/<org_id>/members/<user_id>` | Get member details | Yes |
| PATCH | `/org/api/v1/orgs/<org_id>/members/<user_id>` | Update member role | Yes |
| DELETE | `/org/api/v1/orgs/<org_id>/members/<user_id>` | Remove member | Yes |
| POST | `/org/api/v1/orgs/<org_id>/transfer-ownership` | Transfer ownership | Yes |
| POST | `/org/api/v1/orgs/<org_id>/leave` | Leave organization | Yes |

### Invitations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/org/api/v1/orgs/<org_id>/invites` | List pending invites | Yes |
| POST | `/org/api/v1/orgs/<org_id>/invites` | Create invite | Yes |
| GET | `/org/api/v1/orgs/<org_id>/invites/<invite_id>` | Get invite details | Yes |
| DELETE | `/org/api/v1/orgs/<org_id>/invites/<invite_id>` | Cancel invite | Yes |
| GET | `/org/api/v1/invites/<token>` | Get invite by token | No |
| POST | `/org/api/v1/invites/accept` | Accept invite | Yes |
| POST | `/org/api/v1/invites/<token>/decline` | Decline invite | No |

### Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/org/api/v1/orgs/<org_id>/profile` | Get user's org profile | Yes |
| PATCH | `/org/api/v1/orgs/<org_id>/profile` | Update org profile | Yes |

### Teams

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/org/api/v1/orgs/<org_id>/teams` | List teams | Yes |
| POST | `/org/api/v1/orgs/<org_id>/teams` | Create team | Yes |
| GET | `/org/api/v1/orgs/<org_id>/teams/<team_id>` | Get team details | Yes |
| PATCH | `/org/api/v1/orgs/<org_id>/teams/<team_id>` | Update team | Yes |
| DELETE | `/org/api/v1/orgs/<org_id>/teams/<team_id>` | Delete team | Yes |
| GET | `/org/api/v1/orgs/<org_id>/teams/<team_id>/members` | List team members | Yes |
| POST | `/org/api/v1/orgs/<org_id>/teams/<team_id>/members` | Add team member | Yes |
| DELETE | `/org/api/v1/orgs/<org_id>/teams/<team_id>/members/<member_id>` | Remove team member | Yes |
| GET | `/org/api/v1/orgs/<org_id>/my-teams` | Get user's teams | Yes |

### Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/org/health/` | Health check | No |
| GET | `/org/health/ready` | Readiness probe | No |
| GET | `/org/health/live` | Liveness probe | No |

---

## Permission Service

**Service Prefix**: `/permission`  
**Full Gateway Path**: `http://localhost:8000/permission/api/v1/*`

### Permissions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permission/api/v1/permissions` | List permissions | Yes |
| POST | `/permission/api/v1/permissions` | Create permission | Yes |
| GET | `/permission/api/v1/permissions/<permission_id>` | Get permission details | Yes |
| PATCH | `/permission/api/v1/permissions/<permission_id>` | Update permission | Yes |
| DELETE | `/permission/api/v1/permissions/<permission_id>` | Delete permission | Yes |

### Roles

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permission/api/v1/roles` | List roles | Yes |
| POST | `/permission/api/v1/roles` | Create role | Yes |
| GET | `/permission/api/v1/roles/<role_id>` | Get role details | Yes |
| PATCH | `/permission/api/v1/roles/<role_id>` | Update role | Yes |
| DELETE | `/permission/api/v1/roles/<role_id>` | Delete role | Yes |
| GET | `/permission/api/v1/roles/<role_id>/permissions` | Get role permissions | Yes |
| PUT | `/permission/api/v1/roles/<role_id>/permissions` | Update role permissions | Yes |

### Role Assignments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permission/api/v1/assignments` | List role assignments | Yes |
| POST | `/permission/api/v1/assignments` | Assign role to user | Yes |
| DELETE | `/permission/api/v1/assignments` | Remove role from user | Yes |
| GET | `/permission/api/v1/users/<user_id>/roles` | Get user's roles | Yes |
| GET | `/permission/api/v1/users/<user_id>/permissions` | Get user's permissions | Yes |

### Current User

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permission/api/v1/me/permissions` | Get current user's permissions | Yes |

### Permission Checks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/permission/api/v1/check` | Check single permission | Yes |
| POST | `/permission/api/v1/check-many` | Check multiple permissions | Yes |

### Policies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permission/api/v1/policies` | List policies | Yes |
| POST | `/permission/api/v1/policies` | Create policy | Yes |
| GET | `/permission/api/v1/policies/<policy_id>` | Get policy details | Yes |
| PATCH | `/permission/api/v1/policies/<policy_id>` | Update policy | Yes |
| DELETE | `/permission/api/v1/policies/<policy_id>` | Delete policy | Yes |

### Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permission/health/` | Health check | No |
| GET | `/permission/health/ready` | Readiness probe | No |
| GET | `/permission/health/live` | Liveness probe | No |

---

## Billing Service

**Service Prefix**: `/billing`  
**Full Gateway Path**: `http://localhost:8000/billing/api/v1/*`

### Plans

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/api/v1/plans` | List available plans | No |
| GET | `/billing/api/v1/plans/compare` | Compare plans | No |
| GET | `/billing/api/v1/plans/<plan_code>` | Get plan details | No |

### Subscriptions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/api/v1/subscription` | Get current subscription | Yes |
| POST | `/billing/api/v1/subscription` | Create subscription | Yes |
| POST | `/billing/api/v1/subscription/change-plan` | Change subscription plan | Yes |
| POST | `/billing/api/v1/subscription/cancel` | Cancel subscription | Yes |
| POST | `/billing/api/v1/subscription/reactivate` | Reactivate subscription | Yes |

### Usage Tracking

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/api/v1/usage` | Get usage statistics | Yes |
| POST | `/billing/api/v1/usage/check-limit` | Check feature limit | Yes |

### Invoices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/api/v1/invoices` | List invoices | Yes |
| GET | `/billing/api/v1/invoices/<invoice_id>` | Get invoice details | Yes |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/api/v1/payments` | List payments | Yes |
| GET | `/billing/api/v1/payments/<payment_id>` | Get payment details | Yes |
| POST | `/billing/api/v1/payments/<payment_id>/refund` | Refund payment | Yes |

### Payment Methods

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/api/v1/payment-methods` | List payment methods | Yes |
| POST | `/billing/api/v1/payment-methods` | Add payment method | Yes |
| GET | `/billing/api/v1/payment-methods/<method_id>` | Get payment method | Yes |
| DELETE | `/billing/api/v1/payment-methods/<method_id>` | Delete payment method | Yes |
| POST | `/billing/api/v1/payment-methods/<method_id>/set-default` | Set default payment method | Yes |

### Webhooks (Direct, not through Gateway)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/billing/webhooks/stripe` | Stripe webhook handler | No (Signature) |
| POST | `/billing/webhooks/razorpay` | Razorpay webhook handler | No (Signature) |

### Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/billing/health/` | Health check | No |
| GET | `/billing/health/ready` | Readiness probe | No |
| GET | `/billing/health/live` | Liveness probe | No |

---

## Audit Log Service

**Service Prefix**: `/audit-log`  
**Full Gateway Path**: `http://localhost:8000/audit-log/audit-logs/*`

### Audit Logs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/audit-log/audit-logs/` | Get organization audit logs | Yes |
| GET | `/audit-log/audit-logs/user/<user_id>/` | Get user-specific audit logs | Yes |
| GET | `/audit-log/audit-logs/entity/<entity_type>/<entity_id>/` | Get entity audit trail | Yes |

**Query Parameters**:
- `start_date`: Filter logs from date
- `end_date`: Filter logs to date
- `action`: Filter by action type
- `actor`: Filter by actor user_id
- `limit`: Results per page
- `offset`: Pagination offset

### Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/audit-log/health/` | Health check | No |
| GET | `/audit-log/health/ready` | Readiness probe | No |
| GET | `/audit-log/health/live` | Liveness probe | No |

---

## Admin Panel Service

**Direct URL**: `http://localhost:8001` (Not through Gateway)

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/` | Django admin interface | Yes (Staff) |
| GET | `/health/` | Health check | No |

**Features**:
- Unified admin panel with 2FA
- Access to all service databases
- User management
- Organization management
- Subscription management
- Audit log viewing

---

## Internal APIs (Service-to-Service)

These endpoints are for **internal microservice communication only**, secured with HMAC signatures. Not accessible from frontend.

### Auth Service Internal APIs

**Base**: `http://auth-service:8000/internal/auth/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validate-token` | Validate JWT token (used by Gateway) |
| GET | `/user/<user_id>` | Get user details |

### Organization Service Internal APIs

**Base**: `http://org-service:8000/internal/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/organizations/create` | Create organization (used by Auth) |
| GET | `/users/<user_id>/orgs` | Get user's organizations (used by Auth) |
| GET | `/orgs/<org_id>` | Get organization details |
| GET | `/orgs/<org_id>/members/<user_id>` | Check membership (used by Gateway) |
| POST | `/orgs/<org_id>/members` | Add member |
| PATCH | `/orgs/<org_id>/plan` | Update organization plan (used by Billing) |

### Permission Service Internal APIs

**Base**: `http://permission-service:8000/internal/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/check` | Check permission (used by other services) |
| GET | `/users/<user_id>/orgs/<org_id>/permissions` | Get user permissions (used by Auth) |
| POST | `/evaluate` | Evaluate policy (used by product services) |
| POST | `/cache/invalidate` | Invalidate permission cache |

### Billing Service Internal APIs

**Base**: `http://billing-service:8000/internal/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orgs/<org_id>/subscription` | Get subscription status |
| POST | `/orgs/<org_id>/check-limit` | Check usage limit (used by product services) |
| POST | `/orgs/<org_id>/usage` | Record usage (used by product services) |
| GET | `/plans/<plan_code>/features` | Get plan features |

---

## Security & Authentication

### JWT Token Structure

**Access Token** (15 minutes):
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "org_id": "uuid",
  "role": "ADMIN",
  "permissions": ["crm:read", "crm:write"],
  "exp": 1234567890,
  "type": "access"
}
```

**Refresh Token** (7 days):
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "exp": 1234567890,
  "type": "refresh"
}
```

### HMAC Request Signing

Internal service requests are signed with HMAC-SHA256:
```
X-Service-Signature: timestamp:hmac_hash
X-Request-ID: unique_request_id
X-User-ID: user_uuid
X-Org-ID: org_uuid
```

### Rate Limiting

- **Default**: 60 requests/minute per user
- **Anonymous**: 10 requests/minute per IP
- Headers returned:
  - `X-RateLimit-Limit`: Total allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Error Response Format

All APIs return errors in consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": ["validation error"]
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED`: Invalid credentials
- `TOKEN_EXPIRED`: JWT token expired
- `INSUFFICIENT_PERMISSIONS`: Permission denied
- `ORG_NOT_FOUND`: Organization not found
- `INVALID_ORG_CONTEXT`: User not member of organization
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Server error

---

## Frontend Usage Examples

### Login Flow

```typescript
// Step 1: Login with credentials
const loginResponse = await axios.post('/auth/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Step 2: If MFA required
if (loginResponse.data.status === 'mfa_required') {
  const mfaResponse = await axios.post('/auth/auth/mfa/verify', {
    session_id: loginResponse.data.session_id,
    code: '123456'
  });
}

// Step 3: Select organization (if multiple)
if (loginResponse.data.status === 'org_selection_required') {
  const orgResponse = await axios.post('/auth/auth/select-org', {
    session_id: loginResponse.data.session_id,
    org_id: 'selected_org_uuid'
  });
}

// Step 4: Store tokens
localStorage.setItem('access_token', tokens.access);
localStorage.setItem('refresh_token', tokens.refresh);
```

### Registration Flow (2-Step)

```typescript
// Step 1: Register user
const registerResponse = await axios.post('/auth/auth/register', {
  email: 'newuser@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
});

// Step 2: Setup organization
const setupResponse = await axios.post('/auth/auth/setup-organization', {
  user_id: registerResponse.data.user.id,
  password: 'password123',
  company_name: 'Acme Corp',
  company_size: '11-50'
});

// Auto-logged in with tokens
localStorage.setItem('access_token', setupResponse.data.tokens.access);
localStorage.setItem('refresh_token', setupResponse.data.tokens.refresh);
```

### Authenticated Requests

```typescript
// All requests include auth header
axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

// Multi-tenant requests include org context
axios.defaults.headers.common['X-Org-ID'] = org_id;

// Example: Get organization members
const members = await axios.get(`/org/api/v1/orgs/${org_id}/members`);
```

---

## Development URLs

| Service | URL | Swagger Docs |
|---------|-----|--------------|
| API Gateway | http://localhost:8000 | http://localhost:8000/docs |
| Auth Service | http://localhost:8001 | N/A |
| Org Service | http://localhost:8002 | http://localhost:8002/docs |
| Permission Service | http://localhost:8003 | http://localhost:8003/docs |
| Billing Service | http://localhost:8004 | http://localhost:8004/docs |
| Audit Log Service | http://localhost:8005 | http://localhost:8005/docs |
| Admin Panel | http://localhost:8006 | N/A |
| MailHog UI | http://localhost:8025 | N/A |

---

## Notes

1. **All frontend requests** should go through the API Gateway at `http://localhost:8000`
2. **Internal APIs** are only accessible between services with HMAC signatures
3. **Webhooks** bypass the Gateway and hit services directly (with signature verification)
4. **Health checks** are available on all services for monitoring/K8s probes
5. **Org context** (`X-Org-ID`) is required for all multi-tenant endpoints
6. **Permissions** follow the format `resource:action` (e.g., `crm:write`, `billing:read`)

---

**Document Maintained By**: Development Team  
**Contact**: For API issues, check service logs and Gateway traces via `X-Request-ID`
