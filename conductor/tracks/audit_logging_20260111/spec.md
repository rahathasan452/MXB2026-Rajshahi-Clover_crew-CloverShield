# Track Spec: Robust Audit Logging System

## Goal
Implement a comprehensive audit logging system to track all analyst actions and sensitive data access within CloverShield, ensuring accountability and meeting the "Sovereign Defense" privacy requirements.

## Requirements
- **Database level:** Every critical change (status updates, assignments) in the `transactions` table is automatically logged via triggers.
- **API level:** The `ml-api` must log every inference request and its outcome to the `audit_logs` table.
- **Frontend level:** High-level analyst actions (Login, Report Generation, Manual Search) must be logged via the `log_activity` RPC.
- **Audit Visibility:** A dedicated "Audit Trail" view must be available to authorized analysts to review system activity.

## Technical Implementation
- **Supabase Triggers:** Leverage existing triggers on the `transactions` table and add new ones if necessary for other sensitive tables.
- **FastAPI Logging:** Implement a utility in the `ml-api` to log predictions and backtests using the Supabase Python client to call the `log_activity` RPC.
- **Frontend Logging:** Use the Supabase client in the Next.js frontend to call the `log_activity` RPC for non-CRUD events.
- **UI Component:** Build an `AuditLogViewer` component using Tailwind CSS and the Supabase `audit_logs` table.
