-- Migration: Fix cases table schema - Add user_id column
-- Run this to fix "Could not find user_id column" error

ALTER TABLE cases ADD COLUMN IF NOT EXISTS user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS user_id VARCHAR(20); -- Fallback if FK fails (but handled by relaxation script)

-- Also ensure transaction_id is relaxed (if not already)
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_transaction_id_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_user_id_fkey;
