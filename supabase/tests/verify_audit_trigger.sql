-- SQL Test: Verify trg_audit_case_changes trigger
-- This script performs a test transaction update and verifies an audit log is created.

DO $$
DECLARE
    v_tx_id UUID;
    v_log_count INTEGER;
    v_sender_id VARCHAR := 'test_sender_audit_test';
    v_receiver_id VARCHAR := 'test_receiver_audit_test';
BEGIN
    -- 1. Setup: Create test users
    INSERT INTO users (user_id, name_en, phone, provider, balance)
    VALUES 
    (v_sender_id, 'Test Sender Audit', '01711111111', 'bKash', 1000.00),
    (v_receiver_id, 'Test Receiver Audit', '01722222222', 'bKash', 500.00)
    ON CONFLICT (user_id) DO UPDATE SET balance = 1000.00;

    -- 2. Setup: Create a test transaction
    INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, old_balance_orig, new_balance_orig, old_balance_dest, new_balance_dest, status)
    VALUES (v_sender_id, v_receiver_id, 100.00, 'TRANSFER', 1000.00, 900.00, 500.00, 600.00, 'PENDING')
    RETURNING transaction_id INTO v_tx_id;

    RAISE NOTICE 'Created test transaction: %', v_tx_id;

    -- 3. Action: Update the transaction status
    UPDATE transactions SET status = 'COMPLETED' WHERE transaction_id = v_tx_id;

    -- 4. Verification: Check audit_logs
    SELECT count(*) INTO v_log_count FROM audit_logs 
    WHERE action_type = 'CASE_STATUS_CHANGE' 
    AND resource_id = v_tx_id::TEXT
    AND metadata->>'new_status' = 'COMPLETED';

    IF v_log_count = 0 THEN
        RAISE EXCEPTION 'FAIL: Audit log was not created for transaction status change!';
    ELSE
        RAISE NOTICE 'PASS: Audit log verified successfully for transaction status change. (Count: %)', v_log_count;
    END IF;

    -- 5. Cleanup
    DELETE FROM audit_logs WHERE resource_id = v_tx_id::TEXT;
    DELETE FROM transactions WHERE transaction_id = v_tx_id;
    DELETE FROM users WHERE user_id IN (v_sender_id, v_receiver_id);
    
    RAISE NOTICE 'Cleanup complete.';
END $$;
