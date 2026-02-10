import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import HierarchyCanvas from '@/components/hierarchy/HierarchyCanvas';

export default async function HierarchyPage() {
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

  // Check if user is approved
  if (profile.approval_status !== 'approved') {
    redirect('/pending-approval');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">Church Hierarchy</h1>
        <p className="text-gray-600 mt-1">
          Visual overview of the church organizational structure
        </p>
      </div>

      <HierarchyCanvas userAssignmentId={profile.primary_assignment_id} />
      
      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 How to use</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Zoom:</strong> Scroll or use controls in bottom-left</li>
          <li>• <strong>Pan:</strong> Click and drag the background</li>
          <li>• <strong>Details:</strong> Click on any node to see more information</li>
          <li>• <strong>Mini-map:</strong> Use bottom-right corner for quick navigation</li>
          <li>• <strong>Debug:</strong> Click "Show Debug" to see node/edge data</li>
        </ul>
      </div>
    </div>
  );
}
