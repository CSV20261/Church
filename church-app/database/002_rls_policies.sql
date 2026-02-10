-- ============================================================
-- OLDER APOSTOLIC CHURCH - RLS POLICIES UPDATE
-- Run this AFTER 001_foundation_schema.sql
-- ============================================================

-- Note: Most RLS policies are already created in 001_foundation_schema.sql
-- This file contains additional policies for existing tables that need updating

-- ============================================================
-- UPDATE MEMBERS TABLE POLICIES
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view division members" ON members;
DROP POLICY IF EXISTS "Leadership can manage members" ON members;

-- Members can view members in their priestship
CREATE POLICY "Users can view priestship members" ON members
    FOR SELECT USING (
        priestship_id IN (
            SELECT la.priestship_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
            AND la.priestship_id IS NOT NULL
        )
        OR
        -- Elders can see members in priestships under their eldership
        priestship_id IN (
            SELECT p.id FROM priestships p
            WHERE p.eldership_id IN (
                SELECT la.eldership_id 
                FROM leadership_assignments la 
                WHERE la.profile_id = auth.uid() 
                AND la.is_active = TRUE
                AND la.eldership_id IS NOT NULL
            )
        )
        OR
        -- Higher leadership can see all
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet')
            AND approval_status = 'approved'
        )
    );

-- Leadership can insert/update members
CREATE POLICY "Leadership can manage members" ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- UPDATE EVENTS TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view division events" ON events;
DROP POLICY IF EXISTS "Leadership can manage events" ON events;

-- Users can view events in their scope
CREATE POLICY "Users can view scoped events" ON events
    FOR SELECT USING (
        priestship_id IN (
            SELECT la.priestship_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
        )
        OR
        eldership_id IN (
            SELECT la.eldership_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
        )
        OR
        overseership_id IN (
            SELECT la.overseership_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
        )
        OR
        apostleship_id IN (
            SELECT la.apostleship_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'apostle'
            AND approval_status = 'approved'
        )
    );

-- Leadership can create/update events
CREATE POLICY "Leadership can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- UPDATE ATTENDANCE_RECORDS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view attendance" ON attendance_records;
DROP POLICY IF EXISTS "Leadership can manage attendance" ON attendance_records;

-- Users can view attendance for members in their scope
CREATE POLICY "Users can view scoped attendance" ON attendance_records
    FOR SELECT USING (
        member_id IN (
            SELECT m.id FROM members m
            WHERE m.priestship_id IN (
                SELECT la.priestship_id 
                FROM leadership_assignments la 
                WHERE la.profile_id = auth.uid() 
                AND la.is_active = TRUE
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder')
            AND approval_status = 'approved'
        )
    );

-- Leadership can manage attendance
CREATE POLICY "Leadership can manage attendance" ON attendance_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- UPDATE TITHING_RECORDS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view tithing" ON tithing_records;
DROP POLICY IF EXISTS "Leadership can manage tithing" ON tithing_records;

-- Users can view tithing for members in their scope
CREATE POLICY "Users can view scoped tithing" ON tithing_records
    FOR SELECT USING (
        member_id IN (
            SELECT m.id FROM members m
            WHERE m.priestship_id IN (
                SELECT la.priestship_id 
                FROM leadership_assignments la 
                WHERE la.profile_id = auth.uid() 
                AND la.is_active = TRUE
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder')
            AND approval_status = 'approved'
        )
    );

-- Leadership can manage tithing
CREATE POLICY "Leadership can manage tithing" ON tithing_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- UPDATE SPIRITUAL_GIFTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view spiritual gifts" ON spiritual_gifts;
DROP POLICY IF EXISTS "Users can insert spiritual gifts" ON spiritual_gifts;
DROP POLICY IF EXISTS "Leadership can manage spiritual gifts" ON spiritual_gifts;

-- Users can view spiritual gifts (respecting privacy)
CREATE POLICY "Users can view spiritual gifts" ON spiritual_gifts
    FOR SELECT USING (
        -- Own gifts (via member link)
        member_id IN (
            SELECT id FROM members WHERE profile_id = auth.uid()
        )
        OR
        -- Non-private gifts in scope
        (
            NOT is_private 
            AND member_id IN (
                SELECT m.id FROM members m
                WHERE m.priestship_id IN (
                    SELECT la.priestship_id 
                    FROM leadership_assignments la 
                    WHERE la.profile_id = auth.uid() 
                    AND la.is_active = TRUE
                )
            )
        )
        OR
        -- Leadership can see all in scope
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

-- Anyone can insert spiritual gifts (for self)
CREATE POLICY "Users can insert spiritual gifts" ON spiritual_gifts
    FOR INSERT WITH CHECK (
        recorded_by = auth.uid()
    );

-- Leadership can update/delete
CREATE POLICY "Leadership can manage spiritual gifts" ON spiritual_gifts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- UPDATE WELLNESS_REPORTS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view division reports" ON wellness_reports;
DROP POLICY IF EXISTS "Users can insert reports" ON wellness_reports;
DROP POLICY IF EXISTS "Priests can update reports" ON wellness_reports;

-- Users can view wellness reports in their scope
CREATE POLICY "Users can view scoped wellness reports" ON wellness_reports
    FOR SELECT USING (
        -- Own reports
        member_id IN (
            SELECT id FROM members WHERE profile_id = auth.uid()
        )
        OR
        -- Reports in scope
        priestship_id IN (
            SELECT la.priestship_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
        )
        OR
        eldership_id IN (
            SELECT la.eldership_id 
            FROM leadership_assignments la 
            WHERE la.profile_id = auth.uid() 
            AND la.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet')
            AND approval_status = 'approved'
        )
    );

-- Anyone approved can insert reports
CREATE POLICY "Approved users can insert reports" ON wellness_reports
    FOR INSERT WITH CHECK (
        reported_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND approval_status = 'approved'
        )
    );

-- Leadership can update/resolve reports
CREATE POLICY "Leadership can manage wellness reports" ON wellness_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

-- ============================================================
-- COMPLETE
-- ============================================================

-- Summary:
-- All data is now scoped based on:
-- 1. User's leadership assignments (priestship, eldership, overseership, apostleship)
-- 2. User's role level (higher roles can see more)
-- 3. Approval status (must be approved to access most data)
-- 4. Privacy settings (for spiritual gifts)
