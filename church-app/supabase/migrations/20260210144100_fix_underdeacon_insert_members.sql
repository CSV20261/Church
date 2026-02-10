-- =====================================================
-- FIX: ALLOW UNDERDEACONS TO INSERT MEMBERS
-- Date: 2026-02-10
-- Issue: RLS policy only allows certain roles to manage members
--        but 'underdeacon' was not included
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Leadership can manage members" ON public.members;

-- Recreate with underdeacon included
CREATE POLICY "Leadership can manage members" ON public.members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon', 'deacon')
            AND profiles.approval_status = 'approved'
        )
    );

-- Also ensure INSERT is explicitly allowed for underdeacons
CREATE POLICY IF NOT EXISTS "Underdeacons can insert members" ON public.members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'underdeacon'
            AND profiles.approval_status = 'approved'
        )
    );

-- Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE tablename = 'members' 
AND policyname IN ('Leadership can manage members', 'Underdeacons can insert members');
