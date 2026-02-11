import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import { Profile, LeadershipAssignment, LEADERSHIP_ROLES } from '@/types';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile: Profile | null = null;
  let assignments: LeadershipAssignment[] = [];
  let pendingApprovalsCount = 0;

  if (user) {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    profile = profileData;

    // Fetch leadership assignments with related data
    if (profile) {
      const { data: assignmentsData } = await supabase
        .from('leadership_assignments')
        .select(`
          *,
          apostleship:apostleship_id (*),
          overseership:overseership_id (*),
          eldership:eldership_id (*),
          priestship:priestship_id (*)
        `)
        .eq('profile_id', user.id)
        .eq('is_active', true);
      
      assignments = (assignmentsData || []) as LeadershipAssignment[];

      // Get pending approvals count for leaders
      if (LEADERSHIP_ROLES.includes(profile.role)) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending')
          .eq('onboarding_completed', true);
        
        pendingApprovalsCount = count || 0;
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        profile={profile}
        userEmail={user?.email || null}
        assignments={assignments}
        pendingApprovalsCount={pendingApprovalsCount}
      />
      <main>
        {children}
      </main>
    </div>
  );
}
