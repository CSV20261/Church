-- ============================================================
-- FIX: Allow unauthenticated/unapproved users to view 
-- organizational structure during onboarding
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view apostleships" ON apostleship;
DROP POLICY IF EXISTS "Approved users can view overseerships" ON overseerships;
DROP POLICY IF EXISTS "Approved users can view elderships" ON elderships;
DROP POLICY IF EXISTS "Approved users can view priestships" ON priestships;

-- APOSTLESHIP: Anyone authenticated can view (for onboarding)
CREATE POLICY "Authenticated users can view apostleships" ON apostleship
    FOR SELECT 
    TO authenticated
    USING (true);

-- OVERSEERSHIPS: Anyone authenticated can view (for onboarding)
CREATE POLICY "Authenticated users can view overseerships" ON overseerships
    FOR SELECT 
    TO authenticated
    USING (true);

-- ELDERSHIPS: Anyone authenticated can view (for onboarding)
CREATE POLICY "Authenticated users can view elderships" ON elderships
    FOR SELECT 
    TO authenticated
    USING (true);

-- PRIESTSHIPS: Anyone authenticated can view (for onboarding)
CREATE POLICY "Authenticated users can view priestships" ON priestships
    FOR SELECT 
    TO authenticated
    USING (true);

-- ADMINISTRATIVE DIVISIONS: Anyone authenticated can view (for onboarding)
DROP POLICY IF EXISTS "Approved users can view admin divisions" ON administrative_divisions;
CREATE POLICY "Authenticated users can view admin divisions" ON administrative_divisions
    FOR SELECT 
    TO authenticated
    USING (true);

-- ============================================================
-- VERIFY POLICIES
-- ============================================================
-- Run this to check policies exist:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
