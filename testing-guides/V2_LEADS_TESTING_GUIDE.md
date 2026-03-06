# CRM V2 Leads — UI Testing Guide

## Prerequisites

1. Backend running (`python manage.py runserver`)
2. Frontend running (`cd frontend/crm-app && npm run dev`)
3. Re-seed the lead form to get full fields: `python manage.py seed_default_forms`
4. Logged in with a valid user

> **After re-seeding**, refresh the browser. The lead form will now show all fields
> (Mobile, Website, Industry, Assigned To, Rating, Lead Score, Address, etc.)

---

## How the Form Drawer Works

- Click **"Add Lead"** → drawer slides in from the right
- **Left sidebar** shows clickable section tabs
- **Right panel** shows fields for the selected section
- Required fields marked with red asterisk (*)
- Lookup fields (Company, Assigned To) load options from APIs
- Click **Create Lead** at the bottom to save

---

## 1. Create a Lead

Navigate: **Sidebar → Sales V2 → Leads** → `/sales-v2/leads`

Click **"Add Lead"**. You'll see 5 sections in the left sidebar:

### Section 1: Contact Information

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| First Name | text | YES | `Rahul` |
| Last Name | text | YES | `Sharma` |
| Email | email | YES (unique) | `rahul.sharma@techcorp.in` |
| Phone | phone | no | `+91-9876543210` |
| Mobile | phone | no | `+91-8765432109` |
| Website | url | no | `https://rahulsharma.dev` |

### Section 2: Company Information

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Company | lookup (searches existing companies) | no | (select from dropdown if any exist, or skip) |
| Company Name | text (free text) | no | `TechCorp India` |
| Job Title | text | no | `VP of Engineering` |
| Industry | select dropdown | no | `Technology` |
| Annual Revenue | currency | no | `5000000` |
| Number of Employees | select dropdown | no | `51-200` |

> **Industry options:** Technology, Finance & Banking, Healthcare, Retail & E-commerce, Manufacturing, Real Estate, Education, Consulting, Other
>
> **Employee options:** 1, 2-10, 11-50, 51-200, 201-500, 501-1000, 1000+

### Section 3: Address Information (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Street Address | text (full width) | no | `42 MG Road, Block C` |
| City | text | no | `Bangalore` |
| State/Province | text | no | `Karnataka` |
| Zip/Postal Code | text | no | `560001` |
| Country | text | no | `India` |

### Section 4: Lead Qualification

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Assigned To | lookup (loads org members) | no | (select a team member from dropdown) |
| Status | select dropdown | YES | `New` (pre-selected as default) |
| Lead Source | select dropdown | no | `Website` |
| Source Details | text | no | `Google Ads Campaign Q1` |
| Lead Rating | select dropdown | no | `Hot` |
| Lead Score | number (0-100) | no | `85` |

> **Status options:** New, Contacted, Qualified, Unqualified, Converted
>
> **Source options:** Website, Referral, Cold Call, Trade Show, Social Media, Advertisement, Partner, Webinar, Email Campaign, Other
>
> **Rating options:** Hot, Warm, Cold

### Section 5: Additional Information (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Notes | textarea (full width) | no | `High-value enterprise lead interested in CRM platform. Met at TechSummit 2026.` |

Click **Create Lead**.

**Verify:**
- Toast shows success
- Lead appears in list with name `Rahul Sharma`
- Status badge shows `New`

---

## 2. View Lead Detail

Click `Rahul Sharma` in the list → navigates to `/sales-v2/leads/{id}`.

**Verify all fields display correctly:**
- Name, Email, Phone, Mobile, Website
- Company Name, Job Title, Industry, Annual Revenue, Employees
- Address fields
- Status, Source, Source Details, Rating, Lead Score
- Notes

---

## 3. Edit Lead

On detail page, click **Edit**. The drawer opens with existing data pre-filled.

**Changes to make:**
- **Lead Qualification** section → Status → `Contacted`, Rating → `Warm`, Lead Score → `70`
- **Additional Information** section → append to Notes: ` Follow-up call scheduled for next week.`

Click **Save Changes**.

**Verify:** All changes reflected on detail page.

---

## 4. Create Second Lead (for bulk operations)

Click **"Add Lead"** again. Fill:

### Contact Information

| Field | Test Value |
|-------|------------|
| First Name | `Anita` |
| Last Name | `Desai` |
| Email | `anita.desai@innovate.io` |
| Phone | `+91-7766554433` |

### Company Information

| Field | Test Value |
|-------|------------|
| Company Name | `Innovate Solutions` |
| Job Title | `Product Director` |
| Industry | `Consulting` |

### Lead Qualification

| Field | Test Value |
|-------|------------|
| Status | `New` |
| Lead Source | `Referral` |
| Rating | `Warm` |
| Lead Score | `60` |

### Additional Information

| Field | Test Value |
|-------|------------|
| Notes | `Referred by existing client. Interested in analytics module.` |

Click **Create Lead**.

---

## 5. Create Third Lead (for conversion test)

Click **"Add Lead"** again. Fill:

### Contact Information

| Field | Test Value |
|-------|------------|
| First Name | `Vikram` |
| Last Name | `Singh` |
| Email | `vikram.singh@globaledge.com` |
| Phone | `+91-9988771122` |
| Mobile | `+91-8877661100` |
| Website | `https://globaledge.com` |

### Company Information

| Field | Test Value |
|-------|------------|
| Company Name | `GlobalEdge Technologies` |
| Job Title | `CTO` |
| Industry | `Technology` |
| Annual Revenue | `25000000` |
| Number of Employees | `201-500` |

### Address Information

| Field | Test Value |
|-------|------------|
| Street Address | `100 Cyber City, DLF Phase 2` |
| City | `Gurugram` |
| State/Province | `Haryana` |
| Zip/Postal Code | `122002` |
| Country | `India` |

### Lead Qualification

| Field | Test Value |
|-------|------------|
| Status | `New` |
| Lead Source | `Trade Show` |
| Source Details | `CII Tech Summit 2026` |
| Rating | `Hot` |
| Lead Score | `92` |

### Additional Information

| Field | Test Value |
|-------|------------|
| Notes | `Met at CII Tech Summit. Very interested in enterprise CRM. Budget approved. Decision expected within 30 days.` |

Click **Create Lead**.

---

## 6. Filters & Search

On the leads list page:

| Test | Action | Expected |
|------|--------|----------|
| Search by name | Type `Rahul` in search box | Only `Rahul Sharma` shows |
| Search by company | Type `Innovate` | Only `Anita Desai` shows |
| Filter by status | Select `New` from Status filter | Shows leads with New status |
| Filter by source | Select `Website` from Source filter | Shows only website leads |
| Clear filters | Click clear/reset | All leads show |
| Sort by name | Click name column header | Toggles asc/desc sort |
| Sort by created | Click created date column | Toggles asc/desc sort |
| Pagination | Create 25+ leads | Pagination controls appear |

---

## 7. Bulk Operations

On the leads list:

### Bulk Update
1. Select `Rahul Sharma` and `Anita Desai` using checkboxes
2. Click **Bulk Update**
3. Change status to `Qualified`
4. Confirm
5. **Verify:** Both leads now show `Qualified` status

### Bulk Delete
1. Select `Anita Desai` using checkbox
2. Click **Bulk Delete**
3. Confirm
4. **Verify:** Lead removed from list

---

## 8. Disqualify Lead

1. Click on `Rahul Sharma` → detail page
2. Click **Disqualify**
3. **Verify:** Status changes to `Unqualified`

---

## 9. Convert Lead

1. Click on `Vikram Singh` → detail page
2. Click **Convert**
3. The conversion modal shows 3 sections:

**Contact (always created)**

| Field | Value |
|-------|-------|
| Create new contact | checked (disabled — always on) |
| Name | `Vikram Singh` (read-only, from lead) |
| Email | `vikram.singh@globaledge.com` (read-only, from lead) |
| Phone | `+91-9988771122` (read-only, from lead) |
| Assign to | (select a team member, or leave as "Current user (me)") |

**Company (optional)**

| Field | Value |
|-------|-------|
| Create new company | `checked` |
| Company Name | `GlobalEdge Technologies` (pre-filled from lead) |

**Deal (optional)**

| Field | Value |
|-------|-------|
| Create a deal for this conversion | `checked` |
| Deal Name | `GlobalEdge Technologies - New Business` (pre-filled) |
| Deal Value ($) | `500000` |

> **Note:** Pipeline and Stage are not shown in the UI. The backend automatically assigns the deal to the default active pipeline and its first stage.

4. Click **Convert Lead**

**Verify:**
- Lead status → `Converted`
- Purple banner shows "This lead was converted on [date]" with **View Contact** button
- New contact `Vikram Singh` at `/sales-v2/contacts`
- New company `GlobalEdge Technologies` at `/sales-v2/companies`
- New deal at `/sales-v2/deals` (assigned to default pipeline, first stage)

---

## 10. Export

1. Go to leads list
2. Select leads via checkboxes
3. Click **Export**
4. **Verify:** CSV file downloads with correct data

---

## 11. Validation Edge Cases

| Test | How | Expected Result |
|------|-----|-----------------|
| Missing First Name | Leave First Name empty, fill rest | Red error: "First Name is required" |
| Missing Last Name | Leave Last Name empty, fill rest | Red error: "Last Name is required" |
| Missing Email | Leave Email empty, fill rest | Red error: "Email is required" |
| Duplicate email | Create lead with `rahul.sharma@techcorp.in` again | Backend error: email must be unique |
| Invalid email | Enter `not-an-email` in Email field | Browser or backend validation error |
| Invalid URL | Enter `not-a-url` in Website field | Browser or backend validation error |
| Lead Score > 100 | Enter `150` in Lead Score | Error: "Lead Score must be at most 100" |
| Lead Score < 0 | Enter `-5` in Lead Score | Error: "Lead Score must be at least 0" |
| Special characters | Enter `O'Brien` as Last Name | Saves correctly |
| Unicode | Enter `José García` as First Name | Saves correctly |
| Long text | Enter 5000+ chars in Notes | Saves correctly |
| Empty form | Click Create Lead with nothing filled | Fails on First Name, Last Name, Email |

---

## 12. Layout Editor

1. Navigate to `/sales-v2/leads/layout` (or click **Edit Layout** button in the create drawer)
2. **Verify:** All 5 sections and their fields are displayed
3. Try reordering fields within a section
4. Try changing a field property (e.g., make Phone required)
5. Save changes
6. Go back to **Add Lead** → verify the change appears in the form

---

## API Payload Reference

When you create a lead via the form, this is what gets sent to `POST /crm/api/v2/leads/`:

```json
{
  "status": "new",
  "entity_data": {
    "first_name": "Rahul",
    "last_name": "Sharma",
    "email": "rahul.sharma@techcorp.in",
    "phone": "+91-9876543210",
    "mobile": "+91-8765432109",
    "website": "https://rahulsharma.dev",
    "company_name": "TechCorp India",
    "title": "VP of Engineering",
    "industry": "technology",
    "annual_revenue": 5000000,
    "employees": "51-200",
    "address_line1": "42 MG Road, Block C",
    "city": "Bangalore",
    "state": "Karnataka",
    "postal_code": "560001",
    "country": "India",
    "source": "website",
    "source_detail": "Google Ads Campaign Q1",
    "rating": "hot",
    "lead_score": 85,
    "description": "High-value enterprise lead interested in CRM platform. Met at TechSummit 2026."
  }
}
```

The backend serializer extracts `status`, `source`, `rating`, `assigned_to`, `company` from `entity_data` and moves them to model columns. Everything else stays in the JSONB `entity_data` field.

---

## Lead API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/crm/api/v2/leads/` | GET | List leads |
| `/crm/api/v2/leads/` | POST | Create lead |
| `/crm/api/v2/leads/{id}/` | GET | Get lead detail |
| `/crm/api/v2/leads/{id}/` | PATCH | Update lead |
| `/crm/api/v2/leads/{id}/` | DELETE | Soft delete lead |
| `/crm/api/v2/leads/{id}/convert/` | POST | Convert lead |
| `/crm/api/v2/leads/{id}/disqualify/` | POST | Disqualify lead |
| `/crm/api/v2/leads/stats/` | GET | Lead stats |
| `/crm/api/v2/leads/sources/` | GET | Lead sources |
| `/crm/api/v2/leads/bulk_delete/` | POST | Bulk delete |
| `/crm/api/v2/leads/bulk_update/` | POST | Bulk update |
| `/crm/api/v2/leads/export/` | GET | Export to CSV |
| `/crm/api/v2/leads/mine/` | GET | My leads |
| `/crm/api/v2/leads/web_form/` | POST | Web form submission |
