# Deals V2 - UI Testing Guide

## Pipeline & Stages (Reference)

| Order | Stage | Default Probability | Color |
|-------|-------|---------------------|-------|
| 1 | Qualification | 10% | Gray |
| 2 | Discovery | 20% | Blue |
| 3 | Proposal | 40% | Purple |
| 4 | Negotiation | 60% | Yellow |
| 5 | Closed Won | 100% | Green |
| 6 | Closed Lost | 0% | Red |

> **Auto-Probability:** When you change a deal's stage, the probability auto-updates to the stage's default value (unless you manually set a different probability in the same edit). When a deal is marked Won → 100%, Lost → 0%, Reopened → stage default.

---

## Test 1: Create a New Deal

**Navigate to:** Sales V2 → Deals → **+ Add Deal**

### Test Data

| Field | Value |
|-------|-------|
| Deal Name | TechCorp India - CRM Enterprise License |
| Value | 250000 |
| Currency | INR |
| Stage | Qualification |
| Pipeline | Sales Pipeline |
| Assigned To | (select your user) |
| Contact | Priya Sharma |
| Company | BrightPixel Media |
| Expected Close Date | 2026-06-30 |
| Description | Enterprise CRM license deal for TechCorp India. Annual contract with 50 user seats. Includes training and onboarding package. |

> **Note:** Do NOT set Probability manually — it should auto-set to 10% (Qualification stage default).

### Expected Result
- [ ] Deal appears in the list with name, value (₹2,50,000), stage "Qualification", status "Open"
- [ ] Probability is **10%** (auto-set from Qualification stage)
- [ ] Click on the deal to verify all fields are saved correctly

---

## Test 2: Create a Second Deal (for bulk operations later)

### Test Data

| Field | Value |
|-------|-------|
| Deal Name | GlobalEdge - Cloud Migration Project |
| Value | 175000 |
| Currency | USD |
| Stage | Discovery |
| Pipeline | Sales Pipeline |
| Contact | Vikram Singh |
| Company | (leave empty or select one) |
| Expected Close Date | 2026-08-15 |
| Description | Cloud infrastructure migration project. Phase 1 covers assessment and planning. |

### Expected Result
- [ ] Probability is **20%** (auto-set from Discovery stage)

---

## Test 3: View Deal Detail Page

**Click on "TechCorp India - CRM Enterprise License"**

### Verify Header
- [ ] Deal name displayed
- [ ] Stage badge shown (Qualification)
- [ ] Status badge (Open)
- [ ] Deal value displayed (₹2,50,000)
- [ ] Company name shown with link (BrightPixel Media)

### Verify Summary Cards
- [ ] **Deal Value** — ₹2,50,000 (weighted: ₹25,000 based on 10% probability)
- [ ] **Probability** — 10% (from stage: Qualification)
- [ ] **Expected Close Date** — Jun 30, 2026
- [ ] **Timeline** — shows days open

### Verify Tabs
- [ ] **Details** tab — all deal info, pipeline, contact, company, description
- [ ] **Activity** tab — empty initially
- [ ] **Related Contacts** tab — shows Priya Sharma
- [ ] **Notes** tab — empty initially

### Verify Sidebar
- [ ] **Deal Actions** — Mark Won, Mark Lost buttons visible
- [ ] **Quick Actions** — Send Email, Log Call, Schedule Meeting, Add Note
- [ ] **Deal Score** — probability bar at 10%
- [ ] **Deal Summary** — pipeline, stage, value, probability, close date
- [ ] **Tags** — tag assignment area

---

## Test 4: Edit Deal (Value Only — No Stage Change)

**On the deal detail page → Click Edit button**

### Update Fields

| Field | New Value |
|-------|-----------|
| Value | 300000 |

### Expected Result
- [ ] Value updates to ₹3,00,000
- [ ] Probability stays at **10%** (stage unchanged)
- [ ] Weighted value updates to ₹30,000
- [ ] No page reload — UI updates seamlessly

---

## Test 5: Stage Progression (Auto-Probability)

Test moving the deal through pipeline stages and verify probability auto-updates:

### Step 1: Move to Discovery
- Edit deal → Change Stage to **Discovery** (do NOT change probability manually)
- [ ] Stage badge updates to "Discovery"
- [ ] Probability auto-updates to **20%**
- [ ] Weighted value: ₹60,000

### Step 2: Move to Proposal
- Edit deal → Change Stage to **Proposal**
- [ ] Stage badge updates to "Proposal"
- [ ] Probability auto-updates to **40%**
- [ ] Weighted value: ₹1,20,000

### Step 3: Move to Negotiation
- Edit deal → Change Stage to **Negotiation**
- [ ] Stage badge updates to "Negotiation"
- [ ] Probability auto-updates to **60%**
- [ ] Weighted value: ₹1,80,000

### Step 4: Manual Probability Override
- Edit deal → Keep Stage at **Negotiation**, change Probability to **80%**
- [ ] Probability stays at **80%** (manual override respected)
- [ ] Weighted value: ₹2,40,000

---

## Test 6: Win a Deal

**On the deal detail page → Click "Mark Won" (or Won button in header)**

### Expected Result
- [ ] Status changes to "Won"
- [ ] **Probability auto-updates to 100%**
- [ ] Green banner appears: "This deal has been won!"
- [ ] Actual close date auto-set to today
- [ ] Edit button disabled (won deals can't be edited)
- [ ] "Reopen" button appears in Deal Actions
- [ ] UI updates without page reload
- [ ] Only ONE toast notification shown (not duplicated)

---

## Test 7: Reopen a Won Deal

**On the won deal → Click "Reopen"**

### Expected Result
- [ ] Status changes back to "Open"
- [ ] **Probability restores to stage default** (e.g., 60% for Negotiation)
- [ ] Green banner disappears
- [ ] Edit button re-enabled
- [ ] Won/Lost buttons reappear in Deal Actions
- [ ] UI updates without page reload

---

## Test 8: Lose a Deal

**On the deal detail page → Click "Mark Lost" (sidebar or header)**

### A loss reason dropdown and notes textarea will appear:

| Field | Value |
|-------|-------|
| Loss Reason | Competitor (select from dropdown) |
| Loss Notes | Lost to CompetitorCRM due to lower pricing. Client may reconsider next quarter. |

### Click "Confirm Lost"

### Expected Result
- [ ] Status changes to "Lost"
- [ ] **Probability auto-updates to 0%**
- [ ] Red banner appears: "This deal was lost"
- [ ] **Loss reason displayed** in banner (e.g., "Reason: competitor")
- [ ] **Loss notes displayed** in banner
- [ ] Actual close date auto-set to today
- [ ] Edit button disabled
- [ ] "Reopen" button appears
- [ ] UI updates without page reload
- [ ] Loss reason and notes visible in Details tab → Win/Loss card

### Loss Reason Options
| Value | Label |
|-------|-------|
| price | Price |
| competitor | Competitor |
| no_budget | No Budget |
| no_decision | No Decision |
| timing | Timing |
| product_fit | Product Fit |
| relationship | Relationship |
| other | Other |

---

## Test 9: Reopen a Lost Deal

**On the lost deal → Click "Reopen"**

### Expected Result
- [ ] Status changes back to "Open"
- [ ] **Probability restores to stage default** (e.g., 60% for Negotiation)
- [ ] Red banner disappears
- [ ] Edit button re-enabled
- [ ] Won/Lost buttons reappear

---

## Test 10: Edit Does NOT Reset Status

**Important behavior fix — editing a won/lost deal should NOT reopen it.**

1. Mark a deal as **Lost** (or Won)
2. If the Edit button is visible, open the edit form
3. Change any field (e.g., description)
4. Save
5. [ ] Status should remain **Lost** (or Won) — NOT revert to "Open"

---

## Test 11: Deals List View Features

**Navigate to:** Sales V2 → Deals

### 11a: View Modes
- [ ] **List View** — table with columns (Deal, Stage, Contact, Company, Status, Value, Probability, Expected Close, Created)
- [ ] **Kanban View** — deals grouped by pipeline stage columns
- [ ] **Grid View** — card layout

### 11b: Search
- [ ] Type "TechCorp" in search → filters to matching deals
- [ ] Clear search → all deals return

### 11c: Status Filters
- [ ] Click "All Deals" → shows all
- [ ] Click "Open" → only open deals
- [ ] Click "Won" → only won deals
- [ ] Click "Lost" → only lost deals

### 11d: Stats Cards
- [ ] **Total** — total deal count
- [ ] **Pipeline Value** — sum of open deal values
- [ ] **Won Value** — sum of won deal values
- [ ] **Open Deals** — count of open deals

---

## Test 12: Kanban View

**Switch to Kanban view**

### Expected Result
- [ ] Deals grouped by pipeline stages (Qualification, Discovery, Proposal, Negotiation, Closed Won, Closed Lost)
- [ ] Each card shows deal name, value, company
- [ ] Cards can be clicked to open deal detail

---

## Test 13: Bulk Operations

### 13a: Bulk Delete
1. Select 2+ deals using checkboxes
2. Click bulk delete action
3. [ ] Selected deals are removed from list
4. [ ] Only ONE toast notification shown (not duplicated)

### 13b: Bulk Status Update
1. Select deals using checkboxes
2. Use bulk update to change status
3. [ ] Status updates for all selected deals

---

## Test 14: Export

1. Click **Export** button
2. [ ] CSV file downloads with deal data
3. [ ] File contains all visible columns

---

## Test 15: Duplicate Check

### Create a deal with existing name:
1. Click **+ Add Deal**
2. Enter name: **TechCorp India - CRM Enterprise License** (same as Test 1)
3. [ ] Duplicate warning should appear before save

---

## Test 16: Add Activity to Deal

**On the deal detail page → Activity tab**

### Add a Note
1. Click "Add Note" from Quick Actions
2. Enter: "Initial discovery call completed. Client interested in 50-seat deployment."
3. [ ] Note appears in Activity tab

### Log a Call
1. Click "Log Call" from Quick Actions
2. Fill in call details
3. [ ] Call activity appears in Activity tab

---

## Test 17: Tags

**On the deal detail page → Tags section in sidebar**

1. Add tag: "enterprise"
2. Add tag: "q2-2026"
3. [ ] Tags appear on the deal
4. Remove one tag
5. [ ] Tag is removed

---

## Test 18: Validation

### Required Field Validation
1. Click **+ Add Deal**
2. Try to submit with empty Deal Name → should show error
3. Try to submit with empty Value → should show error
4. Try to submit with empty Stage → should show error

### Field Format Validation
1. Enter negative value (-100) → should show error or be rejected
2. Enter probability > 100 → should show error
3. Enter probability < 0 → should show error

---

## Test 19: Delete Deal

1. Open a deal detail page
2. Click **Delete** button
3. Confirm deletion
4. [ ] Deal removed from list
5. [ ] Redirected to deals list page
6. [ ] Only ONE toast notification shown

---

## Quick Reference: Deal Statuses

| Status | Probability | Description | Actions Available |
|--------|------------|-------------|-------------------|
| **Open** | Stage default | Active deal in pipeline | Edit, Win, Lose, Delete |
| **Won** | 100% | Successfully closed | Reopen, Delete |
| **Lost** | 0% | Lost to competitor/other | Reopen, Delete |
| **Abandoned** | — | No longer pursued | Reopen, Delete |

## Quick Reference: Fixes Applied

| Issue | Fix |
|-------|-----|
| Probability not auto-updating on stage change | Now auto-updates to stage default when user doesn't manually change probability |
| Won deal shows old probability | Now auto-sets to 100% on win |
| Lost deal shows old probability | Now auto-sets to 0% on loss |
| Reopen restores wrong probability | Now restores to current stage's default probability |
| Mark as Lost not saving loss reason | Loss reason dropdown + loss notes textarea now properly sent to backend |
| Edit form resets won/lost status to open | Backend now ignores status from entity_data during updates |
| Delete toast showing twice | Removed duplicate toast from page handlers (hook already shows it) |
