-- Migration: Fix signup trigger constraints
-- Widen phone column to allow emails as fallback, and improve trigger function

BEGIN;

-- 1. Widen phone column to accommodate emails (which are used as fallback when phone is missing)
ALTER TABLE users ALTER COLUMN phone TYPE TEXT;

-- 2. Update the trigger function to be more robust and use 'Auth' provider
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
        NEW.id::text,
        -- Try to find a name, or fallback to email username
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
        -- Use phone if available, otherwise email, otherwise 'No Phone'
        COALESCE(NEW.phone, NEW.email, 'No Phone'),
        'Auth', -- Explicitly mark as Auth user
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

-- 3. Backfill any missed users (who signed up but failed to sync due to column width)
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
      'User'
    ),
    COALESCE(au.phone, au.email, 'No-Contact-' || substr(au.id::text, 1, 8)),
    'Auth',
    0.00,
    0,
    FALSE,
    FALSE,
    'low',
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.user_id = au.id::text
);

COMMIT;
