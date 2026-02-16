# CRM Module — Testing Guide

## Prerequisites

| Service | Port | How to start |
|---------|------|-------------|
| **Backend (Docker)** | `8000` | `docker compose up -d crm-backend` |
| **Frontend** | `3000` | `cd frontend/crm-app && npm run dev` |
| **PostgreSQL** | `5432` | Via Docker (truevalue-postgres) |
| **Redis** | `6379` | Via Docker (truevalue-redis) |

### Seed Test Data

```bash
# Seed companies (accounts)
docker exec crm-backend python manage.py seed_companies --org_id=e14d9498-4c28-480f-80f2-c7be33374388

# This creates: 25 companies with tags
```

To reset and re-seed:

```bash
# Clear all CRM data first
docker exec crm-backend python manage.py clear_crm_data --org-id=e14d9498-4c28-480f-80f2-c7be33374388 --yes

# Then re-seed
docker exec crm-backend python manage.py seed_companies --org_id=e14d9498-4c28-480f-80f2-c7be33374388
```

### How to Test

| Check In | URL | When to use |
|----------|-----|-------------|
| **Frontend** | `http://localhost:3000` | UI pages — click buttons, fill forms, verify visuals |
| **Backend API** | `http://localhost:8000/api/` | Paste URL in browser, or use Postman/curl — for API-only tests |
| **Both** | Frontend + Backend | Verify the action on frontend, then confirm data via API |

---

## Module 1: Accounts (Companies)

### Account CRUD

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 1 | List accounts | **Frontend** | `http://localhost:3000/sales/accounts` | — | Table shows all accounts with name, industry, type, status, location, revenue |
| 1b | List accounts | **Backend** | `http://localhost:8000/api/companies/` | — | JSON paginated list |
| 2 | Create account (Quick form) | **Frontend** | `http://localhost:3000/sales/accounts` → Click **"Add Account"** → Fill Quick Form | Name: `TechCorp Solutions`, Industry: `Technology`, Size: `51-200` | New account appears in table |
| 2b | Create account | **Backend** | POST `http://localhost:8000/api/companies/` | See sample JSON below | 201 Created |
| 3 | Create account (Detailed form) | **Frontend** | `http://localhost:3000/sales/accounts` → Click **"Add Account"** → Switch to Detailed Form | Fill all fields including address, social links | Account created with all details |
| 4 | View account detail | **Frontend** | `http://localhost:3000/sales/accounts/<id>` (click any account row) | — | Detail page with Overview, Details, Contacts, Deals, Activity, Notes tabs |
| 4b | View account detail | **Backend** | `http://localhost:8000/api/companies/<id>/` | — | Full JSON with all fields |
| 5 | Edit account | **Frontend** | `http://localhost:3000/sales/accounts/<id>` → Click **Edit** button | Change industry or revenue | Updated on detail page |
| 5b | Update account | **Backend** | PATCH `http://localhost:8000/api/companies/<id>/` | `{"industry": "Finance"}` | 200 |
| 6 | Delete account | **Frontend** | `http://localhost:3000/sales/accounts/<id>` → Click **Delete** → Confirm | — | Account removed, redirects to list |
| 6b | Delete account | **Backend** | DELETE `http://localhost:8000/api/companies/<id>/` | — | 204 No Content |
| 7 | Search accounts | **Frontend** | `http://localhost:3000/sales/accounts` → Type in search bar | Search: `Tech` | Filtered to matching accounts |
| 7b | Search accounts | **Backend** | `http://localhost:8000/api/companies/?search=Tech` | — | Filtered results |
| 8 | Filter by industry | **Frontend** | `http://localhost:3000/sales/accounts` → Select industry filter | Industry: `Technology` | Only tech companies shown |
| 8b | Filter by industry | **Backend** | `http://localhost:8000/api/companies/?industry=technology` | — | Filtered results |
| 9 | Filter by status | **Frontend** | `http://localhost:3000/sales/accounts` → Select status filter | Status: `Active` | Only active accounts |
| 9b | Filter by status | **Backend** | `http://localhost:8000/api/companies/?status=active` | — | Filtered results |
| 10 | Advanced filters | **Frontend** | `http://localhost:3000/sales/accounts` → Click **Filters** → Add conditions | Field: `annual_revenue`, Operator: `greaterThan`, Value: `1000000` | Only accounts with revenue > $1M |
| 11 | Sort by column | **Frontend** | `http://localhost:3000/sales/accounts` → Click column header | Click "Revenue" header | Sorted by revenue |
| 11b | Sort by column | **Backend** | `http://localhost:8000/api/companies/?ordering=-annual_revenue` | — | Descending by revenue |

**Sample Account Create (Backend JSON)**:

```json
{
  "name": "TechCorp Solutions",
  "industry": "technology",
  "type": "prospect",
  "status": "active",
  "size": "51-200",
  "email": "info@techcorp.com",
  "phone": "+1 555-100-1000",
  "website": "techcorp.com",
  "annual_revenue": 5000000,
  "employee_count": 150,
  "address_line1": "123 Tech Street",
  "city": "San Francisco",
  "state": "CA",
  "postal_code": "94102",
  "country": "USA",
  "description": "Enterprise software company"
}
```

### Account Detail Page Verification

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 12 | Overview tab | **Frontend** | `http://localhost:3000/sales/accounts/<id>` → Overview tab | Company info, contact details, deal summary stats |
| 13 | Details tab | **Frontend** | `http://localhost:3000/sales/accounts/<id>` → Details tab | Business details card, address card, social profiles card |
| 14 | Contacts tab | **Frontend** | `http://localhost:3000/sales/accounts/<id>` → Contacts tab | List of contacts linked to this company |
| 15 | Deals tab | **Frontend** | `http://localhost:3000/sales/accounts/<id>` → Deals tab | Deal stats (Total/Open/Won/Lost), list of deals |
| 16 | Empty state | **Frontend** | Account with no contacts/deals | Graceful "No contacts/deals" message |

---

## Module 2: Contacts

### Contact CRUD

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 1 | List contacts | **Frontend** | `http://localhost:3000/sales/contacts` | — | Table with name, email, phone, company, status, tags |
| 1b | List contacts | **Backend** | `http://localhost:8000/api/contacts/` | — | JSON paginated list |
| 2 | Create contact | **Frontend** | `http://localhost:3000/sales/contacts` → Click **"Add Contact"** | First: `John`, Last: `Smith`, Email: `john@techcorp.com`, Company: `TechCorp` | New contact appears |
| 2b | Create contact | **Backend** | POST `http://localhost:8000/api/contacts/` | See sample JSON below | 201 Created |
| 3 | View contact detail | **Frontend** | `http://localhost:3000/sales/contacts/<id>` | — | Profile with Overview, Details, Activity, Deals, Notes tabs |
| 3b | View contact detail | **Backend** | `http://localhost:8000/api/contacts/<id>/` | — | Full JSON |
| 4 | Edit contact | **Frontend** | `http://localhost:3000/sales/contacts/<id>` → Click **Edit** | Change phone number | Updated on detail page |
| 4b | Update contact | **Backend** | PATCH `http://localhost:8000/api/contacts/<id>/` | `{"phone": "555-999-8888"}` | 200 |
| 5 | Delete contact | **Frontend** | `http://localhost:3000/sales/contacts/<id>` → Click **Delete** → Confirm | — | Contact removed |
| 5b | Delete contact | **Backend** | DELETE `http://localhost:8000/api/contacts/<id>/` | — | 204 No Content |
| 6 | Link contact to company | **Frontend** | Create contact → Select Company dropdown | Company: `TechCorp Solutions` | Contact appears on company's Contacts tab |
| 7 | Filter by status | **Frontend** | `http://localhost:3000/sales/contacts` → Status filter | Status: `Active` | Only active contacts |
| 8 | Filter by company | **Frontend** | `http://localhost:3000/sales/contacts` → Company filter | Company: `TechCorp` | Only TechCorp contacts |
| 9 | Search contacts | **Frontend** | Type in search bar | Search: `john` | Matching contacts |
| 10 | Duplicate detection | **Frontend** | Create contact with existing email | Email: `john@techcorp.com` | Warning or merge option shown |

**Sample Contact Create (Backend JSON)**:

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@techcorp.com",
  "phone": "+1 555-111-1111",
  "mobile": "+1 555-111-2222",
  "job_title": "Chief Technology Officer",
  "company_id": "<company-uuid>",
  "status": "active",
  "source": "website",
  "address_line1": "123 Tech Street",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "linkedin_url": "https://linkedin.com/in/johnsmith",
  "do_not_call": false,
  "do_not_email": false
}
```

### Contact Detail Page Verification

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 11 | Overview tab | **Frontend** | Contact detail → Overview tab | Contact info, company link, deal/activity counts |
| 12 | Details tab | **Frontend** | Contact detail → Details tab | Personal info, address, social profiles, communication preferences |
| 13 | Activity tab | **Frontend** | Contact detail → Activity tab | Timeline of activities (calls, emails, meetings) |
| 14 | Deals tab | **Frontend** | Contact detail → Deals tab | List of deals linked to this contact |
| 15 | Merge contacts | **Frontend** | Select duplicate contact → Click Merge | Select primary contact | Contacts merged, data combined |

---

## Module 3: Leads

### Lead CRUD

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 1 | List leads | **Frontend** | `http://localhost:3000/sales/leads` | — | Table with name, company, status, score, source |
| 1b | List leads | **Backend** | `http://localhost:8000/api/leads/` | — | JSON paginated list |
| 2 | Create lead | **Frontend** | `http://localhost:3000/sales/leads` → Click **"Add Lead"** | First: `Emily`, Last: `Brown`, Email: `emily@startup.io`, Status: `New` | New lead appears |
| 2b | Create lead | **Backend** | POST `http://localhost:8000/api/leads/` | See sample JSON below | 201 Created |
| 3 | View lead detail | **Frontend** | `http://localhost:3000/sales/leads/<id>` | — | Lead profile with status, score, source info |
| 3b | View lead detail | **Backend** | `http://localhost:8000/api/leads/<id>/` | — | Full JSON |
| 4 | Edit lead | **Frontend** | Lead detail → Click **Edit** | Change status to `Contacted` | Status badge updates |
| 4b | Update lead | **Backend** | PATCH `http://localhost:8000/api/leads/<id>/` | `{"status": "contacted"}` | 200 |
| 5 | Delete lead | **Frontend** | Lead detail → Click **Delete** → Confirm | — | Lead removed |
| 5b | Delete lead | **Backend** | DELETE `http://localhost:8000/api/leads/<id>/` | — | 204 No Content |
| 6 | Filter by status | **Frontend** | Leads list → Status filter | Status: `Qualified` | Only qualified leads |
| 7 | Filter by source | **Frontend** | Leads list → Source filter | Source: `Website` | Only website leads |
| 8 | Search leads | **Frontend** | Type in search bar | Search: `emily` | Matching leads |

**Sample Lead Create (Backend JSON)**:

```json
{
  "first_name": "Emily",
  "last_name": "Brown",
  "email": "emily.brown@startup.io",
  "phone": "+1 555-444-4444",
  "company_name": "Startup.io",
  "job_title": "Founder",
  "status": "new",
  "source": "linkedin",
  "score": 75,
  "address_line1": "456 Innovation Ave",
  "city": "Austin",
  "state": "TX",
  "country": "USA"
}
```

### Lead Lifecycle (Critical Path)

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 9 | Status: New → Contacted | **Frontend** | Lead detail → Edit → Status: `Contacted` | — | Status badge changes to yellow/warning |
| 9b | Status: New → Contacted | **Backend** | PATCH `http://localhost:8000/api/leads/<id>/` | `{"status": "contacted"}` | 200 |
| 10 | Status: Contacted → Qualified | **Frontend** | Lead detail → Edit → Status: `Qualified` | — | Status badge changes to green/success |
| 11 | **CONVERT lead** | **Frontend** | Lead detail (Qualified) → Click **"Convert"** button → Confirm | — | See expected below |
| 11b | **CONVERT lead** | **Backend** | POST `http://localhost:8000/api/leads/<id>/convert/` | `{"create_contact": true, "create_deal": false}` | 200, new contact_id returned |
| 12 | **DISQUALIFY lead** | **Frontend** | Lead detail → Click **"Disqualify"** → Select reason → Confirm | Reason: `Budget` | Status: `Unqualified`, reason saved |
| 12b | **DISQUALIFY lead** | **Backend** | POST `http://localhost:8000/api/leads/<id>/disqualify/` | `{"reason": "budget", "notes": "Cannot afford"}` | 200 |

**Convert Lead — What should happen:**

- [ ] Lead status changes to `Converted`
- [ ] New Contact created with same name/email
- [ ] Link to new contact shown on lead detail
- [ ] New contact appears in `/sales/contacts`
- [ ] If "Create Deal" checked: new deal created and linked

**Disqualify Lead — What should happen:**

- [ ] Lead status changes to `Unqualified`
- [ ] Disqualification reason saved
- [ ] Lead hidden from active views (or shown with different styling)

### Lead Score Testing

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 13 | High score (80-100) | **Frontend** | Create lead with Score: `95` | Green/success color indicator |
| 14 | Medium score (50-79) | **Frontend** | Create lead with Score: `65` | Yellow/warning color indicator |
| 15 | Low score (0-49) | **Frontend** | Create lead with Score: `25` | Red/error color indicator |

---

## Module 4: Deals (Critical Path)

### Deal CRUD

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 1 | List deals | **Frontend** | `http://localhost:3000/sales/deals` | — | Kanban board or table with deals grouped by stage |
| 1b | List deals | **Backend** | `http://localhost:8000/api/deals/` | — | JSON paginated list |
| 2 | Create deal | **Frontend** | `http://localhost:3000/sales/deals` → Click **"Add Deal"** | Name: `Enterprise License`, Value: `50000`, Stage: `Qualification` | New deal appears |
| 2b | Create deal | **Backend** | POST `http://localhost:8000/api/deals/` | See sample JSON below | 201 Created |
| 3 | View deal detail | **Frontend** | `http://localhost:3000/sales/deals/<id>` | — | Deal info with stage, value, contact, company, timeline |
| 3b | View deal detail | **Backend** | `http://localhost:8000/api/deals/<id>/` | — | Full JSON with stage details |
| 4 | Edit deal | **Frontend** | Deal detail → Click **Edit** | Change value or stage | Updated on detail page |
| 4b | Update deal | **Backend** | PATCH `http://localhost:8000/api/deals/<id>/` | `{"value": 75000}` | 200 |
| 5 | Delete deal | **Frontend** | Deal detail → Click **Delete** → Confirm | — | Deal removed |
| 5b | Delete deal | **Backend** | DELETE `http://localhost:8000/api/deals/<id>/` | — | 204 No Content |
| 6 | Link deal to contact | **Frontend** | Create deal → Select Contact dropdown | Contact: `John Smith` | Deal appears on contact's Deals tab |
| 7 | Link deal to company | **Frontend** | Create deal → Select Company dropdown | Company: `TechCorp` | Deal appears on company's Deals tab |
| 8 | Filter by stage | **Frontend** | Deals list → Stage filter | Stage: `Proposal` | Only proposal stage deals |
| 9 | Filter by status | **Frontend** | Deals list → Status filter | Status: `Won` | Only won deals |

**Sample Deal Create (Backend JSON)**:

```json
{
  "name": "TechCorp Enterprise License",
  "value": 50000,
  "currency": "USD",
  "stage_id": "<stage-uuid>",
  "contact_id": "<contact-uuid>",
  "company_id": "<company-uuid>",
  "expected_close_date": "2026-03-15",
  "probability": 40,
  "description": "Enterprise software license deal"
}
```

### Deal Pipeline Flow (Critical Path)

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 10 | Stage: Qualification → Discovery | **Frontend** | Deal detail → Edit → Stage: `Discovery` | — | Stage badge updates, probability: 20% |
| 10b | Stage transition | **Backend** | PATCH `http://localhost:8000/api/deals/<id>/` | `{"stage_id": "<discovery-stage-id>"}` | 200 |
| 11 | Stage: Discovery → Proposal | **Frontend** | Deal detail → Edit → Stage: `Proposal` | — | Probability: 40% |
| 12 | Stage: Proposal → Negotiation | **Frontend** | Deal detail → Edit → Stage: `Negotiation` | — | Probability: 60% |
| 13 | **Mark as WON** | **Frontend** | Deal detail → Click **"Won"** button (trophy icon) | — | See expected below |
| 13b | **Mark as WON** | **Backend** | POST `http://localhost:8000/api/deals/<id>/win/` | — | Status: `won`, actual_close_date set |
| 14 | **Mark as LOST** | **Frontend** | Deal detail → Click **"Lost"** button → Enter reason | Reason: `Competitor`, Notes: `Chose Salesforce` | See expected below |
| 14b | **Mark as LOST** | **Backend** | POST `http://localhost:8000/api/deals/<id>/lose/` | `{"reason": "Competitor", "notes": "Chose Salesforce"}` | Status: `lost`, reason saved |
| 15 | **REOPEN deal** | **Frontend** | Won/Lost deal → Click **"Reopen"** button | — | Status: `open`, returns to last stage |
| 15b | **REOPEN deal** | **Backend** | POST `http://localhost:8000/api/deals/<id>/reopen/` | — | Status: `open` |

**Mark as WON — What should happen:**

- [ ] Success banner: "This deal was won on [date]"
- [ ] Status badge shows "Won" (green/success)
- [ ] Probability: 100%
- [ ] Actual close date set
- [ ] Stats update: won count +1, won value +$X
- [ ] "Won" button disabled, "Reopen" button appears

**Mark as LOST — What should happen:**

- [ ] Error banner: "This deal was lost on [date]" with reason
- [ ] Status badge shows "Lost" (red/error)
- [ ] Probability: 0%
- [ ] Loss reason and notes displayed
- [ ] Stats update: lost count +1
- [ ] "Lost" button disabled, "Reopen" button appears

### Deal Stats Verification

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 16 | Deals list stats | **Frontend** | `http://localhost:3000/sales/deals` | Total deals, total value, won value, lost value displayed |
| 17 | Account detail stats | **Frontend** | Account detail → Deals tab | Total, Open, Won, Lost counts for that company |
| 18 | Contact detail stats | **Frontend** | Contact detail → Deals tab | Deals linked to that contact |

### Weighted Value Calculation

| # | Test Case | Check In | Expected |
|---|-----------|----------|----------|
| 19 | Qualification (10%) | Deal value: $100,000, Stage: Qualification | Weighted: $10,000 |
| 20 | Discovery (20%) | Deal value: $100,000, Stage: Discovery | Weighted: $20,000 |
| 21 | Proposal (40%) | Deal value: $100,000, Stage: Proposal | Weighted: $40,000 |
| 22 | Negotiation (60%) | Deal value: $100,000, Stage: Negotiation | Weighted: $60,000 |
| 23 | Closed Won (100%) | Deal value: $100,000, Stage: Closed Won | Weighted: $100,000 |
| 24 | Closed Lost (0%) | Deal value: $100,000, Stage: Closed Lost | Weighted: $0 |

---

## Module 5: Pipelines & Stages

### Pipeline Management

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 1 | List pipelines | **Backend** | `http://localhost:8000/api/pipelines/` | JSON list with stages |
| 2 | View pipeline detail | **Backend** | `http://localhost:8000/api/pipelines/<id>/` | Pipeline with nested stages array |
| 3 | List stages | **Backend** | `http://localhost:8000/api/pipeline-stages/` | All stages across pipelines |

**Default Pipeline Stages (seeded):**

| Stage Name | Order | Probability | Status |
|------------|-------|-------------|--------|
| Qualification | 1 | 10% | open |
| Discovery | 2 | 20% | open |
| Proposal | 3 | 40% | open |
| Negotiation | 4 | 60% | open |
| Closed Won | 5 | 100% | won |
| Closed Lost | 6 | 0% | lost |

---

## Module 6: Tags

### Tag Management

| # | Test Case | Check In | Route / URL | Sample Data | Expected |
|---|-----------|----------|-------------|-------------|----------|
| 1 | List tags | **Backend** | `http://localhost:8000/api/tags/` | — | JSON list with entity_type, color |
| 2 | Create tag | **Backend** | POST `http://localhost:8000/api/tags/` | `{"name": "VIP", "entity_type": "contact", "color": "#FF5733"}` | 201 |
| 3 | Assign tag to contact | **Frontend** | Contact form → Tags field | Select: `VIP`, `Enterprise` | Tags shown on contact |
| 4 | Assign tag to account | **Frontend** | Account form → Tags field | Select: `Key Account` | Tags shown on account |
| 5 | Filter by tag | **Frontend** | List page → Tag filter | Tag: `VIP` | Only tagged entities |

---

## Module 7: Dashboard

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 1 | Dashboard overview | **Frontend** | `http://localhost:3000/dashboard` | Stats cards: Total Leads, Total Deals, Won Deals, Pipeline Value |
| 2 | Leads by status | **Frontend** | Dashboard → Leads section | Breakdown: New, Contacted, Qualified, Converted |
| 3 | Deals by stage | **Frontend** | Dashboard → Pipeline section | Deals grouped by stage |
| 4 | Recent activities | **Frontend** | Dashboard → Activity section | Recent calls, emails, meetings |
| 5 | Empty state | **Frontend** | Dashboard with empty DB | Graceful "no data" messages, no crashes |

---

## Module 8: Bulk Actions & Export

| # | Test Case | Check In | Route / URL | Expected |
|---|-----------|----------|-------------|----------|
| 1 | Bulk select | **Frontend** | Any list page → Check multiple rows | Selection count shown |
| 2 | Bulk delete | **Frontend** | Select items → Click Delete | Confirmation modal, items deleted |
| 3 | Export selected (CSV) | **Frontend** | Select items → Click Export | CSV file downloads |
| 4 | Export all | **Frontend** | Click Export All | CSV with all records |
| 5 | Bulk update status | **Frontend** | Select leads → Change status | All selected leads updated |

---

## Module 9: Relationship Verification

### Test Account → Contact → Deal Chain

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Create chain | 1. Create Account: `MegaCorp` <br> 2. Create Contact: `Alice` linked to MegaCorp <br> 3. Create Deal linked to both | All entities linked |
| 2 | Verify account detail | Go to MegaCorp detail page | Contacts tab shows Alice, Deals tab shows deal |
| 3 | Verify contact detail | Go to Alice detail page | Company shows MegaCorp, Deals tab shows deal |
| 4 | Verify deal detail | Go to deal detail page | Shows contact: Alice, company: MegaCorp |

### Test Lead Conversion Chain

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 5 | Full conversion | 1. Create Lead: `Bob` <br> 2. Qualify lead <br> 3. Convert with Create Deal option | Contact + Deal created, all linked |
| 6 | Verify converted lead | Go to Bob's lead page | Status: Converted, link to contact visible |
| 7 | Verify new contact | Go to Bob's contact page | Contact exists with lead source info |
| 8 | Verify new deal | Go to deal page | Linked to Bob contact |

---

## Module 10: Edge Cases & Validation

### Account Edge Cases

| # | Test Case | Check In | Input | Expected |
|---|-----------|----------|-------|----------|
| 1 | Empty name | **Backend** | `{"name": ""}` | 400: "name is required" |
| 2 | Duplicate name | **Both** | Same name as existing | Should allow (names not unique) |
| 3 | Invalid email | **Both** | `{"email": "invalid"}` | 400: "valid email required" |
| 4 | Negative revenue | **Both** | `{"annual_revenue": -1000}` | 400: "must be positive" |
| 5 | Very large revenue | **Both** | `{"annual_revenue": 999999999999}` | Should save and display correctly |

### Contact Edge Cases

| # | Test Case | Check In | Input | Expected |
|---|-----------|----------|-------|----------|
| 6 | Empty names | **Backend** | `{"first_name": "", "last_name": ""}` | 400: validation error |
| 7 | Duplicate email | **Both** | Email exists | Warning or merge option |
| 8 | No company | **Both** | Create contact without company | Saves, company = null |
| 9 | Invalid phone | **Both** | `{"phone": "abc"}` | May save (no strict validation) |

### Lead Edge Cases

| # | Test Case | Check In | Input | Expected |
|---|-----------|----------|-------|----------|
| 10 | Convert non-qualified | **Both** | Try convert lead with status: New | Error or Convert button hidden |
| 11 | Re-convert | **Both** | Convert already converted lead | Error: already converted |
| 12 | Disqualify converted | **Both** | Disqualify converted lead | Error or button hidden |
| 13 | Score out of range | **Backend** | `{"score": 150}` | 400: max 100 |

### Deal Edge Cases

| # | Test Case | Check In | Input | Expected |
|---|-----------|----------|-------|----------|
| 14 | Zero value | **Both** | `{"value": 0}` | Saves, weighted = $0 |
| 15 | Skip stages | **Both** | Qualification → Negotiation | Should allow |
| 16 | Edit won deal | **Both** | Try editing closed won deal | Limited editing or blocked |
| 17 | Win then lose | **Both** | Won deal → try marking as Lost | Must reopen first |
| 18 | Past close date | **Both** | `{"expected_close_date": "2020-01-01"}` | Should allow or warn |

---

## Sample Test Data Reference

### Account Names

| Name | Industry | Size | Revenue |
|------|----------|------|---------|
| TechCorp Solutions | Technology | 51-200 | $5M |
| Global Retail Inc | Retail | 201-500 | $25M |
| FinanceFirst Bank | Finance | 501-1000 | $100M |
| HealthCare Plus | Healthcare | 51-200 | $15M |
| StartupXYZ | Technology | 1-50 | $500K |

### Contact Names

| Name | Title | Company |
|------|-------|---------|
| John Smith | CTO | TechCorp |
| Mike Chen | VP Operations | Global Retail |
| Sarah Johnson | CFO | FinanceFirst |
| Alice Wang | CEO | HealthCare Plus |
| Bob Miller | Sales Director | TechCorp |

### Lead Names

| Name | Score | Status | Action |
|------|-------|--------|--------|
| Emily Brown | 95 | Qualified | Convert |
| David Wilson | 30 | Contacted | Disqualify |
| Hot Lead Helen | 90 | New | Convert |
| Cold Lead Carl | 25 | Contacted | Disqualify |

### Deal Names

| Name | Value | Stage | Outcome |
|------|-------|-------|---------|
| TechCorp Enterprise | $100,000 | Negotiation | Win |
| Retail Expansion | $75,000 | Proposal | Lose |
| Banking Platform | $200,000 | Discovery | Win |
| Healthcare Suite | $50,000 | Proposal | Keep Open |

### Lead Statuses

| Status | Description |
|--------|-------------|
| `new` | Just created, not contacted |
| `contacted` | Initial outreach done |
| `qualified` | Ready for conversion |
| `converted` | Became a contact |
| `unqualified` | Disqualified/rejected |

### Deal Stages

| Stage | Probability | Description |
|-------|-------------|-------------|
| Qualification | 10% | Initial evaluation |
| Discovery | 20% | Understanding needs |
| Proposal | 40% | Sent pricing |
| Negotiation | 60% | Discussing terms |
| Closed Won | 100% | Customer bought |
| Closed Lost | 0% | Customer rejected |

### Common Lost Reasons

| Reason | Description |
|--------|-------------|
| competitor | Chose another vendor |
| budget | Cannot afford |
| no_decision | Went silent |
| timing | Not the right time |
| feature_gap | Missing required features |

---

## Quick cURL Reference

```bash
# Health check
curl http://localhost:8000/health/

# List accounts
curl http://localhost:8000/api/companies/

# Create account
curl -X POST http://localhost:8000/api/companies/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Corp","industry":"technology","status":"active"}'

# List contacts
curl http://localhost:8000/api/contacts/

# Create contact
curl -X POST http://localhost:8000/api/contacts/ \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@example.com"}'

# List leads
curl http://localhost:8000/api/leads/

# Create lead
curl -X POST http://localhost:8000/api/leads/ \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Lead","last_name":"Test","email":"lead@test.com","status":"new"}'

# Convert lead
curl -X POST http://localhost:8000/api/leads/<id>/convert/ \
  -H "Content-Type: application/json" \
  -d '{"create_contact":true,"create_deal":false}'

# Disqualify lead
curl -X POST http://localhost:8000/api/leads/<id>/disqualify/ \
  -H "Content-Type: application/json" \
  -d '{"reason":"budget","notes":"Cannot afford"}'

# List deals
curl http://localhost:8000/api/deals/

# Create deal
curl -X POST http://localhost:8000/api/deals/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Deal","value":50000,"stage_id":"<stage-uuid>"}'

# Win deal
curl -X POST http://localhost:8000/api/deals/<id>/win/

# Lose deal
curl -X POST http://localhost:8000/api/deals/<id>/lose/ \
  -H "Content-Type: application/json" \
  -d '{"reason":"Competitor","notes":"Lost to Salesforce"}'

# Reopen deal
curl -X POST http://localhost:8000/api/deals/<id>/reopen/

# List pipelines
curl http://localhost:8000/api/pipelines/

# Search with filters
curl "http://localhost:8000/api/companies/?search=Tech&industry=technology"

# Sort results
curl "http://localhost:8000/api/deals/?ordering=-value"
```

---

## Testing Order (Dependencies)

**Always create in this order:**

1. **Accounts** *(no dependencies)*
2. **Contacts** *(can link to Accounts)*
3. **Leads** *(independent, can convert to Contacts)*
4. **Deals** *(can link to Accounts and Contacts)*

---

## Critical Test Paths

### Path 1: Lead to Revenue (Happy Path)
```
Create Lead (New) → Edit (Contacted) → Edit (Qualified) → 
CONVERT (Create Contact + Deal) → Move Deal through stages → 
CLOSE WON → Revenue Counted ✅
```

### Path 2: Lead Rejection
```
Create Lead (New) → Edit (Contacted) → 
DISQUALIFY (Budget) → Lead Archived ❌
```

### Path 3: Deal Loss
```
Create Deal (Qualification) → Discovery → Proposal → 
Negotiation → CLOSE LOST (Competitor) → Loss Recorded ❌
```

### Path 4: Deal Recovery
```
Create Deal → Mark LOST (accidentally) → 
REOPEN → Continue pipeline → Mark WON (correctly) ✅
```

### Path 5: Full Relationship Chain
```
Create Account → Add 3 Contacts → Create 2 Deals → 
Win 1 Deal → Lose 1 Deal → 
Verify Account stats: Won=1, Lost=1, Contacts=3 ✅
```

---

*Last updated: February 2026*
