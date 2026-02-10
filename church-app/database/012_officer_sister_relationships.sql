-- =====================================================
-- OFFICER-SISTER RELATIONSHIPS
-- Track officer spouses for "Underdeacon & Sister" display
-- =====================================================

-- =====================================================
-- 1. CREATE OFFICER_SPOUSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.officer_spouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    spouse_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    spouse_full_name TEXT, -- In case spouse is not a registered member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(officer_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_officer_spouses_officer ON public.officer_spouses(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_spouses_spouse ON public.officer_spouses(spouse_id);

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================

ALTER TABLE public.officer_spouses ENABLE ROW LEVEL SECURITY;

-- Officers can view and manage their spouse records
CREATE POLICY "Officers can manage their spouse records"
ON public.officer_spouses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        JOIN public.profiles p ON m.profile_id = p.id
        WHERE p.id = auth.uid()
        AND m.id = officer_spouses.officer_id
        AND m.category = 'Officer'
    )
);

-- Users can view spouse records in their hierarchy
CREATE POLICY "Users can view officer spouses in their hierarchy"
ON public.officer_spouses FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        JOIN public.profiles p ON m.profile_id = p.id
        WHERE p.id = auth.uid()
        AND (
            p.priestship_id = m.priestship_id
            OR p.eldership_id = m.eldership_id
        )
    )
);

-- =====================================================
-- 3. UPDATE SERVICE_TYPE ENUM FOR ATTENDANCE_REPORTS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM (
        'Testifier',
        'Practice',
        'Wednesday Service',
        'Sunday Service',
        'Special'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update attendance_reports to use enum
ALTER TABLE public.attendance_reports 
DROP COLUMN IF EXISTS service_type CASCADE;

ALTER TABLE public.attendance_reports 
ADD COLUMN service_type service_type DEFAULT 'Sunday Service',
ADD COLUMN special_service_name TEXT; -- For 'Special' service types

-- =====================================================
-- 4. ADD SPOUSE TRACKING TO ATTENDANCE_RECORDS
-- =====================================================

ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS includes_spouse BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spouse_status TEXT CHECK (spouse_status IN ('Present', 'Absent'));

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
    '============================================' as divider
UNION ALL
SELECT 'OFFICER-SISTER RELATIONSHIPS READY' as divider
UNION ALL
SELECT '============================================' as divider;
