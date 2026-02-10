'use client';

import { useState } from 'react';
import { Member, Profile, Role, ROLE_HIERARCHY } from '@/types';
import { Card } from '@/components/ui/Card';
import AddMemberModal from './AddMemberModal';

interface MembersCardProps {
  members: Member[];
  profile: Profile;
  divisionId: string | null;
}

// Roles that can add members (Priest and above)
const canAddMember = (role: Role): boolean => {
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY['priest'];
};

// Roles with global access (can see all data even without specific division)
const hasGlobalAccess = (role: Role): boolean => {
  return ['apostle', 'evangelist', 'prophet', 'overseer_shepherd'].includes(role);
};

export default function MembersCard({ members, profile, divisionId }: MembersCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberList, setMemberList] = useState<Member[]>(members);

  const userCanAdd = canAddMember(profile.role);
  const isMemberRole = profile.role === 'member';

  const handleMemberAdded = (newMember: Member) => {
    setMemberList((prev) => [...prev, newMember]);
  };

  // For regular members, show limited view
  if (isMemberRole) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Your Profile</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <strong>Name:</strong> {profile.full_name || 'Not set'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Role:</strong> {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </p>
          <p className="text-sm text-gray-500 mt-3 italic">
            Contact your division leader to view the full member directory.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Members</h2>
            <p className="text-sm text-gray-500">
              Total: {memberList.length} {divisionId ? 'in your division' : 'members'}
            </p>
          </div>
          {userCanAdd && divisionId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Member
            </button>
          )}
        </div>

        {!divisionId && !hasGlobalAccess(profile.role) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-700">
              ⚠️ You are not assigned to a division. Contact an administrator to be assigned.
            </p>
          </div>
        )}

        {memberList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No members found in your division.</p>
            {userCanAdd && divisionId && (
              <p className="text-sm mt-2">Click "Add Member" to add your first member.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {memberList.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-medium">
                      {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      {member.phone && ` • ${member.phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.is_active ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {userCanAdd && divisionId && (
        <AddMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          divisionId={divisionId}
          userId={profile.id}
          onMemberAdded={handleMemberAdded}
        />
      )}
    </>
  );
}
