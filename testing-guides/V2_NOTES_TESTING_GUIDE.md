# Activities V2 - Notes Testing Guide

**URL:** `/activities-v2/notes`

---

## Test 1: Create a New Note

Click **"+ Add Note"** button. Fill in the form:

### Note Details
| Field | Value |
|-------|-------|
| Note Title | Priya Sharma - Budget Discussion Summary |
| Content | Spoke with Priya regarding budget allocation for CRM license. Key points: 1) Budget approved for 50 seats at INR 3L annual. 2) Need to include training package. 3) Contract review expected by end of month. 4) Decision maker is VP of Operations. Follow up in 1 week. |
| Status | *(leave as default or select Completed)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Priya Sharma |
| Company | BrightPixel Media |
| Deal | TechCorp India - CRM Enterprise License |
| Lead | *(leave empty)* |

### Expected Result
- Note appears in list
- Status shows correctly
- Related entities are linked
- Stats cards update: Total +1

---

## Test 2: Create a Second Note (Deal-Related)

### Note Details
| Field | Value |
|-------|-------|
| Note Title | Competitor analysis - GlobalEdge deal |
| Content | GlobalEdge is also evaluating Salesforce and Zoho CRM. Our advantages: 1) Lower price point. 2) Better customization options. 3) Local support team. Weakness: Less brand recognition. Strategy: Focus on ROI calculations and offer extended trial period. |
| Status | Completed |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Vikram Singh |
| Company | GlobalEdge Technologies |
| Deal | *(select a deal if available)* |
| Lead | *(leave empty)* |

### Expected Result
- Note created with all related entities linked
- Status shows **Completed**

---

## Test 3: Create a Third Note (Minimal - No Relations)

### Note Details
| Field | Value |
|-------|-------|
| Note Title | Sales process improvement ideas |
| Content | Consider adding: 1) Automated follow-up sequences. 2) Lead scoring refinement based on website activity. 3) Better integration with marketing campaigns. 4) Monthly win/loss analysis dashboard. |
| Status | Pending |

### Related Information
| Field | Value |
|-------|-------|
| Contact | *(leave empty)* |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |

### Expected Result
- Note created with no linked entities
- Appears in list

---

## Test 4: View Note Detail Page

Click on **"Priya Sharma - Budget Discussion Summary"** from the list.

### Expected Result
- Detail page shows:
  - Note Title and full Content text
  - Status
  - Related Contact: **Priya Sharma** (clickable)
  - Related Company: **BrightPixel Media** (clickable)
  - Related Deal: **TechCorp India - CRM Enterprise License** (clickable)
  - Created date
- **Edit** and **Delete** buttons visible

**Note:** Notes do NOT have: Priority, Due Date, Reminder, Assigned To, Mark Complete (simplified form compared to Tasks/Calls/Meetings)

---

## Test 5: Edit a Note

Edit **"Sales process improvement ideas"**:

### Change these fields
| Field | Old Value | New Value |
|-------|-----------|-----------|
| Content | *(original)* | *(original)* **5) Implement deal stage automation rules. 6) Set up email templates for common scenarios.** |
| Status | Pending | Completed |
| Contact | *(empty)* | *(select any contact)* |

### Expected Result
- Content updates with appended text
- Status changes to **Completed**
- Contact now linked

---

## Test 6: Stats Cards Verification

### Expected Result
| Card | Check |
|------|-------|
| Total Notes | Count of all notes |
| Completed | Count of completed notes |
| Pending | Count of pending notes |

---

## Test 7: Search Notes

Type **"competitor"** in the search box.

### Expected Result
- Only **"Competitor analysis - GlobalEdge deal"** appears
- Clear search shows all notes

---

## Test 8: Filter by Status

Filter by **Completed** status.

### Expected Result
- Only completed notes are shown

---

## Test 9: View Toggle

Toggle between **List view** and **Card view**.

### Expected Result
- List view: Table with Subject, Status, Related entities, Created date
- Card view: Cards with note preview

---

## Test 10: Bulk Operations

1. Select multiple notes with checkboxes
2. **Bulk Delete** → Confirm
3. **Bulk Update** → Change status

### Expected Result
- Bulk toolbar appears
- Operations work correctly
- Single toast per action

---

## Test 11: Delete a Note

Delete **"Competitor analysis - GlobalEdge deal"**.

### Expected Result
- Confirmation modal → delete → single toast
- Stats update

---

## Test 12: Validation

- **Empty Note Title** → Required error
- Form should not submit without title

---

## Quick Reference: Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Note Title | Text | Yes | Max 255 chars |
| Content | Textarea | No | Main note content |
| Status | Select | No | Pending, In Progress, Completed, Cancelled |
| Contact | Select | No | |
| Company | Select | No | |
| Deal | Select | No | |
| Lead | Select | No | |

**Note:** Notes have a simplified form - no Priority, Due Date, Start/End Time, Duration, Reminder, or Assigned To fields.
