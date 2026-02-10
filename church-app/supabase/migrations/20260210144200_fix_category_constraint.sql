-- =====================================================
-- FIX: UPDATE CATEGORY CONSTRAINT TO INCLUDE ALL SIX PILLARS
-- Date: 2026-02-10
-- Issue: Database only allows 'Officer', 'Adult', 'Youth', 'Sunday School'
--        but app sends 'Senior Citizen' and 'Young Adult' as well
-- =====================================================

-- Drop old constraint
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_category_check;

-- Add new constraint with all six pillars
ALTER TABLE public.members
ADD CONSTRAINT members_category_check 
CHECK (category IN ('Officer', 'Senior Citizen', 'Adult', 'Young Adult', 'Youth', 'Sunday School'));

-- Verify constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.members'::regclass 
AND conname = 'members_category_check';
