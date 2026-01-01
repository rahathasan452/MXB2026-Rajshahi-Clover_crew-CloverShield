-- CloverShield Supabase Migration
-- Fix RLS for Transaction History to allow frontend inserts/updates
-- Required for Simulator and Investigative Queue

-- ============================================================================
-- TRANSACTION HISTORY RLS FIXES
-- ============================================================================

-- Allow authenticated users (analysts) to insert new transaction history records
-- This is needed for the Simulator to save results
CREATE POLICY "Authenticated users can insert transaction_history"
    ON transaction_history
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update transaction history
-- This is needed for the Investigative Queue (resolving alerts)
CREATE POLICY "Authenticated users can update transaction_history"
    ON transaction_history
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Allow anonymous users to insert (for demo purposes if auth is skipped)
-- Note: In a real prod env, this would be restricted.
CREATE POLICY "Anon users can insert transaction_history"
    ON transaction_history
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anon users can update transaction_history"
    ON transaction_history
    FOR UPDATE
    USING (true);
