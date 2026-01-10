# Track Plan: Robust Audit Logging System

## Phase 1: Verification and Database Extension
- [x] Task: Write SQL tests to verify that the existing `trg_audit_case_changes` trigger correctly logs status changes in the `transactions` table. 5e85ad4
- [x] Task: Create a new migration to add a trigger for logging unauthorized access attempts or sensitive config changes in `model_registry` (if applicable). 0c28b0a
- [x] Task: Conductor - User Manual Verification 'Phase 1: Verification and Database Extension' (Protocol in workflow.md) [checkpoint: ce05fa1]

## Phase 2: ML API Logging Integration
- [x] Task: Implement a `AuditLogger` class in `ml-api/utils/audit.py` that wraps the Supabase `log_activity` RPC. 759d8a0
- [x] Task: Write unit tests for `AuditLogger` using a mock Supabase client. 759d8a0
- [x] Task: Integrate `AuditLogger` into the `/predict` endpoint in `ml-api/main.py` to log every fraud score calculation. a756ec4
- [ ] Task: Integrate `AuditLogger` into the `/backtest` endpoint in `ml-api/main.py` to log policy simulations.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: ML API Logging Integration' (Protocol in workflow.md)

## Phase 3: Frontend Events and Audit Viewer
- [ ] Task: Implement a frontend utility to log analyst events (e.g., `LOG_ANALYSIS_START`, `REPORT_DOWNLOADED`) using the `log_activity` RPC.
- [ ] Task: Add a new "Audit Trail" page in the dashboard (`frontend/app/dashboard/audit/page.tsx`) that displays the `audit_logs` table.
- [ ] Task: Build an `AuditLogTable` component to display logs with filtering by user, action type, and date range.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Events and Audit Viewer' (Protocol in workflow.md)
