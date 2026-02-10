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

-- Verify policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'members' 
AND policyname = 'Leadership can manage members';
