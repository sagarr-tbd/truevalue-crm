# Activities V2 - Tasks Testing Guide

**URL:** `/activities-v2/tasks`

---

## Test 1: Create a New Task

Click **"+ Add Task"** button. Fill in the form:

### Task Details
| Field | Value |
|-------|-------|
| Task Title | Follow up with Priya Sharma on CRM proposal |
| Description | Send the revised pricing document and schedule a demo call for next week. Confirm budget approval timeline. |
| Priority | High |
| Status | Pending |

### Schedule & Reminder
| Field | Value |
|-------|-------|
| Due Date | *(pick a date 3 days from today)* |
| Reminder | *(pick a datetime 1 day before due date)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | Priya Sharma |
| Company | BrightPixel Media |
| Deal | TechCorp India - CRM Enterprise License |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Task appears in list with **High** priority badge (orange)
- Status shows **Pending**
- Due date is displayed correctly
- Stats cards update: Total count +1, Pending +1

---

## Test 2: Create a Second Task (Urgent)

Click **"+ Add Task"** again:

### Task Details
| Field | Value |
|-------|-------|
| Task Title | Prepare Q2 sales forecast report |
| Description | Compile deal pipeline data, win/loss ratios, and revenue projections for leadership review meeting. |
| Priority | Urgent |
| Status | In Progress |

### Schedule & Reminder
| Field | Value |
|-------|-------|
| Due Date | *(pick tomorrow's date)* |
| Reminder | *(pick today, 2 hours from now)* |

### Related Information
| Field | Value |
|-------|-------|
| Contact | *(leave empty)* |
| Company | *(leave empty)* |
| Deal | *(leave empty)* |
| Lead | *(leave empty)* |
| Assigned To | *(select any available member)* |

### Expected Result
- Task appears with **Urgent** priority badge (red)
- Status shows **In Progress** (blue/accent)
- Stats cards update: Total +1, In Progress +1

---

## Test 3: Create a Third Task (Low Priority, No Due Date)

### Task Details
| Field | Value |
|-------|-------|
| Task Title | Update CRM knowledge base articles |
| Description | Review and update outdated help articles for the V2 modules. |
| Priority | Low |
| Status | Pending |

### Schedule & Reminder
| Field | Value |
|-------|-------|
| Due Date | *(leave empty)* |
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
- Task appears with **Low** priority badge (gray)
- Due date shows "—"
- No related entities linked

---

## Test 4: View Task Detail Page

Click on **"Follow up with Priya Sharma on CRM proposal"** from the list.

### Expected Result
- Detail page shows all fields correctly:
  - Subject, Description, Priority (High), Status (Pending)
  - Due Date and Reminder datetime
  - Related Contact: **Priya Sharma** (clickable link to contact)
  - Related Company: **BrightPixel Media** (clickable link)
  - Related Deal: **TechCorp India - CRM Enterprise License** (clickable link)
  - Assigned To: shows the member name
- **Edit** and **Delete** buttons are visible
- **Mark Complete** button is visible

---

## Test 5: Edit a Task

From the detail page of **"Follow up with Priya Sharma on CRM proposal"**, click **Edit**.

### Change these fields
| Field | Old Value | New Value |
|-------|-----------|-----------|
| Priority | High | Urgent |
| Status | Pending | In Progress |
| Description | *(original)* | Send the revised pricing document and schedule a demo call for next week. Confirm budget approval timeline. **UPDATE: Client requested additional module pricing.** |

### Expected Result
- Priority updates to **Urgent** (red badge)
- Status updates to **In Progress**
- Description shows updated text
- Stats cards update accordingly

---

## Test 6: Mark a Task as Complete

From the detail page (or list actions), click **"Mark Complete"** on the task **"Prepare Q2 sales forecast report"**.

### Expected Result
- Status changes to **Completed** (green badge)
- `completed_at` timestamp is set
- Stats cards: Completed +1, In Progress -1
- Task should no longer show as overdue (if it was)

---

## Test 7: Stats Cards Verification

Check the stats cards at the top of the Tasks list page.

### Expected Result
| Card | Expected |
|------|----------|
| Total Tasks | 3 (or count of all tasks) |
| In Progress | 1 |
| Completed | 1 |
| Overdue | Check if any task has past due date with non-completed status |

---

## Test 8: Search Tasks

Type **"forecast"** in the search box.

### Expected Result
- Only **"Prepare Q2 sales forecast report"** appears
- Clear search to see all tasks again

---

## Test 9: Filter by Status

Click the status filter dropdown and select **"Completed"**.

### Expected Result
- Only completed tasks are shown
- Clear filter to see all tasks

---

## Test 10: Filter by Priority

Use the advanced filter to filter by **Priority = Urgent**.

### Expected Result
- Only urgent-priority tasks appear

---

## Test 11: View Toggle (List vs Card)

Toggle between **List view** and **Card view**.

### Expected Result
- **List view**: Shows table with columns (Subject, Priority, Status, Due Date, etc.)
- **Card view**: Shows cards with task details, priority badge, status badge

---

## Test 12: Bulk Select & Bulk Delete

1. Select multiple tasks using checkboxes
2. Click **Bulk Delete** from the toolbar

### Expected Result
- Bulk actions toolbar appears when items are selected
- Delete confirmation modal appears
- After confirming, selected tasks are removed
- Stats cards update

---

## Test 13: Bulk Status Update

1. Select tasks using checkboxes
2. Click **Bulk Update** → Change Status to **Cancelled**

### Expected Result
- All selected tasks update to **Cancelled** status
- Stats cards reflect the change

---

## Test 14: Delete a Task

From the detail page or list action menu, delete **"Update CRM knowledge base articles"**.

### Expected Result
- Confirmation modal appears
- Task is removed from the list after confirmation
- Single toast notification (not duplicate)
- Stats cards update: Total -1

---

## Test 15: Validation

Try to create a task with:
- **Empty Title** → Should show "Task title is required" error
- **Reminder after Due Date** → Should show validation error

### Expected Result
- Form does not submit with invalid data
- Appropriate error messages are shown

---

## Quick Reference: Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Task Title | Text | Yes | Max 255 chars |
| Description | Textarea | No | |
| Priority | Select | Yes | Urgent, High, Normal, Low |
| Status | Select | Yes | Pending, In Progress, Completed, Cancelled |
| Due Date | Date | No | |
| Reminder | DateTime | No | Must be before due date |
| Contact | Select/Lookup | No | |
| Company | Select/Lookup | No | |
| Deal | Select/Lookup | No | |
| Lead | Select/Lookup | No | |
| Assigned To | Select | No | |
