import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// ELDER DASHBOARD
// Focus: District Analytics, Growth Stats Across Priestships
// =====================================================

interface Priestship {
  id: string;
  name: string;
  member_count?: number;
}

interface RecruitmentStats {
  total: number;
  by_status: {
    prospect: number;
    first_visit: number;
    second_visit: number;
    regular_attendee: number;
  };
}

export default async function ElderDashboard() {
  const supabase = await createClient();
  
  // Get the current session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, eldership_id')
    .eq('id', user.id)
    .single();

  // Verify role access
  if (profile?.role !== 'elder') {
    redirect('/dashboard');
  }

  // Fetch all priestships under this eldership
  const { data: priestships } = await supabase
    .from('priestships')
    .select('id, name')
    .eq('elder_id', profile.eldership_id)
    .order('name');

  const priestshipList: Priestship[] = priestships || [];

  // Fetch eldership details
  const { data: eldership } = await supabase
    .from('elderships')
    .select('name')
    .eq('id', profile.eldership_id)
    .single();

  // Fetch all members across all priestships in the eldership
  const { data: allMembers } = await supabase
    .from('profiles')
    .select('id, priestship_id, is_approved')
    .eq('eldership_id', profile.eldership_id);

  const totalMembers = allMembers?.length || 0;
  const approvedMembers = allMembers?.filter(m => m.is_approved).length || 0;

  // Fetch recruitment data across all priestships
  const { data: recruitmentData } = await supabase
    .from('recruitment_pipeline')
    .select('id, status')
    .eq('eldership_id', profile.eldership_id);

  const recruitmentStats: RecruitmentStats = {
    total: recruitmentData?.length || 0,
    by_status: {
      prospect: recruitmentData?.filter(r => r.status === 'prospect').length || 0,
      first_visit: recruitmentData?.filter(r => r.status === 'first_visit').length || 0,
      second_visit: recruitmentData?.filter(r => r.status === 'second_visit').length || 0,
      regular_attendee: recruitmentData?.filter(r => r.status === 'regular_attendee').length || 0,
    }
  };

  // Calculate member count per priestship
  const priestshipsWithCounts = priestshipList.map(p => ({
    ...p,
    member_count: allMembers?.filter(m => m.priestship_id === p.id).length || 0
  }));

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          District Analytics
        </h1>
        <p className="text-neutral-600 mt-2">
          {eldership?.name || 'Eldership'} - Overview & Growth Stats
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm text-neutral-600 font-medium">Total Priestships</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{priestshipList.length}</div>
          <div className="text-xs text-neutral-500 mt-1">Under eldership</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm text-neutral-600 font-medium">Total Members</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{totalMembers}</div>
          <div className="text-xs text-neutral-500 mt-1">Across all branches</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm text-neutral-600 font-medium">Approved Members</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{approvedMembers}</div>
          <div className="text-xs text-neutral-500 mt-1">Active & verified</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm text-neutral-600 font-medium">Recruitment Pipeline</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{recruitmentStats.total}</div>
          <div className="text-xs text-neutral-500 mt-1">Souls in pipeline</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Priestship Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              Priestships Overview
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Branch performance across the district
            </p>
          </div>
          <div className="p-6">
            {priestshipsWithCounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No priestships found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priestshipsWithCounts.map((priestship) => (
                  <div key={priestship.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                    <div>
                      <p className="font-medium text-neutral-900">{priestship.name}</p>
                      <p className="text-sm text-neutral-600">Branch location</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-neutral-900">{priestship.member_count}</p>
                      <p className="text-xs text-neutral-500">members</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recruitment Pipeline Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              Soul-Winning Pipeline
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              District-wide recruitment funnel
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Prospects</p>
                  <p className="text-sm text-neutral-600">Initial contact made</p>
                </div>
                <div className="text-2xl font-bold text-primary-600">
                  {recruitmentStats.by_status.prospect}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">First Visit</p>
                  <p className="text-sm text-neutral-600">Attended once</p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {recruitmentStats.by_status.first_visit}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Second Visit</p>
                  <p className="text-sm text-neutral-600">Returning visitors</p>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {recruitmentStats.by_status.second_visit}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Regular Attendees</p>
                  <p className="text-sm text-neutral-600">Consistent participation</p>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {recruitmentStats.by_status.regular_attendee}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            Growth Statistics
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Track progress across all priestships in your district
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-sm text-green-700 font-medium mb-2">Conversion Rate</div>
              <div className="text-4xl font-bold text-green-900">
                {recruitmentStats.total > 0 
                  ? Math.round((recruitmentStats.by_status.regular_attendee / recruitmentStats.total) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-green-600 mt-2">Prospect to Regular</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-sm text-blue-700 font-medium mb-2">Active Pipeline</div>
              <div className="text-4xl font-bold text-blue-900">
                {recruitmentStats.by_status.prospect + recruitmentStats.by_status.first_visit}
              </div>
              <div className="text-xs text-primary-600 mt-2">Prospects + First Visits</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-sm text-purple-700 font-medium mb-2">Approval Rate</div>
              <div className="text-4xl font-bold text-purple-900">
                {totalMembers > 0 
                  ? Math.round((approvedMembers / totalMembers) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-purple-600 mt-2">Members approved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

