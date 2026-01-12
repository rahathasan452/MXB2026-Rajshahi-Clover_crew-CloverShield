-- Migration: Relax foreign key constraints on cases table to allow simulation data
-- This allows cases to be created for users/transactions that might not exist in the strict primary tables (e.g. from transaction_history)

ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_transaction_id_fkey;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_user_id_fkey;
