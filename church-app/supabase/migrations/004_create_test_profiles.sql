-- =====================================================
-- OAC-UDA TEST PROFILES - ACCESS CONTROL LAYER
-- Helper function to link users to profiles after manual creation
-- =====================================================

-- NOTE: Due to auth.users restrictions, you need to create users via Supabase Dashboard first
-- Then run the profile linking SQL below with actual user IDs

-- Create a helper function to auto-create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, is_approved)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MANUAL SETUP INSTRUCTIONS:
-- =============================
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/bcmabkpgifygnpxppzqd/auth/users
-- 2. Click "Add User" and create these three users:
--    - Email: underdeacon@centurion.com, Password: password123
--    - Email: priest@centurion.com, Password: password123
--    - Email: elder@centurion.com, Password: password123
-- 3. Copy each user's ID (UUID) from the dashboard
-- 4. Run the SQL below, replacing the UUIDs with actual IDs:

/*
-- Get the hierarchy IDs
DO $$
DECLARE
    p_id UUID := (SELECT id FROM priestships WHERE name = 'Centurion South Priestship' LIMIT 1);
    e_id UUID := (SELECT id FROM elderships WHERE name = 'Centurion Eldership' LIMIT 1);
BEGIN
    -- Update profiles with roles and assignments
    -- Replace 'UNDERDEACON_USER_ID' with actual UUID from dashboard
    UPDATE profiles 
    SET full_name = 'Underdeacon Centurion',
        role = 'underdeacon',
        priestship_id = p_id,
        eldership_id = e_id,
        is_approved = true
    WHERE id = 'UNDERDEACON_USER_ID'::uuid;

    -- Replace 'PRIEST_USER_ID' with actual UUID from dashboard
    UPDATE profiles 
    SET full_name = 'Priest Centurion South',
        role = 'priest',
        priestship_id = p_id,
        eldership_id = e_id,
        is_approved = true
    WHERE id = 'PRIEST_USER_ID'::uuid;

    -- Replace 'ELDER_USER_ID' with actual UUID from dashboard
    UPDATE profiles 
    SET full_name = 'Elder Pretoria-Centurion',
        role = 'elder',
        eldership_id = e_id,
        is_approved = true
    WHERE id = 'ELDER_USER_ID'::uuid;

    RAISE NOTICE 'Profiles updated successfully!';
END $$;
*/
