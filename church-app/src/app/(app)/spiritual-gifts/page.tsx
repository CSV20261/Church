'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Plus, Eye, Check, X, Clock, Filter } from 'lucide-react';

interface SpiritualGift {
  id: string;
  member_id: string;
  gift_type: string;
  description: string;
  date_reported: string;
  is_reviewed: boolean;
  assessed_by: string | null;
  assessment_notes: string | null;
  assessed_at: string | null;
  notes: string | null;
  created_at: string;
  member?: { full_name: string } | null;
}

interface Member {
  id: string;
  full_name: string;
}

interface UserProfile {
  id: string;
  role: string;
}

const GIFT_TYPES = [
  { value: 'dream', label: 'Dream', color: 'bg-purple-100 text-purple-700', icon: '🌙' },
  { value: 'vision', label: 'Vision', color: 'bg-blue-100 text-blue-700', icon: '👁️' },
  { value: 'prophecy', label: 'Prophecy', color: 'bg-amber-100 text-amber-700', icon: '📜' },
  { value: 'other', label: 'Other', color: 'bg-neutral-100 text-neutral-700', icon: '✨' },
];

export default function SpiritualGiftsPage() {
  const [gifts, setGifts] = useState<SpiritualGift[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<SpiritualGift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const supabase = createClient();

  const canManageGifts = (role: string) =>
    ['apostle', 'overseer', 'elder', 'priest', 'underdeacon'].includes(role);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (profile) setUserProfile(profile);

      const { data: giftsData, error: giftsError } = await supabase
        .from('spiritual_gifts')
        .select(`*, member:members(full_name)`)
        .order('date_reported', { ascending: false });

      if (giftsError) throw giftsError;
      setGifts(giftsData || []);

      const { data: membersData } = await supabase
        .from('members')
        .select('id, full_name')
        .order('full_name');

      setMembers(membersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAsReviewed(giftId: string) {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('spiritual_gifts')
        .update({
          is_reviewed: true,
          assessed_by: userProfile.id,
          assessed_at: new Date().toISOString(),
        })
        .eq('id', giftId)
        .select(`*, member:members(full_name)`)
        .single();

      if (error) throw error;
      setGifts(gifts.map(g => g.id === giftId ? data : g));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  function getGiftTypeInfo(type: string) {
    return GIFT_TYPES.find(t => t.value === type) || GIFT_TYPES[3];
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Filter gifts
  const filteredGifts = gifts.filter(g => {
    if (filterType && g.gift_type !== filterType) return false;
    if (filterStatus === 'reviewed' && !g.is_reviewed) return false;
    if (filterStatus === 'pending' && g.is_reviewed) return false;
    return true;
  });

  // Stats
  const totalGifts = gifts.length;
  const pendingReview = gifts.filter(g => !g.is_reviewed).length;
  const thisMonthGifts = gifts.filter(g => 
    g.date_reported.startsWith(new Date().toISOString().slice(0, 7))
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Spiritual Gifts</h1>
          <p className="text-neutral-600">Record and review dreams, visions, and prophecies</p>
        </div>
        {userProfile && canManageGifts(userProfile.role) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Record Gift
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {GIFT_TYPES.slice(0, 3).map(type => {
          const count = gifts.filter(g => g.gift_type === type.value).length;
          return (
            <div key={type.value} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg ${type.color.split(' ')[0]} flex items-center justify-center text-2xl`}>
                  {type.icon}
                </div>
                <div>
                  <p className="text-sm text-neutral-500">{type.label}s</p>
                  <p className="text-xl font-bold text-neutral-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Pending Review</p>
              <p className="text-xl font-bold text-neutral-900">{pendingReview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {GIFT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Gifts List */}
      <div className="space-y-4">
        {filteredGifts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <Sparkles size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Spiritual Gifts Recorded</h3>
            <p className="text-neutral-500">Start recording dreams, visions, and prophecies</p>
          </div>
        ) : (
          filteredGifts.map((gift) => {
            const typeInfo = getGiftTypeInfo(gift.gift_type);
            return (
              <div key={gift.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-lg ${typeInfo.color.split(' ')[0]} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {typeInfo.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {!gift.is_reviewed && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                            Pending Review
                          </span>
                        )}
                        {gift.is_reviewed && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Reviewed
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-neutral-900">{gift.member?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-neutral-500 mt-1">{formatDate(gift.date_reported)}</p>
                      <p className="text-neutral-600 mt-2 line-clamp-2">{gift.description}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedGift(gift);
                        setIsViewModalOpen(true);
                      }}
                      className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {userProfile && canManageGifts(userProfile.role) && !gift.is_reviewed && (
                      <button
                        onClick={() => markAsReviewed(gift.id)}
                        className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as Reviewed"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && userProfile && (
        <GiftModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          members={members}
          onGiftSaved={(newGift) => {
            setGifts([newGift, ...gifts]);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedGift && (
        <ViewGiftModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedGift(null);
          }}
          gift={selectedGift}
        />
      )}
    </div>
  );
}

// ============================================
// ADD GIFT MODAL
// ============================================
function GiftModal({ 
  isOpen, 
  onClose, 
  members,
  onGiftSaved 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  members: Member[];
  onGiftSaved: (gift: any) => void;
}) {
  const [memberId, setMemberId] = useState('');
  const [giftType, setGiftType] = useState('dream');
  const [description, setDescription] = useState('');
  const [dateReported, setDateReported] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !description) {
      setError('Member and description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('spiritual_gifts')
        .insert({
          member_id: memberId,
          gift_type: giftType,
          description: description.trim(),
          date_reported: dateReported,
          notes: notes.trim() || null,
          is_reviewed: false,
        })
        .select(`*, member:members(full_name)`)
        .single();

      if (insertError) throw insertError;
      onGiftSaved(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Record Spiritual Gift</h2>
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
            <label className="block text-sm font-medium text-neutral-700 mb-1">Member *</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Gift Type *</label>
            <select
              value={giftType}
              onChange={(e) => setGiftType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {GIFT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Date Reported</label>
            <input
              type="date"
              value={dateReported}
              onChange={(e) => setDateReported(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="Describe the dream, vision, or prophecy..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder="Additional notes..."
            />
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Record Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// VIEW GIFT MODAL
// ============================================
function ViewGiftModal({ 
  isOpen, 
  onClose, 
  gift 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  gift: SpiritualGift;
}) {
  if (!isOpen) return null;

  const typeInfo = GIFT_TYPES.find(t => t.value === gift.gift_type) || GIFT_TYPES[3];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Spiritual Gift Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-xl ${typeInfo.color.split(' ')[0]} flex items-center justify-center text-3xl`}>
              {typeInfo.icon}
            </div>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <h3 className="text-xl font-semibold text-neutral-900 mt-1">{gift.member?.full_name}</h3>
              <p className="text-sm text-neutral-500">
                {new Date(gift.date_reported).toLocaleDateString('en-ZA', { 
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-500 mb-1">Description</h4>
              <p className="text-neutral-900 whitespace-pre-wrap">{gift.description}</p>
            </div>

            {gift.notes && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1">Notes</h4>
                <p className="text-neutral-700">{gift.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  gift.is_reviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {gift.is_reviewed ? '✓ Reviewed' : '⏳ Pending Review'}
                </span>
              </div>
              {gift.assessed_at && (
                <p className="text-sm text-neutral-500 mt-2">
                  Reviewed on {new Date(gift.assessed_at).toLocaleDateString()}
                </p>
              )}
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

