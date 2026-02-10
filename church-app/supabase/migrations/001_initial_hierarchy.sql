-- =====================================================
-- OAC-UDA FOUNDATION MIGRATION
-- 5-Level Hierarchy + Recruitment Pipeline
-- =====================================================

-- 1. SETUP ENUMS & EXTENSIONS
CREATE TYPE user_role AS ENUM ('apostle', 'overseer', 'elder', 'priest', 'underdeacon', 'member');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
CREATE TYPE recruitment_status AS ENUM ('prospect', 'first_visit', 'second_visit', 'attending', 'member');

-- 2. HIERARCHY TABLES
CREATE TABLE apostleships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE overseerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apostle_id UUID REFERENCES apostleships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE elderships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overseer_id UUID REFERENCES overseerships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE priestships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES elderships(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROFILES (THE BRIDGE)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'member',
    priestship_id UUID REFERENCES priestships(id),
    eldership_id UUID REFERENCES elderships(id),
    overseership_id UUID REFERENCES overseerships(id),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RECRUITMENT PIPELINE (THE SOUL TRACKER)
-- Managed by Underdeacon, visible to Priest/Elder
CREATE TABLE recruitment_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    underdeacon_id UUID REFERENCES profiles(id),
    priestship_id UUID REFERENCES priestships(id),
    eldership_id UUID REFERENCES elderships(id),
    soul_name TEXT NOT NULL,
    status recruitment_status DEFAULT 'prospect',
    demarcation_area TEXT, -- e.g., 'Centurion South'
    value_shared TEXT,     -- what was discussed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS POLICIES (THE FLOW-UP LOGIC)
ALTER TABLE recruitment_pipeline ENABLE ROW LEVEL SECURITY;

-- Underdeacons see their own entries
CREATE POLICY "Underdeacons manage their recruitment" ON recruitment_pipeline
FOR ALL USING (auth.uid() = underdeacon_id);

-- Priests see all recruitment in their Priestship
CREATE POLICY "Priests oversee branch recruitment" ON recruitment_pipeline
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'priest' 
        AND profiles.priestship_id = recruitment_pipeline.priestship_id
    )
);

-- Elders see all recruitment in their Eldership
CREATE POLICY "Elders oversee district recruitment" ON recruitment_pipeline
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'elder' 
        AND profiles.eldership_id = recruitment_pipeline.eldership_id
    )
);
