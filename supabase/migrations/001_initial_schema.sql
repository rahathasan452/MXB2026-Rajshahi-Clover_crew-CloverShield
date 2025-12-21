-- CloverShield Supabase Migration
-- Initial Schema Creation
-- Run this in Supabase SQL Editor after creating your project

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    -- Primary Key
    user_id VARCHAR(20) PRIMARY KEY,
    
    -- Identity Information
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100),
    phone VARCHAR(20) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('bKash', 'Nagad', 'Rocket', 'Upay')),
    
    -- Account Status
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    account_age_days INTEGER NOT NULL DEFAULT 0 CHECK (account_age_days >= 0),
    
    -- Transaction Statistics
    total_transactions INTEGER NOT NULL DEFAULT 0 CHECK (total_transactions >= 0),
    avg_transaction_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (avg_transaction_amount >= 0),
    
    -- Verification Status
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_complete BOOLEAN NOT NULL DEFAULT FALSE,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'suspicious')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_transaction_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_risk_level ON users(risk_level);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    -- Primary Key
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction Details
    sender_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    receiver_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('CASH_OUT', 'TRANSFER', 'CASH_IN', 'PAYMENT', 'DEBIT')),
    
    -- Balance States (snapshot at transaction time)
    old_balance_orig DECIMAL(15, 2) NOT NULL CHECK (old_balance_orig >= 0),
    new_balance_orig DECIMAL(15, 2) NOT NULL CHECK (new_balance_orig >= 0),
    old_balance_dest DECIMAL(15, 2) NOT NULL CHECK (old_balance_dest >= 0),
    new_balance_dest DECIMAL(15, 2) NOT NULL CHECK (new_balance_dest >= 0),
    
    -- Time Information
    step INTEGER,  -- Time step for ML model
    hour INTEGER CHECK (hour >= 0 AND hour < 24),
    transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ML Model Results
    fraud_probability DECIMAL(5, 4) CHECK (fraud_probability >= 0 AND fraud_probability <= 1),
    fraud_decision VARCHAR(10) CHECK (fraud_decision IN ('pass', 'warn', 'block')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    model_confidence DECIMAL(5, 4) CHECK (model_confidence >= 0 AND model_confidence <= 1),
    
    -- Transaction Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'BLOCKED', 'REVIEW', 'FAILED')),
    
    -- Optional Metadata
    note TEXT,
    analyst_id VARCHAR(50),  -- ID of analyst who reviewed (if applicable)
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT check_sender_receiver_different CHECK (sender_id != receiver_id)
);

-- Indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_fraud_decision ON transactions(fraud_decision);
CREATE INDEX IF NOT EXISTS idx_transactions_fraud_probability ON transactions(fraud_probability);

-- Composite index for user transaction history queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_history ON transactions(sender_id, transaction_timestamp DESC);

-- ============================================================================
-- 3. TRANSACTION FEATURES TABLE (ML Feature Cache)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_features (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Engineered Features (from feature_engineering.py)
    amount_log1p DECIMAL(15, 6),
    amount_over_old_balance_orig DECIMAL(15, 6),
    type_encoded INTEGER,
    hour INTEGER,
    orig_txn_count INTEGER,
    dest_txn_count INTEGER,
    amt_ratio_to_user_mean DECIMAL(15, 6),
    amt_ratio_to_user_median DECIMAL(15, 6),
    amt_log_ratio_to_user_median DECIMAL(15, 6),
    in_degree INTEGER,
    out_degree INTEGER,
    network_trust DECIMAL(5, 4),
    is_new_origin BOOLEAN,
    is_new_dest BOOLEAN,
    
    -- Metadata
    features_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. SHAP EXPLANATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS shap_explanations (
    explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Feature Contribution
    feature_name VARCHAR(100) NOT NULL,
    feature_value DECIMAL(15, 6),
    shap_value DECIMAL(15, 6),
    shap_abs DECIMAL(15, 6),
    
    -- Ranking
    contribution_rank INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for SHAP explanations
CREATE INDEX IF NOT EXISTS idx_shap_transaction ON shap_explanations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_shap_rank ON shap_explanations(transaction_id, contribution_rank);

-- ============================================================================
-- 5. LLM EXPLANATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS llm_explanations (
    explanation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Explanation Content
    explanation_text TEXT NOT NULL,
    language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'bn')),
    
    -- Metadata
    model_used VARCHAR(50) DEFAULT 'llama-3.1-8b-instant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. ANALYST ACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analyst_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE_CASE', 'FLAG_ACCOUNT', 'REPORT_FRAUD', 'APPROVE', 'REJECT', 'REVIEW')),
    action_data JSONB,  -- Flexible JSON for action-specific data
    
    -- Analyst Information
    analyst_id VARCHAR(50) NOT NULL,
    analyst_name VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analyst actions
CREATE INDEX IF NOT EXISTS idx_analyst_actions_transaction ON analyst_actions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_analyst_actions_user ON analyst_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_analyst_actions_type ON analyst_actions(action_type);

-- ============================================================================
-- 7. FLAGGED ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS flagged_accounts (
    flag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Flag Details
    flag_reason TEXT NOT NULL,
    flag_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    outcome VARCHAR(50) CHECK (outcome IN ('UNDER_REVIEW', 'CLEARED', 'CONFIRMED_FRAUD', 'RESOLVED')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Analyst Information
    flagged_by VARCHAR(50),
    resolved_by VARCHAR(50),
    
    -- Indexes
    CONSTRAINT idx_flagged_accounts_user UNIQUE (user_id, flag_date)
);

CREATE INDEX IF NOT EXISTS idx_flagged_accounts_date ON flagged_accounts(flag_date);

-- ============================================================================
-- 8. ANALYTICS SNAPSHOT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    
    -- Metrics
    money_saved DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    transactions_processed INTEGER NOT NULL DEFAULT 0,
    fraud_detected INTEGER NOT NULL DEFAULT 0,
    accuracy_rate DECIMAL(5, 2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    CONSTRAINT unique_snapshot_date UNIQUE(snapshot_date)
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User account information for mobile banking users';
COMMENT ON TABLE transactions IS 'Transaction records with ML fraud detection results';
COMMENT ON TABLE transaction_features IS 'Engineered ML features cache for transactions';
COMMENT ON TABLE shap_explanations IS 'SHAP feature contributions for explainability';
COMMENT ON TABLE llm_explanations IS 'Human-readable LLM-generated explanations';
COMMENT ON TABLE analyst_actions IS 'Analyst action tracking (cases, flags, reports)';
COMMENT ON TABLE flagged_accounts IS 'Accounts flagged for review';
COMMENT ON TABLE analytics_snapshots IS 'Daily aggregated analytics metrics';

