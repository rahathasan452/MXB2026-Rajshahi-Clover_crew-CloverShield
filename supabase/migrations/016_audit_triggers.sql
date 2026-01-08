-- CloverShield Supabase Migration
-- Audit Logging Triggers
-- Migration ID: 016_audit_triggers.sql

-- ============================================================================
-- 1. AUTO LOG CASE CHANGES TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_log_case_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status VARCHAR;
    v_new_status VARCHAR;
    v_analyst VARCHAR;
BEGIN
    -- Only proceed if status has changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        v_old_status := OLD.status;
        v_new_status := NEW.status;
        v_analyst := COALESCE(NEW.analyst_id, 'System/AI');

        -- Log to audit_logs
        INSERT INTO audit_logs (
            user_id, -- Might be NULL if triggered by system background process
            action_type,
            resource_type,
            resource_id,
            human_readable_message,
            metadata
        ) VALUES (
            auth.uid(), -- Capture the user who triggered the update
            'CASE_STATUS_CHANGE',
            'transaction',
            NEW.transaction_id::TEXT,
            FORMAT('Transaction %s status changed from %s to %s', NEW.transaction_id, v_old_status, v_new_status),
            jsonb_build_object(
                'old_status', v_old_status,
                'new_status', v_new_status,
                'analyst_id', NEW.analyst_id,
                'amount', NEW.amount
            )
        );
    END IF;

    -- Also log if an analyst takes ownership (analyst_id changes)
    IF (OLD.analyst_id IS DISTINCT FROM NEW.analyst_id AND NEW.analyst_id IS NOT NULL) THEN
        INSERT INTO audit_logs (
            user_id,
            action_type,
            resource_type,
            resource_id,
            human_readable_message,
            metadata
        ) VALUES (
            auth.uid(),
            'CASE_ASSIGNMENT',
            'transaction',
            NEW.transaction_id::TEXT,
            FORMAT('Transaction %s assigned to analyst %s', NEW.transaction_id, NEW.analyst_id),
            jsonb_build_object('assigned_to', NEW.analyst_id)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to transactions table
DROP TRIGGER IF EXISTS trg_audit_case_changes ON transactions;

CREATE TRIGGER trg_audit_case_changes
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_case_changes();
