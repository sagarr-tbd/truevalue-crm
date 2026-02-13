# Frontend Improvements Documentation

This document outlines the frontend improvements made to the CRM application, focusing on performance, code quality, and accessibility.

---

## Table of Contents

1. [N+1 API Call Fix](#1-n1-api-call-fix)
2. [Duplicate Toast Notifications Fix](#2-duplicate-toast-notifications-fix)
3. [Shared Utilities Extraction](#3-shared-utilities-extraction)
4. [Column Memoization](#4-column-memoization)
5. [React Query staleTime Configuration](#5-react-query-staletime-configuration)
6. [Accessibility Improvements](#6-accessibility-improvements)

---

## 1. N+1 API Call Fix

### Problem
The contact detail page was fetching ALL contacts (`page_size: 100`) just to find related contacts from the same company. This caused unnecessary data transfer and poor performance.

### Before
```typescript
// Fetch all contacts to find related ones from same company
const { data: allContactsResponse } = useContacts({ page_size: 100 });

// Filter client-side
const relatedContacts = useMemo(() => {
  if (!contact) return [];
  const allContacts = allContactsResponse?.data ?? [];
  return allContacts.filter(
    (c) => c.company === contact.company && c.id !== contact.id
  );
}, [contact, allContactsResponse?.data]);
```

### After
```typescript
// Fetch related contacts from same company (only when contact has a company)
const { data: relatedContactsResponse } = useContacts(
  {
    company_id: contact?.primaryCompanyId,
    page_size: 10,
  },
  { enabled: !!contact?.primaryCompanyId }
);

// Filter out current contact
const relatedContacts = useMemo(() => {
  if (!contact || !relatedContactsResponse?.data) return [];
  return relatedContactsResponse.data.filter((c) => c.id !== contact.id);
}, [contact, relatedContactsResponse?.data]);
```

### Files Modified
- `frontend/crm-app/app/(app)/sales/contacts/[id]/page.tsx`
- `frontend/crm-app/lib/queries/useContacts.ts` (added `enabled` option support)

### Impact
- Reduced API payload from potentially 100 contacts to max 10
- Query only runs when there's a company to filter by
- Server-side filtering instead of client-side

---

## 2. Duplicate Toast Notifications Fix

### Problem
Toast notifications were being shown twice - once from the `FormDrawer` component and once from the mutation hooks.

### Before
```typescript
// FormDrawer.tsx
const onSubmitForm = useCallback(
  async (data: any) => {
    try {
      await onSubmit(formDataWithExtras);
      toast.success(`${config.entity} updated successfully`);  // Toast #1
      reset();
      onClose();
    } catch (error) {
      toast.error(error.message);  // Toast #1
    }
  },
  [...]
);

// useContacts.ts (mutation hook)
return useMutation({
  mutationFn: (data) => contactsApi.create(data),
  onSuccess: () => {
    toast.success('Contact created successfully!');  // Toast #2 (duplicate!)
  },
  onError: (error) => {
    toast.error(error.message);  // Toast #2 (duplicate!)
  },
});
```

### After
```typescript
// FormDrawer.tsx - removed toast notifications
const onSubmitForm = useCallback(
  async (data: any) => {
    // Toast notifications are handled by the mutation hooks, not here
    const formDataWithExtras = { ... };
    await onSubmit(formDataWithExtras);
    reset();
    onClose();
  },
  [onSubmit, reset, onClose, selectedTags, profilePicture]
);
```

### Files Modified
- `frontend/crm-app/components/Forms/FormDrawer/FormDrawer.tsx`

### Impact
- Single toast notification per operation
- Consistent toast behavior across the application
- Removed unused `toast` and `Sparkles` imports

---

## 3. Shared Utilities Extraction

### Problem
Utility functions like `toSnakeCaseOperator` and `getStatusColor` were duplicated across multiple page components.

### Solution
Created centralized utilities in `lib/utils.ts`:

```typescript
// lib/utils.ts

/**
 * Convert camelCase operator to snake_case for API
 */
export const toSnakeCaseOperator = (op: string): string => {
  const operatorMap: Record<string, string> = {
    'equals': 'equals',
    'notEquals': 'not_equals',
    'contains': 'contains',
    'notContains': 'not_contains',
    'startsWith': 'starts_with',
    'endsWith': 'ends_with',
    'isEmpty': 'is_empty',
    'isNotEmpty': 'is_not_empty',
    'greaterThan': 'greater_than',
    'lessThan': 'less_than',
    'greaterThanOrEqual': 'greater_than_or_equal',
    'lessThanOrEqual': 'less_than_or_equal',
  };
  return operatorMap[op] || op;
};

/**
 * Status color mapping for badges
 */
export type StatusColorType = 'contact' | 'lead' | 'deal' | 'generic';

const STATUS_COLORS: Record<StatusColorType, Record<string, string>> = {
  contact: {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    bounced: "bg-red-100 text-red-700",
    unsubscribed: "bg-yellow-100 text-yellow-700",
    archived: "bg-purple-100 text-purple-700",
  },
  lead: {
    new: "bg-secondary/10 text-secondary",
    contacted: "bg-accent/10 text-accent",
    qualified: "bg-primary/10 text-primary",
    unqualified: "bg-muted text-muted-foreground",
    converted: "bg-green-100 text-green-700",
  },
  deal: {
    open: "bg-blue-100 text-blue-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
  },
  generic: { ... },
};

export const getStatusColor = (
  status: string,
  type: StatusColorType = 'generic'
): string => {
  const normalizedStatus = status?.toLowerCase() || '';
  return STATUS_COLORS[type][normalizedStatus] || "bg-muted text-muted-foreground";
};
```

### Usage
```typescript
import { toSnakeCaseOperator, getStatusColor } from "@/lib/utils";

// Filter operators
operator: toSnakeCaseOperator(c.operator)

// Status badges
<span className={`... ${getStatusColor(status, 'contact')}`}>
```

### Files Modified
- `frontend/crm-app/lib/utils.ts` (added utilities)
- `frontend/crm-app/app/(app)/sales/contacts/page.tsx`
- `frontend/crm-app/app/(app)/sales/leads/page.tsx`

### Impact
- DRY principle - single source of truth
- Easier maintenance and updates
- Type-safe status color mapping

---

## 4. Column Memoization

### Problem
Table column definitions were being recreated on every render, causing unnecessary re-renders of the DataTable component.

### Before
```typescript
// Table columns - recreated on every render
const columns = [
  { key: "name", label: "Contact", ... },
  { key: "email", label: "Email", ... },
  ...
];
```

### After
```typescript
// Table columns - memoized to prevent unnecessary re-renders
const columns = useMemo(() => [
  { key: "name", label: "Contact", ... },
  { key: "email", label: "Email", ... },
  ...
], [router]);  // Only recreate when router changes
```

### Files Modified
- `frontend/crm-app/app/(app)/sales/contacts/page.tsx`

### Impact
- Reduced unnecessary re-renders
- Better performance on large lists
- Leads and deals pages already had this optimization

---

## 5. React Query staleTime Configuration

### Problem
React Query hooks had no `staleTime` configured, causing data to be considered stale immediately after fetching. This led to unnecessary refetches on component mount/focus.

### Solution
Added appropriate `staleTime` values based on data volatility:

| Query Type | staleTime | Rationale |
|------------|-----------|-----------|
| List queries (contacts, leads, deals) | 1 minute | Frequently changing, but brief caching acceptable |
| Detail queries | 2 minutes | Less frequently accessed, can cache longer |
| Options/dropdowns | 5 minutes | Rarely changes |
| Pipeline/stages | 5 minutes | Infrequently modified |
| Kanban view | 30 seconds | Needs fresher data for real-time feel |
| Forecast/stats | 5 minutes | Aggregated data, changes slowly |

### Example
```typescript
export function useContacts(params, options) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsApi.getAll(params),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactsApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### Files Modified
- `frontend/crm-app/lib/queries/useContacts.ts`
- `frontend/crm-app/lib/queries/useLeads.ts`
- `frontend/crm-app/lib/queries/useDeals.ts`
- `frontend/crm-app/lib/queries/usePipelines.ts`

### Impact
- Reduced API calls on navigation
- Better perceived performance
- Data still invalidates on mutations

---

## 6. Accessibility Improvements

### DataTable Component

Added comprehensive ARIA attributes and keyboard navigation:

```typescript
// Table structure
<div role="region" aria-label="Data table">
  <table role="grid" aria-rowcount={data.length}>
    <thead>
      <tr role="row">
        <th 
          scope="col"
          aria-sort={sortDirectionAria}
          role={column.sortable ? "columnheader button" : "columnheader"}
          tabIndex={column.sortable ? 0 : undefined}
          onKeyDown={(e) => {
            if (column.sortable && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleSort(column.key);
            }
          }}
        >
          {column.label}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr 
        role="row"
        aria-rowindex={rowIndex + 2}
        aria-selected={showSelection ? isSelected : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onRowClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onRowClick(row);
          }
        }}
      >
        <td role="gridcell">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Features:**
- `role="grid"` for proper table semantics
- `aria-sort` for sortable columns
- `aria-selected` for selected rows
- Keyboard navigation (Enter/Space) for clickable rows
- Labeled checkboxes for selection

### ActionMenu Component

Added full ARIA menu pattern with keyboard navigation:

```typescript
<Button
  aria-haspopup="menu"
  aria-expanded={isOpen}
  aria-controls={isOpen ? menuId : undefined}
  aria-label={triggerLabel || "Actions menu"}
>
  <TriggerIcon aria-hidden="true" />
</Button>

<div
  id={menuId}
  role="menu"
  aria-labelledby={buttonId}
>
  <div role="separator" />
  <button
    role="menuitem"
    tabIndex={isFocused ? 0 : -1}
    aria-disabled={item.disabled}
  >
    {item.label}
  </button>
</div>
```

**Keyboard Navigation:**
- `ArrowDown/ArrowUp`: Navigate menu items
- `Enter/Space`: Select item or open menu
- `Escape`: Close menu
- `Tab`: Close menu and move focus

### Files Modified
- `frontend/crm-app/components/DataTable/DataTable.tsx`
- `frontend/crm-app/components/ActionMenu/ActionMenu.tsx`

### Impact
- Screen reader compatible
- Full keyboard navigation
- WCAG 2.1 compliance improvements

---

## Summary Table

| Improvement | Category | Impact |
|-------------|----------|--------|
| N+1 API Fix | Performance | Reduced data transfer, server-side filtering |
| Duplicate Toast Fix | UX | Single notifications, cleaner experience |
| Shared Utilities | Code Quality | DRY principle, maintainability |
| Column Memoization | Performance | Reduced re-renders |
| staleTime Config | Performance | Fewer API calls, better caching |
| Accessibility | A11y | Screen reader & keyboard support |

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `lib/utils.ts` | Added `toSnakeCaseOperator`, `getStatusColor` |
| `lib/queries/useContacts.ts` | Added `enabled` option, `staleTime` |
| `lib/queries/useLeads.ts` | Added `staleTime` |
| `lib/queries/useDeals.ts` | Added `staleTime` |
| `lib/queries/usePipelines.ts` | Added `staleTime` |
| `app/(app)/sales/contacts/page.tsx` | Use shared utils, memoize columns |
| `app/(app)/sales/contacts/[id]/page.tsx` | Optimized related contacts query |
| `app/(app)/sales/leads/page.tsx` | Use shared utilities |
| `components/Forms/FormDrawer/FormDrawer.tsx` | Removed duplicate toasts |
| `components/DataTable/DataTable.tsx` | Accessibility attributes |
| `components/ActionMenu/ActionMenu.tsx` | Accessibility + keyboard nav |

---

## Future Considerations

1. **Virtual Scrolling**: For very large lists, consider implementing virtual scrolling
2. **Skeleton Loading**: Add skeleton loaders for better perceived performance
3. **Error Boundaries**: Add React error boundaries for graceful error handling
4. **Service Worker**: Consider PWA capabilities for offline support
5. **Bundle Analysis**: Analyze and optimize bundle size
