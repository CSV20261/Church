import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// PRIEST DASHBOARD
// Focus: Branch Overview, Member Attendance, Financials
// =====================================================

interface Member {
  id: string;
  full_name: string;
  role: string;
  is_approved: boolean;
}

interface RecruitmentRecord {
  id: string;
  soul_name: string;
  status: string;
}

export default async function PriestDashboard() {
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
  if (profile?.role !== 'priest') {
    redirect('/dashboard');
  }

  // Fetch branch members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_approved')
    .eq('priestship_id', profile.priestship_id)
    .order('full_name');

  const memberList: Member[] = members || [];

  // Fetch recruitment pipeline (from underdeacons)
  const { data: recruitment } = await supabase
    .from('recruitment_pipeline')
    .select('id, soul_name, status')
    .eq('priestship_id', profile.priestship_id);

  const recruitmentList: RecruitmentRecord[] = recruitment || [];

  // Calculate stats
  const totalMembers = memberList.length;
  const approvedMembers = memberList.filter(m => m.is_approved).length;
  const pendingApprovals = memberList.filter(m => !m.is_approved).length;
  const totalRecruitment = recruitmentList.length;

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          Branch Overview
        </h1>
        <p className="text-neutral-600 mt-2">
          Welcome, {profile?.full_name || 'Priest'} - Centurion South Priestship
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm text-neutral-600 font-medium">Total Members</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{totalMembers}</div>
          <div className="text-xs text-neutral-500 mt-1">Active in branch</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm text-neutral-600 font-medium">Approved</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{approvedMembers}</div>
          <div className="text-xs text-neutral-500 mt-1">Verified members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm text-neutral-600 font-medium">Pending</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{pendingApprovals}</div>
          <div className="text-xs text-neutral-500 mt-1">Awaiting approval</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm text-neutral-600 font-medium">Recruitment</div>
          <div className="text-3xl font-bold text-neutral-900 mt-2">{totalRecruitment}</div>
          <div className="text-xs text-neutral-500 mt-1">In pipeline</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Members Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              Branch Members
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Member directory for your priestship
            </p>
          </div>
          <div className="p-6">
            {memberList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No members found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {memberList.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{member.full_name}</p>
                      <p className="text-sm text-neutral-600 capitalize">{member.role}</p>
                    </div>
                    <div>
                      {member.is_approved ? (
                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recruitment Pipeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              Recruitment Reports
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              View underdeacon soul-winning pipeline
            </p>
          </div>
          <div className="p-6">
            {recruitmentList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No recruitment records</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recruitmentList.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{record.soul_name}</p>
                      <p className="text-sm text-neutral-600 capitalize">{record.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                        record.status === 'first_visit' ? 'bg-green-100 text-green-800' :
                        record.status === 'second_visit' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-neutral-900">👥 Members</h3>
          <p className="text-sm text-neutral-600 mt-2">Manage member directory</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-neutral-900">✓ Attendance</h3>
          <p className="text-sm text-neutral-600 mt-2">Track service attendance</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-neutral-900">💰 Tithing</h3>
          <p className="text-sm text-neutral-600 mt-2">Financial tracking</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-neutral-900">📊 Reports</h3>
          <p className="text-sm text-neutral-600 mt-2">Generate branch reports</p>
        </div>
      </div>
    </div>
  );
}

