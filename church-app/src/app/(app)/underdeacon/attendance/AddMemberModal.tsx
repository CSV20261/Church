"use client";

import React, { useState } from 'react';
import { X, User, Lock } from 'lucide-react';

// =====================================================
// ADD MEMBER MODAL
// Auto-fills hierarchy from creator's profile
// =====================================================

interface Profile {
  id: string;
  full_name: string;
  role: string;
  apostleship_id: string | null;
  overseership_id: string | null;
  eldership_id: string | null;
  priestship_id: string | null;
  apostleship_name?: string | null;
  overseership_name?: string | null;
  eldership_name?: string | null;
  priestship_name?: string | null;
}

interface Props {
  category: string;
  profile: Profile;
  onClose: () => void;
}

const TITLES = ['Mr', 'Ms', 'Mrs', 'Sr', 'Br'] as const;

export default function AddMemberModal({ category, profile, onClose }: Props) {
  const isOfficerCategory = category === 'Officer';
  
  // Officer category: Auto-set to Sr (Sister)
  const [title, setTitle] = useState<typeof TITLES[number]>(isOfficerCategory ? 'Sr' : 'Br');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive gender and gift based on category and title
  const getGenderFromTitle = (t: string) => {
    return ['Mr', 'Br'].includes(t) ? 'Male' : 'Female';
  };

  const getGiftFromTitle = (t: string, cat: string) => {
    // Officer category: Always "Sister & Deacon" for wives
    if (cat === 'Officer') {
      return 'Sister & Deacon';
    }
    
    // Standard categories: Title-driven
    return ['Mr', 'Br'].includes(t) ? 'Brother' : 'Sister';
  };

  const gender = getGenderFromTitle(title);
  const gift = getGiftFromTitle(title, category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    setSubmitting(true);

    const payload = {
      title,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      gift,
      category,
      // Auto-fill hierarchy from creator's profile
      apostleship_id: profile.apostleship_id,
      overseership_id: profile.overseership_id,
      eldership_id: profile.eldership_id,
      priestship_id: profile.priestship_id,
    };
    
    // Note: gender is NOT sent - it's auto-derived from title in the database

    console.log('🔵 [AddMemberModal] Submitting payload:', payload);

    try {
      const response = await fetch('/api/members/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      console.log('🔵 [AddMemberModal] Response status:', response.status);
      console.log('🔵 [AddMemberModal] Response body:', result);

      if (!response.ok) {
        const errorMessage = result.error || result.details || 'Unknown error from server';
        console.error('❌ [AddMemberModal] API returned error:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ [AddMemberModal] Member added successfully:', result.member);
      alert(`✅ Member Added!\n\nName: ${result.member.full_name}\nCategory: ${result.member.category}\nGift: ${result.member.gift}`);
      
      // Success - refresh page to show new member
      window.location.reload();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('❌ [AddMemberModal] Error:', errorMsg);
      setError(`Failed to add member: ${errorMsg}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Member</h2>
            <p className="text-sm text-slate-600">Category: {category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title {isOfficerCategory && <span className="text-xs text-slate-500">(Auto-set for Sister & Deacon)</span>}
              </label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value as typeof TITLES[number])}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isOfficerCategory}
              >
                {TITLES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {isOfficerCategory && (
                <p className="mt-1 text-xs text-emerald-700">
                  ✓ Auto-set to "Sr" for registering officer's wife
                </p>
              )}
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Auto-derived fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gender (Auto)
                </label>
                <div className={`px-4 py-2.5 border rounded-lg ${
                  isOfficerCategory 
                    ? 'bg-pink-50 border-pink-200 text-pink-900' 
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {gender}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gift (Auto)
                </label>
                <div className={`px-4 py-2.5 border rounded-lg ${
                  isOfficerCategory 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' 
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {gift}
                </div>
              </div>
            </div>
            
            {isOfficerCategory && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Officer Category:</strong> This member will be registered as "{gift}" 
                  (the wife of an officer who does not have her own user profile).
                </p>
              </div>
            )}
          </div>

          {/* Hierarchy - Auto-filled & Locked */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-900">Hierarchy (Auto-filled)</h3>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-emerald-800 font-medium">
                ✓ Continuity: Member will inherit your hierarchy structure
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Apostleship:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {profile.apostleship_name || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Overseership:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {profile.overseership_name || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Eldership:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {profile.eldership_name || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Priestship:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {profile.priestship_name || 'None'}
                  </span>
                </div>
              </div>
            </div>

            {!isOfficerCategory && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Title-Driven Logic:</strong>
                  <br/>• Sr/Ms → Female, Sister
                  <br/>• Br/Mr → Male, Brother
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You cannot create an 'Officer' directly. Officers must register themselves 
                as users to gain a profile. {isOfficerCategory 
                  ? `This member will be added as '${gift}' (officer's wife).` 
                  : `This member will be added as '${gift}' in the '${category}' category.`}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
