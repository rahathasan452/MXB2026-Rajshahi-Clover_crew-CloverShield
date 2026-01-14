# Plan: Restore Analyst Assignment [checkpoint: 85a7ee3]

## 1. Frontend Implementation
- [x] **Update Cases Table UI** (3d32d79)
  - Edit `frontend/app/dashboard/cases/page.tsx`
  - Add "Analyst" column to the table header.
  - Implement the "Analyst" cell in the table body:
    - Show "Assign" button if `analyst_id` is null.
    - Show "Me" badge if `analyst_id` matches current user.
    - Show "Other" indicator if assigned to someone else.
  - Connect the "Assign" button to the existing `handleAssign` function.

- [x] **Implement Auto-Assignment on View** (3d32d79)
  - Edit `frontend/app/dashboard/cases/page.tsx`
  - Modify the "View" action.
  - Create a handler that checks if the case is unassigned.
  - If unassigned, call `handleAssign` (or equivalent API) before navigating (or fire-and-forget).
  - Navigate to the case detail page.

- [x] **Display Analyst Names** (41269b3)
  - Edit `frontend/lib/supabase.ts`: Add `getAnalystNames` function to fetch `name_en` from `users` table for a list of IDs.
  - Edit `frontend/app/dashboard/cases/page.tsx`:
    - Fetch analyst names when cases are loaded.
    - Create a map of ID -> Name.
    - Display the name in the table cell.

## 2. Verification
- [x] **Manual Verification** (3d32d79)
  - Spin up the dev server.
  - Log in.
  - Check the Cases list for the new column.
  - Test assigning a case.
  - Test "View" auto-assignment.
