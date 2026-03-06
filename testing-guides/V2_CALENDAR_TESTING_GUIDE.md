# Activities V2 - Calendar Testing Guide

**URL:** `/activities-v2/calendar`

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
| **Super Admin** | Full access — all modules, all actions | Primary testing role |
| **Org Admin / Owner** | Full access within organisation | Equivalent to Super Admin |
| **Manager / Member** | Read access to activities | Can view calendar |
| **Viewer** | Read-only | Can view calendar (no create/edit actions on this page) |

### Permission Codes (Calendar)

| Code | Description |
|------|-------------|
| `tasks:read` | View tasks on calendar |
| `activities:read` | View calls and meetings on calendar |

> **Testing Condition:** The Calendar page is read-only (no create/edit actions). Any user with read access to activities can view it. Log in as **Super Admin** or **Org Admin** for full testing.

## Prerequisites

Before testing the Calendar, ensure you have created activities with due dates/times from the other testing guides:
- **Tasks** with due dates (from V2_TASKS_TESTING_GUIDE.md)
- **Calls** with call dates and start/end times (from V2_CALLS_TESTING_GUIDE.md)
- **Meetings** with meeting dates and start/end times (from V2_MEETINGS_TESTING_GUIDE.md)

The Calendar view displays Tasks, Calls, and Meetings (Notes and Emails are NOT shown on the calendar).

---

## Test 1: Calendar Page Loads

Navigate to `/activities-v2/calendar`.

### Expected Result
- Calendar renders without errors
- Current month is displayed by default
- Activity type filter toggles are visible (Tasks, Calls, Meetings)
- All three types are enabled by default
- Activities with due dates appear on their respective dates

---

## Test 2: Activities Appear on Correct Dates

Check that activities from earlier tests appear on the calendar.

### Expected Result
| Activity | Expected Date |
|----------|---------------|
| Follow up with Priya Sharma on CRM proposal | Due date set in Tasks Test 1 |
| Prepare Q2 sales forecast report | Due date set in Tasks Test 2 |
| Discovery call with Vikram Singh | Call date from Calls Test 1 |
| CRM Demo with GlobalEdge Technologies | Meeting date from Meetings Test 1 |
| Weekly Sales Pipeline Review | Today's date (Meetings Test 2) |

- Each activity shows on its correct date cell
- Activity titles are visible on the calendar

---

## Test 3: Filter by Activity Type - Tasks Only

Click the **Tasks** toggle to keep it ON, turn OFF **Calls** and **Meetings**.

### Expected Result
- Only task activities appear on the calendar
- Call and meeting events are hidden
- Toggle states are visually clear (active vs inactive)

---

## Test 4: Filter by Activity Type - Calls Only

Turn ON only **Calls**, turn OFF **Tasks** and **Meetings**.

### Expected Result
- Only call activities appear
- Task and meeting events are hidden

---

## Test 5: Filter by Activity Type - Meetings Only

Turn ON only **Meetings**, turn OFF **Tasks** and **Calls**.

### Expected Result
- Only meeting activities appear

---

## Test 6: All Types Combined

Turn ON all three types: **Tasks**, **Calls**, **Meetings**.

### Expected Result
- All activities with dates are visible
- Different activity types are visually distinguishable (different colors/icons)

---

## Test 7: Click on Calendar Event

Click on any activity shown on the calendar.

### Expected Result
- Navigates to the correct detail page:
  - Task → `/activities-v2/tasks/[id]`
  - Call → `/activities-v2/calls/[id]`
  - Meeting → `/activities-v2/meetings/[id]`

---

## Test 8: Navigate Between Months

Use the calendar navigation (previous/next month arrows).

### Expected Result
- Calendar switches to the selected month
- Activities for that month are displayed (if any)
- Navigation is smooth, no loading errors

---

## Test 9: Activities Without Dates

If you created activities without due dates (e.g., Tasks Test 3: "Update CRM knowledge base articles"):

### Expected Result
- Activities without due dates do NOT appear on the calendar
- They are still visible in their respective list pages

---

## Test 10: Calendar After Creating New Activity

1. Open a new tab/window with Tasks list
2. Create a new task with a due date in the current month
3. Go back to the Calendar page

### Expected Result
- New task appears on the calendar at its due date
- Calendar reflects the latest data

---

## Test 11: Calendar After Deleting an Activity

1. Delete a task/call/meeting that was visible on the calendar
2. Return to the Calendar page

### Expected Result
- Deleted activity no longer appears on the calendar

---

## Quick Reference: What Shows on Calendar

| Activity Type | Shows on Calendar | Date Used |
|---------------|-------------------|-----------|
| Tasks | Yes | `due_date` |
| Calls | Yes | `due_date` or `start_time` |
| Meetings | Yes | `due_date` or `start_time` |
| Notes | No | N/A |
| Emails | No | N/A |

## Quick Reference: Calendar Features

| Feature | Available |
|---------|-----------|
| Monthly view | Yes |
| Activity type toggles | Yes (Tasks, Calls, Meetings) |
| Click to navigate to detail | Yes |
| Month navigation | Yes |
| Activity time display | Yes (for calls/meetings with start_time) |
| Duration display | Yes (for calls/meetings with duration) |
| Status/Priority indicators | Yes |
