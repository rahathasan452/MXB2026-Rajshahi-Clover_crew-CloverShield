-- CloverShield Supabase Migration
-- Seed Data (Mock Users from mock_data.py)
-- Run this after 001_initial_schema.sql and 002_rls_policies.sql

-- ============================================================================
-- INSERT MOCK USERS
-- ============================================================================

INSERT INTO users (user_id, name_en, name_bn, phone, provider, balance, account_age_days, total_transactions, avg_transaction_amount, verified, kyc_complete, risk_level) VALUES
('C123456789', 'Abdul Rahman', 'আব্দুল রহমান', '+8801712345678', 'bKash', 50000.00, 450, 125, 3500.00, TRUE, TRUE, 'low'),
('C234567890', 'Fatima Begum', 'ফাতিমা বেগম', '+8801812345678', 'Nagad', 25000.00, 320, 89, 2800.00, TRUE, TRUE, 'low'),
('C345678901', 'Karim Uddin', 'করিম উদ্দিন', '+8801912345678', 'Rocket', 75000.00, 680, 234, 4200.00, TRUE, TRUE, 'low'),
('C456789012', 'Rashida Khatun', 'রাশিদা খাতুন', '+8801612345678', 'Upay', 15000.00, 120, 45, 2200.00, TRUE, FALSE, 'medium'),
('C567890123', 'Hasan Ali', 'হাসান আলী', '+8801712345679', 'bKash', 30000.00, 89, 12, 5000.00, FALSE, FALSE, 'medium'),
('C678901234', 'Ayesha Sultana', 'আয়েশা সুলতানা', '+8801812345679', 'Nagad', 8000.00, 45, 8, 1500.00, FALSE, FALSE, 'high'),
('C789012345', 'Mohammad Hossain', 'মোহাম্মদ হোসেন', '+8801912345679', 'Rocket', 120000.00, 890, 456, 3800.00, TRUE, TRUE, 'low'),
('C890123456', 'Nusrat Jahan', 'নুসরাত জাহান', '+8801612345679', 'Upay', 18000.00, 200, 67, 3200.00, TRUE, TRUE, 'low'),
('C901234567', 'Shahidul Islam', 'শাহিদুল ইসলাম', '+8801712345680', 'bKash', 22000.00, 156, 34, 4500.00, TRUE, FALSE, 'medium'),
('C012345678', 'Rokeya Begum', 'রোকেয়া বেগম', '+8801812345680', 'Nagad', 35000.00, 567, 178, 2900.00, TRUE, TRUE, 'low'),
('C111222333', 'Kamal Ahmed', 'কামাল আহমেদ', '+8801912345680', 'Rocket', 5000.00, 23, 5, 2000.00, FALSE, FALSE, 'suspicious'),
('C222333444', 'Salma Akter', 'সালমা আক্তার', '+8801612345680', 'Upay', 95000.00, 720, 312, 4100.00, TRUE, TRUE, 'low'),
('C333444555', 'Rafiqul Islam', 'রফিকুল ইসলাম', '+8801712345681', 'bKash', 28000.00, 234, 78, 3600.00, TRUE, TRUE, 'low'),
('C444555666', 'Jahanara Begum', 'জাহানারা বেগম', '+8801812345681', 'Nagad', 42000.00, 389, 145, 3300.00, TRUE, TRUE, 'low'),
('C555666777', 'Tariqul Hasan', 'তারিকুল হাসান', '+8801912345681', 'Rocket', 15000.00, 67, 15, 2800.00, FALSE, FALSE, 'high')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- INSERT SAMPLE TRANSACTION HISTORY (Optional - for testing)
-- ============================================================================

-- Sample transactions for user C123456789
INSERT INTO transactions (
    sender_id, receiver_id, amount, transaction_type,
    old_balance_orig, new_balance_orig, old_balance_dest, new_balance_dest,
    step, hour, status, fraud_probability, fraud_decision, risk_level
) VALUES
('C123456789', 'C234567890', 3000.00, 'TRANSFER', 50000.00, 47000.00, 25000.00, 28000.00, 1, 14, 'COMPLETED', 0.15, 'pass', 'low'),
('C123456789', 'C345678901', 5000.00, 'CASH_OUT', 47000.00, 42000.00, 75000.00, 75000.00, 2, 16, 'COMPLETED', 0.12, 'pass', 'low'),
('C234567890', 'C123456789', 2000.00, 'TRANSFER', 25000.00, 23000.00, 42000.00, 44000.00, 3, 10, 'COMPLETED', 0.18, 'pass', 'low')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT INITIAL ANALYTICS SNAPSHOT
-- ============================================================================

INSERT INTO analytics_snapshots (snapshot_date, money_saved, transactions_processed, fraud_detected, accuracy_rate)
VALUES (CURRENT_DATE, 2547890.00, 15847, 342, 99.80)
ON CONFLICT (snapshot_date) DO UPDATE SET
    money_saved = EXCLUDED.money_saved,
    transactions_processed = EXCLUDED.transactions_processed,
    fraud_detected = EXCLUDED.fraud_detected,
    accuracy_rate = EXCLUDED.accuracy_rate;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This seed data matches the mock_data.py structure
-- Adjust user_id values if you're integrating with Supabase Auth
-- For production, remove this file or use it only for development

