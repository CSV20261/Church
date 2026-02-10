'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Member, Profile, WellnessReport, WellnessReportType, ROLE_HIERARCHY } from '@/types';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  profile: Profile;
  divisionId: string | null;
  onReportCreated: (report: WellnessReport) => void;
  preselectedMemberId?: string;
}

export default function NewReportModal({
  isOpen,
  onClose,
  members,
  profile,
  divisionId,
  onReportCreated,
  preselectedMemberId,
}: NewReportModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMemberId || '');
  const [reportType, setReportType] = useState<WellnessReportType>('wellness');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(false);
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
        .from('wellness_reports')
        .insert({
          member_id: memberId,
          division_id: divisionId,
          report_type: reportType,
          title: title.trim(),
          details: details.trim() || null,
          start_date: startDate,
          end_date: endDate || null,
          is_active: true,
          is_resolved: false,
          auto_mark_absent: autoMarkAbsent,
          reported_by: profile.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If auto-mark absent is enabled, create attendance records
      if (autoMarkAbsent && (reportType === 'wellness' || reportType === 'absence')) {
        await createAbsentRecords(memberId, startDate, endDate || startDate);
      }

      onReportCreated(data as WellnessReport);

      // Reset form
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const createAbsentRecords = async (memberId: string, start: string, end: string) => {
    try {
      // Fetch events in the date range for this division
      const { data: events } = await supabase
        .from('events')
        .select('id, date_time')
        .eq('priestship_id', divisionId)
        .gte('date_time', start)
        .lte('date_time', end + 'T23:59:59');

      if (events && events.length > 0) {
        // Create absent records for each event
        const absentRecords = events.map((event) => ({
          member_id: memberId,
          event_id: event.id,
          date: event.date_time?.split('T')[0] || start,
          status: 'excused' as const,
          notes: `Auto-marked: ${reportType === 'wellness' ? 'Unwell' : 'Planned absence'}`,
          recorded_by: profile.id,
        }));

        await supabase.from('attendance_records').upsert(absentRecords, {
          onConflict: 'member_id,event_id',
        });
      }
    } catch (err) {
      console.error('Error creating absent records:', err);
    }
  };

  const resetForm = () => {
    setSelectedMemberId(preselectedMemberId || '');
    setReportType('wellness');
    setTitle('');
    setDetails('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setAutoMarkAbsent(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">New Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
          {canSelectMember && !preselectedMemberId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as WellnessReportType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
            >
              <option value="wellness">🏥 Wellness / Illness</option>
              <option value="absence">📅 Planned Absence</option>
              <option value="prayer_need">🙏 Prayer Need</option>
              <option value="follow_up">📞 Follow-up Needed</option>
              <option value="other">📝 Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-900"
              placeholder="Brief description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-gray-900"
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {(reportType === 'wellness' || reportType === 'absence') && (
            <label className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={autoMarkAbsent}
                onChange={(e) => setAutoMarkAbsent(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-orange-800">Auto-mark as excused</span>
                <p className="text-xs text-orange-600">
                  Automatically mark absent for events during this period
                </p>
              </div>
            </label>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
