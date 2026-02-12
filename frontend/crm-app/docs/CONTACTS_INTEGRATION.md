# Contacts Module - Real API Integration Guide

This document captures the complete integration of the Contacts module with the real backend API, all issues faced, and solutions applied. Use this as a reference for integrating other modules (Leads, Deals, Companies, etc.).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Type Definitions](#type-definitions)
4. [Data Transformation](#data-transformation)
5. [Integration Steps](#integration-steps)
6. [CRUD Operations](#crud-operations)
7. [Bulk Operations](#bulk-operations)
8. [Dynamic Form Fields](#dynamic-form-fields)
9. [Export Functionality](#export-functionality)
10. [Import Functionality](#import-functionality)
11. [Contact Timeline](#contact-timeline)
12. [Duplicate Detection](#duplicate-detection)
13. [Duplicate Merge](#duplicate-merge)
14. [Issues & Solutions](#issues--solutions)
15. [API Contract](#api-contract)
16. [Checklist for Other Modules](#checklist-for-other-modules)

---

## Overview

### What Was Integrated

| Feature | Description |
|---------|-------------|
| Server-side pagination | Backend handles `page`/`page_size`, returns paginated results |
| Server-side search | Backend performs search with debounced query (300ms) |
| Server-side advanced filters | Backend applies filter conditions (equals, contains, not_equals, etc.) |
| Statistics | Backend returns aggregated stats in meta response |
| Detail page | Single contact view with real API data |
| CRUD operations | Create, Read, Update, Delete via real API |
| Bulk operations | Bulk delete and bulk update via dedicated endpoints |
| Dynamic form fields | Company, Owner, Tags fetched from API |
| Export | Client-side CSV/Excel/PDF export with 14 fields |
| Import | CSV import with field mapping, duplicate handling, validation |
| Contact Timeline | Activity history (calls, emails, meetings, tasks, notes) |
| Duplicate Detection | Check for duplicates before creating contacts |
| Duplicate Merge | Merge two contacts into one with configurable strategy |
| CORS | Backend configured to allow frontend origin |

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| **Frontend** | | |
| API Client | `lib/api/contacts.ts` | API client with type transformers |
| Activities API | `lib/api/activities.ts` | API client for timeline/activities |
| React Query Hooks | `lib/queries/useContacts.ts` | Hooks for data fetching and mutations |
| Activity Hooks | `lib/queries/useActivities.ts` | Hooks for timeline and activities |
| List Page | `app/(app)/sales/contacts/page.tsx` | List view with filters, export, bulk actions |
| Detail Page | `app/(app)/sales/contacts/[id]/page.tsx` | Single contact view with timeline |
| Form Drawer | `components/Forms/Sales/ContactFormDrawer.tsx` | Create/Edit form with dynamic options |
| Form Config | `components/Forms/configs/contactFormConfig.tsx` | Form field definitions |
| Import Modal | `components/ImportModal/ImportModal.tsx` | CSV import with field mapping |
| Duplicate Warning | `components/DuplicateWarningModal/` | Duplicate detection UI |
| Merge Modal | `components/MergeContactModal/` | Contact merge UI |
| Import Template | `public/samples/contacts-import-template.csv` | Sample CSV for import |
| Types | `lib/types.ts` | Contact type (from Zod schema) |
| Schema | `lib/schemas.ts` | Zod validation schema |
| **Backend** | | |
| Serializers | `services/crm/crm/serializers.py` | ContactSerializer, ContactListSerializer |
| Views | `services/crm/crm/views.py` | API endpoints |
| Service | `services/crm/crm/services/contact_service.py` | Business logic, filtering, merge |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TYPE DEFINITIONS (lib/api/contacts.ts)                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ContactApiResponse      → Full response from GET /contacts/{id}     │    │
│  │ ContactListApiResponse  → List item from GET /contacts              │    │
│  │ ContactViewModel        → Frontend display model (camelCase)        │    │
│  │ ContactApiRequest       → Request payload for POST/PATCH            │    │
│  │ ContactFormData         → Form data type (Partial<Contact>)         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  TRANSFORMERS (lib/api/contacts.ts)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ toContactViewModel()      → List API response → ViewModel           │    │
│  │ toFullContactViewModel()  → Detail API response → ViewModel         │    │
│  │ toApiRequest()            → Form data → API request payload         │    │
│  │ nullToUndefined()         → Convert null → undefined                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  API CLIENT (lib/api/contacts.ts)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ contactsApi.getAll(params)   → GET /contacts (list + pagination)    │    │
│  │ contactsApi.getById(id)      → GET /contacts/{id}                   │    │
│  │ contactsApi.create(data)     → POST /contacts                       │    │
│  │ contactsApi.update(id, data) → PATCH /contacts/{id}                 │    │
│  │ contactsApi.delete(id)       → DELETE /contacts/{id}                │    │
│  │ contactsApi.bulkDelete(ids)  → POST /contacts/bulk-delete           │    │
│  │ contactsApi.bulkUpdate(...)  → POST /contacts/bulk-update           │    │
│  │ contactsApi.import(...)      → POST /contacts/import                │    │
│  │ contactsApi.checkDuplicates  → POST /duplicates/check               │    │
│  │ contactsApi.merge(...)       → POST /contacts/merge                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  REACT QUERY HOOKS (lib/queries/useContacts.ts)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ useContacts(params)        → List with pagination                   │    │
│  │ useContact(id)             → Single by UUID                         │    │
│  │ useCreateContact()         → Create mutation (with skip_duplicate)  │    │
│  │ useUpdateContact()         → Update mutation                        │    │
│  │ useDeleteContact()         → Delete mutation                        │    │
│  │ useBulkDeleteContacts()    → Bulk delete mutation                   │    │
│  │ useBulkUpdateContacts()    → Bulk update mutation                   │    │
│  │ useCheckDuplicates()       → Duplicate detection mutation           │    │
│  │ useMergeContacts()         → Contact merge mutation                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ACTIVITY HOOKS (lib/queries/useActivities.ts)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ useContactTimeline(id)     → Contact's activity history             │    │
│  │ useCreateActivity()        → Create activity/note mutation          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP (CORS enabled)
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI Gateway → Django)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SERIALIZERS (serializers.py)                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ContactSerializer (full detail)                                     │    │
│  │   ├── primary_company    → read_only (returns object)               │    │
│  │   ├── primary_company_id → write_only (accepts UUID)                │    │
│  │   ├── tags               → read_only (returns objects)              │    │
│  │   ├── tag_ids            → write_only (accepts UUIDs)               │    │
│  │   └── deal_count, activity_count → SerializerMethodField            │    │
│  │                                                                     │    │
│  │ ContactListSerializer (list view - optimized)                       │    │
│  │   └── Includes: deal_count, activity_count, primary_company         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ENDPOINTS                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ GET    /crm/api/v1/contacts              → List (paginated)         │    │
│  │ POST   /crm/api/v1/contacts              → Create                   │    │
│  │ GET    /crm/api/v1/contacts/{id}         → Detail                   │    │
│  │ PATCH  /crm/api/v1/contacts/{id}         → Update                   │    │
│  │ DELETE /crm/api/v1/contacts/{id}         → Delete                   │    │
│  │ GET    /crm/api/v1/contacts/{id}/timeline → Activity timeline       │    │
│  │ POST   /crm/api/v1/contacts/bulk-delete  → Bulk delete              │    │
│  │ POST   /crm/api/v1/contacts/bulk-update  → Bulk update              │    │
│  │ POST   /crm/api/v1/contacts/import       → CSV import               │    │
│  │ POST   /crm/api/v1/contacts/merge        → Merge two contacts       │    │
│  │ POST   /crm/api/v1/duplicates/check      → Duplicate detection      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### Naming Convention

| Type Name | Purpose | Field Casing |
|-----------|---------|--------------|
| `ContactApiResponse` | Full response from GET /contacts/{id} | snake_case |
| `ContactListApiResponse` | List item from GET /contacts | snake_case |
| `ContactViewModel` | Frontend display model | camelCase |
| `ContactApiRequest` | Request payload for POST/PATCH | snake_case |
| `ContactFormData` | Form input data | camelCase |

### API Response Types (snake_case)

```typescript
// Full contact from GET /contacts/{id}
export interface ContactApiResponse {
  id: string;
  org_id: string;
  owner_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  secondary_email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  
  // IMPORTANT: primary_company is returned as object (read_only)
  // primary_company_id is write_only - NOT returned in response
  primary_company?: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
  };
  primary_company_id?: string;  // Only for reference, usually undefined in response
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Profile
  description?: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  
  // Status
  status?: string;
  source?: string;
  source_detail?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
  
  // IMPORTANT: tags is returned as array of objects (read_only)
  // tag_ids is write_only - NOT returned in response
  tags?: Array<{ id: string; name: string; color?: string }>;
  tag_ids?: string[];  // Only for reference, usually undefined in response
  
  // Activity
  deal_count?: number;
  activity_count?: number;
  last_activity_at?: string;
  last_contacted_at?: string;
  
  created_at: string;
  updated_at: string;
}

// List item from GET /contacts
export interface ContactListApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  primary_company?: { id: string; name: string; };
  status?: string;
  source?: string;
  owner_id?: string;
  tags?: Array<{ id: string; name: string; color?: string }>;
  deal_count?: number;
  activity_count?: number;
  last_activity_at?: string;
  created_at: string;
}
```

### Frontend View Model (camelCase)

```typescript
export interface ContactViewModel {
  id: string;              // UUID from backend
  name: string;            // full_name or computed
  email: string;
  secondaryEmail?: string;
  phone: string;
  mobile?: string;
  jobTitle?: string;       // from title
  department?: string;
  company?: string;        // from primary_company.name
  primaryCompanyId?: string; // EXTRACTED from primary_company.id
  ownerId?: string;
  status: string;
  source?: string;
  sourceDetail?: string;
  created: string;         // formatted date
  initials: string;        // computed
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Profile
  description?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  // Preferences
  doNotCall?: boolean;
  doNotEmail?: boolean;
  // Tags - EXTRACTED from tags[].id
  tagIds?: string[];
  // Activity
  lastActivityAt?: string;
  lastContactedAt?: string;
  dealCount?: number;
  activityCount?: number;
}
```

### Request Payload (snake_case)

```typescript
export interface ContactApiRequest {
  first_name: string;
  last_name: string;
  email: string;
  secondary_email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  primary_company_id?: string;  // Send UUID, not object
  owner_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  description?: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  status?: string;
  source?: string;
  source_detail?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
  tag_ids?: string[];  // Send array of UUIDs, not objects
}
```

---

## Data Transformation

### Critical: Write-Only Fields

The backend serializer has **write-only** fields that are NOT returned in responses:

| Field | Returned As | Write-Only |
|-------|-------------|------------|
| `primary_company_id` | `primary_company: { id, name }` | Yes |
| `tag_ids` | `tags: [{ id, name, color }]` | Yes |

**Solution:** Extract IDs from the returned objects in transformers.

### Transformer: toFullContactViewModel

```typescript
function toFullContactViewModel(response: ContactApiResponse): ContactViewModel {
  // CRITICAL: Extract IDs from nested objects
  // tag_ids and primary_company_id are write-only in backend
  const tagIds = response.tags?.map(tag => tag.id) || response.tag_ids;
  const primaryCompanyId = response.primary_company?.id || response.primary_company_id;

  return {
    id: response.id,
    name: response.full_name || `${response.first_name} ${response.last_name}`.trim(),
    email: response.email,
    secondaryEmail: nullToUndefined(response.secondary_email),
    phone: response.phone || '-',
    mobile: nullToUndefined(response.mobile),
    jobTitle: nullToUndefined(response.title),
    department: nullToUndefined(response.department),
    company: response.primary_company?.name,
    primaryCompanyId: nullToUndefined(primaryCompanyId),  // Extracted!
    ownerId: nullToUndefined(response.owner_id),
    status: response.status || 'active',
    source: nullToUndefined(response.source),
    sourceDetail: nullToUndefined(response.source_detail),
    created: formatDate(response.created_at),
    initials: getInitials(response.first_name, response.last_name),
    // ... other fields
    tagIds: nullToUndefined(tagIds),  // Extracted!
    // ...
  };
}
```

### Transformer: toApiRequest

```typescript
function toApiRequest(data: ContactFormData): ContactApiRequest {
  const payload: ContactApiRequest = {
    first_name: data.firstName || '',
    last_name: data.lastName || '',
    email: data.email || '',
  };

  // Map camelCase → snake_case for all optional fields
  if (data.secondaryEmail) payload.secondary_email = data.secondaryEmail;
  if (data.phone) payload.phone = data.phone;
  if (data.mobile) payload.mobile = data.mobile;
  if (data.title) payload.title = data.title;
  if (data.department) payload.department = data.department;
  if (data.primaryCompanyId) payload.primary_company_id = data.primaryCompanyId;
  if (data.ownerId) payload.owner_id = data.ownerId;
  // ... map all fields
  if (data.tagIds && data.tagIds.length > 0) payload.tag_ids = data.tagIds;

  return payload;
}
```

### Helper: nullToUndefined

```typescript
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}
```

---

## Integration Steps

### Step 1: Backend - Update Serializers

```python
# serializers.py
class ContactListSerializer(serializers.ModelSerializer):
    """Serializer for Contact listings with fields for list view and export."""
    full_name = serializers.CharField(read_only=True)
    primary_company = CompanyMinimalSerializer(read_only=True)
    tags = TagMinimalSerializer(many=True, read_only=True)
    deal_count = serializers.SerializerMethodField()
    activity_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'mobile', 'title', 'department',
            'primary_company', 'status', 'source', 'tags',
            'owner_id', 'deal_count', 'activity_count',
            'last_activity_at', 'created_at'
        ]
    
    def get_deal_count(self, obj) -> int:
        return obj.deals.count()
    
    def get_activity_count(self, obj) -> int:
        return obj.activities.count()
```

### Step 2: Frontend - Define Types

Create all type definitions in `lib/api/contacts.ts` as shown above.

### Step 3: Frontend - Create Transformers

Implement `toContactViewModel`, `toFullContactViewModel`, and `toApiRequest`.

### Step 4: Frontend - Create API Client

```typescript
export const contactsApi = {
  getAll: async (params: ContactQueryParams): Promise<PaginatedContactsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.filters?.conditions.length) {
      queryParams.set('filters', JSON.stringify(params.filters));
    }

    const url = `/crm/api/v1/contacts?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<ContactListApiResponse>>(url);
    
    // Transform stats: by_status → byStatus
    const stats = response.data.meta.stats ? {
      total: response.data.meta.stats.total,
      byStatus: response.data.meta.stats.by_status || {},
    } : undefined;
    
    return {
      data: response.data.data.map(toContactViewModel),
      meta: { ...response.data.meta, stats },
    };
  },

  getById: async (id: string): Promise<ContactViewModel> => {
    const response = await apiClient.get<ContactApiResponse>(`/crm/api/v1/contacts/${id}`);
    return toFullContactViewModel(response.data);
  },

  create: async (data: ContactFormData): Promise<ContactViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.post<ContactApiResponse>('/crm/api/v1/contacts', payload);
    return toFullContactViewModel(response.data);
  },

  update: async (id: string, data: ContactFormData): Promise<ContactViewModel> => {
    const payload = toApiRequest(data);
    const response = await apiClient.patch<ContactApiResponse>(`/crm/api/v1/contacts/${id}`, payload);
    return toFullContactViewModel(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/crm/api/v1/contacts/${id}`);
  },

  bulkDelete: async (ids: string[]): Promise<BulkOperationResult> => {
    const response = await apiClient.post('/crm/api/v1/contacts/bulk-delete', { ids });
    return response.data;
  },

  bulkUpdate: async (ids: string[], data: Partial<ContactFormData>): Promise<BulkOperationResult> => {
    const requestData: Record<string, unknown> = {};
    if (data.status) requestData.status = data.status;
    if (data.ownerId) requestData.owner_id = data.ownerId;
    // ... convert other fields
    
    const response = await apiClient.post('/crm/api/v1/contacts/bulk-update', { ids, data: requestData });
    return response.data;
  },
};
```

### Step 5: Frontend - Create React Query Hooks

```typescript
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params?: ContactQueryParams) => [...contactKeys.lists(), params] as const,
  detail: (id: string) => [...contactKeys.all, 'detail', id] as const,
};

export function useContacts(params: ContactQueryParams = {}) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsApi.getAll(params),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactFormData) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contact created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create contact');
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactFormData }) =>
      contactsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contact updated successfully!');
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: contactKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contact deleted successfully!');
    },
  });
}
```

---

## CRUD Operations

### Create

```typescript
const createMutation = useCreateContact();

const handleFormSubmit = async (data: ContactFormData) => {
  if (formMode === "add") {
    await createMutation.mutateAsync(data);
  }
  setFormDrawerOpen(false);
};
```

### Read (List)

```typescript
const debouncedSearch = useDebounce(searchQuery, 300);

const queryParams = useMemo(() => ({
  page: currentPage,
  page_size: itemsPerPage,
  search: debouncedSearch || undefined,
  status: statusFilter || undefined,
  filters: filterGroup,
}), [currentPage, itemsPerPage, debouncedSearch, statusFilter, filterGroup]);

const { data, isLoading } = useContacts(queryParams);
const contacts = data?.data ?? [];
const total = data?.meta?.total ?? 0;
const stats = data?.meta?.stats;
```

### Read (Single for Edit)

```typescript
const handleEditContact = async (contact: ContactViewModel) => {
  setFormMode("edit");
  
  // Fetch full contact details
  const fullContact = await contactsApi.getById(contact.id);
  
  // Map to form data format
  setEditingContact({
    id: fullContact.id,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email: fullContact.email,
    primaryCompanyId: fullContact.primaryCompanyId,  // Already extracted!
    tagIds: fullContact.tagIds,  // Already extracted!
    // ... other fields
  });
  
  setFormDrawerOpen(true);
};
```

### Update

```typescript
const handleFormSubmit = async (data: ContactFormData) => {
  if (formMode === "edit" && editingContact?.id) {
    await updateMutation.mutateAsync({ 
      id: editingContact.id,
      data: data,
    });
  }
  setFormDrawerOpen(false);
};
```

### Delete

```typescript
const handleDeleteConfirm = async () => {
  await deleteMutation.mutateAsync(contact.id);
  router.push('/sales/contacts');
};
```

---

## Bulk Operations

### Bulk Delete

```typescript
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => contactsApi.bulkDelete(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success(`${result.success} contacts deleted successfully!`);
    },
  });
}

// Usage
const bulkDelete = useBulkDeleteContacts();
const handleBulkDelete = async () => {
  await bulkDelete.mutateAsync(selectedContacts);
  setSelectedContacts([]);
};
```

### Bulk Update

```typescript
export function useBulkUpdateContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<ContactFormData> }) =>
      contactsApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success(`${result.success} contacts updated successfully!`);
    },
  });
}

// Usage
const bulkUpdate = useBulkUpdateContacts();
const handleBulkUpdateStatus = async (status: string) => {
  await bulkUpdate.mutateAsync({ ids: selectedContacts, data: { status } });
  setSelectedContacts([]);
};
```

---

## Dynamic Form Fields

### Problem

The form needs real data for Company, Owner, and Tags dropdowns.

### Solution

Create separate API clients and hooks for each:

```typescript
// lib/api/companies.ts
export const companiesApi = {
  getAll: async () => {
    const response = await apiClient.get('/crm/api/v1/companies');
    return response.data.data;
  },
};

// lib/queries/useCompanies.ts
export function useCompanyOptions() {
  return useQuery({
    queryKey: ['companies', 'options'],
    queryFn: async () => {
      const companies = await companiesApi.getAll();
      return companies.map(c => ({ value: c.id, label: c.name }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### ContactFormDrawer Implementation

```typescript
export function ContactFormDrawer(props: ContactFormDrawerProps) {
  const { user } = useAuth();
  
  // Fetch dynamic options
  const { data: companyOptions = [] } = useCompanyOptions();
  const { data: tagOptions = [] } = useContactTagOptions();
  const { data: memberOptions = [] } = useMemberOptions();

  // Set default owner for new contacts
  const initialDataWithDefaults = useMemo(() => {
    if (props.mode === "edit" && props.initialData) {
      return props.initialData;
    }
    return {
      ownerId: user?.id || "",
      status: "active",
      ...props.initialData,
    };
  }, [props.mode, props.initialData, user?.id]);

  // Inject dynamic options into form config
  const dynamicConfig = useMemo(() => {
    const config = JSON.parse(JSON.stringify(contactFormConfig));
    // ... inject options for primaryCompanyId, ownerId, tagIds, status
    return config;
  }, [companyOptions, tagOptions, memberOptions]);

  return (
    <FormDrawer
      {...props}
      initialData={initialDataWithDefaults}
      config={dynamicConfig}
    />
  );
}
```

---

## Export Functionality

### Export Columns (14 fields from list API)

```typescript
const exportColumns: ExportColumn<typeof contacts[0]>[] = useMemo(() => [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status', format: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) },
  { key: 'source', label: 'Source' },
  { key: 'dealCount', label: 'Deal Count' },
  { key: 'activityCount', label: 'Activity Count' },
  { key: 'lastActivityAt', label: 'Last Activity' },
  { key: 'created', label: 'Created Date' },
], []);
```

### Export Components

```tsx
{/* Export all filtered contacts */}
<ExportButton
  data={filteredContacts}
  columns={exportColumns}
  filename="contacts-export"
  title="Contacts Export"
/>

{/* Bulk export selected contacts */}
<BulkActionsToolbar
  onExport={handleBulkExport}
/>
```

---

## Import Functionality

### Overview

CSV import with multi-step process: upload → field mapping → preview → import.

### Import Modal Component

```typescript
// components/ImportModal/ImportModal.tsx

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: Record<string, unknown>[], options: ImportOptions) => Promise<void>;
  targetFields: FieldMapping[];  // Available fields to map to
  sampleData?: Record<string, string>;  // Example row for preview
}

interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  duplicateCheckField: 'email' | 'phone';
}
```

### Import Flow

1. **Upload**: User uploads CSV file or drags and drops
2. **Parse**: Frontend parses CSV, extracts headers
3. **Mapping**: User maps CSV columns to contact fields
4. **Preview**: Show first 5 rows with mapped data
5. **Import**: Send to backend with options

### API Function

```typescript
contactsApi.import: async (
  contacts: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> => {
  // Transform camelCase → snake_case
  const transformedContacts = contacts.map(contact => {
    const transformed: Record<string, unknown> = {};
    
    // CRITICAL: Convert string booleans to actual booleans
    const booleanFields = ['doNotCall', 'doNotEmail', 'do_not_call', 'do_not_email'];
    
    Object.entries(contact).forEach(([key, value]) => {
      if (booleanFields.includes(key)) {
        transformed[snakeKey] = value === 'true' || value === true;
      } else {
        transformed[snakeKey] = value;
      }
    });
    
    return transformed;
  });

  const response = await apiClient.post('/crm/api/v1/contacts/import', {
    contacts: transformedContacts,
    skip_duplicates: options.skipDuplicates,
    update_existing: options.updateExisting,
    duplicate_check_field: options.duplicateCheckField,
  });

  return response.data;
}
```

### Import Template

Provide a sample CSV at `public/samples/contacts-import-template.csv`:

```csv
firstName,lastName,email,phone,title,department,status,source
John,Doe,john@example.com,+1 555-0100,Sales Manager,Sales,active,Website
```

### Common Issue: Boolean String Values

**Problem:** CSV parsing returns `"true"` and `"false"` as strings, but backend expects actual booleans.

**Solution:** Convert in the frontend before sending:

```typescript
if (typeof value === 'string') {
  transformed[snakeKey] = value.toLowerCase() === 'true';
} else {
  transformed[snakeKey] = Boolean(value);
}
```

---

## Contact Timeline

### Overview

Display activity history (calls, emails, meetings, tasks, notes) for a contact.

### API

```
GET /crm/api/v1/contacts/{id}/timeline
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "call",
      "subject": "Discovery Call",
      "description": "Discussed product requirements",
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "duration_minutes": 30,
      "direction": "outbound",
      "outcome": "connected"
    }
  ]
}
```

### React Query Hook

```typescript
// lib/queries/useActivities.ts

export function useContactTimeline(contactId: string) {
  return useQuery({
    queryKey: ['contacts', contactId, 'timeline'],
    queryFn: () => activitiesApi.getContactTimeline(contactId),
    enabled: !!contactId,
  });
}
```

### Usage in Detail Page

```typescript
const { data: activities = [], isLoading } = useContactTimeline(id);

// Add a note
const createActivity = useCreateActivity();

const handleAddNote = async () => {
  await createActivity.mutateAsync({
    type: 'note',
    subject: 'Note',
    description: noteText,
    contactId: id,
    status: 'completed',
  });
};
```

---

## Duplicate Detection

### Overview

Check for existing contacts with matching email/phone before creating new ones.

### API

```
POST /crm/api/v1/duplicates/check
```

**Request:**

```json
{
  "entity_type": "contact",
  "email": "john@example.com",
  "phone": "+1234567890",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "has_duplicates": true,
  "duplicates": [
    { "id": "uuid", "name": "John Doe" }
  ],
  "match_field": "email"
}
```

### React Query Hook

```typescript
export function useCheckDuplicates() {
  return useMutation({
    mutationFn: (params: { email?: string; phone?: string; name?: string }) =>
      contactsApi.checkDuplicates(params),
  });
}
```

### Integration in Create Flow

```typescript
const handleFormSubmit = async (data: ContactFormData) => {
  if (formMode === "add") {
    // Check for duplicates before creating
    if (data.email || data.phone) {
      const result = await checkDuplicates.mutateAsync({
        email: data.email,
        phone: data.phone,
      });

      if (result.has_duplicates) {
        // Show duplicate warning modal
        setDuplicateCheckResult(result);
        setPendingContactData(data);
        setShowDuplicateWarning(true);
        return; // Wait for user decision
      }
    }

    // No duplicates, proceed with creation
    await proceedWithCreate(data, false);
  }
};
```

### Skip Duplicate Check Option

When user clicks "Create Anyway", pass `skip_duplicate_check: true`:

```typescript
// API layer
create: async (data: ContactFormData, options?: { skipDuplicateCheck?: boolean }) => {
  const payload = {
    ...toApiRequest(data),
    skip_duplicate_check: options?.skipDuplicateCheck ?? false,
  };
  // ...
}

// Backend service
def create(self, data: Dict[str, Any], **kwargs) -> Contact:
    skip_duplicate_check = kwargs.pop('skip_duplicate_check', False)
    
    if not skip_duplicate_check:
        email = data.get('email')
        if email and self.get_queryset().filter(email=email).exists():
            raise DuplicateEntityError('Contact', 'email', email)
    # ...
```

---

## Duplicate Merge

### Overview

Merge two contacts into one. The secondary contact is deleted, and its data/associations are moved to the primary.

### API

```
POST /crm/api/v1/contacts/merge
```

**Request:**

```json
{
  "primary_id": "uuid-primary",
  "secondary_id": "uuid-secondary",
  "merge_strategy": "fill_empty"
}
```

**Merge Strategies:**

| Strategy | Description |
|----------|-------------|
| `keep_primary` | Keep all primary values, only move activities/deals/tags |
| `fill_empty` | Fill empty primary fields with secondary values, plus move associations |

**Response:**

```json
{
  "success": true,
  "merged_contact": { /* full contact object */ },
  "message": "Contacts merged successfully"
}
```

### What Gets Merged

1. **Activities** - All activities from secondary moved to primary
2. **Deals** - All deals from secondary linked to primary
3. **Tags** - Tags from secondary added to primary (no duplicates)
4. **Company associations** - Company links merged
5. **Field values** (if `fill_empty` strategy) - Empty primary fields filled from secondary

### React Query Hook

```typescript
export function useMergeContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      primaryId: string;
      secondaryId: string;
      mergeStrategy?: 'keep_primary' | 'fill_empty';
    }) => contactsApi.merge(params),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
        queryClient.invalidateQueries({ queryKey: contactKeys.all });
        toast.success(result.message);
      }
    },
  });
}
```

### UI: Find & Merge Button

Located on contact detail page:

```typescript
const handleFindDuplicates = async () => {
  const result = await checkDuplicates.mutateAsync({
    email: contact.email,
    phone: contact.phone,
    name: contact.name,
  });

  if (result.has_duplicates) {
    const otherDuplicates = result.duplicates.filter(d => d.id !== contact.id);
    if (otherDuplicates.length > 0) {
      setSelectedDuplicateId(otherDuplicates[0].id);
      setShowMergeModal(true);
    }
  }
};
```

### Merge Modal Component

```typescript
// components/MergeContactModal/MergeContactModal.tsx

interface MergeContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedContactId: string) => void;
  primaryContactId: string;    // Will be kept
  secondaryContactId: string;  // Will be deleted
  isLoading?: boolean;
  onMerge: (primaryId: string, secondaryId: string, strategy: MergeStrategy) => void;
}
```

### Backend Service Implementation

```python
@transaction.atomic
def merge(self, primary_id: UUID, secondary_id: UUID, merge_strategy: str = 'keep_primary') -> Contact:
    primary = self.get_by_id(primary_id)
    secondary = self.get_by_id(secondary_id)
    
    # Merge field values if strategy is 'fill_empty'
    if merge_strategy == 'fill_empty':
        for field in mergeable_fields:
            if not getattr(primary, field) and getattr(secondary, field):
                setattr(primary, field, getattr(secondary, field))
        primary.save()
    
    # Move activities from secondary to primary
    Activity.objects.filter(contact=secondary).update(contact=primary)
    
    # Move deals from secondary to primary
    Deal.objects.filter(contact=secondary).update(contact=primary)
    
    # Merge tags
    for tag in secondary.tags.all():
        if not primary.tags.filter(id=tag.id).exists():
            primary.tags.add(tag)
    
    # Log the merge
    self._log_action(action=CRMAuditLog.Action.MERGE, entity=primary, ...)
    
    # Delete secondary contact
    secondary.delete()
    
    return primary
```

---

## Issues & Solutions

### Issue 1: Write-Only Fields Not Populated in Edit Form

**Problem:** When opening edit form, Company and Tags were empty.

**Cause:** Backend serializer has `primary_company_id` and `tag_ids` as `write_only=True`. These fields are NOT returned in the response. Instead, `primary_company` (object) and `tags` (array) are returned.

**Solution:** Extract IDs from nested objects in transformer:

```typescript
function toFullContactViewModel(response: ContactApiResponse): ContactViewModel {
  // Extract IDs from nested objects
  const tagIds = response.tags?.map(tag => tag.id) || response.tag_ids;
  const primaryCompanyId = response.primary_company?.id || response.primary_company_id;

  return {
    // ...
    primaryCompanyId: nullToUndefined(primaryCompanyId),
    tagIds: nullToUndefined(tagIds),
    // ...
  };
}
```

### Issue 2: null vs undefined Validation Errors

**Problem:** Backend returns `null` for empty fields, Zod expects `undefined`.

**Solution:** Use `z.preprocess` in schema and `nullToUndefined` helper:

```typescript
// schemas.ts
const optionalString = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.string().optional()
);

// contacts.ts
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}
```

### Issue 3: Stats Field Casing

**Problem:** Backend returns `by_status`, frontend expects `byStatus`.

**Solution:** Transform in API layer:

```typescript
const stats = {
  total: response.meta.stats.total,
  byStatus: response.meta.stats.by_status || {},
};
```

### Issue 4: Status Display (lowercase → Capitalized)

**Problem:** Backend returns `"active"`, UI shows `"Active"`.

**Solution:** Capitalize in render and export:

```typescript
status.charAt(0).toUpperCase() + status.slice(1)
```

### Issue 5: Pagination Total Showing All Records

**Problem:** `meta.total` showed count of ALL contacts, not filtered results.

**Solution:** Count filtered queryset in backend before pagination:

```python
filtered_qs = service.list(..., limit=None)  # Get all filtered
total = filtered_qs.count()                   # Count filtered
contacts = filtered_qs[offset:offset + limit] # Then paginate
```

### Issue 6: CORS Error

**Problem:** Frontend couldn't call API.

**Solution:** Configure CORS on FastAPI gateway:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 7: Import Boolean String Values

**Problem:** CSV parsing returns `"true"` and `"false"` as strings. Backend expects actual boolean values.

**Error:**
```
['"false" value must be either True or False.']
```

**Solution:** Convert string booleans in frontend before sending:

```typescript
const booleanFields = ['doNotCall', 'doNotEmail', 'do_not_call', 'do_not_email'];

if (booleanFields.includes(key) || booleanFields.includes(snakeKey)) {
  if (typeof value === 'string') {
    transformed[snakeKey] = value.toLowerCase() === 'true';
  } else {
    transformed[snakeKey] = Boolean(value);
  }
}
```

### Issue 8: 409 Conflict When Creating Duplicate After User Confirms

**Problem:** User clicks "Create Anyway" on duplicate warning, but backend still rejects with 409.

**Cause:** Backend always checks for duplicate email and raises `DuplicateEntityError`.

**Solution:** Add `skip_duplicate_check` flag:

```typescript
// Frontend - pass flag when user confirms
await createContact.mutateAsync({ 
  data: contactData, 
  skipDuplicateCheck: true 
});

// API layer - include in payload
const payload = {
  ...toApiRequest(data),
  skip_duplicate_check: options?.skipDuplicateCheck ?? false,
};

// Backend service - respect the flag
def create(self, data: Dict[str, Any], **kwargs) -> Contact:
    skip_duplicate_check = kwargs.pop('skip_duplicate_check', False)
    
    if not skip_duplicate_check:
        email = data.get('email')
        if email and self.get_queryset().filter(email=email).exists():
            raise DuplicateEntityError('Contact', 'email', email)
```

### Issue 9: Merge Fails with "deal_count, activity_count do not exist"

**Problem:** Merge endpoint returns 500 error about non-existent fields.

**Cause:** Code tried to save `deal_count` and `activity_count` as database fields, but they are `SerializerMethodField` (computed, not stored).

**Solution:** Remove the invalid save call:

```python
# WRONG - these are not database fields
primary.activity_count = Activity.objects.filter(contact=primary).count()
primary.deal_count = Deal.objects.filter(contact=primary).count()
primary.save(update_fields=['activity_count', 'deal_count'])

# CORRECT - just refresh from database
primary.refresh_from_db()
```

### Issue 10: Merge Returns 500 - Double Serialization

**Problem:** Merge endpoint returns `"'ReturnDict' object has no attribute 'deals'"`.

**Cause:** View serialized `merged_contact` twice:

```python
# WRONG
result = {
    'merged_contact': ContactSerializer(merged_contact).data,  # Already serialized
}
return Response(ContactMergeResultSerializer(result).data)  # Serialized again
```

**Solution:** Pass model object, not serialized data:

```python
# CORRECT
result = {
    'merged_contact': merged_contact,  # Model object
}
return Response(ContactMergeResultSerializer(result).data)  # Serializer handles it
```

---

## API Contract

### List Contacts

```
GET /crm/api/v1/contacts?page=1&page_size=10&search=John&status=active&filters={...}
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "mobile": "+1234567891",
      "title": "Manager",
      "department": "Sales",
      "primary_company": { "id": "uuid", "name": "Acme Inc" },
      "status": "active",
      "source": "Website",
      "owner_id": "uuid",
      "tags": [{ "id": "uuid", "name": "VIP", "color": "#ff0000" }],
      "deal_count": 5,
      "activity_count": 12,
      "last_activity_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 10,
    "total": 150,
    "stats": {
      "total": 150,
      "by_status": { "active": 120, "inactive": 20, "bounced": 10 }
    }
  }
}
```

### Get Single Contact

```
GET /crm/api/v1/contacts/{uuid}
```

**Response:** Full ContactApiResponse with all fields.

### Create Contact

```
POST /crm/api/v1/contacts
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "primary_company_id": "uuid",
  "owner_id": "uuid",
  "tag_ids": ["uuid1", "uuid2"],
  "status": "active"
}
```

### Update Contact

```
PATCH /crm/api/v1/contacts/{uuid}
Content-Type: application/json

{
  "first_name": "John",
  "status": "inactive"
}
```

### Delete Contact

```
DELETE /crm/api/v1/contacts/{uuid}
```

### Bulk Delete

```
POST /crm/api/v1/contacts/bulk-delete
Content-Type: application/json

{ "ids": ["uuid1", "uuid2", "uuid3"] }

Response: { "total": 3, "success": 3, "failed": 0 }
```

### Bulk Update

```
POST /crm/api/v1/contacts/bulk-update
Content-Type: application/json

{
  "ids": ["uuid1", "uuid2"],
  "data": { "status": "inactive" }
}

Response: { "total": 2, "success": 2, "failed": 0 }
```

### Import Contacts

```
POST /crm/api/v1/contacts/import
Content-Type: application/json

{
  "contacts": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "active",
      "do_not_call": false,
      "do_not_email": false
    }
  ],
  "skip_duplicates": true,
  "update_existing": false,
  "duplicate_check_field": "email"
}

Response: {
  "total": 10,
  "created": 8,
  "updated": 0,
  "skipped": 2,
  "errors": []
}
```

### Contact Timeline

```
GET /crm/api/v1/contacts/{uuid}/timeline

Response: {
  "data": [
    {
      "id": "uuid",
      "type": "call",
      "subject": "Discovery Call",
      "description": "Initial discussion",
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "duration_minutes": 30
    }
  ]
}
```

### Check Duplicates

```
POST /crm/api/v1/duplicates/check
Content-Type: application/json

{
  "entity_type": "contact",
  "email": "john@example.com",
  "phone": "+1234567890"
}

Response: {
  "has_duplicates": true,
  "duplicates": [
    { "id": "uuid", "name": "John Doe" }
  ],
  "match_field": "email"
}
```

### Merge Contacts

```
POST /crm/api/v1/contacts/merge
Content-Type: application/json

{
  "primary_id": "uuid-to-keep",
  "secondary_id": "uuid-to-delete",
  "merge_strategy": "fill_empty"
}

Response: {
  "success": true,
  "merged_contact": { /* full contact object */ },
  "message": "Contacts merged successfully"
}
```

---

## Checklist for Other Modules

### Backend Checklist

- [ ] Create `ModuleSerializer` (full) with all fields
- [ ] Create `ModuleListSerializer` (list view) with computed fields
- [ ] Add `deal_count`, `activity_count` as SerializerMethodField
- [ ] Mark ID fields as `write_only=True` for relationships (e.g., `company_id`, `tag_ids`)
- [ ] Return related objects as `read_only=True` (e.g., `company`, `tags`)
- [ ] Implement `FILTER_FIELD_MAP` and `FILTER_OPERATOR_MAP`
- [ ] Implement `_build_advanced_filter_q()` method
- [ ] Implement `get_stats()` method
- [ ] Create bulk-delete and bulk-update endpoints
- [ ] Create import endpoint with duplicate handling options
- [ ] Create timeline endpoint (if applicable)
- [ ] Implement duplicate check in create with `skip_duplicate_check` flag
- [ ] Implement merge functionality (if applicable)
- [ ] Return filtered count in `meta.total`
- [ ] Return `by_status` (or similar) stats in `meta.stats`

### Frontend API Layer Checklist

- [ ] Define `ModuleApiResponse` (full response from detail endpoint)
- [ ] Define `ModuleListApiResponse` (list item response)
- [ ] Define `ModuleViewModel` (frontend display model)
- [ ] Define `ModuleApiRequest` (request payload)
- [ ] Create `toModuleViewModel()` transformer for list
- [ ] Create `toFullModuleViewModel()` transformer for detail
  - [ ] **CRITICAL:** Extract IDs from nested objects (e.g., `company.id`, `tags[].id`)
- [ ] Create `toApiRequest()` transformer for create/update
- [ ] Implement `nullToUndefined()` helper
- [ ] Implement all CRUD methods in API client
- [ ] Implement bulk operations
- [ ] Implement import with boolean string conversion
- [ ] Implement duplicate check API
- [ ] Implement merge API (if applicable)
- [ ] Transform stats: `by_status` → `byStatus`

### Frontend Hooks Checklist

- [ ] Define query keys factory
- [ ] `useModules(params)` - list with pagination
- [ ] `useModule(id)` - single by UUID
- [ ] `useCreateModule()` - create mutation with `skipDuplicateCheck` option
- [ ] `useUpdateModule()` - update mutation with cache invalidation
- [ ] `useDeleteModule()` - delete mutation with cache invalidation
- [ ] `useBulkDeleteModules()` - bulk delete
- [ ] `useBulkUpdateModules()` - bulk update
- [ ] `useCheckDuplicates()` - duplicate detection mutation
- [ ] `useMergeModules()` - merge mutation (if applicable)
- [ ] `useModuleTimeline(id)` - timeline/activities query (if applicable)

### Frontend List Page Checklist

- [ ] Use `useDebounce` for search (300ms)
- [ ] Build queryParams in `useMemo` with all filter state
- [ ] Reset page to 1 when filters change
- [ ] Use `meta.total` for pagination
- [ ] Use `meta.stats.byStatus` for filter counts
- [ ] Define `exportColumns` with all available list fields
- [ ] Add format functions for exports (e.g., capitalize status)
- [ ] Handle bulk actions with dedicated endpoints
- [ ] Capitalize status in display

### Frontend Edit Form Checklist

- [ ] Fetch full entity data using `getById()` before opening edit form
- [ ] Map ViewModel to form data format
- [ ] Ensure `primaryCompanyId`, `tagIds`, etc. are populated (extracted from objects)
- [ ] Use dynamic options for select fields
- [ ] Set default values for new entities (e.g., owner = current user)

### Frontend Form Validation Checklist

- [ ] Use Zod schema with `z.preprocess` for optional fields
- [ ] Handle `null` → `undefined` conversion
- [ ] Only validate required fields strictly
- [ ] Optional fields: allow empty strings to convert to undefined

### Import Functionality Checklist

- [ ] Create ImportModal component with multi-step flow
- [ ] Parse CSV and extract headers
- [ ] Allow field mapping (CSV column → target field)
- [ ] Show data preview before import
- [ ] Convert string booleans to actual booleans (`"true"` → `true`)
- [ ] Handle import options (skip duplicates, update existing)
- [ ] Display import results (created, updated, skipped, errors)
- [ ] Create sample CSV template file

### Duplicate Detection Checklist

- [ ] Add duplicate check API call before create
- [ ] Create DuplicateWarningModal component
- [ ] Show matching contacts with option to view
- [ ] Implement "Create Anyway" with `skip_duplicate_check: true`
- [ ] Handle duplicate check in create flow (set state, show modal, wait for decision)

### Merge Functionality Checklist

- [ ] Create MergeContactModal component
- [ ] Show side-by-side comparison of contacts
- [ ] Implement merge strategy selection (keep_primary, fill_empty)
- [ ] Display what will happen during merge
- [ ] Handle merge in backend (move activities, deals, tags, company associations)
- [ ] Log merge action in audit trail
- [ ] Redirect to merged contact after success
