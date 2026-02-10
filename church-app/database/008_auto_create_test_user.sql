-- =====================================================
-- AUTO-CREATE TEST USER - COMPLETE SOLUTION
-- Just copy and paste this entire script into Supabase SQL Editor
-- No manual steps required!
-- =====================================================

-- This will create:
-- Email: underdeacon@centurion.com
-- Password: password123
-- Role: Underdeacon
-- Branch: Centurion South Priestship

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    p_id UUID;
    e_id UUID;
BEGIN
    -- Get hierarchy IDs from Migration 003 seed data
    SELECT id INTO p_id FROM priestships WHERE name = 'Centurion South Priestship' LIMIT 1;
    SELECT id INTO e_id FROM elderships WHERE name = 'Centurion Eldership' LIMIT 1;

    -- Check if hierarchy exists
    IF p_id IS NULL OR e_id IS NULL THEN
        RAISE EXCEPTION 'Centurion hierarchy not found! Run migration 003_seed_centurion_district.sql first.';
    END IF;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Creating test user...';
    RAISE NOTICE 'User ID will be: %', new_user_id;
    
    -- Insert directly into auth.users table
    -- This creates the authentication user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'underdeacon@centurion.com',
        crypt('password123', gen_salt('bf')),  -- Password: password123
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Underdeacon Centurion"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    RAISE NOTICE 'Auth user created successfully!';

    -- Create the profile (this will be done automatically by trigger, but we'll ensure it)
    INSERT INTO public.profiles (
        id, 
        full_name, 
        role, 
        priestship_id, 
        eldership_id, 
        is_approved
    )
    VALUES (
        new_user_id,
        'Underdeacon Centurion',
        'underdeacon'::user_role,
        p_id,
        e_id,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Underdeacon Centurion',
        role = 'underdeacon'::user_role,
        priestship_id = p_id,
        eldership_id = e_id,
        is_approved = true;

    RAISE NOTICE 'Profile created successfully!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'TEST USER CREATED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Email:    underdeacon@centurion.com';
    RAISE NOTICE 'Password: password123';
    RAISE NOTICE 'Role:     Underdeacon';
    RAISE NOTICE 'Branch:   Centurion South Priestship';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'You can now login at: http://localhost:3000/auth/login';
    RAISE NOTICE '============================================';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE NOTICE '============================================';
    RAISE NOTICE 'If you see permission denied on auth.users:';
    RAISE NOTICE '1. Go to Supabase Dashboard SQL Editor';
    RAISE NOTICE '2. Run this script in the "SQL Editor"';
    RAISE NOTICE '3. Make sure you are using service_role privileges';
    RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- VERIFICATION: Check if user was created
-- =====================================================
SELECT 
    au.email,
    p.full_name,
    p.role,
    pr.name as priestship,
    e.name as eldership,
    p.is_approved,
    'Login at: http://localhost:3000/auth/login' as next_step
FROM auth.users au
JOIN profiles p ON au.id = p.id
LEFT JOIN priestships pr ON p.priestship_id = pr.id
LEFT JOIN elderships e ON p.eldership_id = e.id
WHERE au.email = 'underdeacon@centurion.com';
