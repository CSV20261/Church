-- =====================================================
-- VERIFICATION QUERIES FOR CENTURION SEED DATA
-- Test the Flow-Up Logic
-- =====================================================

-- 1. VERIFY HIERARCHY STRUCTURE (Top to Bottom)
SELECT 
    a.name AS apostleship,
    o.name AS overseership,
    e.name AS eldership,
    p.name AS priestship
FROM apostleships a
LEFT JOIN overseerships o ON o.apostle_id = a.id
LEFT JOIN elderships e ON e.overseer_id = o.id
LEFT JOIN priestships p ON p.elder_id = e.id
WHERE a.name = 'Gauteng Apostleship';

-- 2. VERIFY RECRUITMENT PIPELINE DATA
SELECT 
    rp.soul_name,
    rp.status,
    rp.demarcation_area,
    rp.value_shared,
    p.name AS priestship,
    e.name AS eldership
FROM recruitment_pipeline rp
LEFT JOIN priestships p ON p.id = rp.priestship_id
LEFT JOIN elderships e ON e.id = rp.eldership_id;

-- 3. VERIFY MUSIC SCORES
SELECT 
    ms.title,
    ms.category,
    p.name AS priestship
FROM music_scores ms
LEFT JOIN priestships p ON p.id = ms.priestship_id;

-- 4. VERIFY INSTRUMENT INVENTORY
SELECT 
    ii.item_name,
    ii.condition,
    ii.assigned_to_unit,
    p.name AS priestship
FROM instrument_inventory ii
LEFT JOIN priestships p ON p.id = ii.priestship_id;

-- 5. VERIFY SPECIALIZED ACTIVITIES (FLOW-UP TEST)
-- This query simulates what an Elder would see
SELECT 
    sa.unit_name,
    sa.activity_type,
    sa.title,
    sa.description,
    sa.scheduled_at,
    p.name AS priestship,
    e.name AS eldership
FROM specialized_activities sa
LEFT JOIN priestships p ON p.id = sa.priestship_id
LEFT JOIN elderships e ON e.id = sa.eldership_id
WHERE e.name = 'Centurion Eldership';

-- 6. COUNT SUMMARY
SELECT 
    'Apostleships' AS table_name, COUNT(*) AS record_count FROM apostleships
UNION ALL
SELECT 'Overseerships', COUNT(*) FROM overseerships
UNION ALL
SELECT 'Elderships', COUNT(*) FROM elderships
UNION ALL
SELECT 'Priestships', COUNT(*) FROM priestships
UNION ALL
SELECT 'Recruitment Pipeline', COUNT(*) FROM recruitment_pipeline
UNION ALL
SELECT 'Music Scores', COUNT(*) FROM music_scores
UNION ALL
SELECT 'Instrument Inventory', COUNT(*) FROM instrument_inventory
UNION ALL
SELECT 'Specialized Activities', COUNT(*) FROM specialized_activities;
