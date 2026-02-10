import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// UNIFIED DASHBOARD ROUTER
// Redirects users to their role-specific dashboard
// =====================================================
export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get the current session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // If no session, redirect to login
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', user.id)
    .single();

  // If no profile exists, create a basic one and redirect to onboarding
  if (profileError && profileError.code === 'PGRST116') {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'member',
        is_approved: false,
      })
      .select('role')
      .single();

    if (insertError) {
      console.error('Error creating profile:', JSON.stringify(insertError, null, 2));
      redirect('/auth/login?error=profile_creation_failed');
    }
    
    redirect('/onboarding');
  }

  // If profile exists but not approved, redirect to pending approval page
  if (profile && !profile.is_approved) {
    redirect('/pending-approval');
  }

  // Role-based redirect logic
  const role = profile?.role || 'member';
  
  switch (role) {
    case 'underdeacon':
      redirect('/underdeacon/dashboard');
    case 'priest':
      redirect('/priest/dashboard');
    case 'elder':
      redirect('/elder/dashboard');
    case 'overseer':
      redirect('/overseer/dashboard');
    case 'apostle':
      redirect('/apostle/dashboard');
    case 'member':
    default:
      redirect('/member/dashboard');
  }

}
