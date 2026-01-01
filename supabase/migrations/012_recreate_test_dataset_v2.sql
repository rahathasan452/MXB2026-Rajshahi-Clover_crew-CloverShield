-- CloverShield Supabase Migration
-- Recreate Test Dataset Table for Manual Upload
-- Matches the schema of 'dataset_upload_raw.csv'

DROP TABLE IF EXISTS test_dataset CASCADE;

CREATE TABLE test_dataset (
    id SERIAL PRIMARY KEY,
    step INTEGER,
    type VARCHAR(20),
    amount FLOAT,
    "nameOrig" VARCHAR(50),
    "oldBalanceOrig" FLOAT,
    "newBalanceOrig" FLOAT,
    "nameDest" VARCHAR(50),
    "oldBalanceDest" FLOAT,
    "newBalanceDest" FLOAT,
    "isFraud" INTEGER,
    "isFlaggedFraud" INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_test_dataset_nameOrig ON test_dataset("nameOrig");
CREATE INDEX idx_test_dataset_nameDest ON test_dataset("nameDest");
CREATE INDEX idx_test_dataset_isFraud ON test_dataset("isFraud");

-- RLS
ALTER TABLE test_dataset ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON test_dataset FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON test_dataset FOR ALL USING (auth.role() = 'service_role');
