-- CloverShield Supabase Migration
-- Analyst Workload Statistics
-- Migration ID: 017_analyst_stats.sql

-- ============================================================================
-- 1. ANALYST STATS RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION get_analyst_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_analyst_id VARCHAR;
    v_today DATE := CURRENT_DATE;
    v_result JSON;
BEGIN
    -- Assume the analyst_id stored in transactions matches the auth.uid()
    v_analyst_id := auth.uid()::VARCHAR;

    SELECT json_build_object(
        -- Metric 1: Cases Resolved Today
        'cases_resolved_today', (
            SELECT COUNT(*)
            FROM transactions
            WHERE analyst_id = v_analyst_id
            AND status IN ('BLOCKED', 'COMPLETED', 'FAILED', 'RESOLVED')
            AND date(reviewed_at) = v_today
        ),

        -- Metric 2: Average Resolution Time (in minutes)
        'avg_resolution_time_minutes', (
            SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (reviewed_at - transaction_timestamp)) / 60)::NUMERIC, 1), 0)
            FROM transactions
            WHERE analyst_id = v_analyst_id
            AND reviewed_at IS NOT NULL
        ),

        -- Metric 3: Cases by Status (Current Workload)
        'cases_by_status', (
            SELECT json_object_agg(status, count)
            FROM (
                SELECT status, COUNT(*) as count
                FROM transactions
                WHERE analyst_id = v_analyst_id
                GROUP BY status
            ) t
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;
