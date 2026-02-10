-- ============================================================
-- FIX EVENTS TABLE - Add missing columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- Check current structure of events table
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events';

-- Add event_date column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_date DATE;

-- Add start_time column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS start_time TIME;

-- Add end_time column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add location column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add is_recurring column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurrence_pattern column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

-- Add created_by column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add hierarchy columns
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS priestship_id UUID REFERENCES priestships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS eldership_id UUID REFERENCES elderships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS overseership_id UUID REFERENCES overseerships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS apostleship_id UUID REFERENCES apostleship(id) ON DELETE SET NULL;

-- Add timestamps if they don't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on event_date for ordering
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- ============================================================
-- If you have existing events with a different date column,
-- you can copy the data like this (uncomment and modify):
-- ============================================================
-- UPDATE events SET event_date = date::DATE WHERE event_date IS NULL AND date IS NOT NULL;
-- UPDATE events SET event_date = start_date::DATE WHERE event_date IS NULL AND start_date IS NOT NULL;

-- ============================================================
-- Verify the changes
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position;
