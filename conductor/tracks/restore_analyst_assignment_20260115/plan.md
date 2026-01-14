# Plan: Restore Analyst Assignment [checkpoint: 24a5d7e]

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

## 2. Verification
- [x] **Manual Verification** (3d32d79)
  - Spin up the dev server.
  - Log in.
  - Check the Cases list for the new column.
  - Test assigning a case.
  - Test "View" auto-assignment.
