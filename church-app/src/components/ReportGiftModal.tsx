'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Member, Profile, SpiritualGift, GiftType, ROLE_HIERARCHY } from '@/types';

interface ReportGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  profile: Profile;
  onGiftReported: (gift: SpiritualGift) => void;
  preselectedMemberId?: string;
}

export default function ReportGiftModal({
  isOpen,
  onClose,
  members,
  profile,
  onGiftReported,
  preselectedMemberId,
}: ReportGiftModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMemberId || '');
  const [giftType, setGiftType] = useState<GiftType>('dream');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const canSelectMember = ROLE_HIERARCHY[profile.role] <= ROLE_HIERARCHY['priest'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const memberId = preselectedMemberId || selectedMemberId;
    if (!memberId) {
      setError('Please select a member');
      setLoading(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('spiritual_gifts')
        .insert({
          member_id: memberId,
          gift_type: giftType,
          title: title.trim(),
          description: description.trim() || null,
          date_received: dateReceived,
          is_private: isPrivate,
          is_fulfilled: false,
          is_reviewed: false,
          recorded_by: profile.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onGiftReported(data as SpiritualGift);

      // Reset form
      setSelectedMemberId(preselectedMemberId || '');
      setGiftType('dream');
      setTitle('');
      setDescription('');
      setDateReceived(new Date().toISOString().split('T')[0]);
      setIsPrivate(false);
      onClose();
    } catch (err) {
      console.error('Error reporting gift:', err);
      setError(err instanceof Error ? err.message : 'Failed to report spiritual gift');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Report Spiritual Gift</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member selector (for priests) */}
          {canSelectMember && !preselectedMemberId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                <option value="">Select a member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Gift type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gift Type *</label>
            <select
              value={giftType}
              onChange={(e) => setGiftType(e.target.value as GiftType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="dream">🌙 Dream</option>
              <option value="vision">👁️ Vision</option>
              <option value="prophecy">📜 Prophecy</option>
              <option value="tongue">🗣️ Speaking in Tongues</option>
              <option value="interpretation">💬 Interpretation</option>
              <option value="healing">🙏 Healing</option>
              <option value="other">✨ Other</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title / Summary *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="Brief title for this spiritual experience"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received *</label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="Describe the dream, vision, or prophecy in detail..."
              rows={4}
            />
          </div>

          {/* Private checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Keep this private (only visible to assigned priest)
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Report Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
