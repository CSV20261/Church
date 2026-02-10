-- =====================================================
-- FIX: Consolidate overseerships and overseererships tables
-- The members table references overseererships (with 'r')
-- But data exists in overseerships (without 'r')
-- =====================================================

-- Step 1: Copy data from overseerships to overseererships
INSERT INTO public.overseererships (id, name, apostleship_id, created_at)
SELECT 
    id, 
    name,
    apostle_id as apostleship_id,  -- Note: column name difference
    created_at
FROM public.overseerships
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update any profiles that reference overseerships to use the new table
-- (The FK should already point to overseererships, but values might be wrong)
UPDATE public.profiles p
SET overseership_id = o.id
FROM public.overseerships o
WHERE p.overseership_id = o.id
AND NOT EXISTS (
    SELECT 1 FROM public.overseererships 
    WHERE id = o.id
);

-- Step 3: Drop the old overseerships table (after ensuring no dependencies)
-- First, we need to check if there are any foreign keys pointing to it
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    AND constraint_name LIKE '%overseerships%'
    AND table_name != 'overseererships';
    
    RAISE NOTICE 'Found % foreign keys to old overseerships table', fk_count;
END $$;

-- Show what we migrated
SELECT 
    'MIGRATED DATA:' as status,
    COUNT(*) as row_count 
FROM public.overseererships;

SELECT 
    'OLD TABLE DATA:' as status,
    COUNT(*) as row_count 
FROM public.overseerships;
