'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, Edit2, Trash2, Eye, X, Phone, Mail, Users, Calendar } from 'lucide-react';

// ============================================
// ADD MEMBER MODAL
// ============================================
function AddMemberModal({ 
  isOpen, 
  onClose, 
  userId, 
  onMemberAdded 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string;
  onMemberAdded: (member: any) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [priestshipId, setPriestshipId] = useState('');
  const [priestships, setPriestships] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchPriestships();
  }, []);

  async function fetchPriestships() {
    const { data } = await supabase
      .from('priestships')
      .select('id, name')
      .order('name');
    setPriestships(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const contactParts = [];
      if (phone.trim()) contactParts.push(`Phone: ${phone.trim()}`);
      if (email.trim()) contactParts.push(`Email: ${email.trim()}`);
      const contactInfo = contactParts.length > 0 ? contactParts.join(', ') : null;

      const { data, error: insertError } = await supabase
        .from('members')
        .insert({
          full_name: fullName.trim(),
          contact_info: contactInfo,
          priestship_id: priestshipId || null,
          division_id: priestshipId || null,
          approval_status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          added_by: userId,
        })
        .select(`*, priestship:priestships(name)`)
        .single();

      if (insertError) throw insertError;
      onMemberAdded(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+27 xxx xxx xxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Priestship</label>
            <select
              value={priestshipId}
              onChange={(e) => setPriestshipId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select priestship (optional)</option>
              {priestships.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// EDIT MEMBER MODAL
// ============================================
function EditMemberModal({ 
  isOpen, 
  onClose, 
  member,
  onMemberUpdated 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  member: any;
  onMemberUpdated: (member: any) => void;
}) {
  const [fullName, setFullName] = useState(member.full_name || '');
  const [contactInfo, setContactInfo] = useState(member.contact_info || '');
  const [priestshipId, setPriestshipId] = useState(member.priestship_id || '');
  const [approvalStatus, setApprovalStatus] = useState(member.approval_status || 'pending');
  const [priestships, setPriestships] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchPriestships();
  }, []);

  async function fetchPriestships() {
    const { data } = await supabase
      .from('priestships')
      .select('id, name')
      .order('name');
    setPriestships(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: updateError } = await supabase
        .from('members')
        .update({
          full_name: fullName.trim(),
          contact_info: contactInfo.trim() || null,
          priestship_id: priestshipId || null,
          approval_status: approvalStatus,
        })
        .eq('id', member.id)
        .select(`*, priestship:priestships(name)`)
        .single();

      if (updateError) throw updateError;
      onMemberUpdated(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Info</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Phone: +27..., Email: ..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Priestship</label>
            <select
              value={priestshipId}
              onChange={(e) => setPriestshipId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {priestships.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// VIEW MEMBER MODAL
// ============================================
function ViewMemberModal({ 
  isOpen, 
  onClose, 
  member 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  member: any;
}) {
  if (!isOpen) return null;

  // Parse contact info
  const phoneMatch = member.contact_info?.match(/Phone:\s*([^,]+)/i);
  const emailMatch = member.contact_info?.match(/Email:\s*([^,]+)/i);
  const phone = phoneMatch ? phoneMatch[1].trim() : null;
  const email = emailMatch ? emailMatch[1].trim() : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Member Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-primary-600">
                {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">{member.full_name}</h3>
            <span className={`mt-2 inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              member.approval_status === 'approved' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {member.approval_status || 'pending'}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {phone && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Phone size={20} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Phone</p>
                  <p className="font-medium">{phone}</p>
                </div>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Mail size={20} className="text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="font-medium">{email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Users size={20} className="text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Priestship</p>
                <p className="font-medium">{member.priestship?.name || 'Unassigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Calendar size={20} className="text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Added</p>
                <p className="font-medium">{new Date(member.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface Member {
  id: string;
  full_name: string;
  contact_info: string | null;
  priestship_id: string | null;
  division_id: string | null;
  approval_status: string;
  created_at: string;
  priestship?: { name: string } | null;
}

interface UserProfile {
  id: string;
  role: string;
  approval_status: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const hasGlobalAccess = (role: string) => 
    ['apostle', 'overseer', 'evangelist', 'prophet'].includes(role);

  const canManageMembers = (role: string) =>
    ['apostle', 'overseer', 'elder', 'priest', 'underdeacon'].includes(role);

  useEffect(() => {
    fetchUserAndMembers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(m => 
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.contact_info?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  async function fetchUserAndMembers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, approval_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch members with priestship info
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          priestship:priestships(name)
        `)
        .order('full_name', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);
      setFilteredMembers(membersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMember(memberId: string) {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err: any) {
      alert('Error deleting member: ' + err.message);
    }
  }

  function handleViewMember(member: Member) {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  }

  function handleEditMember(member: Member) {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900">Members</h1>
          <p className="text-sm sm:text-base text-neutral-600">Manage church members</p>
        </div>
        {userProfile && canManageMembers(userProfile.role) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-bold text-sm sm:text-base"
          >
            <Plus size={20} />
            Add Member
          </button>
        )}
      </div>

      {/* Search and Stats - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
          />
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-neutral-100 rounded-lg border-2 border-neutral-300">
          <Users size={18} className="text-neutral-600" />
          <span className="text-neutral-700 font-bold text-sm sm:text-base">{filteredMembers.length} members</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Members List - Mobile Cards / Desktop Table */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-neutral-200 p-8 sm:p-12 text-center">
          <p className="text-neutral-500 text-sm sm:text-base">
            {searchTerm ? 'No members found matching your search.' : 'No members yet. Add your first member!'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-lg border-2 border-neutral-200 p-3 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-bold text-sm">
                        {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 truncate">{member.full_name}</p>
                      <p className="text-xs text-neutral-600 truncate">{member.priestship?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full flex-shrink-0 ml-2 ${
                    member.approval_status === 'approved' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {member.approval_status || 'pending'}
                  </span>
                </div>
                
                {member.contact_info && (
                  <p className="text-xs text-neutral-600 mb-3 truncate">{member.contact_info}</p>
                )}
                
                <div className="flex gap-2 pt-2 border-t border-neutral-200">
                  <button
                    onClick={() => handleViewMember(member)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 text-primary-600 bg-primary-50 rounded-lg font-bold text-xs"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  {userProfile && canManageMembers(userProfile.role) && (
                    <>
                      <button
                        onClick={() => handleEditMember(member)}
                        className="flex-1 flex items-center justify-center gap-2 p-2 text-green-600 bg-green-50 rounded-lg font-bold text-xs"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="flex-1 flex items-center justify-center gap-2 p-2 text-red-600 bg-red-50 rounded-lg font-bold text-xs"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border-2 border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b-2 border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider">Priestship</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-bold">
                              {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold text-neutral-900">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">
                        {member.contact_info || '-'}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">
                        {member.priestship?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                          member.approval_status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {member.approval_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          {userProfile && canManageMembers(userProfile.role) && (
                            <>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && userProfile && (
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          userId={userProfile.id}
          onMemberAdded={(newMember) => {
            setMembers([...members, newMember]);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && selectedMember && userProfile && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onMemberUpdated={(updatedMember) => {
            setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* View Member Modal */}
      {isViewModalOpen && selectedMember && (
        <ViewMemberModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
        />
      )}
    </div>
  );
}


