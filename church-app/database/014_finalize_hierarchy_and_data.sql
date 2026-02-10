-- =====================================================
-- FINALIZE CORE DATA AND HIERARCHY
-- Update names, titles, and constraints
-- =====================================================

-- =====================================================
-- 1. CREATE/UPDATE APOSTLESHIP: '200'
-- =====================================================

-- Create apostleship if it doesn't exist
DO $$ 
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id 
    FROM public.apostleships 
    WHERE name = '200' 
    LIMIT 1;
    
    IF existing_id IS NULL THEN
        INSERT INTO public.apostleships (name)
        VALUES ('200');
    END IF;
END $$;

-- Get the apostleship ID for use in other updates
DO $$
DECLARE
    apostleship_200_id UUID;
BEGIN
    SELECT id INTO apostleship_200_id 
    FROM public.apostleships 
    WHERE name = '200' 
    LIMIT 1;
    
    RAISE NOTICE 'Apostleship 200 ID: %', apostleship_200_id;
END $$;

-- =====================================================
-- 2. CREATE/UPDATE OVERSEERSHIP: '20261'
-- =====================================================

DO $$
DECLARE
    apostleship_200_id UUID;
    overseership_20261_id UUID;
BEGIN
    -- Get apostleship ID
    SELECT id INTO apostleship_200_id 
    FROM public.apostleships 
    WHERE name = '200' 
    LIMIT 1;
    
    -- Check if overseership already exists
    SELECT id INTO overseership_20261_id 
    FROM public.overseerships 
    WHERE name = '20261' 
    LIMIT 1;
    
    IF overseership_20261_id IS NULL THEN
        -- Create new overseership
        INSERT INTO public.overseerships (name, apostleship_id)
        VALUES ('20261', apostleship_200_id)
        RETURNING id INTO overseership_20261_id;
    ELSE
        -- Update existing overseership
        UPDATE public.overseerships
        SET apostleship_id = apostleship_200_id
        WHERE name = '20261';
    END IF;
    
    RAISE NOTICE 'Overseership 20261 ID: %', overseership_20261_id;
END $$;

-- =====================================================
-- 3. UPDATE ELDERSHIP: 'MANYANO'
-- =====================================================

DO $$
DECLARE
    overseership_20261_id UUID;
    eldership_manyano_id UUID;
BEGIN
    -- Get overseership ID
    SELECT id INTO overseership_20261_id 
    FROM public.overseererships 
    WHERE name = '20261' 
    LIMIT 1;
    
    -- Update existing eldership to MANYANO
    -- Assuming we're renaming 'Centurion Eldership' to 'MANYANO'
    UPDATE public.elderships
    SET name = 'MANYANO'
    WHERE name LIKE '%Centurion%' 
    OR name = 'Centurion Eldership';
    
    -- Get the eldership ID (whether it was updated or already existed)
    SELECT id INTO eldership_manyano_id 
    FROM public.elderships 
    WHERE name = 'MANYANO' 
    LIMIT 1;
    
    -- If still doesn't exist, create it
    IF eldership_manyano_id IS NULL THEN
        INSERT INTO public.elderships (name)
        VALUES ('MANYANO')
        RETURNING id INTO eldership_manyano_id;
    END IF;
    
    RAISE NOTICE 'Eldership MANYANO ID: %', eldership_manyano_id;
END $$;

-- =====================================================
-- 4. UPDATE PRIESTSHIP: Ensure 'Monavoni' exists
-- =====================================================

DO $$
DECLARE
    eldership_manyano_id UUID;
    priestship_monavoni_id UUID;
BEGIN
    -- Get eldership ID
    SELECT id INTO eldership_manyano_id 
    FROM public.elderships 
    WHERE name = 'MANYANO' 
    LIMIT 1;
    
    -- Update existing priestship to Monavoni or create it
    UPDATE public.priestships
    SET name = 'Monavoni',
        elder_id = eldership_manyano_id
    WHERE name LIKE '%Centurion South%'
    OR name = 'Centurion South Priestship';
    
    -- Get the priestship ID (whether it was updated or already existed)
    SELECT id INTO priestship_monavoni_id 
    FROM public.priestships 
    WHERE name = 'Monavoni' 
    LIMIT 1;
    
    -- If still doesn't exist, create it
    IF priestship_monavoni_id IS NULL THEN
        INSERT INTO public.priestships (name, elder_id)
        VALUES ('Monavoni', eldership_manyano_id)
        RETURNING id INTO priestship_monavoni_id;
    END IF;
    
    RAISE NOTICE 'Priestship Monavoni ID: %', priestship_monavoni_id;
END $$;

-- =====================================================
-- 5. UPDATE VUSI SHANGE: Title = 'UD'
-- =====================================================

DO $$
DECLARE
    apostleship_200_id UUID;
    overseership_20261_id UUID;
    eldership_manyano_id UUID;
    priestship_monavoni_id UUID;
BEGIN
    -- Get hierarchy IDs
    SELECT id INTO apostleship_200_id FROM public.apostleships WHERE name = '200' LIMIT 1;
    SELECT id INTO overseership_20261_id FROM public.overseererships WHERE name = '20261' LIMIT 1;
    SELECT id INTO eldership_manyano_id FROM public.elderships WHERE name = 'MANYANO' LIMIT 1;
    SELECT id INTO priestship_monavoni_id FROM public.priestships WHERE name = 'Monavoni' LIMIT 1;
    
    -- Update Vusi Shange's profile
    UPDATE public.profiles
    SET 
        apostleship_id = apostleship_200_id,
        overseership_id = overseership_20261_id,
        eldership_id = eldership_manyano_id,
        priestship_id = priestship_monavoni_id
    WHERE full_name = 'Vusi Shange';
    
    -- Update Vusi Shange's member record
    UPDATE public.members
    SET 
        title = 'UD',
        gift = 'Underdeacon',
        gender = 'Male',
        apostleship_id = apostleship_200_id,
        overseership_id = overseership_20261_id,
        eldership_id = eldership_manyano_id,
        priestship_id = priestship_monavoni_id
    WHERE full_name = 'Vusi Shange';
    
    RAISE NOTICE 'Vusi Shange updated: Title=UD, Gift=Underdeacon, Gender=Male';
END $$;

-- =====================================================
-- 6. UPDATE TITLE OPTIONS - Add 'UD' and 'SR/UD'
-- =====================================================

-- Update the title check constraint to include new titles
ALTER TABLE public.members 
DROP CONSTRAINT IF EXISTS members_title_check;

ALTER TABLE public.members 
ADD CONSTRAINT members_title_check 
CHECK (title IN ('Mr', 'Ms', 'Mrs', 'Sr', 'Br', 'Dr', 'Rev', 'UD', 'SR/UD'));

-- =====================================================
-- 7. GENDER CONSTRAINT: Underdeacon = Male
-- =====================================================

-- Add a check to ensure Underdeacons are Male
ALTER TABLE public.members
ADD CONSTRAINT underdeacon_must_be_male
CHECK (
    (gift != 'Underdeacon' AND gift != 'Deacon') 
    OR 
    (gender = 'Male')
);

-- =====================================================
-- 8. CREATE DISPLAY NAME FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_display_name(
    p_title TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_full_name TEXT
)
RETURNS TEXT AS $$
BEGIN
    -- Format: [Title] [Surname]
    -- Example: UD Shange, SR/UD Shange
    IF p_last_name IS NOT NULL AND p_last_name != '' THEN
        RETURN p_title || ' ' || p_last_name;
    ELSE
        -- Fallback to full name if no last name
        RETURN p_title || ' ' || p_full_name;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check hierarchy
SELECT 
    '============================================' as section
UNION ALL
SELECT 'HIERARCHY FINALIZED' as section
UNION ALL
SELECT '============================================' as section;

SELECT 
    'Apostleship' as level,
    name,
    id::text
FROM public.apostleships
WHERE name = '200'

UNION ALL

SELECT 
    'Overseership' as level,
    o.name,
    o.id::text
FROM public.overseerships o
WHERE o.name = '20261'

UNION ALL

SELECT 
    'Eldership' as level,
    e.name,
    e.id::text
FROM public.elderships e
WHERE e.name = 'MANYANO'

UNION ALL

SELECT 
    'Priestship' as level,
    p.name,
    p.id::text
FROM public.priestships p
WHERE p.name = 'Monavoni';

-- Check Vusi Shange
SELECT 
    '============================================' as section
UNION ALL
SELECT 'VUSI SHANGE UPDATED' as section
UNION ALL
SELECT '============================================' as section;

SELECT 
    m.title,
    m.first_name,
    m.last_name,
    m.full_name,
    m.gender,
    m.gift,
    m.category::text,
    public.get_display_name(m.title, m.first_name, m.last_name, m.full_name) as display_name
FROM public.members m
WHERE m.full_name = 'Vusi Shange';
