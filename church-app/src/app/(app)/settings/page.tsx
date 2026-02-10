'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, User, Bell, Shield, Building, Save, Eye, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  email?: string;
}

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

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
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
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
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setUserProfile({ ...userProfile, first_name: firstName, last_name: lastName, phone });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <User size={20} />
              <span className="font-medium">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeTab === 'security' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <Shield size={20} />
              <span className="font-medium">Security</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <Bell size={20} />
              <span className="font-medium">Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeTab === 'organization' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <Building size={20} />
              <span className="font-medium">Organization</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              {/* Current Info Display */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">
                      {firstName[0]}{lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{firstName} {lastName}</h3>
                    <p className="text-sm text-gray-500">{userProfile?.email}</p>
                    <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {formatRole(userProfile?.role || 'member')}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+27 xxx xxx xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Shield size={18} />
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <p className="text-gray-500">Email notifications are coming soon.</p>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-not-allowed opacity-50">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-gray-700">Event Reminders</p>
                      <p className="text-sm text-gray-500">Get notified about upcoming events</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-not-allowed opacity-50">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-gray-700">New Reports</p>
                      <p className="text-sm text-gray-500">Get notified when new reports are submitted</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-not-allowed opacity-50">
                    <input type="checkbox" disabled className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-gray-700">Approval Requests</p>
                      <p className="text-sm text-gray-500">Get notified when users need approval</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Organization Settings</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Older Apostolic Church</h3>
                  <p className="text-sm text-gray-500">Church Management System</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Your Assignment</h3>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Role: <span className="font-medium text-gray-900">{formatRole(userProfile?.role || 'member')}</span></p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Contact your administrator to change organization settings or your role assignment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
