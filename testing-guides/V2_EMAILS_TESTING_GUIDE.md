# Activities V2 - Emails Testing Guide

**URL:** `/activities-v2/emails`

## Organisation & Environment

| Item | Value |
|------|-------|
| **Organisation** | TrueValue CRM (multi-tenant) |
| **Frontend URL** | `http://localhost:3000` |
| **Backend API** | `http://localhost:8000/crm/api/v2/activities/` |
| **Docker Backend** | `crm-backend` container |

## User Roles & Permissions

| Role | Permissions | Use For Testing |
|------|------------|-----------------|
| **Super Admin** | Full access — all modules, all actions | Primary testing role (bypasses all permission checks) |
| **Org Admin / Owner** | Full access within organisation | Equivalent to Super Admin for CRM testing |
| **Manager** | Read, Write, Delete on assigned modules | Test permission-gated buttons (Edit, Delete, Bulk) |
| **Member** | Read, Write on assigned modules | Test limited write access |
| **Viewer** | Read-only | Test that Add/Edit/Delete buttons are hidden |

### Permission Codes (Activities — Emails)

| Code | Description |
|------|-------------|
| `activities:read` | View emails list and detail pages |
| `activities:write` | Create and edit email activities |
| `activities:delete` | Delete email activities (single and bulk) |

> **Testing Condition:** Unless testing role-based access specifically, log in as **Super Admin** or **Org Admin** to ensure all buttons and actions are available.

## Prerequisites

1. Backend running via Docker (`docker compose up`) or locally
2. Frontend running (`cd frontend/crm-app && npm run dev`)
3. Logged in with a valid user (Super Admin or Org Admin recommended)
4. Contacts, Companies, and Deals created (from prior V2 testing guides) for relation linking

## Testing Conditions

- Tests should be run in **order** (Test 1 → Test 13) as later tests depend on earlier data
- After each create/edit/delete, verify **no duplicate toast** notifications appear
- After each mutation, verify **no page reload** — UI should update via React Query cache invalidation
- Cross-check **Stats cards** after every create/edit/delete to confirm counts are correct
- Emails do **NOT** have Start/End Time or Duration fields (unlike Calls and Meetings)
- Email activities use **soft delete** — deleted emails are hidden from the UI but retained in the database

---

## Test 1: Create a New Email (Sent)

Click **"+ Add Email"** button. Fill in the form:

### Email Details
| Field | Value |
|-------|-------|
| Email Subject | CRM Enterprise License - Revised Pricing Proposal |
| Description | Sent the revised pricing proposal to Priya Sharma. Includes: 50-seat annual license at INR 3,00,000. Training package (20 hours) included. 24/7 premium support for first year. Data migration assistance included. |
| Direction | Sent |
| Status | Completed |
| Priority | High |

### Schedule & Reminder
| Field | Value |
|-------|-------|
| Due Date | *(pick today's date)* |
| Reminder | *(leave empty - already sent)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Priya Sharma |
| Company | BrightPixel Media |
| Deal | TechCorp India - CRM Enterprise License |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Email appears in list with **Sent** direction badge (blue)
- Status shows **Completed** (green badge)
- Priority shows **High** (orange badge)
- Stats cards update: Total +1

---

## Test 2: Create a Second Email (Received)

### Email Details
| Field | Value |
|-------|-------|
| Email Subject | RE: Product Demo Request - GlobalEdge Technologies |
| Description | Received confirmation from Vikram Singh for the CRM demo. Team of 5 will attend. They need focus on: pipeline management, custom fields, API documentation, and reporting. Requested demo environment access beforehand. |
| Direction | Received |
| Status | Pending |
| Priority | Normal |

### Schedule & Reminder
| Field | Value |
|-------|-------|
| Due Date | *(pick tomorrow's date - need to respond)* |
| Reminder | *(pick today, 5:00 PM)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Vikram Singh |
| Company | GlobalEdge Technologies |
| Deal | *(select a deal if available)* |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Email appears with **Received** direction badge (green)
- Status shows **Pending**
- Due Date and Reminder set

---

## Test 3: Create a Third Email (Internal Follow-up)

### Email Details
| Field | Value |
|-------|-------|
| Email Subject | Internal: Q2 Pipeline Update Required |
| Description | Need all sales reps to update their deal stages and expected close dates by EOD Friday. Q2 forecast meeting with leadership is next Monday. |
| Direction | Sent |
| Status | Completed |
| Priority | Urgent |

### Schedule & Reminder
| Field | Value |
|-------|-------|
| Due Date | *(pick today's date)* |
| Reminder | *(leave empty)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | *(leave empty)* |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(leave empty)* |

### Expected Result
- Priority shows **Urgent** (red badge)
- No related entities linked
- Status shows **Completed**

---

## Test 4: View Email Detail Page

Click on **"CRM Enterprise License - Revised Pricing Proposal"** from the list.

### Expected Result
- Detail page displays:
  - Email Subject and Description (full content)
  - Direction: **Sent** (blue badge)
  - Status: **Completed**, Priority: **High**
  - Due Date
  - Related Contact: **Priya Sharma** (clickable)
  - Related Company: **BrightPixel Media** (clickable)
  - Related Deal: **TechCorp India - CRM Enterprise License** (clickable)
  - Assigned To: member name
- **Edit** and **Delete** buttons visible

---

## Test 5: Edit an Email

Edit **"RE: Product Demo Request - GlobalEdge Technologies"**:

### Change these fields
| Field | Old Value | New Value |
|-------|-----------|-----------|
| Status | Pending | Completed |
| Description | *(original)* | *(original)* **Response sent: Demo environment credentials shared. Confirmed date and agenda.** |

### Expected Result
- Status updates to **Completed**
- Description shows appended text
- Stats: Completed +1, Pending -1

---

## Test 6: Stats Cards Verification

### Expected Result
| Card | Check |
|------|-------|
| Total Emails | Count of all tracked emails |
| Completed | Count of completed emails |
| Pending | Count of pending emails |
| Overdue | Emails with past due date and non-completed status |

---

## Test 7: Filter by Direction

Use filter to show only **Received** emails.

### Expected Result
- Only received emails displayed
- Clear filter shows all

---

## Test 8: Filter by Status

Filter by **Pending** status.

### Expected Result
- Only pending emails shown

---

## Test 9: Search Emails

Type **"Pipeline"** in search box.

### Expected Result
- Only **"Internal: Q2 Pipeline Update Required"** appears

---

## Test 10: View Toggle

Toggle between **List view** and **Card view**.

### Expected Result
- List view: Table with Subject, Direction, Status, Priority, Due Date
- Card view: Cards with email details and direction/status badges

---

## Test 11: Bulk Operations

1. Select multiple emails with checkboxes
2. **Bulk Delete** and **Bulk Update** (change status)

### Expected Result
- Bulk toolbar appears
- Single toast per action
- Stats update

---

## Test 12: Delete an Email

Delete **"Internal: Q2 Pipeline Update Required"**.

### Expected Result
- Confirmation modal → delete → single toast
- Stats update

---

## Test 13: Validation

- **Empty Email Subject** → Required error
- **Reminder after Due Date** → Validation error

---

## Quick Reference: Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Email Subject | Text | Yes | Max 255 chars |
| Description | Textarea | No | Email body/summary |
| Direction | Select | No | Sent, Received |
| Status | Select | No | Pending, In Progress, Completed, Cancelled |
| Priority | Select | No | Urgent, High, Normal, Low |
| Due Date | Date | No | |
| Reminder | DateTime | No | Must be before due date |
| Contact | Select | No | |
| Company | Select | No | |
| Deal | Select | No | |
| Lead | Select | No | |
| Assigned To | Select | No | |

**Note:** Emails do NOT have Start/End Time or Duration fields (unlike Calls and Meetings).
