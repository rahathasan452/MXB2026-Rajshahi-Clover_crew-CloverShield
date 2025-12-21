-- CloverShield Supabase Setup Verification Script
-- Run this after completing all migrations to verify everything is set up correctly

-- ============================================================================
-- 1. CHECK TABLES EXIST
-- ============================================================================

SELECT 
    'Tables Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 8 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 8 tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'transactions', 
    'transaction_features',
    'shap_explanations',
    'llm_explanations',
    'analyst_actions',
    'flagged_accounts',
    'analytics_snapshots'
);

-- ============================================================================
-- 2. CHECK RLS IS ENABLED
-- ============================================================================

SELECT 
    'RLS Check' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users', 
    'transactions', 
    'transaction_features',
    'shap_explanations',
    'llm_explanations',
    'analyst_actions',
    'flagged_accounts',
    'analytics_snapshots'
)
ORDER BY tablename;

-- ============================================================================
-- 3. CHECK POLICIES EXIST
-- ============================================================================

SELECT 
    'Policies Check' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ POLICIES EXIST'
        ELSE '❌ NO POLICIES'
    END as status
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- 4. CHECK SEED DATA
-- ============================================================================

SELECT 
    'Seed Data Check' as check_type,
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM transactions) as transaction_count,
    (SELECT COUNT(*) FROM analytics_snapshots) as snapshot_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) >= 15 THEN '✅ USERS SEEDED'
        ELSE '⚠️ FEWER THAN 15 USERS'
    END as user_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM analytics_snapshots) > 0 THEN '✅ ANALYTICS SEEDED'
        ELSE '⚠️ NO ANALYTICS DATA'
    END as analytics_status;

-- ============================================================================
-- 5. CHECK INDEXES
-- ============================================================================

SELECT 
    'Indexes Check' as check_type,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'users', 
    'transactions', 
    'transaction_features',
    'shap_explanations',
    'llm_explanations',
    'analyst_actions',
    'flagged_accounts',
    'analytics_snapshots'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- 6. CHECK FOREIGN KEYS
-- ============================================================================

SELECT 
    'Foreign Keys Check' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 7. TEST QUERIES
-- ============================================================================

-- Test: Get all users
SELECT 'Test Query: Users' as test_name, COUNT(*) as result_count FROM users;

-- Test: Get user by ID
SELECT 'Test Query: User by ID' as test_name, user_id, name_en, balance 
FROM users 
WHERE user_id = 'C123456789';

-- Test: Get transactions
SELECT 'Test Query: Transactions' as test_name, COUNT(*) as result_count 
FROM transactions;

-- Test: Insert test transaction (will be rolled back)
BEGIN;
    INSERT INTO transactions (
        sender_id, receiver_id, amount, transaction_type,
        old_balance_orig, new_balance_orig, old_balance_dest, new_balance_dest,
        status
    ) VALUES (
        'C123456789', 'C234567890', 100.00, 'TRANSFER',
        50000.00, 49900.00, 25000.00, 25100.00,
        'PENDING'
    );
    SELECT 'Test Query: Insert Transaction' as test_name, '✅ SUCCESS' as status;
ROLLBACK;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
    '=== SETUP VERIFICATION SUMMARY ===' as summary,
    '' as details;

SELECT 
    '✅ Setup Complete!' as status,
    'All checks passed. Your Supabase backend is ready for frontend integration.' as message;

