'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, Shield, Calendar, MapPin, Building, Edit2, Save, X } from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  role_subtype: string | null;
  approval_status: string;
  created_at: string;
  email?: string;
}

interface LeadershipAssignment {
  id: string;
  unit_type: string;
  is_primary: boolean;
  specialist_type: string | null;
  apostleship?: { name: string } | null;
  overseership?: { name: string } | null;
  eldership?: { name: string } | null;
  priestship?: { name: string } | null;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<LeadershipAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile({ ...profile, email: user.email });
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setPhone(profile.phone || '');
      }

      // Fetch leadership assignments
      const { data: assignmentsData } = await supabase
        .from('leadership_assignments')
        .select(`
          *,
          apostleship:apostleship_id(name),
          overseership:overseership_id(name),
          eldership:eldership_id(name),
          priestship:priestship_id(name)
        `)
        .eq('profile_id', user.id)
        .eq('is_active', true);

      setAssignments(assignmentsData || []);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!userProfile) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      setUserProfile({ ...userProfile, first_name: firstName, last_name: lastName, phone });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function getAssignmentName(assignment: LeadershipAssignment): string {
    if (assignment.apostleship?.name) return assignment.apostleship.name;
    if (assignment.overseership?.name) return assignment.overseership.name;
    if (assignment.eldership?.name) return assignment.eldership.name;
    if (assignment.priestship?.name) return assignment.priestship.name;
    return 'Unknown';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-500">Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
        <p className="text-neutral-600">View and manage your personal information</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Cover & Avatar */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-600">
                    {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1 sm:pb-2">
                  <h2 className="text-xl font-bold text-neutral-900">
                    {userProfile.first_name} {userProfile.last_name}
                  </h2>
                  <p className="text-neutral-500">{formatRole(userProfile.role)}</p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
                >
                  {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* Profile Info */}
              <div className="mt-6 space-y-4">
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+27 xxx xxx xxxx"
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  /* Display Info */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Mail size={20} className="text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Email</p>
                        <p className="font-medium text-neutral-900">{userProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Phone size={20} className="text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Phone</p>
                        <p className="font-medium text-neutral-900">{userProfile.phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Shield size={20} className="text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Role</p>
                        <p className="font-medium text-neutral-900">{formatRole(userProfile.role)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Calendar size={20} className="text-neutral-400" />
                      <div>
                        <p className="text-xs text-neutral-500">Member Since</p>
                        <p className="font-medium text-neutral-900">
                          {new Date(userProfile.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  userProfile.approval_status === 'approved' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {userProfile.approval_status}
                </span>
              </div>
            </div>
          </div>

          {/* Assignments Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-neutral-500 text-sm">No active assignments</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-neutral-400" />
                      <span className="font-medium text-neutral-900">{getAssignmentName(assignment)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500 capitalize">{assignment.unit_type}</span>
                      {assignment.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Primary</span>
                      )}
                      {assignment.specialist_type && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded capitalize">
                          {assignment.specialist_type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <a href="/settings" className="block p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-neutral-700 transition-colors">
                ⚙️ Account Settings
              </a>
              <a href="/dashboard" className="block p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-neutral-700 transition-colors">
                📊 Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

