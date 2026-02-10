-- =====================================================
-- OAC-UDA CENTURION SEED DATA
-- Brings the hierarchy to life with real test data
-- =====================================================

-- 1. SEED HIERARCHY (Top Down)
-- Create Gauteng Apostleship
INSERT INTO apostleships (name) VALUES ('Gauteng Apostleship');

-- Create Pretoria Overseership under Gauteng
INSERT INTO overseerships (apostle_id, name) 
VALUES ((SELECT id FROM apostleships WHERE name = 'Gauteng Apostleship'), 'Pretoria Overseership');

-- Create Centurion Eldership under Pretoria
INSERT INTO elderships (overseer_id, name) 
VALUES ((SELECT id FROM overseerships WHERE name = 'Pretoria Overseership'), 'Centurion Eldership');

-- Create Centurion South Priestship under Centurion
INSERT INTO priestships (elder_id, name) 
VALUES ((SELECT id FROM elderships WHERE name = 'Centurion Eldership'), 'Centurion South Priestship');

-- 2. SEED SAMPLE RECRUITMENT (The Underdeacon's Work)
INSERT INTO recruitment_pipeline (soul_name, status, demarcation_area, value_shared, notes, priestship_id, eldership_id)
VALUES 
('John Doe', 'prospect', 'Centurion Central', 'Shared the value of the New Season', 'Met at the community center', 
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship'), 
 (SELECT id FROM elderships WHERE name = 'Centurion Eldership')),
('Sarah Smith', 'first_visit', 'Centurion West', 'Invited to Sunday School', 'Parent of a potential Sunday School member',
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship'), 
 (SELECT id FROM elderships WHERE name = 'Centurion Eldership'));

-- 3. SEED MUSIC VAULT
INSERT INTO music_scores (title, category, lyrics, priestship_id)
VALUES 
('Joy to the World', 'Sunday School', 'Joy to the world, the Lord is come...', 
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship')),
('Ancient of Days', 'Choir', 'Blessing and honor, glory and power...', 
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship'));

-- 4. SEED INSTRUMENT INVENTORY
INSERT INTO instrument_inventory (item_name, condition, assigned_to_unit, priestship_id)
VALUES 
('Yamaha Keyboard', 'good', 'Young Adult', 
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship')),
('Sunday School PA System', 'needs_repair', 'Sunday School', 
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship'));

-- 5. SEED ACTIVITIES
INSERT INTO specialized_activities (unit_name, activity_type, title, description, scheduled_at, priestship_id, eldership_id)
VALUES 
('Young Adult', 'Practice', 'Choir Rehearsal', 'Preparation for Socials Festival', now() + interval '2 days', 
 (SELECT id FROM priestships WHERE name = 'Centurion South Priestship'), 
 (SELECT id FROM elderships WHERE name = 'Centurion Eldership'));
