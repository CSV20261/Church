import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AccordionRegisterClient from './AccordionRegisterClient';

// =====================================================
// ATTENDANCE REGISTER - Server Component
// Dynamic register with Six Pillar dropdowns
// =====================================================

export default async function AttendanceRegisterPage() {
  const supabase = await createClient();
  
  // Get the current session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch user profile with full hierarchy (with names)
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, 
      full_name, 
      role, 
      apostleship_id,
      overseership_id,
      eldership_id,
      priestship_id,
      apostleships:apostleship_id(name)
    `)
    .eq('id', user.id)
    .single();

  // Fetch hierarchy names separately from members table (which has the correct FKs)
  const { data: memberHierarchy } = await supabase
    .from('members')
    .select(`
      overseererships:overseership_id(name),
      elderships:eldership_id(name),
      priestships:priestship_id(name)
    `)
    .eq('full_name', profile?.full_name)
    .single();

  // Verify role access
  if (profile?.role !== 'underdeacon' && profile?.role !== 'priest' && profile?.role !== 'elder') {
    redirect('/dashboard');
  }

  // Filter members based on user's role and hierarchy
  let membersQuery = supabase
    .from('members')
    .select('id, title, first_name, last_name, full_name, gender, gift, category')
    .eq('is_active', true);

  // Apply filtering based on role
  if (profile.role === 'underdeacon' || profile.role === 'priest') {
    // Underdeacons and Priests see only their priestship
    membersQuery = membersQuery.eq('priestship_id', profile.priestship_id);
  } else if (profile.role === 'elder') {
    // Elders see all priestships in their eldership
    membersQuery = membersQuery.eq('eldership_id', profile.eldership_id);
  }

  const { data: members } = await membersQuery
    .order('category')
    .order('gift')
    .order('full_name');

  const membersList = members || [];

  // Group members by Six Pillars categories
  const membersByCategory = membersList.reduce((acc, member) => {
    const category = member.category || 'Adult';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(member);
    
    return acc;
  }, {} as Record<string, typeof membersList>);

  return (
    <AccordionRegisterClient 
      profileName={profile?.full_name || 'Underdeacon'}
      profile={{
        id: profile.id,
        full_name: profile.full_name || '',
        role: profile.role || '',
        apostleship_id: profile.apostleship_id,
        overseership_id: profile.overseership_id,
        eldership_id: profile.eldership_id,
        priestship_id: profile.priestship_id,
        apostleship_name: (profile.apostleships as any)?.name || null,
        overseership_name: (memberHierarchy?.overseererships as any)?.name || null,
        eldership_name: (memberHierarchy?.elderships as any)?.name || null,
        priestship_name: (memberHierarchy?.priestships as any)?.name || null,
      }}
      membersByCategory={membersByCategory}
    />
  );
}
