-- CloverShield Supabase Migration
-- Auth Integration Helpers
-- Optional: Run this if you want to integrate Supabase Auth with user accounts

-- ============================================================================
-- FUNCTION: Sync Auth Users with Users Table
-- ============================================================================

-- This function creates a user record when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        user_id,
        name_en,
        phone,
        provider,
        balance,
        account_age_days,
        verified,
        kyc_complete,
        risk_level
    )
    VALUES (
        NEW.id::text,  -- Use Supabase auth.uid() as user_id
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        COALESCE(NEW.phone, NEW.email),
        'bKash',  -- Default provider, can be updated later
        0.00,
        0,
        FALSE,
        FALSE,
        'low'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Get User Profile with Auth Info
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id TEXT)
RETURNS TABLE (
    user_id VARCHAR(20),
    name_en VARCHAR(100),
    name_bn VARCHAR(100),
    phone VARCHAR(20),
    provider VARCHAR(50),
    balance DECIMAL(15,2),
    account_age_days INTEGER,
    verified BOOLEAN,
    kyc_complete BOOLEAN,
    risk_level VARCHAR(20),
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.name_en,
        u.name_bn,
        u.phone,
        u.provider,
        u.balance,
        u.account_age_days,
        u.verified,
        u.kyc_complete,
        u.risk_level,
        au.email,
        au.created_at
    FROM public.users u
    LEFT JOIN auth.users au ON au.id::text = u.user_id
    WHERE u.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLICY: Allow users to update their own profile
-- ============================================================================

CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- NOTES
-- ============================================================================

-- This integration assumes:
-- 1. Supabase Auth users' UUID will be used as user_id in users table
-- 2. You'll need to map existing mock user_ids to auth users if migrating
-- 3. Adjust the trigger logic based on your signup flow

-- To use this:
-- 1. Enable Supabase Auth
-- 2. Users sign up via Supabase Auth
-- 3. Trigger automatically creates user record
-- 4. Frontend can query user profile using get_user_profile()

-- For existing mock users, you may need to:
-- 1. Create auth users manually, OR
-- 2. Keep mock users separate from auth users, OR
-- 3. Migrate mock users to auth users with matching IDs

