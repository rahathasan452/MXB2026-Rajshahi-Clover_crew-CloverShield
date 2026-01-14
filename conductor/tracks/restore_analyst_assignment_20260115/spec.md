# Specification: Restore Analyst Assignment

## 1. Overview
The "Analyst Assignment" feature was previously removed and needs to be restored to the Investigation Queue (Cases Page). This feature allows analysts to see who is working on a case, assign cases to themselves, and ensures accountability. Additionally, cases should be automatically assigned to the current analyst when they actively engage with it (e.g., start investigation or take quick actions).

## 2. User Stories
- **As a Fraud Analyst**, I want to see an "Analyst" column in the cases list so I know which cases are already being handled.
- **As a Fraud Analyst**, I want to easily assign an unassigned case to myself directly from the list.
- **As a Fraud Analyst**, I want cases to be automatically assigned to me if I open them or perform an action, ensuring no duplicate work occurs.

## 3. Requirements

### 3.1 Cases Table Update (`frontend/app/dashboard/cases/page.tsx`)
- Add a new table column: **"Analyst"**.
- **Display Logic:**
  - If `analyst_id` is `NULL`: Show "Unassigned" with an option/button to "Assign to Me".
  - If `analyst_id` matches the current user: Show "Me" (highlighted).
  - If `analyst_id` is someone else: **Fetch and display the Analyst's Name** (from `users` table). If name is unavailable, fall back to ID.

### 3.2 Assignment Logic
- **Manual Assignment:** Clicking "Assign to Me" updates the `cases` table `analyst_id` to the current user's ID and status to `Investigating` (if currently `Open`).
- **Auto-Assignment:**
  - When clicking "View" to enter a case detail page, if the case is currently **Unassigned**, it should automatically be assigned to the current user.
  - *Alternative:* If "View" is too aggressive, ensure "Quick Actions" (Freeze, Block, etc.) trigger assignment. *Refining:* User asked for "start investigation ... auto assign". "View" is effectively starting investigation.

### 3.3 Backend/Database
- Ensure `cases` table has `analyst_id` (Confirmed: It does).
- Ensure RLS policies allow updating `analyst_id` (Need to verify, but assumed yes if `updateCaseStatus` works).

## 4. Technical Design

### 4.1 UI Components
- **`CasesPage` Component:**
  - Update `<thead>` to include `<th>Analyst</th>`.
  - Update `<tbody>` to render the analyst cell.
  - Use `handleAssign` function (already present but unused) for the "Assign to Me" button.
  - Add visual indicator for "Assigned to Other".

### 4.2 Auto-Assignment
- Intercept the "View" link click or add logic in the `CaseDetail` page `useEffect` to check assignment.
- **Approach:** It is better to handle this in the `CasesPage` "View" button click handler before navigation, OR in the `CaseDetail` page itself.
- **Decision:** In `CasesPage`, change the "View" Link to a button that calls `handleAssign` (if unassigned) then navigates, OR simply keep it as a link and handle "Auto-assign on load" in the case detail page.
- **User Request:** "when start investigation... auto assign".
- **Implementation:** In `CasesPage`, the "View" action will trigger assignment if unassigned.

## 5. Security & Permissions
- Only authenticated users can assign cases.
- Analysts can re-assign cases (take over) or only pick up unassigned ones? *Assumption: Open for now, allow taking over or at least picking up unassigned.*

## 6. Testing Plan
- **Unit/Component Test:** Verify the column renders.
- **Manual Test:**
  1. Load Cases Page.
  2. Verify "Analyst" column exists.
  3. Click "Assign to Me" on an unassigned case. Verify UI updates and backend updates.
  4. Click "View" on an unassigned case. Verify it gets assigned to the user automatically.
