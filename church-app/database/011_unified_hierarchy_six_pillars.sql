-- =====================================================
-- UNIFIED HIERARCHY & SIX PILLARS RESTRUCTURE
-- Shared relationship model for profiles and members
-- =====================================================

-- =====================================================
-- 1. CREATE APOSTLESHIP & OVERSEERSHIP TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.apostleships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.overseererships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    apostleship_id UUID REFERENCES public.apostleships(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 2. CREATE SIX PILLARS CATEGORY ENUM
-- =====================================================

DO $$ BEGIN
    CREATE TYPE member_category AS ENUM (
        'Officer',
        'Senior Citizen',
        'Adult',
        'Young Adult',
        'Youth',
        'Sunday School'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. ADD HIERARCHY COLUMNS TO PROFILES TABLE
-- =====================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS apostleship_id UUID REFERENCES public.apostleships(id),
ADD COLUMN IF NOT EXISTS overseership_id UUID REFERENCES public.overseererships(id);

-- eldership_id and priestship_id should already exist
-- If not, add them:
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS eldership_id UUID REFERENCES public.elderships(id),
ADD COLUMN IF NOT EXISTS priestship_id UUID REFERENCES public.priestships(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_apostleship ON public.profiles(apostleship_id);
CREATE INDEX IF NOT EXISTS idx_profiles_overseership ON public.profiles(overseership_id);
CREATE INDEX IF NOT EXISTS idx_profiles_eldership ON public.profiles(eldership_id);
CREATE INDEX IF NOT EXISTS idx_profiles_priestship ON public.profiles(priestship_id);

-- =====================================================
-- 4. RESTRUCTURE MEMBERS TABLE
-- =====================================================

-- Add new columns to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS title TEXT CHECK (title IN ('Mr', 'Ms', 'Mrs', 'Sr', 'Br', 'Dr', 'Rev')),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS office TEXT, -- Brother, Sister, Underdeacon, Priest, Elder, etc.
ADD COLUMN IF NOT EXISTS apostleship_id UUID REFERENCES public.apostleships(id),
ADD COLUMN IF NOT EXISTS overseership_id UUID REFERENCES public.overseererships(id);

-- Drop old category column if it exists and recreate with new enum
ALTER TABLE public.members DROP COLUMN IF EXISTS category CASCADE;
ALTER TABLE public.members ADD COLUMN category member_category;

-- Drop old sub_category as it's replaced by office
ALTER TABLE public.members DROP COLUMN IF EXISTS sub_category;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_members_apostleship ON public.members(apostleship_id);
CREATE INDEX IF NOT EXISTS idx_members_overseership ON public.members(overseership_id);
CREATE INDEX IF NOT EXISTS idx_members_category ON public.members(category);
CREATE INDEX IF NOT EXISTS idx_members_office ON public.members(office);

-- =====================================================
-- 5. CREATE GENDER LOGIC FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.derive_gender_from_title(title_input TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE title_input
        WHEN 'Mr', 'Br' THEN
            RETURN 'Brother';
        WHEN 'Ms', 'Mrs', 'Sr' THEN
            RETURN 'Sister';
        ELSE
            RETURN 'Brother'; -- Default
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. UPDATE PROFILE-TO-MEMBER AUTOMATIC SYNC TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_member_from_profile()
RETURNS TRIGGER AS $$
DECLARE
    member_title TEXT;
    member_gender TEXT;
    member_office TEXT;
    member_category member_category;
    member_first_name TEXT;
    member_last_name TEXT;
BEGIN
    -- Extract first and last name from full_name
    member_first_name := split_part(COALESCE(NEW.full_name, 'Unknown'), ' ', 1);
    member_last_name := NULLIF(substring(COALESCE(NEW.full_name, '') from position(' ' in COALESCE(NEW.full_name, ''))+1), '');
    
    -- Determine title, office, and category based on role
    CASE NEW.role
        WHEN 'apostle' THEN
            member_title := 'Rev';
            member_office := 'Apostle';
            member_category := 'Officer';
        WHEN 'overseer' THEN
            member_title := 'Rev';
            member_office := 'Overseer';
            member_category := 'Officer';
        WHEN 'elder' THEN
            member_title := 'Br';
            member_office := 'Elder';
            member_category := 'Officer';
        WHEN 'priest' THEN
            member_title := 'Br';
            member_office := 'Priest';
            member_category := 'Officer';
        WHEN 'underdeacon' THEN
            member_title := 'Br';
            member_office := 'Underdeacon';
            member_category := 'Officer';
        ELSE
            member_title := 'Br';
            member_office := 'Brother';
            member_category := 'Adult'; -- Default to Adult for members
    END CASE;

    -- Derive gender from title
    member_gender := derive_gender_from_title(member_title);

    -- Insert into members table
    INSERT INTO public.members (
        profile_id,
        title,
        first_name,
        last_name,
        full_name,
        gender,
        office,
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
        member_office,
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
        office = EXCLUDED.office,
        category = EXCLUDED.category,
        apostleship_id = EXCLUDED.apostleship_id,
        overseership_id = EXCLUDED.overseership_id,
        eldership_id = EXCLUDED.eldership_id,
        priestship_id = EXCLUDED.priestship_id,
        is_active = EXCLUDED.is_active;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_profile_created_create_member ON public.profiles;
CREATE TRIGGER on_profile_created_create_member
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_member_from_profile();

-- =====================================================
-- 7. UPDATE PROFILE SYNC TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_member_from_profile()
RETURNS TRIGGER AS $$
DECLARE
    member_first_name TEXT;
    member_last_name TEXT;
BEGIN
    -- Extract first and last name from full_name
    member_first_name := split_part(COALESCE(NEW.full_name, 'Unknown'), ' ', 1);
    member_last_name := NULLIF(substring(COALESCE(NEW.full_name, '') from position(' ' in COALESCE(NEW.full_name, ''))+1), '');

    -- Update corresponding member record
    UPDATE public.members
    SET 
        first_name = member_first_name,
        last_name = member_last_name,
        full_name = COALESCE(NEW.full_name, full_name),
        apostleship_id = NEW.apostleship_id,
        overseership_id = NEW.overseership_id,
        eldership_id = NEW.eldership_id,
        priestship_id = NEW.priestship_id,
        is_active = NEW.is_approved
    WHERE profile_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the update trigger
DROP TRIGGER IF EXISTS on_profile_updated_sync_member ON public.profiles;
CREATE TRIGGER on_profile_updated_sync_member
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_member_from_profile();

-- =====================================================
-- 8. UPDATE EXISTING MEMBERS WITH NEW STRUCTURE
-- =====================================================

-- Update existing members with new fields based on their current data
UPDATE public.members m
SET 
    title = CASE 
        WHEN m.gender = 'Brother' THEN 'Br'
        WHEN m.gender = 'Sister' THEN 'Sr'
        ELSE 'Br'
    END,
    first_name = split_part(m.full_name, ' ', 1),
    last_name = NULLIF(substring(m.full_name from position(' ' in m.full_name)+1), ''),
    office = CASE 
        WHEN p.role = 'apostle' THEN 'Apostle'
        WHEN p.role = 'overseer' THEN 'Overseer'
        WHEN p.role = 'elder' THEN 'Elder'
        WHEN p.role = 'priest' THEN 'Priest'
        WHEN p.role = 'underdeacon' THEN 'Underdeacon'
        ELSE 'Brother'
    END,
    category = CASE 
        WHEN p.role IN ('apostle', 'overseer', 'elder', 'priest', 'underdeacon') THEN 'Officer'::member_category
        ELSE 'Adult'::member_category
    END,
    apostleship_id = p.apostleship_id,
    overseership_id = p.overseership_id
FROM public.profiles p
WHERE m.profile_id = p.id;

-- =====================================================
-- 9. UPDATE RLS POLICIES FOR NEW HIERARCHY
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view members in their hierarchy" ON public.members;

-- Create new comprehensive policy
CREATE POLICY "Users can view members in their hierarchy"
ON public.members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (
            -- Same priestship
            profiles.priestship_id = members.priestship_id
            -- Same eldership
            OR profiles.eldership_id = members.eldership_id
            -- Same overseership
            OR profiles.overseership_id = members.overseership_id
            -- Same apostleship
            OR profiles.apostleship_id = members.apostleship_id
            -- Officers can see their subordinates
            OR profiles.role IN ('apostle', 'overseer', 'elder')
        )
    )
);

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check Vusi Shange's updated profile and member record
SELECT 
    '============================================' as section
UNION ALL
SELECT 'VUSI SHANGE - PROFILE & MEMBER SYNC' as section
UNION ALL
SELECT '============================================' as section;

SELECT 
    p.full_name as profile_name,
    p.role,
    m.title,
    m.first_name,
    m.last_name,
    m.gender,
    m.office,
    m.category::text,
    pr.name as priestship,
    e.name as eldership
FROM public.profiles p
JOIN public.members m ON p.id = m.profile_id
LEFT JOIN priestships pr ON m.priestship_id = pr.id
LEFT JOIN elderships e ON m.eldership_id = e.id
WHERE p.full_name = 'Vusi Shange';

-- Show all members grouped by Six Pillars
SELECT 
    category::text,
    office,
    COUNT(*) as member_count
FROM public.members
WHERE is_active = true
GROUP BY category, office
ORDER BY 
    CASE category::text
        WHEN 'Officer' THEN 1
        WHEN 'Senior Citizen' THEN 2
        WHEN 'Adult' THEN 3
        WHEN 'Young Adult' THEN 4
        WHEN 'Youth' THEN 5
        WHEN 'Sunday School' THEN 6
    END,
    office;
