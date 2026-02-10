-- =====================================================
-- FINALIZE PRIMARY USER IDENTITY: VUSI SHANGE
-- Update profile and ensure member sync
-- =====================================================

-- =====================================================
-- 1. ADD PHONE_NUMBER COLUMN TO PROFILES TABLE
-- =====================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);

-- =====================================================
-- 2. UPDATE VUSI SHANGE'S PROFILE
-- =====================================================

-- First, let's find and update the underdeacon profile
DO $$
DECLARE
    vusi_user_id UUID;
    p_id UUID;
    e_id UUID;
BEGIN
    -- Get the user ID for underdeacon@centurion.com
    SELECT id INTO vusi_user_id 
    FROM auth.users 
    WHERE email = 'underdeacon@centurion.com' 
    LIMIT 1;

    IF vusi_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email underdeacon@centurion.com not found!';
    END IF;

    -- Get hierarchy IDs
    SELECT id INTO p_id FROM priestships WHERE name = 'Centurion South Priestship' LIMIT 1;
    SELECT id INTO e_id FROM elderships WHERE name = 'Centurion Eldership' LIMIT 1;

    -- Update the profile with validated data
    UPDATE public.profiles
    SET 
        full_name = 'Vusi Shange',
        role = 'underdeacon'::user_role,
        priestship_id = p_id,
        eldership_id = e_id,
        is_approved = true,
        phone_number = NULL -- Will be updated later if provided
    WHERE id = vusi_user_id;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Profile updated successfully!';
    RAISE NOTICE 'User ID: %', vusi_user_id;
    RAISE NOTICE 'Full Name: Vusi Shange';
    RAISE NOTICE 'Role: underdeacon';
    RAISE NOTICE 'Priestship: Centurion South Priestship';
    RAISE NOTICE 'Eldership: Centurion Eldership';
    RAISE NOTICE '============================================';

    -- The profile-to-member sync trigger will automatically update the members table
    -- But let's verify it exists and manually sync if needed
    IF EXISTS (SELECT 1 FROM public.members WHERE profile_id = vusi_user_id) THEN
        -- Update existing member record
        UPDATE public.members
        SET 
            full_name = 'Vusi Shange',
            category = 'Officer',
            sub_category = 'Underdeacon & Sister',
            priestship_id = p_id,
            eldership_id = e_id,
            is_active = true
        WHERE profile_id = vusi_user_id;
        
        RAISE NOTICE 'Member record synced successfully!';
    ELSE
        -- Create member record if it doesn't exist (shouldn't happen with trigger)
        INSERT INTO public.members (
            profile_id,
            full_name,
            gender,
            category,
            sub_category,
            priestship_id,
            eldership_id,
            is_active
        ) VALUES (
            vusi_user_id,
            'Vusi Shange',
            'Brother',
            'Officer',
            'Underdeacon & Sister',
            p_id,
            e_id,
            true
        );
        
        RAISE NOTICE 'Member record created!';
    END IF;

END $$;

-- =====================================================
-- 3. VERIFY AUTHENTICATION LINK
-- =====================================================

-- Check that the profile is correctly linked to auth.users
SELECT 
    au.email,
    au.email_confirmed_at,
    au.created_at as auth_created_at,
    p.id as profile_id,
    p.full_name,
    p.role,
    p.is_approved,
    CASE 
        WHEN au.id = p.id THEN 'LINKED ✓'
        ELSE 'NOT LINKED ✗'
    END as auth_status
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'underdeacon@centurion.com';

-- =====================================================
-- 4. VERIFY MEMBER SYNC
-- =====================================================

-- Check that the member record is correctly synced
SELECT 
    p.full_name as profile_name,
    p.role as profile_role,
    m.full_name as member_name,
    m.category,
    m.sub_category,
    m.gender,
    pr.name as priestship,
    e.name as eldership,
    CASE 
        WHEN p.full_name = m.full_name THEN 'SYNCED ✓'
        ELSE 'OUT OF SYNC ✗'
    END as sync_status
FROM public.profiles p
JOIN public.members m ON p.id = m.profile_id
LEFT JOIN priestships pr ON m.priestship_id = pr.id
LEFT JOIN elderships e ON m.eldership_id = e.id
WHERE p.role = 'underdeacon';

-- =====================================================
-- 5. FINAL VERIFICATION
-- =====================================================

-- Show complete user identity
SELECT 
    '============================================' as divider
UNION ALL
SELECT 'PRIMARY USER IDENTITY FINALIZED' as divider
UNION ALL
SELECT '============================================' as divider
UNION ALL
SELECT 'Email: underdeacon@centurion.com' as divider
UNION ALL
SELECT 'Password: password123 (unchanged)' as divider
UNION ALL
SELECT 'Full Name: Vusi Shange' as divider
UNION ALL
SELECT 'Role: Underdeacon' as divider
UNION ALL
SELECT 'Priestship: Centurion South Priestship' as divider
UNION ALL
SELECT 'Member Status: Active' as divider
UNION ALL
SELECT '============================================' as divider;
