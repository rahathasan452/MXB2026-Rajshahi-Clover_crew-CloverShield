# Plan: Case Management & Analyst Toolkit

This plan implements a structured case management system, including a new database schema, investigation queue, and analyst toolkit components.

## Phase 1: Database Schema & API Setup [checkpoint: 2a4bb5d]
- [x] Task: Create Supabase migration for `cases` table [424ca27]
- [x] Task: Update `lib/supabase.ts` with new Case types and helper functions [be4051b]
- [x] Task: Create server-side logic (if needed) or RLS policies for case access [de48e4d]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & API Setup' (Protocol in workflow.md) [2a4bb5d]

## Phase 2: Investigation Queue UI
- [x] Task: Create `components/CaseStatusBadge.tsx` for status visualization [ec57b83]
- [x] Task: Create `app/dashboard/cases/page.tsx` with a searchable/filterable case table [10779ad]
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
