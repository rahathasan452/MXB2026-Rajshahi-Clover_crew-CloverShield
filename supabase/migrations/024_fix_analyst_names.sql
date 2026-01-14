-- Migration: Fix user_id schema and populate analysts
-- This fixes the issue where Analyst names are not resolving because:
-- 1. users.user_id was too short (VARCHAR 20) to hold Auth UUIDs
-- 2. Analysts were not copied from auth.users to public.users

BEGIN;

-- 1. Relax Provider Check Constraint to allow 'System' users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_provider_check;
ALTER TABLE users ADD CONSTRAINT users_provider_check 
  CHECK (provider IN ('bKash', 'Nagad', 'Rocket', 'Upay', 'System', 'Auth'));

-- 2. Drop Foreign Keys (referencing users.user_id)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_sender_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_receiver_id_fkey;
ALTER TABLE flagged_accounts DROP CONSTRAINT IF EXISTS flagged_accounts_user_id_fkey;
ALTER TABLE analyst_actions DROP CONSTRAINT IF EXISTS analyst_actions_user_id_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_user_id_fkey;

-- 3. Widen user_id columns to TEXT to support UUIDs
ALTER TABLE users ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN sender_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN receiver_id TYPE TEXT;
ALTER TABLE flagged_accounts ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE analyst_actions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE cases ALTER COLUMN user_id TYPE TEXT;

-- 4. Re-establish Foreign Keys
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

-- 5. Backfill Analysts from auth.users to public.users
-- This ensures getAnalystNames() finds a name for the UUID
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
    -- Use metadata name, or email username, or full email, or fallback
    COALESCE(
      au.raw_user_meta_data->>'name', 
      au.raw_user_meta_data->>'full_name',
      split_part(au.email, '@', 1),
      'Analyst'
    ),
    COALESCE(au.phone, 'N/A'),
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
