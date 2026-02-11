'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, Plus, Edit2, Trash2, Calendar, TrendingUp, Users, X, Download } from 'lucide-react';

interface TithingRecord {
  id: string;
  member_id: string;
  amount: number;
  date_paid: string;
  payment_method: string | null;
  notes: string | null;
  recorded_by: string;
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

interface MonthlyData {
  month: string;
  label: string;
  total: number;
  count: number;
}

export default function TithingPage() {
  const [records, setRecords] = useState<TithingRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TithingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterMember, setFilterMember] = useState<string>('');

  const supabase = createClient();

  const canManageTithing = (role: string) =>
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

      // Fetch tithing records with member info
      const { data: recordsData, error: recordsError } = await supabase
        .from('tithing_records')
        .select(`*, member:members(full_name)`)
        .order('date_paid', { ascending: false });

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

      // Fetch members
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

  async function handleDeleteRecord(recordId: string) {
    if (!confirm('Are you sure you want to delete this tithing record?')) return;

    try {
      const { error } = await supabase.from('tithing_records').delete().eq('id', recordId);
      if (error) throw error;
      setRecords(records.filter(r => r.id !== recordId));
    } catch (err: any) {
      alert('Error deleting record: ' + err.message);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Filter records
  const filteredRecords = records.filter(r => {
    if (filterMonth && !r.date_paid.startsWith(filterMonth)) return false;
    if (filterMember && r.member_id !== filterMember) return false;
    return true;
  });

  // Calculate stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRecords = records.filter(r => r.date_paid.startsWith(currentMonth));
  const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalAll = records.reduce((sum, r) => sum + r.amount, 0);
  const uniqueContributors = new Set(thisMonthRecords.map(r => r.member_id)).size;

  // Monthly data for chart (last 6 months)
  const monthlyData: MonthlyData[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);
    const monthRecords = records.filter(r => r.date_paid.startsWith(monthKey));
    monthlyData.push({
      month: monthKey,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      total: monthRecords.reduce((sum, r) => sum + r.amount, 0),
      count: monthRecords.length,
    });
  }
  const maxMonthlyTotal = Math.max(...monthlyData.map(d => d.total), 1);

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
          <h1 className="text-2xl font-bold text-neutral-900">Tithing</h1>
          <p className="text-neutral-600">Track and manage tithing contributions</p>
        </div>
        {userProfile && canManageTithing(userProfile.role) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Record Tithing
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">This Month</p>
              <p className="text-xl font-bold text-neutral-900">{formatCurrency(thisMonthTotal)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Contributors (This Month)</p>
              <p className="text-xl font-bold text-neutral-900">{uniqueContributors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Records</p>
              <p className="text-xl font-bold text-neutral-900">{records.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Calendar size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">All Time Total</p>
              <p className="text-xl font-bold text-neutral-900">{formatCurrency(totalAll)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Monthly Tithing (Last 6 Months)</h3>
        <div className="flex items-end gap-4 h-48">
          {monthlyData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-neutral-100 rounded-t-lg relative" style={{ height: '160px' }}>
                <div
                  className="absolute bottom-0 w-full bg-green-500 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(data.total / maxMonthlyTotal) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">{data.label}</p>
              <p className="text-xs font-medium text-neutral-700">{formatCurrency(data.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Filter by Month</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Filter by Member</label>
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        {(filterMonth || filterMember) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFilterMonth(''); setFilterMember(''); }}
              className="px-3 py-2 text-neutral-600 hover:text-neutral-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Notes</th>
                {userProfile && canManageTithing(userProfile.role) && (
                  <th className="text-right px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No tithing records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-neutral-900">{record.member?.full_name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-600">{formatCurrency(record.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {formatDate(record.date_paid)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700">
                        {record.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-sm max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                    {userProfile && canManageTithing(userProfile.role) && (
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && userProfile && (
        <TithingModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          userId={userProfile.id}
          members={members}
          onRecordSaved={(newRecord) => {
            setRecords([newRecord, ...records]);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedRecord && userProfile && (
        <TithingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRecord(null);
          }}
          userId={userProfile.id}
          members={members}
          record={selectedRecord}
          onRecordSaved={(updatedRecord) => {
            setRecords(records.map(r => r.id === updatedRecord.id ? updatedRecord : r));
            setIsEditModalOpen(false);
            setSelectedRecord(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// TITHING MODAL (Add/Edit)
// ============================================
function TithingModal({ 
  isOpen, 
  onClose, 
  userId,
  members,
  record,
  onRecordSaved 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string;
  members: Member[];
  record?: TithingRecord;
  onRecordSaved: (record: any) => void;
}) {
  const [memberId, setMemberId] = useState(record?.member_id || '');
  const [amount, setAmount] = useState(record?.amount?.toString() || '');
  const [datePaid, setDatePaid] = useState(record?.date_paid || new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(record?.payment_method || 'cash');
  const [notes, setNotes] = useState(record?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();
  const isEdit = !!record;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !amount) {
      setError('Member and amount are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recordData = {
        member_id: memberId,
        amount: parseFloat(amount),
        date_paid: datePaid,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      let result;
      if (isEdit) {
        result = await supabase
          .from('tithing_records')
          .update(recordData)
          .eq('id', record.id)
          .select(`*, member:members(full_name)`)
          .single();
      } else {
        result = await supabase
          .from('tithing_records')
          .insert({ ...recordData, recorded_by: userId })
          .select(`*, member:members(full_name)`)
          .single();
      }

      if (result.error) throw result.error;
      onRecordSaved(result.data);
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
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Tithing Record' : 'Record Tithing'}</h2>
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
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (ZAR) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Date Paid</label>
            <input
              type="date"
              value={datePaid}
              onChange={(e) => setDatePaid(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="eft">EFT / Bank Transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
              placeholder="Optional notes..."
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
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Record Tithing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

