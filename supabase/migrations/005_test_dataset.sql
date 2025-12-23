-- CloverShield Supabase Migration
-- Test Dataset Table Creation
-- This table stores the test dataset CSV data for transaction simulation

-- ============================================================================
-- TEST_DATASET TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_dataset (
    -- Primary Key (using row number or composite key)
    id SERIAL PRIMARY KEY,
    
    -- Transaction Details (matching CSV headers exactly: step,type,amount,nameOrig,oldBalanceOrig,newBalanceOrig,nameDest,oldBalanceDest,newBalanceDest,isFlaggedFraud)
    step INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CASH_OUT', 'TRANSFER', 'CASH_IN', 'PAYMENT', 'DEBIT')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    
    -- Column names must match CSV exactly: nameOrig, oldBalanceOrig, newBalanceOrig, nameDest, oldBalanceDest, newBalanceDest, isFlaggedFraud
    nameOrig VARCHAR(50) NOT NULL,
    oldBalanceOrig DECIMAL(15, 2) NOT NULL CHECK (oldBalanceOrig >= 0),
    newBalanceOrig DECIMAL(15, 2) NOT NULL CHECK (newBalanceOrig >= 0),
    nameDest VARCHAR(50) NOT NULL,
    oldBalanceDest DECIMAL(15, 2) NOT NULL CHECK (oldBalanceDest >= 0),
    newBalanceDest DECIMAL(15, 2) NOT NULL CHECK (newBalanceDest >= 0),
    isFlaggedFraud INTEGER NOT NULL CHECK (isFlaggedFraud IN (0, 1)),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_sender_receiver_different CHECK (nameOrig != nameDest)
);

-- Indexes for test_dataset table
CREATE INDEX IF NOT EXISTS idx_test_dataset_nameOrig ON test_dataset(nameOrig);
CREATE INDEX IF NOT EXISTS idx_test_dataset_nameDest ON test_dataset(nameDest);
CREATE INDEX IF NOT EXISTS idx_test_dataset_type ON test_dataset(type);
CREATE INDEX IF NOT EXISTS idx_test_dataset_sender_receiver ON test_dataset(nameOrig, nameDest);
CREATE INDEX IF NOT EXISTS idx_test_dataset_step ON test_dataset(step);

-- Composite index for efficient sender-receiver lookups
CREATE INDEX IF NOT EXISTS idx_test_dataset_sender_receiver_step ON test_dataset(nameOrig, nameDest, step DESC);

-- ============================================================================
-- TRANSACTION HISTORY TABLE
-- ============================================================================
-- This table stores transaction history from test dataset simulations

CREATE TABLE IF NOT EXISTS transaction_history (
    -- Primary Key
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction Details
    sender_id VARCHAR(50) NOT NULL,  -- nameOrig from test_dataset
    receiver_id VARCHAR(50) NOT NULL,  -- nameDest from test_dataset
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('CASH_OUT', 'TRANSFER', 'CASH_IN', 'PAYMENT', 'DEBIT')),
    
    -- Balance States (from test_dataset)
    old_balance_orig DECIMAL(15, 2) NOT NULL CHECK (old_balance_orig >= 0),
    new_balance_orig DECIMAL(15, 2) NOT NULL CHECK (new_balance_orig >= 0),
    old_balance_dest DECIMAL(15, 2) NOT NULL CHECK (old_balance_dest >= 0),
    new_balance_dest DECIMAL(15, 2) NOT NULL CHECK (new_balance_dest >= 0),
    
    -- Time Information
    step INTEGER,
    hour INTEGER CHECK (hour >= 0 AND hour < 24),
    transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ML Model Results
    fraud_probability DECIMAL(5, 4) CHECK (fraud_probability >= 0 AND fraud_probability <= 1),
    fraud_decision VARCHAR(10) CHECK (fraud_decision IN ('pass', 'warn', 'block')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    model_confidence DECIMAL(5, 4) CHECK (model_confidence >= 0 AND model_confidence <= 1),
    
    -- Transaction Status
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'BLOCKED', 'REVIEW', 'FAILED')),
    
    -- Source tracking
    is_test_data BOOLEAN NOT NULL DEFAULT TRUE,
    test_dataset_id INTEGER REFERENCES test_dataset(id) ON DELETE SET NULL,
    
    -- Optional Metadata
    note TEXT,
    
    -- Constraints
    CONSTRAINT check_sender_receiver_different_history CHECK (sender_id != receiver_id)
);

-- Indexes for transaction_history table
CREATE INDEX IF NOT EXISTS idx_transaction_history_sender ON transaction_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_receiver ON transaction_history(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON transaction_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_history_status ON transaction_history(status);
CREATE INDEX IF NOT EXISTS idx_transaction_history_fraud_decision ON transaction_history(fraud_decision);
CREATE INDEX IF NOT EXISTS idx_transaction_history_is_test_data ON transaction_history(is_test_data);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE test_dataset IS 'Test dataset CSV data for transaction simulation';
COMMENT ON TABLE transaction_history IS 'Transaction history from test dataset simulations with ML predictions';

