-- CloverShield Supabase Migration
-- Workflow Updates: Investigation Queue & Seeding
-- Corresponds to Optimized Tasks 01 & 02

-- 1. Create a View for the "Priority Inbox" (Investigative Queue)
-- This combines live transactions and test history into one unified work queue
CREATE OR REPLACE VIEW view_investigation_queue AS
SELECT 
    transaction_id,
    transaction_timestamp as created_at,
    amount,
    transaction_type,
    sender_id,
    receiver_id,
    fraud_probability,
    risk_level,
    fraud_decision,
    status,
    is_test_data
FROM transaction_history
WHERE 
    (status IN ('REVIEW', 'PENDING') AND fraud_decision IN ('warn', 'block'))
    OR
    (fraud_probability > 0.3 AND status = 'PENDING');

-- 2. Database Function to "Seed" the Queue (Replaces the Python script)
-- This allows you to click a button in the UI to generate work items instantly
CREATE OR REPLACE FUNCTION seed_investigation_queue(limit_count INTEGER DEFAULT 10)
RETURNS VOID AS $$
BEGIN
    -- Insert high-risk items from test_dataset into transaction_history
    INSERT INTO transaction_history (
        sender_id, receiver_id, amount, transaction_type, 
        old_balance_orig, new_balance_orig, old_balance_dest, new_balance_dest,
        step, transaction_timestamp,
        fraud_probability, fraud_decision, risk_level, model_confidence,
        status, is_test_data
    )
    SELECT 
        nameOrig, nameDest, amount, type,
        oldBalanceOrig, newBalanceOrig, oldBalanceDest, newBalanceDest,
        step, NOW(),
        0.85, 'warn', 'high', 0.90, -- Simulate model output
        'REVIEW', TRUE
    FROM test_dataset
    WHERE isFlaggedFraud = 1 OR amount > 200000
    ORDER BY step DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to Process a Queue Item (Approve/Block)
CREATE OR REPLACE FUNCTION process_investigation_item(
    p_transaction_id UUID,
    p_decision VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE transaction_history
    SET 
        status = CASE 
            WHEN p_decision = 'APPROVE' THEN 'COMPLETED'
            WHEN p_decision = 'BLOCK' THEN 'BLOCKED'
            ELSE status
        END,
        note = CASE 
            WHEN p_decision = 'APPROVE' THEN 'Approved by Analyst'
            WHEN p_decision = 'BLOCK' THEN 'Blocked by Analyst'
            ELSE note
        END
    WHERE transaction_id = p_transaction_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
