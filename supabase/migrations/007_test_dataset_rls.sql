-- CloverShield Supabase Migration
-- Fix RLS for Test Dataset and Transaction History
-- This ensures the Customer 360 view can access test dataset users

-- ============================================================================
-- TEST DATASET RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE test_dataset ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated and anonymous) for demo purposes
-- This is required for the Customer 360 view to find users in the test dataset
CREATE POLICY "Allow public read access to test_dataset"
    ON test_dataset
    FOR SELECT
    USING (true);

-- ============================================================================
-- TRANSACTION HISTORY RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for demo purposes
CREATE POLICY "Allow public read access to transaction_history"
    ON transaction_history
    FOR SELECT
    USING (true);

-- Allow service role to insert/update (for simulation)
CREATE POLICY "Service role can manage transaction_history"
    ON transaction_history
    FOR ALL
    USING (auth.role() = 'service_role');
