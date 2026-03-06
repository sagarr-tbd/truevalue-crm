# Activities V2 - Meetings Testing Guide

**URL:** `/activities-v2/meetings`

---

## Test 1: Create a New Meeting

Click **"+ Add Meeting"** button. Fill in the form:

### Meeting Details
| Field | Value |
|-------|-------|
| Meeting Title | CRM Demo with GlobalEdge Technologies |
| Description | Product demo for Vikram Singh and team. Cover dashboard, pipeline management, reporting, and API integration. Prepare sandbox environment. |
| Priority | High |
| Status | Pending |

### Schedule & Duration
| Field | Value |
|-------|-------|
| Meeting Date | *(pick a date 5 days from today)* |
| Start Time | *(pick that date, 10:00 AM)* |
| End Time | *(pick that date, 11:30 AM)* |
| Duration (minutes) | *(should auto-calculate to 90)* |
| Reminder | *(pick 1 hour before start: 9:00 AM same day)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Vikram Singh |
| Company | GlobalEdge Technologies |
| Deal | *(select a deal if available)* |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Meeting appears in list with **High** priority (orange badge)
- Status shows **Pending**
- Duration shows **90 min** (auto-calculated)
- Stats cards update: Total +1, Pending +1

---

## Test 2: Create a Second Meeting (Internal, Today)

### Meeting Details
| Field | Value |
|-------|-------|
| Meeting Title | Weekly Sales Pipeline Review |
| Description | Review current pipeline status, discuss stuck deals, forecast adjustments, and resource allocation for Q2. |
| Priority | Normal |
| Status | In Progress |

### Schedule & Duration
| Field | Value |
|-------|-------|
| Meeting Date | *(pick today's date)* |
| Start Time | *(pick today, 3:00 PM)* |
| End Time | *(pick today, 4:00 PM)* |
| Duration (minutes) | *(should auto-calculate to 60)* |
| Reminder | *(leave empty)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | *(leave empty)* |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Meeting appears with **Normal** priority
- Status shows **In Progress** (blue/accent badge)
- Duration shows **60 min**

---

## Test 3: Create a Third Meeting (Past, Completed)

### Meeting Details
| Field | Value |
|-------|-------|
| Meeting Title | Onboarding call with Rachel Green |
| Description | Walked through initial setup, user roles, and data import process. Client has 10 users to onboard. |
| Priority | Normal |
| Status | Completed |

### Schedule & Duration
| Field | Value |
|-------|-------|
| Meeting Date | *(pick a date 2 days ago)* |
| Start Time | *(that date, 2:00 PM)* |
| End Time | *(that date, 2:45 PM)* |
| Duration (minutes) | *(should auto-calculate to 45)* |
| Reminder | *(leave empty)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Rachel Green |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(leave empty)* |

### Expected Result
- Status shows **Completed** (green badge)
- Duration shows **45 min**

---

## Test 4: View Meeting Detail Page

Click on **"CRM Demo with GlobalEdge Technologies"** from the list.

### Expected Result
- Detail page displays:
  - Meeting Title, Description
  - Priority: **High**, Status: **Pending**
  - Meeting Date, Start Time, End Time, Duration: **90 min**
  - Reminder date/time
  - Related Contact: **Vikram Singh** (clickable)
  - Related Company: **GlobalEdge Technologies** (clickable)
  - Assigned To: member name
- **Edit**, **Delete**, **Mark Complete** buttons visible

---

## Test 5: Edit a Meeting

Edit **"CRM Demo with GlobalEdge Technologies"**:

### Change these fields
| Field | Old Value | New Value |
|-------|-----------|-----------|
| Start Time | 10:00 AM | 11:00 AM |
| End Time | 11:30 AM | 12:30 PM |
| Description | *(original)* | *(original)* **Added: Include pricing discussion and contract terms review.** |

### Expected Result
- Times update correctly
- Duration remains **90 min** (still 1.5 hours)
- Description shows appended text

---

## Test 6: Duration Auto-Calculation

Create a new meeting and test:

1. Set **Start Time** to `9:00 AM`
2. Set **End Time** to `9:15 AM`
3. Check **Duration** → should show **15**
4. Change **End Time** to `10:30 AM`
5. Check **Duration** → should update to **90**

### Expected Result
- Duration field auto-calculates on start/end time changes
- Duration field is disabled (read-only)

---

## Test 7: Mark Complete

Click **"Mark Complete"** on **"Weekly Sales Pipeline Review"**.

### Expected Result
- Status changes to **Completed**
- `completed_at` timestamp is set
- Stats: Completed +1, In Progress -1

---

## Test 8: Stats Cards Verification

### Expected Result
| Card | Check |
|------|-------|
| Total Meetings | Count of all meetings |
| Completed | Count of completed meetings |
| Pending | Count of pending meetings |
| Overdue | Meetings with past due date and non-completed status |

---

## Test 9: Search & Filter

1. Search: Type **"Demo"** → Only "CRM Demo..." should appear
2. Filter by Status: **Completed** → Only completed meetings shown
3. Filter by Priority: **High** → Only high-priority meetings shown

---

## Test 10: View Toggle

Toggle between **List view** and **Card view**.

### Expected Result
- List view: Table with columns (Title, Priority, Status, Date, Duration, etc.)
- Card view: Cards with meeting details and badges

---

## Test 11: Bulk Operations

1. Select multiple meetings
2. **Bulk Delete** → Confirm deletion
3. **Bulk Update** → Change status to Cancelled

### Expected Result
- Bulk toolbar appears
- Operations execute with single toast per action
- Stats update

---

## Test 12: Delete a Meeting

Delete **"Onboarding call with Rachel Green"** from list or detail page.

### Expected Result
- Confirmation modal → delete → single toast
- Stats update

---

## Test 13: Validation

- **Empty Meeting Title** → Required error
- **End Time before Start Time** → Validation error
- **Reminder after Meeting Date** → Validation error

---

## Quick Reference: Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Meeting Title | Text | Yes | Max 255 chars |
| Description | Textarea | No | |
| Priority | Select | Yes | Urgent, High, Normal, Low |
| Status | Select | Yes | Pending, In Progress, Completed, Cancelled |
| Meeting Date | Date | No | |
| Start Time | DateTime | No | |
| End Time | DateTime | No | Must be after Start Time |
| Duration (min) | Number | No | Auto-calculated (read-only) |
| Reminder | DateTime | No | Must be before meeting date |
| Contact | Select | No | |
| Company | Select | No | |
| Deal | Select | No | |
| Lead | Select | No | |
| Assigned To | Select | No | |
