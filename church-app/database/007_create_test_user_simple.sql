-- =====================================================
-- SIMPLE APPROACH: CREATE TEST USER
-- =====================================================
-- Run this AFTER creating the user via Supabase Dashboard
-- 
-- STEP 1: Go to Supabase Dashboard
-- https://supabase.com/dashboard/project/bcmabkpgifygnpxppzqd/auth/users
-- Click "Add User" → "Create new user"
-- Email: underdeacon@centurion.com
-- Password: password123
-- ✓ Auto Confirm User
-- 
-- STEP 2: Copy the User ID (UUID) from the dashboard
-- 
-- STEP 3: Replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- 
-- STEP 4: Run this SQL in Supabase SQL Editor
-- =====================================================

DO $$
DECLARE
    p_id UUID;
    e_id UUID;
    user_uuid UUID := 'YOUR_USER_ID_HERE'::uuid; -- REPLACE THIS WITH ACTUAL USER ID
BEGIN
    -- Get hierarchy IDs from Migration 003 seed data
    SELECT id INTO p_id FROM priestships WHERE name = 'Centurion South Priestship' LIMIT 1;
    SELECT id INTO e_id FROM elderships WHERE name = 'Centurion Eldership' LIMIT 1;

    -- Check if hierarchy exists
    IF p_id IS NULL OR e_id IS NULL THEN
        RAISE EXCEPTION 'Centurion hierarchy not found! Run migration 003 first.';
    END IF;

    -- Update or insert profile
    INSERT INTO public.profiles (
        id, 
        full_name, 
        role, 
        priestship_id, 
        eldership_id, 
        is_approved, 
        onboarding_completed
    )
    VALUES (
        user_uuid,
        'Underdeacon Centurion',
        'underdeacon',
        p_id,
        e_id,
        true,
        true
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        full_name = 'Underdeacon Centurion',
        role = 'underdeacon',
        priestship_id = p_id,
        eldership_id = e_id,
        is_approved = true,
        onboarding_completed = true;

    RAISE NOTICE 'Profile updated successfully for user: %', user_uuid;
    RAISE NOTICE 'Priestship ID: %', p_id;
    RAISE NOTICE 'Eldership ID: %', e_id;
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify the profile was created correctly
-- =====================================================
SELECT 
    p.id,
    p.full_name,
    p.role,
    pr.name as priestship,
    e.name as eldership,
    p.is_approved,
    p.onboarding_completed
FROM profiles p
LEFT JOIN priestships pr ON p.priestship_id = pr.id
LEFT JOIN elderships e ON p.eldership_id = e.id
WHERE p.role = 'underdeacon';
