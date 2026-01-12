-- Migration: Create cases table for investigation management

-- Create ENUMs for better data integrity
DO $$ BEGIN
    CREATE TYPE case_status AS ENUM ('Open', 'Investigating', 'Resolved', 'False Positive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_priority AS ENUM ('High', 'Medium', 'Low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Target Entity (Link to User OR Transaction)
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    
    -- Case Details
    status case_status NOT NULL DEFAULT 'Open',
    priority case_priority NOT NULL DEFAULT 'Medium',
    
    -- Assignment
    -- Referencing auth.users to ensure the analyst exists and is a valid system user
    analyst_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Must target at least one entity
    CONSTRAINT check_case_target CHECK (user_id IS NOT NULL OR transaction_id IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_analyst ON cases(analyst_id);
CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_transaction ON cases(transaction_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();