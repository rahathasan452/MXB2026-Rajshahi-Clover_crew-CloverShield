-- Migration: Allow users to insert their own profile
-- This is a fallback in case the signup trigger fails or is slow
-- Run this to allow the client to self-heal missing profiles

BEGIN;

CREATE POLICY "Users can insert own profile"
    ON users
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

COMMIT;
