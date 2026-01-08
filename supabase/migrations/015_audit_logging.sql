-- CloverShield Supabase Migration
-- Audit Logging System
-- Migration ID: 015_audit_logging.sql

-- ============================================================================
-- 1. AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor Information
    user_id UUID DEFAULT auth.uid(), -- Auto-fills with current authenticated user
    user_email VARCHAR(255),         -- Optional: capture email for easier reading
    
    -- Action Details
    action_type VARCHAR(100) NOT NULL, -- e.g., 'CASE_STATUS_CHANGE', 'LOGIN', 'EXPORT_REPORT'
    resource_type VARCHAR(50),         -- e.g., 'transaction', 'user', 'system'
    resource_id VARCHAR(100),          -- ID of the affected resource
    
    -- The Core "Human Readable" Message
    human_readable_message TEXT NOT NULL,
    
    -- Structured Metadata for AI/Filtering
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 2. LOG ACTIVITY RPC
-- ============================================================================
-- Simplifies logging from the frontend or other PL/PGSQL functions

CREATE OR REPLACE FUNCTION log_activity(
    p_action_type VARCHAR,
    p_message TEXT,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to ensure logging always succeeds
AS $$
DECLARE
    v_log_id UUID;
    v_user_email VARCHAR;
BEGIN
    -- Attempt to get user email if available (fails gracefully if not)
    BEGIN
        SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_email := NULL;
    END;

    INSERT INTO audit_logs (
        user_id,
        user_email,
        action_type,
        resource_type,
        resource_id,
        human_readable_message,
        metadata
    ) VALUES (
        auth.uid(),
        v_user_email,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_message,
        p_metadata
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Analysts can VIEW all logs (Transparency)
CREATE POLICY "Analysts can view all audit logs"
    ON audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Analysts can INSERT logs (via RPC or direct)
CREATE POLICY "Analysts can create audit logs"
    ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- No one can UPDATE or DELETE logs (Immutable Audit Trail)
-- (No policies created for UPDATE/DELETE implies default DENY)

COMMENT ON TABLE audit_logs IS 'Immutable registry of all critical system actions for audit and AI analysis';
