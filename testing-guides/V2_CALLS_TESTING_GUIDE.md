# Activities V2 - Calls Testing Guide

**URL:** `/activities-v2/calls`

---

## Test 1: Create a New Call (Outbound)

Click **"+ Add Call"** button. Fill in the form:

### Call Details
| Field | Value |
|-------|-------|
| Call Subject | Discovery call with Vikram Singh |
| Description | Initial discovery call to understand GlobalEdge Technologies' CRM requirements. Discuss team size, current tools, and migration timeline. |
| Direction | Outbound |
| Status | Pending |
| Priority | High |
| Call Outcome | *(leave empty - will fill after call)* |

### Schedule & Duration
| Field | Value |
|-------|-------|
| Call Date | *(pick today's date)* |
| Start Time | *(pick today, 2:00 PM)* |
| End Time | *(pick today, 2:30 PM)* |
| Duration (minutes) | *(should auto-calculate to 30)* |
| Reminder | *(pick today, 1:45 PM)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Vikram Singh |
| Company | GlobalEdge Technologies |
| Deal | *(select a deal if available, or leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Call appears in list with **Outbound** direction badge (green)
- Status shows **Pending**
- Duration shows **30 min** (auto-calculated)
- Priority badge shows **High** (orange)
- Stats cards update: Total +1, Pending +1

---

## Test 2: Create a Second Call (Inbound, Completed)

### Call Details
| Field | Value |
|-------|-------|
| Call Subject | Inbound inquiry from Kiran Mehta |
| Description | Client called to ask about custom reporting features and API integration options. Very interested in premium tier. |
| Direction | Inbound |
| Status | Completed |
| Priority | Normal |
| Call Outcome | Answered |

### Schedule & Duration
| Field | Value |
|-------|-------|
| Call Date | *(pick yesterday's date)* |
| Start Time | *(pick yesterday, 11:00 AM)* |
| End Time | *(pick yesterday, 11:25 AM)* |
| Duration (minutes) | *(should auto-calculate to 25)* |
| Reminder | *(leave empty)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Kiran Mehta |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Call appears with **Inbound** direction badge (blue)
- Status shows **Completed** (green)
- Call Outcome shows **Answered**
- Duration shows **25 min**

---

## Test 3: Create a Third Call (No Answer)

### Call Details
| Field | Value |
|-------|-------|
| Call Subject | Follow-up call to Sophie Martin |
| Description | Attempted follow-up on webinar attendance and product demo scheduling. |
| Direction | Outbound |
| Status | Completed |
| Priority | Normal |
| Call Outcome | No Answer |

### Schedule & Duration
| Field | Value |
|-------|-------|
| Call Date | *(pick today's date)* |
| Start Time | *(pick today, 10:00 AM)* |
| End Time | *(pick today, 10:02 AM)* |
| Duration (minutes) | *(should auto-calculate to 2)* |
| Reminder | *(leave empty)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Sophie Martin |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(leave empty)* |

### Expected Result
- Call Outcome shows **No Answer** (orange badge)
- Duration shows **2 min**

---

## Test 4: View Call Detail Page

Click on **"Discovery call with Vikram Singh"** from the list.

### Expected Result
- Detail page shows all fields:
  - Subject, Description
  - Direction: **Outbound**
  - Status: **Pending**, Priority: **High**
  - Call Outcome: *(empty or not set)*
  - Schedule: Call Date, Start Time, End Time, Duration
  - Reminder datetime
  - Related Contact: **Vikram Singh** (clickable)
  - Related Company: **GlobalEdge Technologies** (clickable)
  - Assigned To: member name
- **Edit**, **Delete**, **Mark Complete** buttons visible

---

## Test 5: Edit a Call (Update Outcome After Call)

Edit **"Discovery call with Vikram Singh"**:

### Change these fields
| Field | Old Value | New Value |
|-------|-----------|-----------|
| Status | Pending | Completed |
| Call Outcome | *(empty)* | Answered |
| Description | *(original)* | *(original)* **UPDATE: Very productive call. Vikram confirmed budget of 5L. Scheduling demo for next week.** |

### Expected Result
- Status changes to **Completed**
- Call Outcome shows **Answered**
- Stats cards: Completed +1, Pending -1

---

## Test 6: Duration Auto-Calculation

Create a new call and test:

1. Set **Start Time** to `3:00 PM`
2. Set **End Time** to `3:45 PM`
3. Check **Duration (minutes)** field

### Expected Result
- Duration auto-populates to **45**
- Duration field is disabled/read-only (auto-calculated)

---

## Test 7: Mark Complete

From the list, use the action menu to **Mark Complete** on the first pending call.

### Expected Result
- Status changes to **Completed**
- Stats cards update

---

## Test 8: Stats Cards Verification

### Expected Result
| Card | Check |
|------|-------|
| Total Calls | Count of all calls |
| Completed | Count of completed calls |
| Pending | Count of pending calls |
| Overdue | Calls with past due date and non-completed status |

---

## Test 9: Filter by Direction

Use the filter to show only **Inbound** calls.

### Expected Result
- Only inbound calls are displayed
- Clear filter shows all calls

---

## Test 10: Filter by Outcome

Use the advanced filter to filter by **Call Outcome = No Answer**.

### Expected Result
- Only calls with "No Answer" outcome appear

---

## Test 11: Search Calls

Type **"Vikram"** in search box.

### Expected Result
- Only **"Discovery call with Vikram Singh"** appears

---

## Test 12: Bulk Operations

1. Select multiple calls with checkboxes
2. Test **Bulk Delete** and **Bulk Status Update**

### Expected Result
- Bulk actions toolbar appears
- Operations execute correctly
- Single toast notification per action

---

## Test 13: Delete a Call

Delete **"Follow-up call to Sophie Martin"** from the list or detail page.

### Expected Result
- Confirmation modal appears
- Call removed after confirmation
- Single toast notification
- Stats cards update

---

## Test 14: Validation

- **Empty Subject** → Error: required
- **End Time before Start Time** → Validation error
- **Reminder after Call Date** → Validation error

---

## Quick Reference: Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Call Subject | Text | Yes | Max 255 chars |
| Description | Textarea | No | |
| Direction | Select | Yes | Inbound, Outbound |
| Status | Select | No | Pending, In Progress, Completed, Cancelled |
| Priority | Select | No | Urgent, High, Normal, Low |
| Call Outcome | Select | No | Answered, Voicemail, No Answer, Busy, Failed |
| Call Date | Date | No | |
| Start Time | DateTime | No | |
| End Time | DateTime | No | Must be after Start Time |
| Duration (min) | Number | No | Auto-calculated (read-only) |
| Reminder | DateTime | No | Must be before call date |
| Contact | Select | No | |
| Company | Select | No | |
| Deal | Select | No | |
| Lead | Select | No | |
| Assigned To | Select | No | |
