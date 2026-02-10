-- Diagnostic query to check table structure
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if overseererships exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'overseererships'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Table "overseererships" EXISTS';
    ELSE
        RAISE NOTICE '❌ Table "overseererships" DOES NOT EXIST';
    END IF;
    
    -- Check if overseerships exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'overseerships'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Table "overseerships" EXISTS';
    ELSE
        RAISE NOTICE '❌ Table "overseerships" DOES NOT EXIST';
    END IF;
END $$;

-- Show foreign key on members table
SELECT 
    'Foreign Key: ' || tc.constraint_name as info,
    'Column: ' || kcu.column_name as column_info,
    'References: ' || ccu.table_name as ref_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='members'
AND kcu.column_name LIKE '%overseer%';
