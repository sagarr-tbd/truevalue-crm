# CRM V2 Companies — UI Testing Guide

## Prerequisites

1. Backend running, frontend running
2. Forms seeded (`docker exec crm-backend python manage.py seed_default_forms`)
3. Logged in with a valid user
4. Recommended: have contacts created (for Link Contact testing)

---

## How the Form Drawer Works

- Click **"Add Company"** → drawer slides in from the right
- **Left sidebar** shows clickable section tabs
- **Right panel** shows fields for the selected section
- Required fields marked with red asterisk (*)

---

## 1. Create Company #1 — BrightPixel Media

Navigate: **Sidebar → Sales V2 → Companies** → `/sales-v2/companies`

Click **"Add Company"**. You'll see 5 sections in the left sidebar:

### Section 1: Company Details

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Company Name | text | YES (unique) | `BrightPixel Media` |
| Website | url | no | `https://brightpixelmedia.com` |
| Email | email | no | `info@brightpixelmedia.com` |
| Phone | phone | no | `+91-4023456789` |
| Industry | select | no | `Media & Entertainment` |
| Company Size | select | no | `51-200` |

> **Industry options:** Technology, Finance, Healthcare, Retail, Manufacturing, Education, Real Estate, Consulting, Media & Entertainment, Non-Profit, Other
>
> **Size options:** 1, 2-10, 11-50, 51-200, 201-500, 501-1000, 1000+

### Section 2: Financial Details (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Annual Revenue | currency | no | `5000000` |
| Employee Count | number | no | `120` |

### Section 3: Address Information (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Street Address | text (full width) | no | `42 Film City Road` |
| Address Line 2 | text (full width) | no | `Building C, 3rd Floor` |
| City | text | no | `Hyderabad` |
| State/Province | text | no | `Telangana` |
| Zip/Postal Code | text | no | `500032` |
| Country | text | no | `India` |

### Section 4: Social & Web (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| LinkedIn | url | no | `https://linkedin.com/company/brightpixelmedia` |
| Twitter / X | url | no | `https://x.com/brightpixel` |
| Facebook | url | no | `https://facebook.com/brightpixelmedia` |

### Section 5: Additional Information (collapsible)

| Field | Type | Required | Test Value |
|-------|------|----------|------------|
| Description | textarea (full width) | no | `Digital media production house specializing in corporate videos and brand content. Key client for our premium plan.` |

Click **Create Company**.

**Verify:**
- Toast shows success
- Company appears in list with name `BrightPixel Media`
- Industry shows `Media & Entertainment`

---

## 2. View Company Detail

Click `BrightPixel Media` in the list → `/sales-v2/companies/{id}`.

**Verify:**
- Header shows company name, website, industry, phone
- Financial details (revenue, employee count) show
- Address shows
- Social links show
- **Contacts card** exists (empty for now)
- **Deals card** exists
- Tags section exists
- Activity timeline section exists

---

## 3. Link Contact to Company

On the `BrightPixel Media` detail page:

1. Scroll to the **Contacts** card
2. Click **"Link Contact"**
3. Search for an existing contact (e.g., `Priya Patel`)
4. Select and link

**Verify:**
- Contact appears in the Contacts card
- Contact name is clickable (links to contact detail page)

---

## 4. Unlink Contact

1. On the Contacts card, find the contact you just linked
2. Click the **Unlink** icon on that contact row

**Verify:**
- Contact removed from the Contacts card

---

## 5. Edit Company

On detail page, click **Edit**. The drawer opens with existing data pre-filled.

**Changes to make:**
- **Company Details** section → Company Size → `201-500`
- **Financial Details** section → Annual Revenue → `8500000`
- **Additional** section → append to Description: ` Recently expanded to international markets.`

Click **Save Changes**.

**Verify:** All changes reflected on detail page.

---

## 6. Create Company #2 — NovaTech Solutions

Click **"Add Company"**. Fill:

### Company Details

| Field | Test Value |
|-------|------------|
| Company Name | `NovaTech Solutions` |
| Website | `https://novatech.io` |
| Email | `contact@novatech.io` |
| Phone | `+91-8028889999` |
| Industry | `Technology` |
| Company Size | `11-50` |

### Financial Details

| Field | Test Value |
|-------|------------|
| Annual Revenue | `1200000` |
| Employee Count | `35` |

### Address Information

| Field | Test Value |
|-------|------------|
| Street Address | `88 Whitefield Main Road` |
| City | `Bangalore` |
| State/Province | `Karnataka` |
| Zip/Postal Code | `560066` |
| Country | `India` |

### Social & Web

| Field | Test Value |
|-------|------------|
| LinkedIn | `https://linkedin.com/company/novatech` |

### Additional Information

| Field | Test Value |
|-------|------------|
| Description | `Emerging SaaS startup focused on developer tools. Evaluating our enterprise plan.` |

Click **Create Company**.

---

## 7. Create Company #3 — GreenLeaf Organics

Click **"Add Company"**. Fill:

### Company Details

| Field | Test Value |
|-------|------------|
| Company Name | `GreenLeaf Organics` |
| Website | `https://greenleaforganics.in` |
| Email | `hello@greenleaforganics.in` |
| Phone | `+91-4412345678` |
| Industry | `Retail` |
| Company Size | `2-10` |

### Address Information

| Field | Test Value |
|-------|------------|
| Street Address | `5 Anna Salai` |
| City | `Chennai` |
| State/Province | `Tamil Nadu` |
| Zip/Postal Code | `600002` |
| Country | `India` |

### Additional Information

| Field | Test Value |
|-------|------------|
| Description | `Small organic food retailer. Potential pilot customer.` |

Click **Create Company**.

---

## 8. Tags

On any company detail page:

1. Look for the **Tags** section
2. Click **Add Tag** → create a new tag or select existing
3. Verify tag appears on the company
4. Remove a tag → verify it's gone
5. Refresh page → verify tags persist

---

## 9. Activity Timeline

On company detail page:

1. Look for the **Activity** tab/section
2. Verify timeline shows activities related to this company
3. If no activities exist, the section shows empty state

---

## 10. Related Deals

On company detail page:

1. Look for the **Deals** section
2. If this company is linked to deals, they should appear
3. If created from lead conversion with a deal, that deal shows here

---

## 11. Filters & Search

On the companies list page:

| Test | Action | Expected |
|------|--------|----------|
| Search by name | Type `BrightPixel` in search box | Only `BrightPixel Media` shows |
| Search by name | Type `NovaTech` | Only `NovaTech Solutions` shows |
| Search by name | Type `GreenLeaf` | Only `GreenLeaf Organics` shows |
| Filter by industry | Select `Technology` | Shows tech companies only |
| Filter by industry | Select `Retail` | Shows `GreenLeaf Organics` |
| Clear filters | Click clear/reset | All companies show |
| Sort by name | Click name column header | Toggles asc/desc |
| Sort by created | Click created date column | Toggles asc/desc |

---

## 12. Bulk Operations

Select 2+ companies via checkboxes:

### Bulk Delete
1. Select `GreenLeaf Organics`
2. Click **Bulk Delete**
3. Confirm
4. **Verify:** Company removed from list

---

## 13. Export

1. Go to companies list
2. Select companies via checkboxes
3. Click **Export**
4. **Verify:** CSV file downloads with correct data

---

## 14. Validation Edge Cases

| Test | How | Expected Result |
|------|-----|-----------------|
| Missing Company Name | Leave Company Name empty | Red error: "Company Name is required" |
| Duplicate name | Create company with `BrightPixel Media` again | Backend error: name must be unique |
| Invalid URL | Enter `not-a-url` in Website | Validation error |
| Invalid email | Enter `not-an-email` in Email | Validation error |
| Negative revenue | Enter `-100` in Annual Revenue | Validation error (min: 0) |
| Negative employee count | Enter `-5` in Employee Count | Validation error (min: 0) |
| Special characters | Enter `O'Reilly & Sons` as Company Name | Saves correctly |
| Unicode | Enter `München GmbH` as Company Name | Saves correctly |
| Empty form | Click Create with nothing filled | Fails on Company Name |

---

## 15. Layout Editor

1. Navigate to `/sales-v2/companies/layout` (or click **Edit Layout** in the drawer)
2. Verify all 5 sections and their fields are displayed
3. Try reordering fields
4. Try changing a field property (e.g., make Industry required)
5. Save → open Add Company → verify changes appear

---

## API Payload Reference

When you create a company, this is what gets sent to `POST /crm/api/v2/companies/`:

```json
{
  "entity_data": {
    "name": "BrightPixel Media",
    "website": "https://brightpixelmedia.com",
    "email": "info@brightpixelmedia.com",
    "phone": "+91-4023456789",
    "industry": "media",
    "size": "51-200",
    "annual_revenue": 5000000,
    "employee_count": 120,
    "address_line1": "42 Film City Road",
    "address_line2": "Building C, 3rd Floor",
    "city": "Hyderabad",
    "state": "Telangana",
    "postal_code": "500032",
    "country": "India",
    "linkedin_url": "https://linkedin.com/company/brightpixelmedia",
    "twitter_url": "https://x.com/brightpixel",
    "facebook_url": "https://facebook.com/brightpixelmedia",
    "description": "Digital media production house..."
  }
}
```

---

## Company API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/crm/api/v2/companies/` | GET | List companies |
| `/crm/api/v2/companies/` | POST | Create company |
| `/crm/api/v2/companies/{id}/` | GET | Get company detail |
| `/crm/api/v2/companies/{id}/` | PATCH | Update company |
| `/crm/api/v2/companies/{id}/` | DELETE | Soft delete company |
| `/crm/api/v2/companies/{id}/contacts/` | GET | List linked contacts |
| `/crm/api/v2/companies/{id}/deals/` | GET | List related deals |
| `/crm/api/v2/companies/{id}/stats/` | GET | Company-specific stats |
| `/crm/api/v2/companies/{id}/update_status/` | POST | Update company status |
| `/crm/api/v2/companies/check_duplicate/` | POST | Check for duplicate company name |
| `/crm/api/v2/companies/stats/` | GET | Company stats |
| `/crm/api/v2/companies/sources/` | GET | Company sources |
| `/crm/api/v2/companies/bulk_delete/` | POST | Bulk delete |
| `/crm/api/v2/companies/bulk_update/` | POST | Bulk update |
| `/crm/api/v2/companies/export/` | GET | Export to CSV |
