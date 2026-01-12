-- Migration: Add checklist_state to cases table

ALTER TABLE cases ADD COLUMN checklist_state JSONB DEFAULT '{}'::jsonb;
