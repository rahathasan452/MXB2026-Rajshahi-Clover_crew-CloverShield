-- CloverShield Supabase Migration
-- Recreate Feature Engineered Table for Manual Upload
-- Matches the schema of 'dataset_upload_engineered.csv' exactly (including case-sensitive columns)

DROP TABLE IF EXISTS test_dataset_engineered CASCADE;

CREATE TABLE test_dataset_engineered (
    id SERIAL PRIMARY KEY,
    
    -- ID Columns
    "nameOrig" VARCHAR(50),
    "nameDest" VARCHAR(50),
    "isFraud" INTEGER,
    
    -- Raw Numeric Columns
    step INTEGER,
    amount DOUBLE PRECISION,
    "oldBalanceOrig" DOUBLE PRECISION,
    "newBalanceOrig" DOUBLE PRECISION,
    "oldBalanceDest" DOUBLE PRECISION,
    "newBalanceDest" DOUBLE PRECISION,
    
    -- Engineered Features
    hour INTEGER,
    orig_txn_count INTEGER,
    dest_txn_count INTEGER,
    
    -- Ratios & Log
    amt_ratio_to_user_mean DOUBLE PRECISION,
    amount_log1p DOUBLE PRECISION,
    "amount_over_oldBalanceOrig" DOUBLE PRECISION, -- Quoted to preserve camelCase matching CSV
    amt_ratio_to_user_median DOUBLE PRECISION,
    amt_log_ratio_to_user_median DOUBLE PRECISION,
    
    -- Graph Features
    in_degree DOUBLE PRECISION,
    out_degree DOUBLE PRECISION,
    network_trust DOUBLE PRECISION, -- PageRank
    
    -- Flags
    is_new_origin INTEGER,
    is_new_dest INTEGER,
    type_encoded INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_eng_nameOrig ON test_dataset_engineered("nameOrig");
CREATE INDEX idx_eng_isFraud ON test_dataset_engineered("isFraud");

-- RLS
ALTER TABLE test_dataset_engineered ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON test_dataset_engineered FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON test_dataset_engineered FOR ALL USING (auth.role() = 'service_role');
