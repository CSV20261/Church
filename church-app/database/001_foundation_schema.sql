-- ============================================================
-- OLDER APOSTOLIC CHURCH - FOUNDATION REBUILD
-- Schema Version: 2.0
-- Date: January 2025
-- Description: New hierarchical structure for church management
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================================

-- Role enum (updated hierarchy)
DO $$ BEGIN
    CREATE TYPE role_type AS ENUM (
        'apostle',           -- Level 1 - Highest
        'evangelist',        -- Level 2 - Fourfold
        'prophet',           -- Level 2 - Fourfold
        'overseer_shepherd', -- Level 2 - Fourfold
        'elder',             -- Level 3
        'priest',            -- Level 4
        'underdeacon',       -- Level 5
        'member'             -- Level 6 - No app access until approved
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Role subtype enum
DO $$ BEGIN
    CREATE TYPE role_subtype_type AS ENUM (
        'shepherd',    -- Works with 1 unit only
        'specialist'   -- Works with 2+ units OR specific division focus
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Specialist type enum
DO $$ BEGIN
    CREATE TYPE specialist_type AS ENUM (
        'youth',
        'young_adult',
        'adult',
        'senior_citizen',
        'sunday_school',
        'evangelism'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Approval status enum
DO $$ BEGIN
    CREATE TYPE approval_status_type AS ENUM (
        'pending',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Assignment type enum
DO $$ BEGIN
    CREATE TYPE assignment_type AS ENUM (
        'primary',
        'additional'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Unit type enum (for leadership assignments)
DO $$ BEGIN
    CREATE TYPE unit_type AS ENUM (
        'apostleship',
        'overseership',
        'eldership',
        'priestship',
        'specialist'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Administrative division type enum
DO $$ BEGIN
    CREATE TYPE admin_division_type AS ENUM (
        'youth',
        'adult',
        'young_adult',
        'senior_citizen',
        'sunday_school',
        'evangelism'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Administrative division level enum
DO $$ BEGIN
    CREATE TYPE admin_division_level AS ENUM (
        'apostleship',
        'overseership',
        'eldership'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- STEP 2: CREATE NEW HIERARCHICAL TABLES
-- ============================================================

-- 1. APOSTLESHIP TABLE (Top level - led by Apostle)
CREATE TABLE IF NOT EXISTS apostleship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    apostle_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for apostle lookup
CREATE INDEX IF NOT EXISTS idx_apostleship_apostle ON apostleship(apostle_id);

-- 2. OVERSEERSHIPS TABLE (Led by Fourfold Officers - Overseer/Shepherd)
CREATE TABLE IF NOT EXISTS overseerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    apostleship_id UUID REFERENCES apostleship(id) ON DELETE CASCADE,
    overseer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_overseerships_apostleship ON overseerships(apostleship_id);
CREATE INDEX IF NOT EXISTS idx_overseerships_overseer ON overseerships(overseer_id);

-- 3. ELDERSHIPS TABLE (Led by Elders)
CREATE TABLE IF NOT EXISTS elderships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    overseership_id UUID REFERENCES overseerships(id) ON DELETE CASCADE,
    elder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_elderships_overseership ON elderships(overseership_id);
CREATE INDEX IF NOT EXISTS idx_elderships_elder ON elderships(elder_id);

-- 4. PRIESTSHIPS TABLE (Led by Priests - lowest pastoral unit)
CREATE TABLE IF NOT EXISTS priestships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    eldership_id UUID REFERENCES elderships(id) ON DELETE CASCADE,
    priest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    meeting_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_priestships_eldership ON priestships(eldership_id);
CREATE INDEX IF NOT EXISTS idx_priestships_priest ON priestships(priest_id);

-- 5. ADMINISTRATIVE DIVISIONS TABLE (Cross-cutting divisions)
CREATE TABLE IF NOT EXISTS administrative_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type admin_division_type NOT NULL,
    level admin_division_level NOT NULL,
    -- Parent can be apostleship, overseership, or eldership based on level
    apostleship_id UUID REFERENCES apostleship(id) ON DELETE CASCADE,
    overseership_id UUID REFERENCES overseerships(id) ON DELETE CASCADE,
    eldership_id UUID REFERENCES elderships(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: exactly one parent based on level
    CONSTRAINT valid_parent CHECK (
        (level = 'apostleship' AND apostleship_id IS NOT NULL AND overseership_id IS NULL AND eldership_id IS NULL) OR
        (level = 'overseership' AND overseership_id IS NOT NULL AND apostleship_id IS NULL AND eldership_id IS NULL) OR
        (level = 'eldership' AND eldership_id IS NOT NULL AND apostleship_id IS NULL AND overseership_id IS NULL)
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_divisions_apostleship ON administrative_divisions(apostleship_id);
CREATE INDEX IF NOT EXISTS idx_admin_divisions_overseership ON administrative_divisions(overseership_id);
CREATE INDEX IF NOT EXISTS idx_admin_divisions_eldership ON administrative_divisions(eldership_id);
CREATE INDEX IF NOT EXISTS idx_admin_divisions_leader ON administrative_divisions(leader_id);
CREATE INDEX IF NOT EXISTS idx_admin_divisions_type ON administrative_divisions(type);

-- 6. LEADERSHIP ASSIGNMENTS TABLE (Flexible assignment system)
CREATE TABLE IF NOT EXISTS leadership_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_type assignment_type NOT NULL DEFAULT 'primary',
    unit_type unit_type NOT NULL,
    -- Unit IDs (nullable based on unit_type)
    apostleship_id UUID REFERENCES apostleship(id) ON DELETE CASCADE,
    overseership_id UUID REFERENCES overseerships(id) ON DELETE CASCADE,
    eldership_id UUID REFERENCES elderships(id) ON DELETE CASCADE,
    priestship_id UUID REFERENCES priestships(id) ON DELETE CASCADE,
    admin_division_id UUID REFERENCES administrative_divisions(id) ON DELETE CASCADE,
    -- For specialists
    specialist_type specialist_type,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: Only one primary assignment per user
    CONSTRAINT unique_primary_assignment UNIQUE (profile_id, assignment_type) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leadership_profile ON leadership_assignments(profile_id);
CREATE INDEX IF NOT EXISTS idx_leadership_unit_type ON leadership_assignments(unit_type);
CREATE INDEX IF NOT EXISTS idx_leadership_active ON leadership_assignments(is_active);

-- ============================================================
-- STEP 3: MODIFY PROFILES TABLE
-- ============================================================

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role role_type DEFAULT 'member',
ADD COLUMN IF NOT EXISTS role_subtype role_subtype_type,
ADD COLUMN IF NOT EXISTS approval_status approval_status_type DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_assignment_id UUID,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add foreign key for primary_assignment_id after leadership_assignments table exists
DO $$ BEGIN
    ALTER TABLE profiles 
    ADD CONSTRAINT fk_primary_assignment 
    FOREIGN KEY (primary_assignment_id) 
    REFERENCES leadership_assignments(id) 
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create index for approval lookups
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- STEP 4: MODIFY MEMBERS TABLE
-- ============================================================

-- Add new columns to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS priestship_id UUID REFERENCES priestships(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approval_status approval_status_type DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index
CREATE INDEX IF NOT EXISTS idx_members_priestship ON members(priestship_id);
CREATE INDEX IF NOT EXISTS idx_members_approval_status ON members(approval_status);

-- ============================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to get role hierarchy level (lower = higher authority)
CREATE OR REPLACE FUNCTION get_role_level(r role_type)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE r
        WHEN 'apostle' THEN 1
        WHEN 'evangelist' THEN 2
        WHEN 'prophet' THEN 2
        WHEN 'overseer_shepherd' THEN 2
        WHEN 'elder' THEN 3
        WHEN 'priest' THEN 4
        WHEN 'underdeacon' THEN 5
        WHEN 'member' THEN 6
        ELSE 99
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user can approve another user
CREATE OR REPLACE FUNCTION can_approve_user(approver_id UUID, target_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    approver_role role_type;
    target_role role_type;
    approver_level INTEGER;
    target_level INTEGER;
BEGIN
    SELECT role INTO approver_role FROM profiles WHERE id = approver_id;
    SELECT role INTO target_role FROM profiles WHERE id = target_id;
    
    approver_level := get_role_level(approver_role);
    target_level := get_role_level(target_role);
    
    -- Approver must have higher authority (lower level number)
    RETURN approver_level < target_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's hierarchical path
CREATE OR REPLACE FUNCTION get_user_hierarchy_path(user_id UUID)
RETURNS TABLE (
    apostleship_id UUID,
    apostleship_name TEXT,
    overseership_id UUID,
    overseership_name TEXT,
    eldership_id UUID,
    eldership_name TEXT,
    priestship_id UUID,
    priestship_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as apostleship_id,
        a.name as apostleship_name,
        o.id as overseership_id,
        o.name as overseership_name,
        e.id as eldership_id,
        e.name as eldership_name,
        p.id as priestship_id,
        p.name as priestship_name
    FROM leadership_assignments la
    LEFT JOIN priestships p ON la.priestship_id = p.id
    LEFT JOIN elderships e ON COALESCE(la.eldership_id, p.eldership_id) = e.id
    LEFT JOIN overseerships o ON COALESCE(la.overseership_id, e.overseership_id) = o.id
    LEFT JOIN apostleship a ON COALESCE(la.apostleship_id, o.apostleship_id) = a.id
    WHERE la.profile_id = user_id AND la.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 6: CREATE UPDATED_AT TRIGGERS
-- ============================================================

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
DROP TRIGGER IF EXISTS update_apostleship_updated_at ON apostleship;
CREATE TRIGGER update_apostleship_updated_at
    BEFORE UPDATE ON apostleship
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_overseerships_updated_at ON overseerships;
CREATE TRIGGER update_overseerships_updated_at
    BEFORE UPDATE ON overseerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_elderships_updated_at ON elderships;
CREATE TRIGGER update_elderships_updated_at
    BEFORE UPDATE ON elderships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_priestships_updated_at ON priestships;
CREATE TRIGGER update_priestships_updated_at
    BEFORE UPDATE ON priestships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_divisions_updated_at ON administrative_divisions;
CREATE TRIGGER update_admin_divisions_updated_at
    BEFORE UPDATE ON administrative_divisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leadership_assignments_updated_at ON leadership_assignments;
CREATE TRIGGER update_leadership_assignments_updated_at
    BEFORE UPDATE ON leadership_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE apostleship ENABLE ROW LEVEL SECURITY;
ALTER TABLE overseerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderships ENABLE ROW LEVEL SECURITY;
ALTER TABLE priestships ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 8: CREATE RLS POLICIES
-- ============================================================

-- APOSTLESHIP POLICIES
CREATE POLICY "Anyone can view apostleships" ON apostleship
    FOR SELECT USING (true);

CREATE POLICY "Apostles can manage apostleships" ON apostleship
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'apostle' 
            AND approval_status = 'approved'
        )
    );

-- OVERSEERSHIPS POLICIES
CREATE POLICY "Approved users can view overseerships" ON overseerships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Apostles and overseers can manage overseerships" ON overseerships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet')
            AND approval_status = 'approved'
        )
    );

-- ELDERSHIPS POLICIES
CREATE POLICY "Approved users can view elderships" ON elderships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Leadership can manage elderships" ON elderships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder')
            AND approval_status = 'approved'
        )
    );

-- PRIESTSHIPS POLICIES
CREATE POLICY "Approved users can view priestships" ON priestships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Leadership can manage priestships" ON priestships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

-- ADMINISTRATIVE DIVISIONS POLICIES
CREATE POLICY "Approved users can view admin divisions" ON administrative_divisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Leadership can manage admin divisions" ON administrative_divisions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder')
            AND approval_status = 'approved'
        )
    );

-- LEADERSHIP ASSIGNMENTS POLICIES
CREATE POLICY "Users can view own assignments" ON leadership_assignments
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Leadership can view all assignments in hierarchy" ON leadership_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND approval_status = 'approved'
        )
    );

CREATE POLICY "Leadership can manage assignments" ON leadership_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder')
            AND approval_status = 'approved'
        )
    );

-- PROFILES POLICIES (Update existing)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Approved users can view other profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.approval_status = 'approved'
        )
    );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Leadership can update profiles for approval" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest')
            AND p.approval_status = 'approved'
        )
    );

-- ============================================================
-- STEP 9: ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE apostleship;
ALTER PUBLICATION supabase_realtime ADD TABLE overseerships;
ALTER PUBLICATION supabase_realtime ADD TABLE elderships;
ALTER PUBLICATION supabase_realtime ADD TABLE priestships;
ALTER PUBLICATION supabase_realtime ADD TABLE administrative_divisions;
ALTER PUBLICATION supabase_realtime ADD TABLE leadership_assignments;

-- ============================================================
-- COMPLETE!
-- ============================================================

-- Summary of tables created:
-- 1. apostleship - Top level organizational unit
-- 2. overseerships - Second level, under apostleship
-- 3. elderships - Third level, under overseership
-- 4. priestships - Fourth level, under eldership
-- 5. administrative_divisions - Cross-cutting divisions (Youth, Adult, etc.)
-- 6. leadership_assignments - Flexible assignment tracking

-- Summary of modifications:
-- 1. profiles - Added role, approval_status, assignment tracking
-- 2. members - Added priestship_id, approval_status

-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update TypeScript types
-- 3. Build onboarding wizard
