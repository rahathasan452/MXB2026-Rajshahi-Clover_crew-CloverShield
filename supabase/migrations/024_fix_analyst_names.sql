-- Migration: Fix user_id schema and populate analysts
-- v3: Fixes Unique Phone Constraint Violation

BEGIN;

-- ============================================================================
-- 1. DROP DEPENDENT POLICIES
-- ============================================================================
-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

-- Flagged Accounts
DROP POLICY IF EXISTS "Users can view own account flags" ON flagged_accounts;

-- Dependencies (Policies on other tables querying transactions)
DROP POLICY IF EXISTS "Users can view own transaction features" ON transaction_features;
DROP POLICY IF EXISTS "Users can view own SHAP explanations" ON shap_explanations;
DROP POLICY IF EXISTS "Users can view own LLM explanations" ON llm_explanations;

-- ============================================================================
-- 2. ALTER COLUMNS
-- ============================================================================

-- Relax Provider Check Constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_provider_check;
ALTER TABLE users ADD CONSTRAINT users_provider_check 
  CHECK (provider IN ('bKash', 'Nagad', 'Rocket', 'Upay', 'System', 'Auth'));

-- Drop Foreign Keys
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_sender_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_receiver_id_fkey;
ALTER TABLE flagged_accounts DROP CONSTRAINT IF EXISTS flagged_accounts_user_id_fkey;
ALTER TABLE analyst_actions DROP CONSTRAINT IF EXISTS analyst_actions_user_id_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_user_id_fkey;

-- Widen user_id columns
ALTER TABLE users ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN sender_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN receiver_id TYPE TEXT;
ALTER TABLE flagged_accounts ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE analyst_actions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE cases ALTER COLUMN user_id TYPE TEXT;

-- ============================================================================
-- 2.5 CLEANUP ORPHANS (Fixes 23503 Violation)
-- ============================================================================
-- Delete cases where the user_id does not exist in the users table relative to old schema
-- NOTE: Since we are widening types, we don't strictly *need* to delete if the ID format was the only issue,
-- but the error showed strictly missing keys. Best to clean up consistency.

DELETE FROM cases WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT user_id FROM users);
DELETE FROM flagged_accounts WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT user_id FROM users);
DELETE FROM transactions WHERE sender_id NOT IN (SELECT user_id FROM users);
DELETE FROM transactions WHERE receiver_id NOT IN (SELECT user_id FROM users);

-- ============================================================================
-- 3. RE-ESTABLISH FOREIGN KEYS
-- ============================================================================
ALTER TABLE transactions 
  ADD CONSTRAINT transactions_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(user_id);
ALTER TABLE transactions 
  ADD CONSTRAINT transactions_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(user_id);
ALTER TABLE flagged_accounts 
  ADD CONSTRAINT flagged_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE analyst_actions 
  ADD CONSTRAINT analyst_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE cases 
  ADD CONSTRAINT cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- ============================================================================
-- 4. RECREATE POLICIES
-- ============================================================================

-- Users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        auth.uid()::text = sender_id OR 
        auth.uid()::text = receiver_id OR
        auth.role() = 'service_role'
    );

-- Flagged Accounts
CREATE POLICY "Users can view own account flags" ON flagged_accounts
    FOR SELECT USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- Transaction Features
CREATE POLICY "Users can view own transaction features" ON transaction_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.transaction_id = transaction_features.transaction_id
            AND (t.sender_id = auth.uid()::text OR t.receiver_id = auth.uid()::text)
        ) OR auth.role() = 'service_role'
    );

-- SHAP Explanations
CREATE POLICY "Users can view own SHAP explanations" ON shap_explanations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.transaction_id = shap_explanations.transaction_id
            AND (t.sender_id = auth.uid()::text OR t.receiver_id = auth.uid()::text)
        ) OR auth.role() = 'service_role'
    );

-- LLM Explanations
CREATE POLICY "Users can view own LLM explanations" ON llm_explanations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.transaction_id = llm_explanations.transaction_id
            AND (t.sender_id = auth.uid()::text OR t.receiver_id = auth.uid()::text)
        ) OR auth.role() = 'service_role'
    );

-- ============================================================================
-- 5. BACKFILL ANALYSTS
-- ============================================================================

-- We insert auth users into public.users so they can be referenced by cases/analyst names.
-- To satisfy the UNIQUE constraint on 'phone', we generate a unique pseudo-phone for analysts.

INSERT INTO public.users (
    user_id,
    name_en,
    phone,
    provider,
    balance,
    account_age_days,
    verified,
    kyc_complete,
    risk_level,
    created_at,
    updated_at
)
SELECT 
    au.id::text,
    COALESCE(
      au.raw_user_meta_data->>'name', 
      au.raw_user_meta_data->>'full_name',
      split_part(au.email, '@', 1),
      'Analyst'
    ),
    -- FIX: Use a unique fallback for phone instead of 'N/A'
    -- 'Sys-' + first 12 chars of UUID (Sys-12345678-abc) fits in VARCHAR(20)
    COALESCE(au.phone, 'Sys-' || substr(au.id::text, 1, 12)),
    'System',
    0.00,
    0,
    TRUE,
    TRUE,
    'low',
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.user_id = au.id::text
);

COMMIT;
