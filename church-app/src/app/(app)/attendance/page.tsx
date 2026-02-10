'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Users, Check, X, Clock, ChevronDown, UserCheck, UserX, Percent } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date_time: string;
  event_type: string;
}

interface Member {
  id: string;
  full_name: string;
  priestship_id: string | null;
}

interface AttendanceRecord {
  id: string;
  event_id: string;
  member_id: string;
  status: string;
  recorded_by: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  role: string;
}

export default function AttendancePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  const canRecordAttendance = (role: string) =>
    ['apostle', 'overseer', 'elder', 'priest', 'underdeacon'].includes(role);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendanceForEvent(selectedEvent.id);
    }
  }, [selectedEvent]);

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

      // Fetch events (recent and upcoming)
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, date_time, event_type')
        .order('date_time', { ascending: false })
        .limit(50);

      setEvents(eventsData || []);

      // Auto-select the most recent event
      if (eventsData && eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
      }

      // Fetch members
      const { data: membersData } = await supabase
        .from('members')
        .select('id, full_name, priestship_id')
        .order('full_name');

      setMembers(membersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAttendanceForEvent(eventId: string) {
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('event_id', eventId);

    setAttendanceRecords(data || []);
  }

  async function recordAttendance(memberId: string, status: 'present' | 'absent' | 'excused') {
    if (!selectedEvent || !userProfile) return;

    setSaving(true);
    try {
      const existingRecord = attendanceRecords.find(
        r => r.member_id === memberId && r.event_id === selectedEvent.id
      );

      if (existingRecord) {
        // Update existing record
        const { data, error } = await supabase
          .from('attendance_records')
          .update({ status, recorded_by: userProfile.id })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) throw error;
        setAttendanceRecords(attendanceRecords.map(r => r.id === existingRecord.id ? data : r));
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            event_id: selectedEvent.id,
            member_id: memberId,
            status,
            recorded_by: userProfile.id,
          })
          .select()
          .single();

        if (error) throw error;
        setAttendanceRecords([...attendanceRecords, data]);
      }
    } catch (err: any) {
      alert('Error recording attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function markAllPresent() {
    if (!selectedEvent || !userProfile) return;
    
    setSaving(true);
    try {
      for (const member of filteredMembers) {
        const existingRecord = attendanceRecords.find(
          r => r.member_id === member.id && r.event_id === selectedEvent.id
        );

        if (!existingRecord) {
          await supabase
            .from('attendance_records')
            .insert({
              event_id: selectedEvent.id,
              member_id: member.id,
              status: 'present',
              recorded_by: userProfile.id,
            });
        }
      }
      await fetchAttendanceForEvent(selectedEvent.id);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function getMemberAttendanceStatus(memberId: string): string | null {
    if (!selectedEvent) return null;
    const record = attendanceRecords.find(
      r => r.member_id === memberId && r.event_id === selectedEvent.id
    );
    return record?.status || null;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-ZA', { 
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
    });
  }

  // Filter members by search term
  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats for selected event
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
  const attendanceRate = members.length > 0 
    ? Math.round((presentCount / members.length) * 100) 
    : 0;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Record and track attendance for church events</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Event Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Select Event</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">No events found. Create an event first.</p>
              ) : (
                events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedEvent?.id === event.id
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(event.date_time)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {!selectedEvent ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
              <p className="text-gray-500">Choose an event from the sidebar to record attendance</p>
            </div>
          ) : (
            <>
              {/* Event Info & Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h2>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Clock size={16} />
                      {formatDate(selectedEvent.date_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                      <p className="text-xs text-gray-500">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                      <p className="text-xs text-gray-500">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{excusedCount}</p>
                      <p className="text-xs text-gray-500">Excused</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
                      <p className="text-xs text-gray-500">Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {userProfile && canRecordAttendance(userProfile.role) && (
                  <button
                    onClick={markAllPresent}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserCheck size={18} />
                    Mark All Present
                  </button>
                )}
              </div>

              {/* Members List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      {userProfile && canRecordAttendance(userProfile.role) && (
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                          No members found.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const status = getMemberAttendanceStatus(member.id);
                        return (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">{member.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {status ? (
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                  status === 'present' ? 'bg-green-100 text-green-700' :
                                  status === 'absent' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">Not recorded</span>
                              )}
                            </td>
                            {userProfile && canRecordAttendance(userProfile.role) && (
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => recordAttendance(member.id, 'present')}
                                    disabled={saving}
                                    className={`p-2 rounded-lg transition-colors ${
                                      status === 'present'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                                    }`}
                                    title="Present"
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    onClick={() => recordAttendance(member.id, 'absent')}
                                    disabled={saving}
                                    className={`p-2 rounded-lg transition-colors ${
                                      status === 'absent'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                                    }`}
                                    title="Absent"
                                  >
                                    <X size={18} />
                                  </button>
                                  <button
                                    onClick={() => recordAttendance(member.id, 'excused')}
                                    disabled={saving}
                                    className={`p-2 rounded-lg transition-colors ${
                                      status === 'excused'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                                    }`}
                                    title="Excused"
                                  >
                                    <Clock size={18} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
