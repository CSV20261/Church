'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WellnessReport, Member, Profile, Role, ROLE_HIERARCHY, WellnessReportType } from '@/types';
import { Card } from '@/components/ui/Card';
import NewReportModal from './NewReportModal';
import ReportsChart, { ReportTypeCount } from './ReportsChart';

interface ReportsCardProps {
  initialReports: WellnessReport[];
  reportCounts: ReportTypeCount[];
  members: Member[];
  profile: Profile;
  divisionId: string | null;
}

// Roles that can resolve reports (Priest and above)
const canResolveReports = (role: Role): boolean => {
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY['priest'];
};

// Roles with global access (can see all data even without specific division)
const hasGlobalAccess = (role: Role): boolean => {
  return ['apostle', 'evangelist', 'prophet', 'overseer_shepherd'].includes(role);
};

// Report type colors and labels
const reportTypeConfig: Record<WellnessReportType, { color: string; bgColor: string; label: string; emoji: string }> = {
  wellness: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Wellness', emoji: '🏥' },
  absence: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Absence', emoji: '📅' },
  prayer_need: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Prayer Need', emoji: '🙏' },
  follow_up: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Follow-up', emoji: '📞' },
  other: { color: 'text-neutral-700', bgColor: 'bg-neutral-100', label: 'Other', emoji: '📝' },
};

export default function ReportsCard({
  initialReports,
  reportCounts: initialReportCounts,
  members,
  profile,
  divisionId,
}: ReportsCardProps) {
  const [reports, setReports] = useState<WellnessReport[]>(initialReports);
  const [reportCounts, setReportCounts] = useState<ReportTypeCount[]>(initialReportCounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [savingResolution, setSavingResolution] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const supabase = createClient();
  const userCanResolve = canResolveReports(profile.role);
  const isMemberRole = profile.role === 'member';

  // Calculate stats
  const activeReports = reports.filter((r) => r.is_active && !r.is_resolved).length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekReports = reports.filter((r) => new Date(r.created_at || r.start_date) >= weekAgo).length;

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!divisionId && !isMemberRole) return;

    let query = supabase.from('wellness_reports').select('*');

    if (isMemberRole) {
      const memberRecord = members.find((m) => m.profile_id === profile.id);
      if (memberRecord) {
        query = query.eq('member_id', memberRecord.id);
      } else {
        return;
      }
    } else {
      query = query.eq('division_id', divisionId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

    if (!error && data) {
      setReports(data as WellnessReport[]);
      setLastUpdate(new Date());
      recalculateReportCounts(data as WellnessReport[]);
    }
  }, [supabase, divisionId, members, profile.id, isMemberRole]);

  // Recalculate report counts
  const recalculateReportCounts = (reportData: WellnessReport[]) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthReports = reportData.filter((r) => 
      (r.created_at || r.start_date).startsWith(currentMonth)
    );

    const counts: ReportTypeCount[] = [
      { type: 'wellness', count: monthReports.filter((r) => r.report_type === 'wellness').length, color: '#eab308' },
      { type: 'absence', count: monthReports.filter((r) => r.report_type === 'absence').length, color: '#ef4444' },
      { type: 'prayer_need', count: monthReports.filter((r) => r.report_type === 'prayer_need').length, color: '#3b82f6' },
      { type: 'follow_up', count: monthReports.filter((r) => r.report_type === 'follow_up').length, color: '#a855f7' },
      { type: 'other', count: monthReports.filter((r) => r.report_type === 'other').length, color: '#6b7280' },
    ];

    setReportCounts(counts.filter((c) => c.count > 0));
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!divisionId && !isMemberRole) return;

    const channel = supabase
      .channel(`wellness-reports-${divisionId || profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wellness_reports',
        },
        (payload) => {
          console.log('Realtime wellness report update:', payload);
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [divisionId, profile.id, supabase, fetchReports, isMemberRole]);

  // Handle new report created
  const handleReportCreated = (newReport: WellnessReport) => {
    setReports((prev) => [newReport, ...prev]);
    recalculateReportCounts([newReport, ...reports]);
    setLastUpdate(new Date());
  };

  // Get member name by ID
  const getMemberName = (memberId: string): string => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  // Toggle expanded view
  const toggleExpanded = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  // Resolve report
  const resolveReport = async (reportId: string) => {
    setSavingResolution(reportId);
    const notes = resolutionNotes[reportId] || '';

    try {
      const { error } = await supabase
        .from('wellness_reports')
        .update({
          is_resolved: true,
          is_active: false,
          resolved_by: profile.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, is_resolved: true, is_active: false, resolved_by: profile.id, resolution_notes: notes }
            : r
        )
      );
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report. Please try again.');
    } finally {
      setSavingResolution(null);
    }
  };

  // Format date range
  const formatDateRange = (start: string, end: string | null): string => {
    const startDate = new Date(start).toLocaleDateString();
    if (!end) return startDate;
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };

  // For regular members
  if (isMemberRole) {
    const memberRecord = members.find((m) => m.profile_id === profile.id);

    return (
      <>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">My Reports</h2>
              <p className="text-sm text-neutral-500">Wellness & Absence</p>
            </div>
            {memberRecord && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + New Report
              </button>
            )}
          </div>

          {!memberRecord ? (
            <p className="text-sm text-neutral-500 italic">
              You need to be registered as a member to submit reports. Contact your division leader.
            </p>
          ) : reports.length === 0 ? (
            <p className="text-center text-neutral-500 py-4">
              No reports submitted. Use this to report illness, planned absence, or prayer needs.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${reportTypeConfig[report.report_type].bgColor} ${reportTypeConfig[report.report_type].color}`}>
                      {reportTypeConfig[report.report_type].emoji} {reportTypeConfig[report.report_type].label}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatDateRange(report.start_date, report.end_date)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-800">{report.title}</p>
                  {report.details && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{report.details}</p>
                  )}
                  <div className="mt-2">
                    {report.is_resolved ? (
                      <span className="text-xs text-green-600">✓ Resolved</span>
                    ) : (
                      <span className="text-xs text-yellow-600">⏳ Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {memberRecord && (
          <NewReportModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            members={[memberRecord]}
            profile={profile}
            divisionId={divisionId}
            onReportCreated={handleReportCreated}
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
            <h2 className="text-lg font-semibold text-neutral-800">Reports & Wellness</h2>
            {lastUpdate && (
              <p className="text-xs text-neutral-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          {divisionId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Report
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
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-600 font-medium">Active Reports</p>
                <p className="text-xl font-bold text-yellow-800">{activeReports}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-xs text-primary-600 font-medium">This Week</p>
                <p className="text-xl font-bold text-blue-800">{thisWeekReports}</p>
              </div>
            </div>

            {/* Chart */}
            {reportCounts.length > 0 && (
              <div className="mb-4">
                <ReportsChart data={reportCounts} />
              </div>
            )}

            {/* Recent reports list */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Recent Reports</h3>
              {reports.length === 0 ? (
                <p className="text-center text-neutral-500 py-4 text-sm">
                  No reports submitted yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reports.slice(0, 15).map((report) => (
                    <div
                      key={report.id}
                      className={`p-3 rounded-lg transition-colors cursor-pointer ${
                        expandedReportId === report.id ? 'bg-yellow-50' : 'bg-neutral-50 hover:bg-neutral-100'
                      }`}
                      onClick={() => toggleExpanded(report.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${reportTypeConfig[report.report_type].bgColor} ${reportTypeConfig[report.report_type].color}`}
                          >
                            {reportTypeConfig[report.report_type].emoji}
                          </span>
                          <span className="font-medium text-neutral-800 text-sm truncate">
                            {getMemberName(report.member_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-neutral-500">
                            {formatDateRange(report.start_date, report.end_date)}
                          </span>
                          {report.is_resolved ? (
                            <span className="w-2 h-2 rounded-full bg-green-500" title="Resolved" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-yellow-500" title="Active" />
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-neutral-700 mt-1 font-medium">{report.title}</p>
                      {report.details && !expandedReportId && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{report.details}</p>
                      )}

                      {/* Expanded view */}
                      {expandedReportId === report.id && (
                        <div className="mt-3 pt-3 border-t border-yellow-200" onClick={(e) => e.stopPropagation()}>
                          {report.details && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-neutral-600 mb-1">Details:</p>
                              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{report.details}</p>
                            </div>
                          )}

                          {report.auto_mark_absent && (
                            <p className="text-xs text-orange-600 mb-2">
                              📅 Auto-marking absent for events in this date range
                            </p>
                          )}

                          {/* Resolution section for priests */}
                          {userCanResolve && !report.is_resolved && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-100">
                              <p className="text-xs font-medium text-yellow-700 mb-2">
                                Resolve Report
                              </p>
                              <textarea
                                value={resolutionNotes[report.id] ?? ''}
                                onChange={(e) =>
                                  setResolutionNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                                }
                                placeholder="Resolution notes (optional)..."
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-1 focus:ring-yellow-500 text-neutral-700"
                                rows={2}
                              />
                              <button
                                onClick={() => resolveReport(report.id)}
                                disabled={savingResolution === report.id}
                                className="mt-2 w-full px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                              >
                                {savingResolution === report.id ? 'Resolving...' : '✓ Mark as Resolved'}
                              </button>
                            </div>
                          )}

                          {/* Show resolution info */}
                          {report.is_resolved && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                              <p className="text-xs font-medium text-green-700">✓ Resolved</p>
                              {report.resolution_notes && (
                                <p className="text-sm text-green-800 mt-1">{report.resolution_notes}</p>
                              )}
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
        <NewReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          members={members}
          profile={profile}
          divisionId={divisionId}
          onReportCreated={handleReportCreated}
        />
      )}
    </>
  );
}

