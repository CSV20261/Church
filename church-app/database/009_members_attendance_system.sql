-- =====================================================
-- MEMBERS & ATTENDANCE SYSTEM
-- Core data engine with tiered hierarchy
-- =====================================================

-- =====================================================
-- 1. CREATE MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Brother', 'Sister')) NOT NULL,
    category TEXT CHECK (category IN ('Officer', 'Adult', 'Youth', 'Sunday School')) NOT NULL,
    sub_category TEXT, -- e.g., 'Priest & Sister', 'Underdeacon & Sister', 'Choir Member'
    priestship_id UUID REFERENCES public.priestships(id),
    eldership_id UUID REFERENCES public.elderships(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_priestship ON public.members(priestship_id);
CREATE INDEX IF NOT EXISTS idx_members_eldership ON public.members(eldership_id);
CREATE INDEX IF NOT EXISTS idx_members_category ON public.members(category);
CREATE INDEX IF NOT EXISTS idx_members_profile ON public.members(profile_id);

-- =====================================================
-- 2. CREATE ATTENDANCE_REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    priestship_id UUID REFERENCES public.priestships(id) NOT NULL,
    service_type TEXT DEFAULT 'Sunday Service', -- e.g., 'Sunday Service', 'Wednesday Prayer', 'Youth Service'
    prophecy_count INTEGER DEFAULT 0,
    vision_count INTEGER DEFAULT 0,
    dreams_count INTEGER DEFAULT 0,
    absentee_notes TEXT, -- e.g., 'Sr Ngcobo is not feeling well'
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date, priestship_id, service_type) -- One report per service per day
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_reports_date ON public.attendance_reports(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_reports_priestship ON public.attendance_reports(priestship_id);

-- =====================================================
-- 3. CREATE ATTENDANCE_RECORDS TABLE (Join Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.attendance_reports(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('Present', 'Absent')) NOT NULL,
    notes TEXT, -- Optional notes for individual member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(report_id, member_id) -- One record per member per report
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_report ON public.attendance_records(report_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member ON public.attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);

-- =====================================================
-- 4. PROFILE-TO-MEMBER TRIGGER FUNCTION
-- Automatically creates member entry when profile is created
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_member_from_profile()
RETURNS TRIGGER AS $$
DECLARE
    member_gender TEXT;
    member_category TEXT;
    member_sub_category TEXT;
BEGIN
    -- Determine gender (default to Brother if not specified)
    member_gender := 'Brother';
    
    -- Determine category and sub_category based on role
    CASE NEW.role
        WHEN 'priest' THEN
            member_category := 'Officer';
            member_sub_category := 'Priest & Sister';
        WHEN 'underdeacon' THEN
            member_category := 'Officer';
            member_sub_category := 'Underdeacon & Sister';
        WHEN 'elder' THEN
            member_category := 'Officer';
            member_sub_category := 'Elder & Sister';
        WHEN 'overseer' THEN
            member_category := 'Officer';
            member_sub_category := 'Overseer & Sister';
        WHEN 'apostle' THEN
            member_category := 'Officer';
            member_sub_category := 'Apostle & Sister';
        ELSE
            member_category := 'Adult';
            member_sub_category := NULL;
    END CASE;

    -- Insert into members table
    INSERT INTO public.members (
        profile_id,
        full_name,
        gender,
        category,
        sub_category,
        priestship_id,
        eldership_id,
        is_active
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.full_name, 'Unknown'),
        member_gender,
        member_category,
        member_sub_category,
        NEW.priestship_id,
        NEW.eldership_id,
        NEW.is_approved
    )
    ON CONFLICT (profile_id) DO NOTHING; -- Prevent duplicates if member already exists

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (runs after profile insert)
DROP TRIGGER IF EXISTS on_profile_created_create_member ON public.profiles;
CREATE TRIGGER on_profile_created_create_member
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_member_from_profile();

-- =====================================================
-- 5. UPDATE TRIGGER FUNCTION
-- Keep member in sync when profile is updated
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_member_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update corresponding member record
    UPDATE public.members
    SET 
        full_name = COALESCE(NEW.full_name, full_name),
        priestship_id = NEW.priestship_id,
        eldership_id = NEW.eldership_id,
        is_active = NEW.is_approved,
        updated_at = now()
    WHERE profile_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update trigger
DROP TRIGGER IF EXISTS on_profile_updated_sync_member ON public.profiles;
CREATE TRIGGER on_profile_updated_sync_member
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_member_from_profile();

-- =====================================================
-- 6. ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Members: Users can view members in their priestship/eldership
CREATE POLICY "Users can view members in their hierarchy"
ON public.members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.priestship_id = members.priestship_id
            OR profiles.eldership_id = members.eldership_id
            OR profiles.role IN ('apostle', 'overseer', 'elder')
        )
    )
);

-- Attendance Reports: Users can view reports for their priestship
CREATE POLICY "Users can view attendance reports in their priestship"
ON public.attendance_reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.priestship_id = attendance_reports.priestship_id
            OR profiles.eldership_id IN (
                SELECT eldership_id FROM priestships WHERE id = attendance_reports.priestship_id
            )
            OR profiles.role IN ('apostle', 'overseer', 'elder')
        )
    )
);

-- Attendance Reports: Officers can create reports
CREATE POLICY "Officers can create attendance reports"
ON public.attendance_reports FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('apostle', 'overseer', 'elder', 'priest', 'underdeacon')
        AND profiles.priestship_id = attendance_reports.priestship_id
    )
);

-- Attendance Records: Users can view records for reports they can access
CREATE POLICY "Users can view attendance records"
ON public.attendance_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.attendance_reports
        WHERE attendance_reports.id = attendance_records.report_id
    )
);

-- Attendance Records: Officers can create records
CREATE POLICY "Officers can create attendance records"
ON public.attendance_records FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.attendance_reports ar
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE ar.id = attendance_records.report_id
        AND p.priestship_id = ar.priestship_id
        AND p.role IN ('apostle', 'overseer', 'elder', 'priest', 'underdeacon')
    )
);

-- =====================================================
-- 7. SEED EXISTING PROFILES AS MEMBERS
-- Backfill: Create members for any existing profiles
-- =====================================================

INSERT INTO public.members (
    profile_id,
    full_name,
    gender,
    category,
    sub_category,
    priestship_id,
    eldership_id,
    is_active
)
SELECT 
    p.id,
    COALESCE(p.full_name, 'Unknown'),
    'Brother', -- Default gender
    CASE 
        WHEN p.role IN ('priest', 'underdeacon', 'elder', 'apostle', 'overseer') THEN 'Officer'
        ELSE 'Adult'
    END,
    CASE 
        WHEN p.role = 'priest' THEN 'Priest & Sister'
        WHEN p.role = 'underdeacon' THEN 'Underdeacon & Sister'
        WHEN p.role = 'elder' THEN 'Elder & Sister'
        WHEN p.role = 'overseer' THEN 'Overseer & Sister'
        WHEN p.role = 'apostle' THEN 'Apostle & Sister'
        ELSE NULL
    END,
    p.priestship_id,
    p.eldership_id,
    p.is_approved
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.members m WHERE m.profile_id = p.id
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check members table
SELECT 
    m.full_name,
    m.gender,
    m.category,
    m.sub_category,
    pr.name as priestship,
    e.name as eldership
FROM members m
LEFT JOIN priestships pr ON m.priestship_id = pr.id
LEFT JOIN elderships e ON m.eldership_id = e.id
ORDER BY m.category, m.sub_category, m.full_name;

-- Summary by category
SELECT 
    category,
    sub_category,
    COUNT(*) as member_count
FROM members
WHERE is_active = true
GROUP BY category, sub_category
ORDER BY category, sub_category;
