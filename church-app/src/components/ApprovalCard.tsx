'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, formatRole, formatSpecialistType, ROLE_HIERARCHY } from '@/types';

interface ApprovalCardProps {
  profile: Profile;
  canApproveThis: boolean;
  currentUserId: string;
  onApproved: () => void;
  onRejected: () => void;
}

export default function ApprovalCard({ 
  profile, 
  canApproveThis, 
  currentUserId,
  onApproved, 
  onRejected 
}: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const supabase = createClient();

  const handleApprove = async () => {
    setProcessing(true);
    setAction('approve');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      onApproved();
    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve. Please try again.');
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    setAction('reject');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      onRejected();
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject. Please try again.');
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const level = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 6;
    if (level <= 2) return 'bg-purple-100 text-purple-700';
    if (level <= 3) return 'bg-blue-100 text-blue-700';
    if (level <= 4) return 'bg-green-100 text-green-700';
    if (level <= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-neutral-100 text-neutral-700';
  };

  const getAssignmentInfo = () => {
    const assignment = profile.primary_assignment || (profile as any).leadership_assignments?.[0];
    if (!assignment) return null;

    if (assignment.unit_type === 'specialist' && assignment.specialist_type) {
      return `${formatSpecialistType(assignment.specialist_type)} Specialist`;
    }

    return assignment.unit_type ? `${assignment.unit_type} (Shepherd)` : null;
  };

  const submittedDate = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold text-lg">
                {profile.first_name?.[0] || '?'}{profile.last_name?.[0] || ''}
              </span>
            </div>

            {/* Name and role */}
            <div>
              <h3 className="font-semibold text-neutral-800">
                {profile.first_name} {profile.last_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                  {formatRole(profile.role)}
                </span>
                {profile.role_subtype && (
                  <span className="text-xs text-neutral-500">
                    ({profile.role_subtype})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status and expand */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">
              Submitted: {submittedDate}
            </span>
            <svg 
              className={`w-5 h-5 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-neutral-100 p-4 bg-neutral-50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-neutral-500">Phone</p>
              <p className="text-sm font-medium text-neutral-800">{profile.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Assignment</p>
              <p className="text-sm font-medium text-neutral-800">{getAssignmentInfo() || 'Not specified'}</p>
            </div>
          </div>

          {/* Action buttons */}
          {canApproveThis ? (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && action === 'approve' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && action === 'reject' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                You cannot approve this registration. A higher-level leader must approve {formatRole(profile.role)} roles.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

