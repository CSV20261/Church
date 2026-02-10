-- =====================================================
-- TERMINOLOGY REFINEMENT
-- Rename 'office' to 'gift' and update service types
-- =====================================================

-- =====================================================
-- 1. RENAME 'OFFICE' TO 'GIFT' IN MEMBERS TABLE
-- =====================================================

ALTER TABLE public.members 
RENAME COLUMN office TO gift;

-- Update index name if it exists
DROP INDEX IF EXISTS idx_members_office;
CREATE INDEX IF NOT EXISTS idx_members_gift ON public.members(gift);

-- =====================================================
-- 2. CREATE/UPDATE SERVICE_TYPE ENUM: 'Testify'
-- =====================================================

-- Create the enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE service_type AS ENUM (
        'Testify',
        'Practice',
        'Wednesday Service',
        'Sunday Service',
        'Special'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        -- If it already exists, we need to recreate it
        -- First, drop the column that uses it
        ALTER TABLE public.attendance_reports DROP COLUMN IF EXISTS service_type;
        DROP TYPE service_type;
        CREATE TYPE service_type AS ENUM (
            'Testify',
            'Practice',
            'Wednesday Service',
            'Sunday Service',
            'Special'
        );
END $$;

-- Ensure the column exists with the correct type
DO $$ BEGIN
    -- Try to add the column
    ALTER TABLE public.attendance_reports 
    ADD COLUMN service_type service_type DEFAULT 'Sunday Service';
EXCEPTION
    WHEN duplicate_column THEN
        -- Column already exists, just update its default
        ALTER TABLE public.attendance_reports 
        ALTER COLUMN service_type SET DEFAULT 'Sunday Service';
END $$;

-- =====================================================
-- 3. UPDATE TRIGGERS TO USE 'GIFT' INSTEAD OF 'OFFICE'
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_member_from_profile()
RETURNS TRIGGER AS $$
DECLARE
    member_title TEXT;
    member_gender TEXT;
    member_gift TEXT;
    member_category member_category;
    member_first_name TEXT;
    member_last_name TEXT;
BEGIN
    -- Extract first and last name from full_name
    member_first_name := split_part(COALESCE(NEW.full_name, 'Unknown'), ' ', 1);
    member_last_name := NULLIF(substring(COALESCE(NEW.full_name, '') from position(' ' in COALESCE(NEW.full_name, ''))+1), '');
    
    -- Determine title, gift, and category based on role
    CASE NEW.role
        WHEN 'apostle' THEN
            member_title := 'Rev';
            member_gift := 'Apostle';
            member_category := 'Officer';
            member_gender := 'Male';
        WHEN 'overseer' THEN
            member_title := 'Rev';
            member_gift := 'Overseer';
            member_category := 'Officer';
            member_gender := 'Male';
        WHEN 'elder' THEN
            member_title := 'Br';
            member_gift := 'Elder';
            member_category := 'Officer';
            member_gender := 'Male';
        WHEN 'priest' THEN
            member_title := 'Br';
            member_gift := 'Priest';
            member_category := 'Officer';
            member_gender := 'Male';
        WHEN 'underdeacon' THEN
            member_title := 'Br';
            member_gift := 'Underdeacon';
            member_category := 'Officer';
            member_gender := 'Male';
        ELSE
            member_title := 'Br';
            member_gift := 'Brother';
            member_category := 'Adult';
            member_gender := 'Male';
    END CASE;

    -- Insert into members table
    INSERT INTO public.members (
        profile_id,
        title,
        first_name,
        last_name,
        full_name,
        gender,
        gift,
        category,
        apostleship_id,
        overseership_id,
        eldership_id,
        priestship_id,
        is_active
    )
    VALUES (
        NEW.id,
        member_title,
        member_first_name,
        member_last_name,
        COALESCE(NEW.full_name, 'Unknown'),
        member_gender,
        member_gift,
        member_category,
        NEW.apostleship_id,
        NEW.overseership_id,
        NEW.eldership_id,
        NEW.priestship_id,
        NEW.is_approved
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        title = EXCLUDED.title,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        gender = EXCLUDED.gender,
        gift = EXCLUDED.gift,
        category = EXCLUDED.category,
        apostleship_id = EXCLUDED.apostleship_id,
        overseership_id = EXCLUDED.overseership_id,
        eldership_id = EXCLUDED.eldership_id,
        priestship_id = EXCLUDED.priestship_id,
        is_active = EXCLUDED.is_active;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. UPDATE EXISTING MEMBER RECORDS
-- =====================================================

-- Update Vusi Shange's gift field
UPDATE public.members
SET gift = 'Underdeacon'
WHERE gift IS NULL 
  AND category = 'Officer'::member_category
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = members.profile_id 
    AND p.role = 'underdeacon'
  );

-- =====================================================
-- 5. ADD GENDER ENUM FOR CONSISTENCY
-- =====================================================

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('Male', 'Female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update gender column to use enum (optional, for data consistency)
-- Note: Keep as TEXT for now to avoid breaking existing code

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check updated schema
SELECT 
    '============================================' as divider
UNION ALL
SELECT 'TERMINOLOGY UPDATED' as divider
UNION ALL
SELECT '============================================' as divider
UNION ALL
SELECT 'office → gift' as divider
UNION ALL
SELECT 'Testifier → Testify' as divider
UNION ALL
SELECT '============================================' as divider;

-- Verify Vusi Shange's record
SELECT 
    full_name,
    title,
    gender,
    gift,
    category::text
FROM public.members
WHERE full_name = 'Vusi Shange';
