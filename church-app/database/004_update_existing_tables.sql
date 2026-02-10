-- ============================================================
-- UPDATE EXISTING TABLES TO MATCH NEW HIERARCHY
-- Run this to add the new columns to your existing tables
-- ============================================================

-- Add hierarchy columns to EVENTS table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS priestship_id UUID REFERENCES priestships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS eldership_id UUID REFERENCES elderships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS overseership_id UUID REFERENCES overseerships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS apostleship_id UUID REFERENCES apostleship(id) ON DELETE SET NULL;

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_priestship ON events(priestship_id);
CREATE INDEX IF NOT EXISTS idx_events_eldership ON events(eldership_id);
CREATE INDEX IF NOT EXISTS idx_events_overseership ON events(overseership_id);
CREATE INDEX IF NOT EXISTS idx_events_apostleship ON events(apostleship_id);

-- Add hierarchy columns to WELLNESS_REPORTS table
ALTER TABLE wellness_reports 
ADD COLUMN IF NOT EXISTS priestship_id UUID REFERENCES priestships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS eldership_id UUID REFERENCES elderships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS overseership_id UUID REFERENCES overseerships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS apostleship_id UUID REFERENCES apostleship(id) ON DELETE SET NULL;

-- Create indexes for wellness_reports
CREATE INDEX IF NOT EXISTS idx_wellness_priestship ON wellness_reports(priestship_id);
CREATE INDEX IF NOT EXISTS idx_wellness_eldership ON wellness_reports(eldership_id);
CREATE INDEX IF NOT EXISTS idx_wellness_overseership ON wellness_reports(overseership_id);
CREATE INDEX IF NOT EXISTS idx_wellness_apostleship ON wellness_reports(apostleship_id);

-- Make sure MEMBERS table has priestship_id
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS priestship_id UUID REFERENCES priestships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_priestship ON members(priestship_id);

-- Enable RLS policies for events if not enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop old event policies if they exist
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can view scoped events" ON events;
DROP POLICY IF EXISTS "Leadership can manage events" ON events;

-- Simple policy: All authenticated users can view events
CREATE POLICY "Authenticated users can view events" ON events
    FOR SELECT 
    TO authenticated
    USING (true);

-- Leadership can manage events
CREATE POLICY "Leadership can manage events" ON events
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon')
            AND approval_status = 'approved'
        )
    );

-- Enable RLS for wellness_reports if not enabled
ALTER TABLE wellness_reports ENABLE ROW LEVEL SECURITY;

-- Drop old wellness_reports policies if they exist
DROP POLICY IF EXISTS "Users can view wellness reports" ON wellness_reports;
DROP POLICY IF EXISTS "Users can view scoped wellness reports" ON wellness_reports;
DROP POLICY IF EXISTS "Approved users can insert reports" ON wellness_reports;
DROP POLICY IF EXISTS "Leadership can manage wellness reports" ON wellness_reports;

-- Simple policy: All authenticated users can view wellness reports
CREATE POLICY "Authenticated users can view wellness reports" ON wellness_reports
    FOR SELECT 
    TO authenticated
    USING (true);

-- Authenticated users can insert reports
CREATE POLICY "Authenticated users can insert wellness reports" ON wellness_reports
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Leadership can update/delete wellness reports
CREATE POLICY "Leadership can manage wellness reports" ON wellness_reports
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

-- Enable RLS for members if not enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Drop old member policies if they exist
DROP POLICY IF EXISTS "Users can view members" ON members;
DROP POLICY IF EXISTS "Users can view priestship members" ON members;
DROP POLICY IF EXISTS "Leadership can manage members" ON members;

-- Simple policy: All authenticated users can view members
CREATE POLICY "Authenticated users can view members" ON members
    FOR SELECT 
    TO authenticated
    USING (true);

-- Leadership can manage members
CREATE POLICY "Leadership can manage members" ON members
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- DONE
-- ============================================================
-- Your existing tables now have the hierarchy columns added
-- and simplified RLS policies that allow all authenticated users 
-- to view data (for easier development)
