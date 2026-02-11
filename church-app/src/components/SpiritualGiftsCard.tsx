'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SpiritualGift, Member, Profile, Role, ROLE_HIERARCHY, GiftType } from '@/types';
import { Card } from '@/components/ui/Card';
import ReportGiftModal from './ReportGiftModal';
import SpiritualGiftsChart, { MonthlyGiftData } from './SpiritualGiftsChart';

interface SpiritualGiftsCardProps {
  initialGifts: SpiritualGift[];
  monthlyData: MonthlyGiftData[];
  members: Member[];
  profile: Profile;
  divisionId: string | null;
}

// Roles that can assess gifts (Priest and above)
const canAssessGifts = (role: Role): boolean => {
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY['priest'];
};

// Roles with global access (can see all data even without specific division)
const hasGlobalAccess = (role: Role): boolean => {
  return ['apostle', 'evangelist', 'prophet', 'overseer_shepherd'].includes(role);
};

// Gift type colors and labels
const giftTypeConfig: Record<GiftType, { color: string; bgColor: string; label: string }> = {
  dream: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Dream' },
  vision: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Vision' },
  prophecy: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Prophecy' },
  tongue: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Tongue' },
  interpretation: { color: 'text-teal-700', bgColor: 'bg-teal-100', label: 'Interpretation' },
  healing: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Healing' },
  other: { color: 'text-neutral-700', bgColor: 'bg-neutral-100', label: 'Other' },
};

export default function SpiritualGiftsCard({
  initialGifts,
  monthlyData: initialMonthlyData,
  members,
  profile,
  divisionId,
}: SpiritualGiftsCardProps) {
  const [gifts, setGifts] = useState<SpiritualGift[]>(initialGifts);
  const [monthlyData, setMonthlyData] = useState<MonthlyGiftData[]>(initialMonthlyData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedGiftId, setExpandedGiftId] = useState<string | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState<Record<string, string>>({});
  const [savingAssessment, setSavingAssessment] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const supabase = createClient();
  const userCanAssess = canAssessGifts(profile.role);
  const isMemberRole = profile.role === 'member';

  // Calculate stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthGifts = gifts.filter((g) => g.date_received.startsWith(currentMonth));
  const pendingReview = gifts.filter((g) => !g.is_reviewed).length;

  // Fetch gifts
  const fetchGifts = useCallback(async () => {
    if (!divisionId && !isMemberRole) return;

    let query = supabase.from('spiritual_gifts').select('*');

    if (isMemberRole) {
      // Members see only their own gifts (need to find their member record)
      const memberRecord = members.find((m) => m.profile_id === profile.id);
      if (memberRecord) {
        query = query.eq('member_id', memberRecord.id);
      } else {
        return; // No member record found
      }
    } else {
      // Leaders see all gifts from their division members
      const memberIds = members.map((m) => m.id);
      if (memberIds.length > 0) {
        query = query.in('member_id', memberIds);
      } else {
        return;
      }
    }

    const { data, error } = await query.order('date_received', { ascending: false }).limit(50);

    if (!error && data) {
      setGifts(data as SpiritualGift[]);
      setLastUpdate(new Date());
      recalculateMonthlyData(data as SpiritualGift[]);
    }
  }, [supabase, divisionId, members, profile.id, isMemberRole]);

  // Recalculate monthly data
  const recalculateMonthlyData = (giftData: SpiritualGift[]) => {
    const monthsMap = new Map<string, { dreams: number; visions: number; prophecies: number }>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      monthsMap.set(monthKey, { dreams: 0, visions: 0, prophecies: 0 });
    }

    // Count gifts by type and month
    giftData.forEach((gift) => {
      const monthKey = gift.date_received.slice(0, 7);
      if (monthsMap.has(monthKey)) {
        const current = monthsMap.get(monthKey)!;
        if (gift.gift_type === 'dream') current.dreams++;
        else if (gift.gift_type === 'vision') current.visions++;
        else if (gift.gift_type === 'prophecy') current.prophecies++;
      }
    });

    const newData: MonthlyGiftData[] = Array.from(monthsMap.entries()).map(([month, counts]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      ...counts,
    }));

    setMonthlyData(newData);
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!divisionId && !isMemberRole) return;

    const channel = supabase
      .channel(`spiritual-gifts-${divisionId || profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spiritual_gifts',
        },
        (payload) => {
          console.log('Realtime spiritual gift update:', payload);
          fetchGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [divisionId, profile.id, supabase, fetchGifts, isMemberRole]);

  // Handle new gift reported
  const handleGiftReported = (newGift: SpiritualGift) => {
    setGifts((prev) => [newGift, ...prev]);
    recalculateMonthlyData([newGift, ...gifts]);
    setLastUpdate(new Date());
  };

  // Get member name by ID
  const getMemberName = (memberId: string): string => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  // Toggle expanded view
  const toggleExpanded = (giftId: string) => {
    setExpandedGiftId(expandedGiftId === giftId ? null : giftId);
  };

  // Save assessment
  const saveAssessment = async (giftId: string, markReviewed: boolean) => {
    setSavingAssessment(giftId);
    const notes = assessmentNotes[giftId] || '';

    try {
      const { error } = await supabase
        .from('spiritual_gifts')
        .update({
          is_reviewed: markReviewed,
          assessed_by: profile.id,
          assessment_notes: notes || null,
          assessed_at: new Date().toISOString(),
        })
        .eq('id', giftId);

      if (error) throw error;

      // Update local state
      setGifts((prev) =>
        prev.map((g) =>
          g.id === giftId
            ? { ...g, is_reviewed: markReviewed, assessed_by: profile.id, assessment_notes: notes }
            : g
        )
      );
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert('Failed to save assessment. Please try again.');
    } finally {
      setSavingAssessment(null);
    }
  };

  // For regular members without a division, show self-report view
  if (isMemberRole) {
    const memberRecord = members.find((m) => m.profile_id === profile.id);
    
    return (
      <>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">My Spiritual Gifts</h2>
              <p className="text-sm text-neutral-500">Dreams, Visions & Prophecies</p>
            </div>
            {memberRecord && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Report Gift
              </button>
            )}
          </div>

          {!memberRecord ? (
            <p className="text-sm text-neutral-500 italic">
              You need to be registered as a member to report spiritual gifts. Contact your division leader.
            </p>
          ) : gifts.length === 0 ? (
            <p className="text-center text-neutral-500 py-4">
              No spiritual gifts reported yet. Share your dreams, visions, or prophecies with your church leaders.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {gifts.map((gift) => (
                <div key={gift.id} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${giftTypeConfig[gift.gift_type].bgColor} ${giftTypeConfig[gift.gift_type].color}`}>
                      {giftTypeConfig[gift.gift_type].label}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(gift.date_received).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-800">{gift.title}</p>
                  {gift.description && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{gift.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {gift.is_reviewed ? (
                      <span className="text-xs text-green-600">✓ Reviewed by leader</span>
                    ) : (
                      <span className="text-xs text-yellow-600">⏳ Pending review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {memberRecord && (
          <ReportGiftModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            members={[memberRecord]}
            profile={profile}
            onGiftReported={handleGiftReported}
            preselectedMemberId={memberRecord.id}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Spiritual Gifts</h2>
            {lastUpdate && (
              <p className="text-xs text-neutral-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          {divisionId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Report Gift
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

        {(divisionId || hasGlobalAccess(profile.role)) && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 font-medium">Total Reports</p>
                <p className="text-xl font-bold text-purple-800">{gifts.length}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-xs text-primary-600 font-medium">This Month</p>
                <p className="text-xl font-bold text-blue-800">{thisMonthGifts.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-600 font-medium">Pending</p>
                <p className="text-xl font-bold text-yellow-800">{pendingReview}</p>
              </div>
            </div>

            {/* Chart */}
            {monthlyData.length > 0 && (
              <div className="mb-4">
                <SpiritualGiftsChart data={monthlyData} />
              </div>
            )}

            {/* Recent reports list */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Recent Reports</h3>
              {gifts.length === 0 ? (
                <p className="text-center text-neutral-500 py-4 text-sm">
                  No spiritual gifts reported yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gifts.slice(0, 15).map((gift) => (
                    <div
                      key={gift.id}
                      className={`p-3 rounded-lg transition-colors cursor-pointer ${
                        expandedGiftId === gift.id ? 'bg-purple-50' : 'bg-neutral-50 hover:bg-neutral-100'
                      }`}
                      onClick={() => toggleExpanded(gift.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${giftTypeConfig[gift.gift_type].bgColor} ${giftTypeConfig[gift.gift_type].color}`}
                          >
                            {giftTypeConfig[gift.gift_type].label}
                          </span>
                          <span className="font-medium text-neutral-800 text-sm truncate">
                            {getMemberName(gift.member_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-neutral-500">
                            {new Date(gift.date_received).toLocaleDateString()}
                          </span>
                          {gift.is_reviewed ? (
                            <span className="w-2 h-2 rounded-full bg-green-500" title="Reviewed" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-yellow-500" title="Pending" />
                          )}
                        </div>
                      </div>

                      {/* Title and description snippet */}
                      <p className="text-sm text-neutral-700 mt-1 font-medium">{gift.title}</p>
                      {gift.description && !expandedGiftId && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{gift.description}</p>
                      )}

                      {/* Expanded view */}
                      {expandedGiftId === gift.id && (
                        <div className="mt-3 pt-3 border-t border-purple-200" onClick={(e) => e.stopPropagation()}>
                          {gift.description && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-neutral-600 mb-1">Full Description:</p>
                              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{gift.description}</p>
                            </div>
                          )}

                          {/* Assessment section for priests */}
                          {userCanAssess && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-purple-100">
                              <p className="text-xs font-medium text-purple-700 mb-2">
                                Priest Assessment
                              </p>
                              <textarea
                                value={assessmentNotes[gift.id] ?? gift.assessment_notes ?? ''}
                                onChange={(e) =>
                                  setAssessmentNotes((prev) => ({ ...prev, [gift.id]: e.target.value }))
                                }
                                placeholder="Add assessment notes..."
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-1 focus:ring-purple-500 text-neutral-700"
                                rows={2}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <label className="flex items-center gap-2 text-sm text-neutral-600">
                                  <input
                                    type="checkbox"
                                    checked={gift.is_reviewed}
                                    onChange={(e) => saveAssessment(gift.id, e.target.checked)}
                                    disabled={savingAssessment === gift.id}
                                    className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  Mark as Reviewed
                                </label>
                                <button
                                  onClick={() => saveAssessment(gift.id, gift.is_reviewed)}
                                  disabled={savingAssessment === gift.id}
                                  className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                                >
                                  {savingAssessment === gift.id ? 'Saving...' : 'Save Notes'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Show existing assessment for non-priests */}
                          {!userCanAssess && gift.assessment_notes && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                              <p className="text-xs font-medium text-green-700">Leader&apos;s Notes:</p>
                              <p className="text-sm text-green-800">{gift.assessment_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {divisionId && (
        <ReportGiftModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          members={members}
          profile={profile}
          onGiftReported={handleGiftReported}
        />
      )}
    </>
  );
}

