-- Migration: Enable RLS and policies for cases table

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Policy: Analysts (authenticated users) and Service Role can view all cases
CREATE POLICY "Authenticated users and service role can view cases"
    ON cases
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Analysts (authenticated users) and Service Role can create cases
CREATE POLICY "Authenticated users and service role can create cases"
    ON cases
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Analysts (authenticated users) and Service Role can update cases
CREATE POLICY "Authenticated users and service role can update cases"
    ON cases
    FOR UPDATE
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Service role can delete cases (optional, usually cases are not deleted but resolved)
CREATE POLICY "Service role can delete cases"
    ON cases
    FOR DELETE
    USING (auth.role() = 'service_role');
