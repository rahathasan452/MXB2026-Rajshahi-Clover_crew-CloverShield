# Specification: Case Management & Analyst Toolkit

## Overview
This track implements a robust Case Management System and Analyst Toolkit to streamline the fraud investigation workflow. It transitions the platform from a "Scanner" to a functional "Analyst Station" by introducing a structured investigation lifecycle, quick-action controls, and standardized investigation checklists.

## Functional Requirements

### 1. Case Lifecycle Management
- **Schema:** Implement a `cases` table in Supabase.
  - Fields: `case_id`, `target_id` (ref: users/transactions), `status` (Open, Investigating, Resolved, False Positive), `priority` (High, Medium, Low), `analyst_id`, `created_at`, `updated_at`.
- **Investigation Queue:** Create a new dashboard view `/dashboard/cases` to list and filter active cases.

### 2. Quick Action Toolbar
- **Interactive Controls:** One-click buttons to:
  - Transition case status.
  - Simulate account freezing or transaction blocking.
  - Trigger SAR (Suspicious Activity Report) generation or email alerts.
- **Keyboard Shortcuts:** Support for rapid triage (e.g., 'F' to freeze, 'S' to start investigation).

### 3. Investigation Checklist
- **Component:** A persistent checklist sidebar within the case detail view.
- **Tracking:** Real-time progress percentage based on completed steps.
- **Persistence:** Save the state of each checklist item to the database so analysts can resume work.

## Non-Functional Requirements
- **Integration:** Seamlessly merge with the existing "Analyst Station" dark theme and Emerald brand colors.
- **Latency:** Quick actions and status updates should reflect in the UI in <500ms (using optimistic updates where applicable).

## Acceptance Criteria
- [ ] A user can view a list of all open fraud cases.
- [ ] An analyst can change a case status from "Open" to "Investigating".
- [ ] A checklist is visible for each case, and progress is saved between sessions.
- [ ] Keyboard shortcuts trigger the correct UI actions.

## Out of Scope
- Integration with external real-world banking APIs for actual account freezing (simulated only).
- Multi-analyst real-time collaboration (e.g., seeing who else is viewing a case).
