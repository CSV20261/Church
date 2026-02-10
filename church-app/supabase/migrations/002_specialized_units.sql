-- =====================================================
-- OAC-UDA SPECIALIZED UNITS MIGRATION
-- Music & Arts Vault + Sunday School/Young Adult Infrastructure
-- =====================================================

-- 1. MUSIC & ARTS VAULT
CREATE TABLE music_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT, -- e.g., 'Hymn', 'Choir', 'Sunday School'
    sheet_music_url TEXT, -- Link to document/PDF
    lyrics TEXT,
    created_by UUID REFERENCES profiles(id),
    priestship_id UUID REFERENCES priestships(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE instrument_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    serial_number TEXT,
    condition TEXT DEFAULT 'good', -- good, needs_repair, broken
    assigned_to_unit TEXT, -- e.g., 'Young Adult', 'Sunday School'
    priestship_id UUID REFERENCES priestships(id),
    last_inspected_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SPECIALIZED UNIT ACTIVITIES (Sunday School, Young Adults, Youth)
CREATE TABLE specialized_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name TEXT NOT NULL, -- 'Sunday School', 'Young Adult', 'Youth'
    activity_type TEXT NOT NULL, -- 'Practice', 'Lesson', 'Social', 'Service'
    title TEXT NOT NULL,
    description TEXT,
    underdeacon_id UUID REFERENCES profiles(id),
    priestship_id UUID REFERENCES priestships(id),
    eldership_id UUID REFERENCES elderships(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS POLICIES FOR SPECIALIZED UNITS
ALTER TABLE music_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialized_activities ENABLE ROW LEVEL SECURITY;

-- Visibility: Underdeacons create/manage, Priests/Elders oversee (Flow-up logic)
CREATE POLICY "Underdeacon music management" ON music_scores FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Priest music oversight" ON music_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'priest' AND profiles.priestship_id = music_scores.priestship_id)
);

CREATE POLICY "Branch instrument access" ON instrument_inventory FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.priestship_id = instrument_inventory.priestship_id)
);

CREATE POLICY "Activity oversight" ON specialized_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.priestship_id = specialized_activities.priestship_id OR profiles.eldership_id = specialized_activities.eldership_id))
);
