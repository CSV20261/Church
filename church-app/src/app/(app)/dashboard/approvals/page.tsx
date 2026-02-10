import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Profile, LEADERSHIP_ROLES } from '@/types';
import ApprovalsList from '@/components/ApprovalsList';

export default async function ApprovalsPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Check if user is approved and has leadership role
  if (profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  if (!LEADERSHIP_ROLES.includes(profile.role)) {
    redirect('/dashboard');
  }

  // Fetch pending approvals
  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select(`
      *,
      leadership_assignments (*)
    `)
    .eq('approval_status', 'pending')
    .eq('onboarding_completed', true)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve new member registrations
        </p>
      </div>

      <ApprovalsList 
        pendingProfiles={(pendingProfiles || []) as Profile[]} 
        currentUserRole={profile.role}
        currentUserId={user.id}
      />
    </div>
  );
}
