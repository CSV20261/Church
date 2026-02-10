'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileBarChart, Plus, Eye, AlertCircle, CheckCircle, Clock, X, User } from 'lucide-react';

interface Report {
  id: string;
  member_id: string;
  report_type: string;
  description: string;
  status: string;
  created_by: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
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

const REPORT_TYPES = [
  { value: 'wellness', label: 'Wellness Check', color: 'bg-green-100 text-green-700', icon: '💚' },
  { value: 'absence', label: 'Absence Report', color: 'bg-yellow-100 text-yellow-700', icon: '📋' },
  { value: 'concern', label: 'Concern', color: 'bg-red-100 text-red-700', icon: '⚠️' },
  { value: 'prayer_request', label: 'Prayer Request', color: 'bg-purple-100 text-purple-700', icon: '🙏' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', icon: '📝' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const supabase = createClient();

  const canManageReports = (role: string) =>
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

      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`*, member:members(full_name)`)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

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

  async function updateReportStatus(reportId: string, newStatus: string) {
    if (!userProfile) return;

    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = userProfile.id;
      }

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)
        .select(`*, member:members(full_name)`)
        .single();

      if (error) throw error;
      setReports(reports.map(r => r.id === reportId ? data : r));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  function getReportTypeInfo(type: string) {
    return REPORT_TYPES.find(t => t.value === type) || REPORT_TYPES[4];
  }

  function getStatusInfo(status: string) {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Filter reports
  const filteredReports = reports.filter(r => {
    if (filterType && r.report_type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const openReports = reports.filter(r => r.status === 'open' || r.status === 'in_progress').length;
  const thisWeekReports = reports.filter(r => {
    const reportDate = new Date(r.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return reportDate >= weekAgo;
  }).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Manage wellness checks, absence reports, and concerns</p>
        </div>
        {userProfile && canManageReports(userProfile.role) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            New Report
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileBarChart size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Reports</p>
              <p className="text-xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Open/Active</p>
              <p className="text-xl font-bold text-gray-900">{openReports}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'resolved' || r.status === 'closed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <AlertCircle size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-xl font-bold text-gray-900">{thisWeekReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {REPORT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No reports found.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => {
                const typeInfo = getReportTypeInfo(report.report_type);
                const statusInfo = getStatusInfo(report.status);
                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{report.member?.full_name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {report.description}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {userProfile && canManageReports(userProfile.role) ? (
                        <select
                          value={report.status}
                          onChange={(e) => updateReportStatus(report.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${statusInfo.color}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setIsViewModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && userProfile && (
        <ReportModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          userId={userProfile.id}
          members={members}
          onReportSaved={(newReport) => {
            setReports([newReport, ...reports]);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedReport && (
        <ViewReportModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
        />
      )}
    </div>
  );
}

// ============================================
// ADD REPORT MODAL
// ============================================
function ReportModal({ 
  isOpen, 
  onClose, 
  userId,
  members,
  onReportSaved 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string;
  members: Member[];
  onReportSaved: (report: any) => void;
}) {
  const [memberId, setMemberId] = useState('');
  const [reportType, setReportType] = useState('wellness');
  const [description, setDescription] = useState('');
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
        .from('reports')
        .insert({
          member_id: memberId,
          report_type: reportType,
          description: description.trim(),
          status: 'open',
          created_by: userId,
        })
        .select(`*, member:members(full_name)`)
        .single();

      if (insertError) throw insertError;
      onReportSaved(data);
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
          <h2 className="text-lg font-semibold">New Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {REPORT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe the report..."
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// VIEW REPORT MODAL
// ============================================
function ViewReportModal({ 
  isOpen, 
  onClose, 
  report 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  report: Report;
}) {
  if (!isOpen) return null;

  const typeInfo = REPORT_TYPES.find(t => t.value === report.report_type) || REPORT_TYPES[4];
  const statusInfo = STATUS_OPTIONS.find(s => s.value === report.status) || STATUS_OPTIONS[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Report Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
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
              <h3 className="text-xl font-semibold text-gray-900 mt-1">{report.member?.full_name}</h3>
              <p className="text-sm text-gray-500">
                {new Date(report.created_at).toLocaleDateString('en-ZA', { 
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-gray-900 whitespace-pre-wrap">{report.description}</p>
            </div>

            {report.resolved_at && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Resolved on {new Date(report.resolved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
