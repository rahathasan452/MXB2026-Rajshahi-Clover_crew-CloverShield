-- CloverShield Supabase Migration
-- Model Registry Audit Logging
-- Migration ID: 018_model_registry_audit.sql

-- ============================================================================
-- 1. AUTO LOG MODEL REGISTRY CHANGES TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_log_model_registry_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log Insertion (New Model Registered)
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (
            user_id,
            action_type,
            resource_type,
            resource_id,
            human_readable_message,
            metadata
        ) VALUES (
            auth.uid(),
            'MODEL_REGISTERED',
            'model',
            NEW.id::TEXT,
            FORMAT('New model registered: %s (version %s)', NEW.name, NEW.version),
            jsonb_build_object(
                'name', NEW.name,
                'version', NEW.version,
                'status', NEW.status
            )
        );
    -- Log Updates
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Log Status Changes
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO audit_logs (
                user_id,
                action_type,
                resource_type,
                resource_id,
                human_readable_message,
                metadata
            ) VALUES (
                auth.uid(),
                'MODEL_STATUS_CHANGE',
                'model',
                NEW.id::TEXT,
                FORMAT('Model %s status changed from %s to %s', NEW.name, OLD.status, NEW.status),
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;

        -- Log Activation/Deactivation
        IF (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
            INSERT INTO audit_logs (
                user_id,
                action_type,
                resource_type,
                resource_id,
                human_readable_message,
                metadata
            ) VALUES (
                auth.uid(),
                'MODEL_ACTIVATION_CHANGE',
                'model',
                NEW.id::TEXT,
                FORMAT('Model %s is now %s', NEW.name, CASE WHEN NEW.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END),
                jsonb_build_object(
                    'is_active', NEW.is_active
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to model_registry table
DROP TRIGGER IF EXISTS trg_audit_model_registry_changes ON model_registry;

CREATE TRIGGER trg_audit_model_registry_changes
    AFTER INSERT OR UPDATE ON model_registry
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_model_registry_changes();
