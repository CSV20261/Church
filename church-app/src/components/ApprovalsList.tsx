'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Role, formatRole, canApprove } from '@/types';
import ApprovalCard from './ApprovalCard';

interface ApprovalsListProps {
  pendingProfiles: Profile[];
  currentUserRole: Role;
  currentUserId: string;
}

export default function ApprovalsList({ 
  pendingProfiles: initialProfiles, 
  currentUserRole,
  currentUserId 
}: ApprovalsListProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [filter, setFilter] = useState<'all' | 'can_approve'>('can_approve');
  const supabase = createClient();

  // Filter profiles based on what the current user can approve
  const filterableProfiles = profiles.filter((profile) => {
    if (filter === 'all') return true;
    return canApprove(currentUserRole, profile.role);
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('pending-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'approval_status=eq.pending',
        },
        async () => {
          // Refetch pending profiles
          const { data } = await supabase
            .from('profiles')
            .select('*, leadership_assignments (*)')
            .eq('approval_status', 'pending')
            .eq('onboarding_completed', true)
            .order('created_at', { ascending: false });
          
          if (data) {
            setProfiles(data as Profile[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleApproved = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleRejected = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('can_approve')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'can_approve'
              ? 'bg-green-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          I Can Approve ({profiles.filter((p) => canApprove(currentUserRole, p.role)).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-green-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Pending ({profiles.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-800">{profiles.length}</p>
          <p className="text-sm text-yellow-600">Total Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-800">
            {profiles.filter((p) => canApprove(currentUserRole, p.role)).length}
          </p>
          <p className="text-sm text-green-600">You Can Approve</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-800">
            {profiles.filter((p) => p.role === 'member').length}
          </p>
          <p className="text-sm text-blue-600">New Members</p>
        </div>
      </div>

      {/* Pending list */}
      {filterableProfiles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">All Caught Up!</h3>
          <p className="text-gray-600 mt-2">
            {filter === 'can_approve' 
              ? 'No pending registrations for you to approve.'
              : 'No pending registrations at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filterableProfiles.map((profile) => (
            <ApprovalCard
              key={profile.id}
              profile={profile}
              canApproveThis={canApprove(currentUserRole, profile.role)}
              currentUserId={currentUserId}
              onApproved={() => handleApproved(profile.id)}
              onRejected={() => handleRejected(profile.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
