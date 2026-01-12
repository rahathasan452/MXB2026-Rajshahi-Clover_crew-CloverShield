# Plan: Case Management & Analyst Toolkit

This plan implements a structured case management system, including a new database schema, investigation queue, and analyst toolkit components.

## Phase 1: Database Schema & API Setup
- [x] Task: Create Supabase migration for `cases` table [424ca27]
- [ ] Task: Update `lib/supabase.ts` with new Case types and helper functions
- [ ] Task: Create server-side logic (if needed) or RLS policies for case access
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & API Setup' (Protocol in workflow.md)

## Phase 2: Investigation Queue UI
- [ ] Task: Create `components/CaseStatusBadge.tsx` for status visualization
- [ ] Task: Create `app/dashboard/cases/page.tsx` with a searchable/filterable case table
- [ ] Task: Implement case assignment logic (UI + DB update)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Investigation Queue UI' (Protocol in workflow.md)

## Phase 3: Case Detail & Toolkit
- [ ] Task: Create `app/dashboard/cases/[id]/page.tsx` for detailed investigation
- [ ] Task: Implement `components/QuickActionToolbar.tsx` with keyboard shortcut support
- [ ] Task: Implement `components/InvestigationChecklist.tsx` with persistence
- [ ] Task: Integrate "Block Transaction" and "Freeze Account" simulation buttons
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Case Detail & Toolkit' (Protocol in workflow.md)

## Phase 4: Integration & Polish
- [ ] Task: Add "Create Case" button to existing Transaction Detail/Decision views
- [ ] Task: Ensure mobile responsiveness for the new Case views
- [ ] Task: Final end-to-end testing of the investigation lifecycle
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration & Polish' (Protocol in workflow.md)
