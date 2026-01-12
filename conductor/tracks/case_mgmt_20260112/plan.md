# Plan: Case Management & Analyst Toolkit

This plan implements a structured case management system, including a new database schema, investigation queue, and analyst toolkit components.

## Phase 1: Database Schema & API Setup [checkpoint: 2a4bb5d]
- [x] Task: Create Supabase migration for `cases` table [424ca27]
- [x] Task: Update `lib/supabase.ts` with new Case types and helper functions [be4051b]
- [x] Task: Create server-side logic (if needed) or RLS policies for case access [de48e4d]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & API Setup' (Protocol in workflow.md) [2a4bb5d]

## Phase 2: Investigation Queue UI [checkpoint: 40e38ad]
- [x] Task: Create `components/CaseStatusBadge.tsx` for status visualization [ec57b83]
- [x] Task: Create `app/dashboard/cases/page.tsx` with a searchable/filterable case table [10779ad]
- [x] Task: Implement case assignment logic (UI + DB update) [c40a9d3]
- [x] Task: Implement 'Generate Demo Cases' feature to populate queue from test dataset [e79a499]
- [x] Task: Conductor - User Manual Verification 'Phase 2: Investigation Queue UI' (Protocol in workflow.md) [40e38ad]

## Phase 3: Case Detail & Toolkit [checkpoint: e7019a4]
- [x] Task: Create `app/dashboard/cases/[id]/page.tsx` for detailed investigation [bdb13d1]
- [x] Task: Implement `components/QuickActionToolbar.tsx` with keyboard shortcut support [5ee92e0]
- [x] Task: Implement `components/InvestigationChecklist.tsx` with persistence [3b8292a]
- [x] Task: Integrate "Block Transaction" and "Freeze Account" simulation buttons [acb2b2f]
- [x] Task: Conductor - User Manual Verification 'Phase 3: Case Detail & Toolkit' (Protocol in workflow.md) [e7019a4]

## Phase 4: Integration & Polish [checkpoint: 00e6827]
- [x] Task: Add "Create Case" button to existing Transaction Detail/Decision views [161ba0f]
- [x] Task: Ensure mobile responsiveness for the new Case views [cd5d3fb]
- [x] Task: Final end-to-end testing of the investigation lifecycle [manual-verified]
- [x] Task: Conductor - User Manual Verification 'Phase 4: Integration & Polish' (Protocol in workflow.md) [00e6827]
