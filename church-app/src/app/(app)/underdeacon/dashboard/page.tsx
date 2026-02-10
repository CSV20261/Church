import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UnderdeaconDashboardClient from './UnderdeaconDashboardClient';

// =====================================================
// UNDERDEACON DASHBOARD - Server Component
// Fetches data and passes to Command Center UI
// =====================================================

interface RecruitmentRecord {
  id: string;
  soul_name: string;
  status: string;
  demarcation_area: string;
  value_shared: string;
  notes: string;
  created_at: string;
}

export default async function UnderdeaconDashboard() {
  const supabase = await createClient();
  
  // Get the current session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, priestship_id, eldership_id')
    .eq('id', user.id)
    .single();

  // Verify role access
  if (profile?.role !== 'underdeacon') {
    redirect('/dashboard');
  }

  // Fetch Recruitment Pipeline data seeded in Migration 003
  const { data: recruitmentData } = await supabase
    .from('recruitment_pipeline')
    .select('*')
    .eq('priestship_id', profile.priestship_id)
    .order('created_at', { ascending: false });

  const recruitment: RecruitmentRecord[] = recruitmentData || [];

  // Get counts by status for stats and funnel
  const prospectCount = recruitment.filter(r => r.status === 'prospect').length;
  const firstVisitCount = recruitment.filter(r => r.status === 'first_visit').length;
  const secondVisitCount = recruitment.filter(r => r.status === 'second_visit').length;
  const regularCount = recruitment.filter(r => r.status === 'regular_attendee').length;

  // Calculate total prospects
  const totalProspects = recruitment.length;

  // Pass data to client component
  return (
    <UnderdeaconDashboardClient 
      profileName={profile?.full_name || 'Underdeacon Centurion'}
      totalProspects={totalProspects}
      prospectCount={prospectCount}
      firstVisitCount={firstVisitCount}
      secondVisitCount={secondVisitCount}
      regularCount={regularCount}
      recruitment={recruitment}
    />
  );
}
