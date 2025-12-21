-- CloverShield Supabase Migration
-- Row Level Security (RLS) Policies
-- Run this after 001_initial_schema.sql

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE shap_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Policy: Service role can read all users (for transaction processing)
CREATE POLICY "Service role can read all users"
    ON users
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read all users (for transaction simulator)
-- Note: Adjust this based on your security requirements
CREATE POLICY "Authenticated users can read all users"
    ON users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Service role can update user balances
CREATE POLICY "Service role can update users"
    ON users
    FOR UPDATE
    USING (auth.role() = 'service_role');

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own transactions (as sender or receiver)
CREATE POLICY "Users can view own transactions"
    ON transactions
    FOR SELECT
    USING (
        auth.uid()::text = sender_id OR 
        auth.uid()::text = receiver_id OR
        auth.role() = 'service_role'
    );

-- Policy: Service role can insert transactions
CREATE POLICY "Service role can insert transactions"
    ON transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Service role can update transactions
CREATE POLICY "Service role can update transactions"
    ON transactions
    FOR UPDATE
    USING (auth.role() = 'service_role');

-- Policy: Analysts can view all transactions (if you have analyst role)
-- Uncomment and adjust if you have a separate analyst role
-- CREATE POLICY "Analysts can view all transactions"
--     ON transactions
--     FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_roles 
--             WHERE user_id = auth.uid()::text 
--             AND role = 'analyst'
--         )
--     );

-- ============================================================================
-- TRANSACTION FEATURES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view features for their own transactions
CREATE POLICY "Users can view own transaction features"
    ON transaction_features
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.transaction_id = transaction_features.transaction_id
            AND (t.sender_id = auth.uid()::text OR t.receiver_id = auth.uid()::text)
        ) OR auth.role() = 'service_role'
    );

-- Policy: Service role can insert/update features
CREATE POLICY "Service role can manage features"
    ON transaction_features
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- SHAP EXPLANATIONS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view SHAP explanations for their own transactions
CREATE POLICY "Users can view own SHAP explanations"
    ON shap_explanations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.transaction_id = shap_explanations.transaction_id
            AND (t.sender_id = auth.uid()::text OR t.receiver_id = auth.uid()::text)
        ) OR auth.role() = 'service_role'
    );

-- Policy: Service role can insert SHAP explanations
CREATE POLICY "Service role can insert SHAP explanations"
    ON shap_explanations
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- LLM EXPLANATIONS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view LLM explanations for their own transactions
CREATE POLICY "Users can view own LLM explanations"
    ON llm_explanations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.transaction_id = llm_explanations.transaction_id
            AND (t.sender_id = auth.uid()::text OR t.receiver_id = auth.uid()::text)
        ) OR auth.role() = 'service_role'
    );

-- Policy: Service role can insert LLM explanations
CREATE POLICY "Service role can insert LLM explanations"
    ON llm_explanations
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- ANALYST ACTIONS TABLE POLICIES
-- ============================================================================

-- Policy: Analysts can view their own actions
CREATE POLICY "Analysts can view own actions"
    ON analyst_actions
    FOR SELECT
    USING (analyst_id = auth.uid()::text OR auth.role() = 'service_role');

-- Policy: Authenticated users can create analyst actions
-- Note: Adjust based on your authentication requirements
CREATE POLICY "Authenticated users can create actions"
    ON analyst_actions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Service role can manage all actions
CREATE POLICY "Service role can manage all actions"
    ON analyst_actions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- FLAGGED ACCOUNTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view flags on their own account
CREATE POLICY "Users can view own account flags"
    ON flagged_accounts
    FOR SELECT
    USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- Policy: Service role can manage flagged accounts
CREATE POLICY "Service role can manage flagged accounts"
    ON flagged_accounts
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- ANALYTICS SNAPSHOTS TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can view analytics (public metrics)
CREATE POLICY "Authenticated users can view analytics"
    ON analytics_snapshots
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Service role can insert/update analytics
CREATE POLICY "Service role can manage analytics"
    ON analytics_snapshots
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- NOTES
-- ============================================================================

-- IMPORTANT: These policies assume:
-- 1. User IDs in the users table match Supabase auth.uid() values
-- 2. You may need to adjust policies based on your authentication setup
-- 3. For demo/public access, you might want to allow anonymous reads
-- 4. Consider creating a separate 'analyst' role if needed

-- To allow anonymous reads (for demo purposes), you can add:
-- CREATE POLICY "Anonymous can read users"
--     ON users
--     FOR SELECT
--     USING (true);

