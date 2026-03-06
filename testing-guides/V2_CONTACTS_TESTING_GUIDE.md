# CRM V2 Contacts — UI Testing Guide

## Organisation & Environment

| Item | Value |
|------|-------|
| **Organisation** | TrueValue CRM (multi-tenant) |
| **Frontend URL** | `http://localhost:3000` |
| **Backend API** | `http://localhost:8000/crm/api/v2/` |
| **Docker Backend** | `crm-backend` container |

## User Roles & Permissions

| Role | Permissions | Use For Testing |
|------|------------|-----------------|
| **Super Admin** | Full access — all modules, all actions | Primary testing role (bypasses all permission checks) |
| **Org Admin / Owner** | Full access within organisation | Equivalent to Super Admin for CRM testing |
| **Manager** | Read, Write, Delete on assigned modules | Test permission-gated buttons (Edit, Delete, Bulk) |
| **Member** | Read, Write on assigned modules | Test limited write access |
| **Viewer** | Read-only | Test that Add/Edit/Delete buttons are hidden |

### Permission Codes (Contacts)

| Code | Description |
|------|-------------|
| `contacts:read` | View contacts list and detail pages |
| `contacts:write` | Create, edit contacts, link/unlink companies |
| `contacts:delete` | Delete contacts (single and bulk) |
| `contacts:export` | Export contacts to CSV |
| `contacts:import` | Import contacts from JSON |

> **Testing Condition:** Unless testing role-based access specifically, log in as **Super Admin** or **Org Admin** to ensure all buttons and actions are available.

## Prerequisites

1. Backend running via Docker (`docker compose up`) or locally
2. Frontend running (`cd frontend/crm-app && npm run dev`)
3. Forms seeded (`docker exec crm-backend python manage.py seed_default_forms`)
4. Logged in with a valid user (Super Admin or Org Admin recommended)
5. **Have at least one company created** (needed to test Company lookup and Companies card)

## Testing Conditions

- All tests assume the **Leads testing guide** has been completed (some contacts come from lead conversion)
- Tests should be run in **order** (Test 1 → Test 18) as later tests depend on earlier data
- After each create/edit/delete, verify **no duplicate toast** notifications appear
- After each mutation, verify **no page reload** — UI should update via React Query cache invalidation
- Cross-check **Stats cards** after every create/edit/delete to confirm counts are correct
- When testing **Find & Merge**, ensure you have at least two contacts with the same name for duplicate detection to work

---

## How the Form Drawer Works

- Click **"Add Contact"** → drawer slides in from the right
- **Left sidebar** shows clickable section tabs
- **Right panel** shows fields for the selected section
- Required fields marked with red asterisk (*)
- Lookup fields (Company, Contact Owner) load options from APIs

---

## 1. Create Contact #1 — Priya Patel

Navigate: **Sidebar → Sales V2 → Contacts** → `/sales-v2/contacts`

Click **"Add Contact"**. You'll see 7 sections in the left sidebar:

### Section 1: Contact Information

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| First Name | text | YES | `Priya` |
| Last Name | text | YES | `Patel` |
| Email | email | YES (unique) | `priya.patel@globalfin.com` |
| Secondary Email | email | no | `priya.personal@gmail.com` |
| Phone | phone | no | `+91-2234567890` |
| Mobile | phone | no | `+91-9988776655` |

### Section 2: Professional Information

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Company | lookup (searches existing companies) | no | **Select an existing company** (e.g., `GlobalFin Technologies`) |
| Job Title | text | no | `Chief Financial Officer` |
| Department | text | no | `Finance` |

### Section 3: Lifecycle & Classification

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Contact Owner | lookup (loads org members) | no | (select a team member) |
| Status | select dropdown | YES | `Active` (pre-selected as default) |
| Source | select dropdown | no | `Referral` |

> **Status options:** Active, Inactive, Bounced, Unsubscribed, Archived
>
> **Source options:** Lead Conversion, Website, Referral, Cold Call, Social Media, Trade Show, Advertisement, Partner, Webinar, Email Campaign, Data Import, Other

### Section 4: Address Information (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Street Address | text (full width) | no | `15 Nariman Point` |
| Address Line 2 | text (full width) | no | `Floor 12, Suite B` |
| City | text | no | `Mumbai` |
| State/Province | text | no | `Maharashtra` |
| Zip/Postal Code | text | no | `400021` |
| Country | text | no | `India` |

### Section 5: Social & Web (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| LinkedIn | url | no | `https://linkedin.com/in/priyapatel` |
| Twitter / X | url | no | `https://x.com/priyapatel` |

### Section 6: Communication Preferences (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Do Not Call | checkbox | no | `unchecked` |
| Do Not Email | checkbox | no | `unchecked` |

### Section 7: Additional Information (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Notes | textarea (full width) | no | `Key decision maker at GlobalFin. Strong interest in financial analytics module.` |

Click **Create Contact**.

**Verify:**
- Toast shows success
- Contact appears in list with name `Priya Patel`
- Status badge shows `Active`
- Company name shows in the list row

---

## 2. View Contact Detail

Click `Priya Patel` in the list → `/sales-v2/contacts/{id}`.

**Verify:**
- Header shows name, email, phone, job title, company
- **Companies card** shows the company you selected (e.g., `GlobalFin Technologies`) with `is_primary = true`
- "Link Company" button is visible below the existing company
- Address shows in detail section
- Social links show
- Communication preferences show
- Activity timeline section exists
- Tags section exists
- Related deals section exists

---

## 3. Link Additional Company (Manual)

On the `Priya Patel` detail page:

1. Scroll to the **Companies** card
2. Click **"Link Company"**
3. Search and select a different company (e.g., `TechStart Solutions`)
4. Click **Link**

**Verify:**
- Companies card now shows **two** companies
- The originally selected company remains marked as primary
- The newly linked company appears as a secondary association

---

## 4. Remove Linked Company

1. On the Companies card, find the secondary company you just linked
2. Click the **X** / **Remove** button on that company row
3. Confirm removal

**Verify:**
- Only the primary company remains in the Companies card
- The removed company is gone

---

## 5. Edit Contact

On detail page, click **Edit**. The drawer opens with existing data pre-filled.

**Changes to make:**
- **Lifecycle** section → Status → `Inactive`
- **Communication** section → Do Not Call → `checked`
- **Additional** section → append to Notes: ` Opted out of calls on 2026-03-05.`

Click **Save Changes**.

**Verify:** All changes reflected on detail page. Status badge shows `Inactive`.

---

## 6. Create Contact #2 — Duplicate Priya (for Find & Merge)

Click **"Add Contact"** again. Fill **only** these fields:

### Contact Information

| Field | Test Value |
|-------|------------|
| First Name | `Priya` |
| Last Name | `Patel` |
| Email | `priya.patel2@globalfin.com` |
| Phone | `+91-2234567891` |
| Mobile | `+91-8899001122` |

### Professional Information

| Field | Test Value |
|-------|------------|
| Job Title | `CFO` |
| Department | `Finance & Operations` |

### Lifecycle & Classification

| Field | Test Value |
|-------|------------|
| Status | `Active` |
| Source | `Website` |

### Social & Web

| Field | Test Value |
|-------|------------|
| LinkedIn | `https://linkedin.com/in/priya-patel-cfo` |

### Additional Information

| Field | Test Value |
|-------|------------|
| Notes | `Duplicate record. Same person as priya.patel@globalfin.com.` |

Click **Create Contact**.

> **Why this data?** This contact intentionally:
> - Has the **same name** as Contact #1 (so duplicate detection by name will match)
> - Has a **different email** (so it passes unique validation)
> - Has **extra fields** that Contact #1 left empty (LinkedIn) — useful for testing "Fill Empty" merge strategy
> - Leaves some fields empty that Contact #1 has (Secondary Email, Address, Company) — useful for verifying primary data is preserved

---

## 7. Find & Merge Contacts

### Step-by-Step Flow

1. Go back to the contacts list
2. Click on **Contact #1** (`Priya Patel` — `priya.patel@globalfin.com`) to open her detail page
3. Click the **"Find & Merge"** button (top-right area, next to Edit)
4. The system calls the backend `check_duplicate` API using the current contact's **email**
5. If duplicates are found, the **Merge Contacts modal** opens automatically

### What You See in the Merge Modal

The modal shows two cards side-by-side:

| Left Card (Primary — Keep) | Right Card (Secondary — Delete) |
|-------|------------|
| `Priya Patel` | `Priya Patel` |
| `priya.patel@globalfin.com` | `priya.patel2@globalfin.com` |
| `+91-2234567890` | `+91-2234567891` |
| Company: `GlobalFin Technologies` | (no company) |
| `Chief Financial Officer` | `CFO` |

### Choose a Merge Strategy

| Strategy | What Happens |
|----------|--------------|
| **Keep Primary Only** | Keeps all of Contact #1's data as-is. Only activities, deals, tags, and company associations from Contact #2 are moved to Contact #1. Contact #2's field values are discarded. |
| **Fill Empty Fields** | Keeps Contact #1's existing data, BUT fills in any empty fields from Contact #2. So Contact #1 gets LinkedIn (`https://linkedin.com/in/priya-patel-cfo`) from Contact #2 since that was empty on Contact #1. |

**Recommended for this test:** Select **"Fill Empty Fields"** to verify both data preservation and gap-filling.

6. Click **"Merge Contacts"**

### After Merge — Verify

| Check | Expected |
|-------|----------|
| Page reloads to merged contact | Yes — stays on Contact #1's detail page |
| Name | `Priya Patel` (from primary) |
| Email | `priya.patel@globalfin.com` (from primary) |
| Phone | `+91-2234567890` (from primary — was not empty) |
| Mobile | `+91-9988776655` (from primary — was not empty) |
| Job Title | `Chief Financial Officer` (from primary — was not empty) |
| LinkedIn | `https://linkedin.com/in/priya-patel-cfo` (filled from secondary) |
| Source | `Referral` (from primary — was not empty) |
| Notes | `Key decision maker at GlobalFin...` (from primary) |
| Companies card | Still shows the primary company |
| Contact #2 gone from list | Go back to contacts list — only one `Priya Patel` should exist |

### Find & Merge — No Duplicates Found

1. Click on `Amit Kumar` (or any unique contact) → detail page
2. Click **"Find & Merge"**
3. **Expected:** Toast shows "No duplicate contacts found"

---

## 8. Create Contact #3 — Amit Kumar (for bulk operations)

Click **"Add Contact"** again. Fill:

### Contact Information

| Field | Test Value |
|-------|------------|
| First Name | `Amit` |
| Last Name | `Kumar` |
| Email | `amit.kumar@techstart.io` |
| Phone | `+91-8877665544` |
| Mobile | `+91-7766554433` |

### Professional Information

| Field | Test Value |
|-------|------------|
| Company | (select if exists) |
| Job Title | `Head of Product` |
| Department | `Product` |

### Lifecycle & Classification

| Field | Test Value |
|-------|------------|
| Status | `Active` |
| Source | `Cold Call` |

### Address Information

| Field | Test Value |
|-------|------------|
| Street Address | `22 Koramangala, 4th Block` |
| City | `Bangalore` |
| State/Province | `Karnataka` |
| Zip/Postal Code | `560034` |
| Country | `India` |

### Social & Web

| Field | Test Value |
|-------|------------|
| LinkedIn | `https://linkedin.com/in/amitkumar` |

### Additional Information

| Field | Test Value |
|-------|------------|
| Notes | `Strong technical background. Interested in API integrations.` |

Click **Create Contact**.

---

## 9. Create Contact #4 — Sneha Reddy (different company)

Click **"Add Contact"**. Fill:

### Contact Information

| Field | Test Value |
|-------|------------|
| First Name | `Sneha` |
| Last Name | `Reddy` |
| Email | `sneha.reddy@infrasolutions.com` |
| Phone | `+91-4455667788` |

### Professional Information

| Field | Test Value |
|-------|------------|
| Company | (select a different company from Priya's) |
| Job Title | `VP of Engineering` |
| Department | `Engineering` |

### Lifecycle & Classification

| Field | Test Value |
|-------|------------|
| Status | `Active` |
| Source | `Trade Show` |

### Address Information

| Field | Test Value |
|-------|------------|
| Street Address | `100 MG Road` |
| City | `Hyderabad` |
| State/Province | `Telangana` |
| Zip/Postal Code | `500001` |
| Country | `India` |

### Communication Preferences

| Field | Test Value |
|-------|------------|
| Do Not Email | `checked` |

Click **Create Contact**.

**Verify:**
- Contact appears with company name in the list
- Detail page → Companies card shows the linked company

---

## 10. Tags

On any contact detail page:

1. Look for the **Tags** section
2. Click **Add Tag** → create a new tag or select existing
3. Verify tag appears on the contact
4. Remove a tag → verify it's gone
5. Refresh page → verify tags persist

---

## 11. Activity Timeline

On contact detail page:

1. Click the **Activity** tab
2. Verify the timeline shows activities related to this contact
3. If no activities exist, the section shows empty state

---

## 12. Related Deals

On contact detail page:

1. Look for the **Deals** section
2. If this contact is linked to deals, they should appear
3. If the contact was created from lead conversion with a deal, that deal should show

---

## 13. Filters & Search

On the contacts list page:

| Test | Action | Expected |
|------|--------|----------|
| Search by name | Type `Priya` in search box | Only Priya contact(s) show |
| Search by email | Type `techstart` | Only `Amit Kumar` shows |
| Search by email | Type `infrasolutions` | Only `Sneha Reddy` shows |
| Filter by status | Select `Active` | Shows only active contacts |
| Filter by status | Select `Inactive` | Shows `Priya Patel` (edited earlier) |
| Filter by source | Select `Referral` | Shows referral contacts |
| Filter by source | Select `Trade Show` | Shows `Sneha Reddy` |
| Clear filters | Click clear/reset | All contacts show |
| Sort by name | Click name column header | Toggles asc/desc |
| Sort by created | Click created date column | Toggles asc/desc |

---

## 14. Bulk Operations

Select 2+ contacts via checkboxes:

### Bulk Update
1. Select `Priya Patel` and `Amit Kumar`
2. Click **Bulk Update**
3. Change status to `Inactive`
4. Confirm
5. **Verify:** Both contacts now show `Inactive`

### Bulk Delete
1. Select a contact (e.g., `Sneha Reddy`)
2. Click **Bulk Delete**
3. Confirm
4. **Verify:** Contact removed from list

---

## 15. Export

1. Go to contacts list
2. Select contacts via checkboxes
3. Click **Export**
4. **Verify:** CSV file downloads with correct data

---

## 16. Converted Lead Contact

If you converted a lead in the Leads testing:

1. Navigate to contacts list
2. Find the contact created from lead conversion (e.g., `Vikram Singh`)
3. Click to open detail page
4. **Verify:**
   - Source shows `Lead Conversion`
   - Contact data (name, email, phone) matches the original lead
   - Company is linked if company was created during conversion
   - Companies card shows the company

---

## 17. Validation Edge Cases

| Test | How | Expected Result |
|------|-----|-----------------|
| Missing First Name | Leave First Name empty | Red error: "First Name is required" |
| Missing Last Name | Leave Last Name empty | Red error: "Last Name is required" |
| Missing Email | Leave Email empty | Red error: "Email is required" |
| Duplicate email | Create contact with `priya.patel@globalfin.com` again | Backend error: email must be unique |
| Invalid email | Enter `not-an-email` | Validation error |
| Invalid URL | Enter `not-a-url` in LinkedIn | Validation error |
| Special characters | Enter `O'Brien` as Last Name | Saves correctly |
| Unicode | Enter `José García` as First Name | Saves correctly |
| Long text | Enter 5000+ chars in Notes | Saves correctly |
| Empty form | Click Create with nothing filled | Fails on First Name, Last Name, Email |

---

## 18. Layout Editor

1. Navigate to `/sales-v2/contacts/layout` (or click **Edit Layout** in the drawer)
2. Verify all 7 sections and their fields are displayed
3. Try reordering fields
4. Try changing a field property (e.g., make Phone required)
5. Save → open Add Contact → verify changes appear

---

## API Payload Reference

When you create a contact, this is what gets sent to `POST /crm/api/v2/contacts/`:

```json
{
  "status": "active",
  "entity_data": {
    "first_name": "Priya",
    "last_name": "Patel",
    "email": "priya.patel@globalfin.com",
    "secondary_email": "priya.personal@gmail.com",
    "phone": "+91-2234567890",
    "mobile": "+91-9988776655",
    "company": "<company-uuid>",
    "title": "Chief Financial Officer",
    "department": "Finance",
    "status": "active",
    "source": "referral",
    "address_line1": "15 Nariman Point",
    "address_line2": "Floor 12, Suite B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400021",
    "country": "India",
    "linkedin_url": "https://linkedin.com/in/priyapatel",
    "twitter_url": "https://x.com/priyapatel",
    "do_not_call": false,
    "do_not_email": false,
    "description": "Key decision maker at GlobalFin."
  }
}
```

The backend serializer extracts `status`, `source`, `assigned_to`, `company`, `do_not_call`, `do_not_email` from `entity_data` and moves them to model columns. When `company` is set, the backend also automatically creates a `ContactCompanyV2` junction record (same pattern as V1).

---

## Contact API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/crm/api/v2/contacts/` | GET | List contacts |
| `/crm/api/v2/contacts/` | POST | Create contact |
| `/crm/api/v2/contacts/{id}/` | GET | Get contact detail |
| `/crm/api/v2/contacts/{id}/` | PATCH | Update contact |
| `/crm/api/v2/contacts/{id}/` | DELETE | Soft delete contact |
| `/crm/api/v2/contacts/{id}/timeline/` | GET | Contact activity timeline |
| `/crm/api/v2/contacts/{id}/companies/` | GET | List company associations |
| `/crm/api/v2/contacts/{id}/companies/` | POST | Link company (manual) |
| `/crm/api/v2/contacts/{id}/companies/{assocId}/` | DELETE | Remove company link |
| `/crm/api/v2/contacts/check_duplicate/` | POST | Find duplicates by email/name |
| `/crm/api/v2/contacts/merge/` | POST | Merge two contacts |
| `/crm/api/v2/contacts/import_contacts/` | POST | Import contacts (JSON) |
| `/crm/api/v2/contacts/stats/` | GET | Contact stats |
| `/crm/api/v2/contacts/sources/` | GET | Contact sources |
| `/crm/api/v2/contacts/bulk_delete/` | POST | Bulk delete |
| `/crm/api/v2/contacts/bulk_update/` | POST | Bulk update |
| `/crm/api/v2/contacts/export/` | GET | Export to CSV |
| `/crm/api/v2/contacts/mine/` | GET | My contacts |
