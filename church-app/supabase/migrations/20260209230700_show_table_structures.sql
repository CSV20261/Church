-- Show columns in overseererships
SELECT 
    'OVERSEERERSHIPS COLUMNS:' as info,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'overseererships'
ORDER BY ordinal_position;

-- Show columns in overseerships
SELECT 
    'OVERSEERSHIPS COLUMNS:' as info,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'overseerships'
ORDER BY ordinal_position;

-- Show actual data in overseerships (the one with data)
SELECT * FROM public.overseerships;
