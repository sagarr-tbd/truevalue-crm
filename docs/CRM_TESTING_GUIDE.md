# CRM Manual Testing Guide

A complete guide for developers to understand and test the CRM system.

---

## Table of Contents

1. [CRM Concepts Explained](#crm-concepts-explained)
2. [Entity Relationships](#entity-relationships)
3. [Complete Testing Scenario](#complete-testing-scenario)
4. [Step-by-Step Testing Guide](#step-by-step-testing-guide)
5. [Quick Reference](#quick-reference)
6. [Test Checklist](#test-checklist)

---

## CRM Concepts Explained

### 1. Pipeline & Pipeline Stages

Think of a **Pipeline** as a workflow/state machine for tracking deals.

```
PIPELINE: "Sales Pipeline"
│
├── Stage 1: Qualification (10%)    ← New opportunity, checking if it's real
├── Stage 2: Discovery (20%)        ← Understanding customer needs
├── Stage 3: Proposal (40%)         ← Sent pricing/proposal
├── Stage 4: Negotiation (60%)      ← Discussing terms
├── Stage 5: Closed Won (100%)      ← SUCCESS! Deal completed ✅
└── Stage 6: Closed Lost (0%)       ← FAILED! Customer said no ❌
```

**The percentage** = probability of closing the deal at that stage

**A Deal moves through stages** like:

```
Qualification → Discovery → Proposal → Negotiation → Closed Won
                                                   └→ Closed Lost
```

### 2. Deals: Won vs Lost

| Status | Meaning | What Happens |
|--------|---------|--------------|
| **Closed Won** | Customer bought! | Revenue counted, deal archived |
| **Closed Lost** | Customer rejected | Lost reason recorded, deal archived |
| **Open Stages** | Still in progress | Active deal being worked on |

### 3. Leads: Conversion & Disqualification

A **Lead** = someone who might become a customer (potential)

```
LEAD LIFECYCLE:

                    ┌─→ CONVERTED (becomes a Contact + optional Deal)
                    │
NEW → CONTACTED → QUALIFIED 
                    │
                    └─→ DISQUALIFIED (not a fit, bad timing, etc.)
```

| Action | What Happens |
|--------|--------------|
| **Convert** | Lead becomes a Contact (real customer to work with) |
| **Disqualify** | Lead is marked as "not a fit" with a reason |

---

## Entity Relationships

```
ACCOUNT (Company)
    │
    ├── has many → CONTACTS (people at that company)
    │
    └── has many → DEALS (sales opportunities)
                      │
                      └── linked to → CONTACT (decision maker)

LEAD (potential customer)
    │
    └── converts to → CONTACT + optionally creates DEAL
```

### Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CRM DATA FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   LEAD                    CONTACT                 DEAL          │
│   ┌─────┐                 ┌─────┐                ┌─────┐       │
│   │ New │                 │     │                │     │       │
│   │  ↓  │   Convert       │     │   Create       │ Q   │       │
│   │Cont-│ ──────────────→ │Person│ ────────────→ │ D P │       │
│   │acted│                 │  at  │               │ i r │       │
│   │  ↓  │                 │Comp- │               │ s o │       │
│   │Qual-│                 │ any  │               │ c p │       │
│   │ified│                 │     │                │   N │       │
│   └──┬──┘                 └──┬──┘                │   e │       │
│      │                       │                   │   g │       │
│      │ Disqualify            │                   │     │       │
│      ↓                       │                   ├─────┤       │
│   ┌─────┐                    │                   │ WON │       │
│   │ Bad │                    │                   ├─────┤       │
│   │ Fit │              ┌─────┴─────┐             │LOST │       │
│   └─────┘              │  ACCOUNT  │             └─────┘       │
│                        │ (Company) │                           │
│                        └───────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Testing Scenario

### The Story: "TechCorp wants to buy our software"

1. **TechCorp** (a company) reaches out
2. **John Smith** (CTO) is our contact there
3. We create a **deal** worth $50,000
4. We move through negotiation stages
5. Deal either **WON** or **LOST**

---

## Step-by-Step Testing Guide

### Prerequisites

- Frontend running at `http://localhost:3000`
- Backend running (Docker)
- Logged in to the application

---

## Phase 1: Setup (Create Base Data)

### 1.1 Create Account (Company)

**Go to:** `/sales/accounts` → Click **"Add Account"**

| Field | Value |
|-------|-------|
| Name | TechCorp Solutions |
| Industry | Technology |
| Size | 51-200 |
| Email | info@techcorp.com |
| Phone | +1 555-100-1000 |
| Website | techcorp.com |
| City | San Francisco |
| State | CA |
| Country | USA |
| Annual Revenue | 5000000 |
| Employees | 150 |

**Save and verify** the account appears in the list.

### 1.2 Create Second Account

| Field | Value |
|-------|-------|
| Name | Global Retail Inc |
| Industry | Retail |
| Size | 201-500 |
| Email | contact@globalretail.com |
| Phone | +1 555-200-2000 |
| Website | globalretail.com |
| City | New York |
| State | NY |
| Country | USA |
| Annual Revenue | 25000000 |
| Employees | 400 |

### 1.3 Create Contact (Person at Company)

**Go to:** `/sales/contacts` → Click **"Add Contact"**

| Field | Value |
|-------|-------|
| First Name | John |
| Last Name | Smith |
| Email | john.smith@techcorp.com |
| Phone | +1 555-111-1111 |
| Job Title | CTO |
| Company | TechCorp Solutions *(select from dropdown)* |
| Status | Active |
| Source | Website |

### 1.4 Create Second Contact

| Field | Value |
|-------|-------|
| First Name | Mike |
| Last Name | Chen |
| Email | mike.chen@globalretail.com |
| Phone | +1 555-333-3333 |
| Job Title | VP of Operations |
| Company | Global Retail Inc *(select from dropdown)* |
| Status | Active |
| Source | Trade Show |

---

## Phase 2: Test Lead Flow

### 2.1 Create a New Lead

**Go to:** `/sales/leads` → Click **"Add Lead"**

| Field | Value |
|-------|-------|
| First Name | Emily |
| Last Name | Brown |
| Email | emily@startup.io |
| Phone | +1 555-444-4444 |
| Company | Startup.io |
| Title | Founder |
| Status | **New** *(starting status)* |
| Source | LinkedIn |
| Score | 75 |

### 2.2 Move Lead Through Statuses

1. Click on **Emily Brown** to open detail page
2. Click **"Edit"** button
3. Change status to **"Contacted"** → Save
4. Edit again → Change status to **"Qualified"** → Save

**Expected:** Status badge updates each time

### 2.3 CONVERT the Lead

> **What is Conversion?** When a lead is qualified and ready to become a real customer contact.

1. On Emily's detail page, find the **"Convert"** button
2. Click it
3. Confirm the conversion in the modal

**What should happen:**
- [ ] A new Contact is created (Emily Brown)
- [ ] Lead status changes to **"Converted"**
- [ ] A link to the new contact appears on the lead page
- [ ] Emily Brown now appears in `/sales/contacts`

### 2.4 Create Another Lead to DISQUALIFY

**Go to:** `/sales/leads` → Click **"Add Lead"**

| Field | Value |
|-------|-------|
| First Name | David |
| Last Name | Wilson |
| Email | david@badfit.com |
| Phone | +1 555-555-5555 |
| Company | BadFit Inc |
| Title | Manager |
| Status | Contacted |
| Source | Cold Call |

### 2.5 DISQUALIFY the Lead

> **What is Disqualification?** Marking a lead as "not a fit" so salespeople don't waste time on it.

1. Open David Wilson's detail page
2. Find the **"Disqualify"** button
3. Click it
4. Select a reason: **"Budget"** or **"Not a fit"** or **"No response"**
5. Confirm

**What should happen:**
- [ ] Lead status changes to **"Unqualified"**
- [ ] Disqualification reason is saved and displayed
- [ ] Lead is typically hidden from active views

---

## Phase 3: Test Deal Pipeline Flow

### 3.1 Create a Deal

**Go to:** `/sales/deals` → Click **"Add Deal"**

| Field | Value |
|-------|-------|
| Name | TechCorp Enterprise License |
| Amount | 50000 |
| Stage | **Qualification** *(first stage)* |
| Contact | John Smith *(select from dropdown)* |
| Company | TechCorp Solutions *(select from dropdown)* |
| Close Date | *(pick date 30 days from now)* |
| Probability | 10% |

### 3.2 Move Deal Through Pipeline Stages

> **This is the key test!** Deals progress through stages as negotiations advance.

**How to move stages:**
1. Open deal detail page
2. Click **"Edit"**
3. Change **Stage** in dropdown
4. Save

**Move through each stage in order:**

| Step | Change Stage To | What This Means in Real Life |
|------|-----------------|------------------------------|
| 1 | **Discovery** | "We're learning their needs" |
| 2 | **Proposal** | "We sent them pricing" |
| 3 | **Negotiation** | "They're reviewing, we're discussing terms" |

### 3.3 Mark Deal as WON

> **Closed Won** = The customer agreed to buy! Success!

1. Edit the TechCorp deal
2. Change Stage to **"Closed Won"**
3. Save

**What should happen:**
- [ ] Deal shows with "Won" indicator/badge
- [ ] Stats on deals page update (won count, won value)
- [ ] Deal may move to a "Closed" section

### 3.4 Create Another Deal and Mark as LOST

Create a second deal:

| Field | Value |
|-------|-------|
| Name | Failed Opportunity |
| Amount | 25000 |
| Stage | Proposal |
| Contact | Mike Chen |
| Company | Global Retail Inc |
| Close Date | *(pick date 45 days from now)* |

Now mark it as lost:

1. Edit the deal
2. Change Stage to **"Closed Lost"**
3. You may be asked for a **"Lost Reason"**:
   - Competitor
   - Budget
   - No Decision
   - Timing
4. Save

**What should happen:**
- [ ] Deal shows with "Lost" indicator/badge
- [ ] Stats update (lost count)
- [ ] Deal may move to "Closed" section

---

## Phase 4: Verify Relationships

### Check Account Detail Page

**Go to:** `/sales/accounts` → Click on **TechCorp Solutions**

**Verify:**
- [ ] Company information displays correctly
- [ ] **Contacts tab** shows John Smith
- [ ] **Deals tab** shows TechCorp Enterprise License (Won)
- [ ] Activity timeline shows recent actions

### Check Contact Detail Page

**Go to:** `/sales/contacts` → Click on **John Smith**

**Verify:**
- [ ] Contact info displays correctly
- [ ] Company shows: TechCorp Solutions
- [ ] **Deals tab** shows related deals
- [ ] Tags display (if any)

### Check Converted Lead

**Go to:** `/sales/leads` → Find **Emily Brown** (status: Converted)

**Verify:**
- [ ] Status shows "Converted"
- [ ] Link to new contact is visible
- [ ] Click link → opens Emily Brown's contact page

---

## Phase 5: Test Additional Features

### Search & Filters

| Test | Where | Action |
|------|-------|--------|
| Search by name | Any list page | Type "TechCorp" in search |
| Filter by status | Leads page | Filter dropdown → "Qualified" |
| Filter by industry | Accounts page | Filter dropdown → "Technology" |
| Advanced filters | Any list page | Click "Advanced Filters" → Add conditions |

### Sorting

| Test | Action |
|------|--------|
| Sort by name | Click "Name" column header |
| Sort by date | Click "Created" column header |
| Reverse sort | Click same header again |

### Bulk Actions

| Test | Action |
|------|--------|
| Select multiple | Check boxes on left |
| Bulk delete | Select items → Click "Delete" in toolbar |
| Bulk export | Select items → Click "Export" |

### Export

| Test | Action |
|------|--------|
| Export selected | Select 2-3 rows → Export button |
| Export all | Without selection → Export All |

---

## Quick Reference

### Lead Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **New** | Just came in | Contact them |
| **Contacted** | We reached out | Qualify them |
| **Qualified** | Real opportunity | Convert to Contact |
| **Converted** | Became a Contact | Done! |
| **Unqualified** | Not a fit | Archived |

### Deal Stages (Pipeline)

| Stage | Probability | Meaning |
|-------|-------------|---------|
| **Qualification** | 10% | Is this real? |
| **Discovery** | 20% | Understanding needs |
| **Proposal** | 40% | Sent pricing |
| **Negotiation** | 60% | Discussing terms |
| **Closed Won** | 100% | They bought! ✅ |
| **Closed Lost** | 0% | They rejected ❌ |

### Common Lost Reasons

- **Competitor** - Chose another vendor
- **Budget** - Can't afford it
- **No Decision** - They went silent
- **Timing** - Not the right time
- **Feature Gap** - We don't have what they need

---

## Test Checklist

### Accounts
- [ ] Create account with quick form
- [ ] Create account with detailed form
- [ ] Edit existing account
- [ ] View account detail page
- [ ] Search accounts
- [ ] Filter by industry
- [ ] Sort by columns
- [ ] Delete an account

### Contacts
- [ ] Create contact
- [ ] Link contact to account (Company field)
- [ ] Edit existing contact
- [ ] View contact detail page
- [ ] Search contacts
- [ ] Filter by status
- [ ] Bulk select and export

### Leads
- [ ] Create lead with "New" status
- [ ] Change status: New → Contacted
- [ ] Change status: Contacted → Qualified
- [ ] **CONVERT** qualified lead to contact
- [ ] Verify new contact was created
- [ ] Create another lead
- [ ] **DISQUALIFY** lead with reason
- [ ] Verify lead shows as unqualified

### Deals
- [ ] Create deal in Qualification stage
- [ ] Link deal to Contact
- [ ] Link deal to Account/Company
- [ ] Move stage: Qualification → Discovery
- [ ] Move stage: Discovery → Proposal
- [ ] Move stage: Proposal → Negotiation
- [ ] Move stage: Negotiation → **Closed Won**
- [ ] Verify stats update for won deal
- [ ] Create another deal
- [ ] Move to **Closed Lost** with reason
- [ ] Verify stats update for lost deal

### Relationships
- [ ] Account detail shows linked contacts
- [ ] Account detail shows related deals
- [ ] Contact detail shows company
- [ ] Contact detail shows related deals
- [ ] Converted lead links to new contact

---

## Test Data Summary

```
ACCOUNTS (2)
├── TechCorp Solutions
│   ├── Industry: Technology
│   ├── Size: 51-200 (Medium)
│   ├── Employees: 150
│   └── Revenue: $5M
│
└── Global Retail Inc
    ├── Industry: Retail
    ├── Size: 201-500 (Large)
    ├── Employees: 400
    └── Revenue: $25M

CONTACTS (3+)
├── John Smith (CTO @ TechCorp)
├── Mike Chen (VP Ops @ Global Retail)
└── Emily Brown (converted from lead)

LEADS (2)
├── Emily Brown → CONVERTED ✅
└── David Wilson → DISQUALIFIED ❌

DEALS (2)
├── TechCorp License → $50K → CLOSED WON ✅
└── Failed Opportunity → $25K → CLOSED LOST ❌
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Form won't submit | Check required fields (red asterisks) |
| Company dropdown empty | Create Accounts first |
| Contact dropdown empty | Create Contacts first |
| Convert button missing | Lead must be "Qualified" status |
| Can't change stage | Check if deal is already closed |
| Filters not working | Click "Clear Filters" and try again |
| Data not refreshing | Refresh the page (F5) |

---

## Testing Order

**Always create in this order (due to dependencies):**

1. **Accounts** *(no dependencies)*
2. **Contacts** *(can link to Accounts)*
3. **Leads** *(independent, can convert to Contacts)*
4. **Deals** *(can link to Accounts and Contacts)*

---

---

## Part 2: Advanced Testing Scenarios

This section provides deeper testing for developers who want to thoroughly validate CRM functionality.

---

## Advanced Deal Pipeline Testing

### Understanding Pipeline Mechanics

```
PIPELINE VISUALIZATION:

Deal Value: $50,000
Current Stage: Proposal (40%)

Weighted Value = $50,000 × 40% = $20,000
                 ↑              ↑
              Raw Value    Stage Probability

As deal progresses:
- Qualification (10%)  →  $50,000 × 0.10 = $5,000 weighted
- Discovery (20%)      →  $50,000 × 0.20 = $10,000 weighted
- Proposal (40%)       →  $50,000 × 0.40 = $20,000 weighted
- Negotiation (60%)    →  $50,000 × 0.60 = $30,000 weighted
- Closed Won (100%)    →  $50,000 × 1.00 = $50,000 (revenue!)
- Closed Lost (0%)     →  $0 (lost opportunity)
```

### Test Scenario: Complete Deal Lifecycle

#### Step 1: Create Multiple Deals at Different Stages

| Deal Name | Company | Value | Initial Stage |
|-----------|---------|-------|---------------|
| Enterprise Deal | TechCorp | $100,000 | Qualification |
| SMB Package | StartupABC | $15,000 | Discovery |
| Consulting Project | FinanceInc | $75,000 | Proposal |
| Renewal Contract | ExistingCo | $30,000 | Negotiation |

#### Step 2: Test Stage Transitions

For **Enterprise Deal ($100K)**:

1. **Qualification → Discovery**
   - Edit deal → Change stage to "Discovery"
   - Save
   - **Verify:**
     - [ ] Stage badge updates
     - [ ] Probability changes to 20%
     - [ ] Weighted value = $20,000
     - [ ] "Stage Entered At" date updates

2. **Discovery → Proposal**
   - Edit → Stage = "Proposal"
   - **Verify:**
     - [ ] Probability = 40%
     - [ ] Weighted value = $40,000

3. **Proposal → Negotiation**
   - Edit → Stage = "Negotiation"
   - **Verify:**
     - [ ] Probability = 60%
     - [ ] Weighted value = $60,000

4. **Negotiation → Closed Won**
   - Use the **"Won"** button on deal detail page (or Edit → Stage)
   - **Verify:**
     - [ ] Success banner appears: "This deal was won on [date]"
     - [ ] Probability = 100%
     - [ ] Status = "won"
     - [ ] Deal value counts toward "Won Value" stats
     - [ ] "Actual Close Date" is set
     - [ ] Deal cannot be edited (or has limited editing)

#### Step 3: Test Win/Loss Buttons

**Test the "Won" Button:**
1. Create a deal in "Negotiation" stage
2. Go to deal detail page
3. Click **"Won"** button (trophy icon)
4. **Verify:**
   - [ ] Deal immediately moves to "Closed Won"
   - [ ] Toast notification confirms win
   - [ ] Stats update on deals list page

**Test the "Lost" Button:**
1. Create another deal in "Proposal" stage
2. Go to deal detail page
3. Click **"Lost"** button (X icon)
4. Modal should appear asking for:
   - **Loss Reason** (dropdown): Competitor, Budget, No Decision, Timing, etc.
   - **Loss Notes** (optional text)
5. Fill in: Reason = "Competitor", Notes = "Chose Salesforce"
6. Click Confirm
7. **Verify:**
   - [ ] Deal moves to "Closed Lost"
   - [ ] Error/Lost banner appears with reason
   - [ ] Stats update (lost count increases)
   - [ ] Loss reason displayed on detail page

**Test the "Reopen" Button:**
1. Go to a Won or Lost deal
2. Find the **"Reopen"** button
3. Click it
4. **Verify:**
   - [ ] Deal status returns to "open"
   - [ ] Deal returns to the last open stage (e.g., Negotiation)
   - [ ] Can now edit and progress the deal again

---

## Advanced Lead Testing

### Lead Scoring System

Lead scores help prioritize which leads to work on first.

```
LEAD SCORE INTERPRETATION:

Score: 0-49   → Low priority (cold lead)
Score: 50-79  → Medium priority (warm lead)  
Score: 80-100 → High priority (hot lead) 🔥
```

#### Test Lead Score Display

Create leads with different scores:

| Lead Name | Score | Expected Display |
|-----------|-------|------------------|
| Hot Lead Henry | 95 | Green/Success color, "Hot" indicator |
| Warm Lead Wendy | 65 | Yellow/Warning color |
| Cold Lead Carl | 25 | Red/Error color |

**Verify on lead detail page:**
- [ ] Score color matches expected theme color
- [ ] Score bar/indicator shows correct fill level

### Lead Conversion - Complete Flow

#### Scenario A: Convert Lead to Contact ONLY

1. Create a qualified lead:
   ```
   Name: Convert Test 1
   Email: convert1@test.com
   Company: NewCompany Inc
   Status: Qualified
   ```

2. Go to lead detail page
3. Click **"Convert"** button
4. In modal:
   - [ ] Check "Create Contact" (should be default/required)
   - [ ] Uncheck "Create Deal" (if option exists)
   - [ ] Uncheck "Create Company" (if option exists)
5. Confirm conversion
6. **Verify:**
   - [ ] Lead status = "Converted"
   - [ ] New Contact exists with same name/email
   - [ ] No new Deal was created
   - [ ] No new Account was created

#### Scenario B: Convert Lead to Contact + Deal

1. Create another qualified lead:
   ```
   Name: Convert Test 2
   Email: convert2@test.com
   Company: AnotherCompany Ltd
   Status: Qualified
   ```

2. Convert with options:
   - [x] Create Contact
   - [x] Create Deal (value: $25,000)
   - [ ] Create Company
3. **Verify:**
   - [ ] Contact created
   - [ ] Deal created with $25,000 value
   - [ ] Deal linked to the new Contact
   - [ ] Lead status = "Converted"

#### Scenario C: Convert Lead to Contact + Deal + Company

1. Create a qualified lead:
   ```
   Name: Full Convert Test
   Email: fulltest@bigcorp.com
   Company Name: BigCorp Industries
   Status: Qualified
   ```

2. Convert with ALL options:
   - [x] Create Contact
   - [x] Create Deal ($50,000)
   - [x] Create Company (from lead's company name)
3. **Verify:**
   - [ ] Account "BigCorp Industries" created
   - [ ] Contact linked to BigCorp Industries
   - [ ] Deal linked to both Contact and Account
   - [ ] All three entities visible in their respective lists

### Lead Disqualification - Complete Flow

#### Test Different Disqualification Reasons

Create 4 leads and disqualify each with different reasons:

| Lead | Disqualify Reason | Notes |
|------|-------------------|-------|
| Bad Budget Bob | Budget | "Can't afford until next year" |
| Wrong Fit Wilma | Not a Fit | "B2C company, we serve B2B only" |
| Silent Sam | No Response | "Called 5 times, no answer" |
| Competitor Carol | Competitor | "Already using HubSpot" |

**For each disqualification:**
1. Open lead detail page
2. Click **"Disqualify"** button
3. Select reason from dropdown
4. Add notes explaining why
5. Confirm

**Verify for each:**
- [ ] Status changes to "Unqualified"
- [ ] Disqualification reason saved
- [ ] Notes saved and visible
- [ ] Lead may be hidden from default views
- [ ] Can still find lead using filters (Status = Unqualified)

---

## Entity Relationship Testing

### Test: Account → Contacts → Deals Chain

1. **Create Account:**
   ```
   Company: MegaCorp
   Industry: Finance
   Revenue: $100M
   ```

2. **Create 3 Contacts at MegaCorp:**
   | Contact | Title |
   |---------|-------|
   | Alice CFO | Chief Financial Officer |
   | Bob Sales | Sales Director |
   | Carol IT | IT Manager |

3. **Create 2 Deals for MegaCorp:**
   | Deal | Contact | Value | Stage |
   |------|---------|-------|-------|
   | Finance Software | Alice CFO | $200,000 | Proposal |
   | IT Upgrade | Carol IT | $50,000 | Discovery |

4. **Verify Account Detail Page:**
   - Go to MegaCorp detail page
   - **Contacts Tab:**
     - [ ] Shows all 3 contacts
     - [ ] Can click through to each contact
   - **Deals Tab:**
     - [ ] Shows both deals
     - [ ] Shows deal values and stages
     - [ ] Deal stats: Total = 2, Open = 2, Value = $250K

5. **Win one deal, lose another:**
   - Mark "Finance Software" as Won
   - Mark "IT Upgrade" as Lost (reason: Budget)

6. **Verify Account Detail Page After:**
   - **Deals Tab:**
     - [ ] Total = 2
     - [ ] Won = 1 ($200K)
     - [ ] Lost = 1
     - [ ] Open = 0
   - **Deal Stats Card:**
     - [ ] Shows correct won/lost counts
     - [ ] Total value and won value display correctly

### Test: Contact → Deals Relationship

1. Go to Alice CFO's Contact detail page
2. **Verify Deals Tab:**
   - [ ] Shows "Finance Software" deal (Won)
   - [ ] Deal value: $200,000
   - [ ] Stage: Closed Won (with success badge)

---

## Edge Case Testing

### Deal Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Zero-value deal | Create deal with Amount = 0 | Deal saves, weighted value = $0 |
| Very large deal | Create deal with Amount = 999,999,999 | Formats correctly, calculations work |
| Past close date | Create deal with close date in past | Should warn or allow (business logic dependent) |
| Skip stages | Move deal from Qualification directly to Negotiation | Should allow (stages aren't always linear) |
| Duplicate deal name | Create two deals with same name | Should allow (names don't need to be unique) |

### Lead Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Convert without company | Lead has no company name, convert | Contact created without company link |
| Re-convert same lead | Try to convert an already converted lead | Button disabled or error shown |
| Disqualify then requalify | Disqualify lead, then edit status back to Qualified | Should allow status change |
| Convert with existing email | Lead email matches existing contact | Warning or merge option |

### Contact Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Contact without company | Create contact, leave Company empty | Saves successfully |
| Multiple contacts same email | Create two contacts with same email | System may warn about duplicates |
| Delete contact with deals | Delete contact linked to deals | Deal contact becomes null/empty |

### Account Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Delete account with contacts | Delete account that has linked contacts | Contacts orphaned (company = null) |
| Delete account with deals | Delete account that has linked deals | Deals orphaned |
| Duplicate company name | Create two accounts with same name | Should allow (warn if duplicate detection exists) |

---

## API-Level Testing (For Developers)

### Test API Endpoints Directly

If you want to verify backend functionality, use these curl commands:

#### Get all pipelines and stages
```bash
curl -X GET "http://localhost:8000/api/pipelines/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create a deal via API
```bash
curl -X POST "http://localhost:8000/api/deals/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Deal",
    "value": 50000,
    "stage_id": "STAGE_UUID_HERE",
    "contact_id": "CONTACT_UUID_HERE"
  }'
```

#### Win a deal via API
```bash
curl -X POST "http://localhost:8000/api/deals/DEAL_ID/win/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Lose a deal via API
```bash
curl -X POST "http://localhost:8000/api/deals/DEAL_ID/lose/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Competitor",
    "notes": "Lost to Salesforce"
  }'
```

#### Convert a lead via API
```bash
curl -X POST "http://localhost:8000/api/leads/LEAD_ID/convert/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "create_contact": true,
    "create_deal": true,
    "deal_value": 25000,
    "create_company": false
  }'
```

#### Disqualify a lead via API
```bash
curl -X POST "http://localhost:8000/api/leads/LEAD_ID/disqualify/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "budget",
    "notes": "Cannot afford until next fiscal year"
  }'
```

---

## Performance Testing

### List Page Load Times

Test each list page with different data volumes:

| Page | 10 items | 100 items | 500 items |
|------|----------|-----------|-----------|
| /sales/accounts | < 1s | < 2s | < 5s |
| /sales/contacts | < 1s | < 2s | < 5s |
| /sales/leads | < 1s | < 2s | < 5s |
| /sales/deals | < 1s | < 2s | < 5s |

### Detail Page Load Times

| Page | Expected |
|------|----------|
| Account with 10 contacts, 5 deals | < 2s |
| Contact with 10 deals | < 2s |
| Lead detail | < 1s |
| Deal with full history | < 2s |

---

## Test Summary: Critical Paths

These are the MUST-TEST scenarios that cover core CRM functionality:

### Path 1: Lead to Revenue (Happy Path)
```
New Lead → Contacted → Qualified → CONVERT → Contact Created → 
Create Deal → Move through stages → Closed Won → Revenue Counted
```

### Path 2: Lead Rejection
```
New Lead → Contacted → DISQUALIFY (Budget) → Lead Archived
```

### Path 3: Lost Deal
```
Create Deal → Qualification → Discovery → Proposal → 
Negotiation → CLOSED LOST (Competitor) → Loss Recorded
```

### Path 4: Account Relationship Chain
```
Create Account → Add 3 Contacts → Create 2 Deals → 
Win 1 Deal → Lose 1 Deal → Verify Account Dashboard Stats
```

### Path 5: Deal Reopen (Error Recovery)
```
Create Deal → Mark as Lost (accidentally) → REOPEN → 
Continue through pipeline → Mark as Won (correctly)
```

---

## Complete Test Data Set

For comprehensive testing, create all of this data:

```
=== ACCOUNTS (5) ===
1. TechCorp Solutions    | Tech    | 51-200   | $5M revenue
2. Global Retail Inc     | Retail  | 201-500  | $25M revenue
3. FinanceFirst Bank     | Finance | 501-1000 | $100M revenue
4. HealthCare Plus       | Healthcare | 51-200 | $15M revenue
5. StartupXYZ            | Tech    | 1-50     | $500K revenue

=== CONTACTS (8) ===
1. John Smith    | CTO           | TechCorp
2. Mike Chen     | VP Ops        | Global Retail
3. Sarah Johnson | CFO           | FinanceFirst
4. Emily Brown   | Converted Lead| StartupXYZ
5. Alice Wang    | CEO           | HealthCare Plus
6. Bob Miller    | Sales Dir     | TechCorp
7. Carol Davis   | IT Manager    | FinanceFirst
8. Tom Wilson    | Buyer         | Global Retail

=== LEADS (4) ===
1. Hot Lead Helen    | Score: 95 | Status: Qualified  | → Convert
2. Warm Lead Walter  | Score: 65 | Status: Contacted  | → Convert
3. Cold Lead Chris   | Score: 30 | Status: New        | → Disqualify
4. Bad Fit Barbara   | Score: 40 | Status: Contacted  | → Disqualify

=== DEALS (6) ===
1. TechCorp Enterprise  | $100K | John Smith    | → Win
2. Retail Expansion     | $75K  | Mike Chen     | → Lose (Budget)
3. Banking Platform     | $200K | Sarah Johnson | → Win
4. Healthcare Suite     | $50K  | Alice Wang    | Keep Open (Proposal)
5. Startup Starter      | $10K  | Emily Brown   | Keep Open (Discovery)
6. Big Retail Deal      | $150K | Tom Wilson    | → Lose (Competitor)

=== EXPECTED FINAL STATE ===
Won Deals: 2 ($300K total)
Lost Deals: 2 ($225K lost opportunity)
Open Deals: 2 ($60K weighted pipeline)
Converted Leads: 2
Disqualified Leads: 2
```

---

*Last updated: February 2026*
