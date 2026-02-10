# 🚨 URGENT: SQL Fixes Required

## Two Database Issues Blocking Member Addition

The "Failed to add member" error is caused by **TWO database permission/constraint issues**. Both must be fixed in Supabase.

---

## Fix #1: RLS Policy (Permissions)
**Problem:** Underdeacons can't INSERT into the members table because the RLS policy doesn't include their role.

**Solution:** Run this in Supabase SQL Editor:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Leadership can manage members" ON public.members;

-- Recreate with underdeacon and deacon included
CREATE POLICY "Leadership can manage members" ON public.members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('apostle', 'overseer_shepherd', 'evangelist', 'prophet', 'elder', 'priest', 'underdeacon', 'deacon')
            AND profiles.approval_status = 'approved'
        )
    );
```

---

## Fix #2: Category Constraint (Validation)
**Problem:** Database only allows 4 categories: `'Officer', 'Adult', 'Youth', 'Sunday School'`  
But app sends 6 categories including: `'Senior Citizen'` and `'Young Adult'`

**Solution:** Run this in Supabase SQL Editor:

```sql
-- Drop old constraint
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_category_check;

-- Add new constraint with all six pillars
ALTER TABLE public.members
ADD CONSTRAINT members_category_check 
CHECK (category IN ('Officer', 'Senior Citizen', 'Adult', 'Young Adult', 'Youth', 'Sunday School'));
```

---

## How to Apply (Supabase Dashboard)

1. Go to: https://supabase.com/dashboard/project/bcmabkpgifygnpxppzqd
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Copy and paste **BOTH** SQL blocks above (Fix #1 then Fix #2)
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see success messages for both

---

## After Applying

1. Go to http://localhost:3000/underdeacon/attendance
2. Click "Add" on any pillar category (e.g., YOUTH)
3. Fill in member details
4. Click "Add Member"
5. Check the browser console for detailed logs showing:
   - `🔵 [AddMemberModal] Submitting payload:`
   - `🔵 [API] Attempting to insert member`
   - `✅ Member added successfully:`

If you still see errors, the console will now show the **exact** error message from Supabase!

---

## Expected Result

✅ Success message: "Member Added! Name: [name], Category: [category], Gift: [gift]"  
✅ Page refreshes and new member appears in the dropdown
