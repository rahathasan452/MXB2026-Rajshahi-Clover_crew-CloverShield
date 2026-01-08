-- Create Model Registry table
CREATE TABLE IF NOT EXISTS public.model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT,
    status TEXT NOT NULL DEFAULT 'training', -- 'training', 'ready', 'failed'
    metrics JSONB, -- Stores {accuracy, f1, precision, recall}
    file_path TEXT, -- Path to .pkl file relative to Models/ dir
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.model_registry ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow all authenticated users to read
CREATE POLICY "Allow authenticated read access" ON public.model_registry
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create Policy: Allow all authenticated users to insert (training start)
CREATE POLICY "Allow authenticated insert access" ON public.model_registry
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create Policy: Allow all authenticated users to update (training complete/activate)
CREATE POLICY "Allow authenticated update access" ON public.model_registry
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create index for faster active model lookup
CREATE INDEX idx_model_registry_active ON public.model_registry(is_active) WHERE is_active = TRUE;

-- Function to ensure only one active model
CREATE OR REPLACE FUNCTION public.ensure_single_active_model()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE public.model_registry
        SET is_active = FALSE
        WHERE id != NEW.id AND is_active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for single active model
CREATE TRIGGER trigger_ensure_single_active_model
BEFORE INSERT OR UPDATE ON public.model_registry
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_model();
