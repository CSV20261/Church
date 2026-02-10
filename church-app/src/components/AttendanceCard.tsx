'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Event, Member, AttendanceRecord, Profile, Role, ROLE_HIERARCHY } from '@/types';
import { Card } from '@/components/ui/Card';
import CreateEventModal from './CreateEventModal';

interface AttendanceCardProps {
  events: Event[];
  members: Member[];
  initialAttendance: AttendanceRecord[];
  profile: Profile;
  divisionId: string | null;
}

interface AttendanceState {
  [memberId: string]: {
    status: 'present' | 'absent' | 'excused';
    notes: string;
    recordId?: string;
  };
}

// Roles that can record attendance (Underdeacon and above)
const canRecordAttendance = (role: Role): boolean => {
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY['underdeacon'];
};

// Roles with global access (can see all data even without specific division)
const hasGlobalAccess = (role: Role): boolean => {
  return ['apostle', 'evangelist', 'prophet', 'overseer_shepherd'].includes(role);
};

export default function AttendanceCard({
  events: initialEvents,
  members,
  initialAttendance,
  profile,
  divisionId,
}: AttendanceCardProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents.length > 0 ? initialEvents[0].id : null
  );
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [saving, setSaving] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const supabase = createClient();
  const userCanRecord = canRecordAttendance(profile.role);
  const isMemberRole = profile.role === 'member';

  // Initialize attendance state from initial data
  useEffect(() => {
    const attendanceMap: AttendanceState = {};
    
    // Initialize all members as absent by default
    members.forEach((member) => {
      attendanceMap[member.id] = {
        status: 'absent',
        notes: '',
      };
    });

    // Override with actual attendance records for selected event
    initialAttendance
      .filter((record) => record.event_id === selectedEventId)
      .forEach((record) => {
        attendanceMap[record.member_id] = {
          status: record.status,
          notes: record.notes || '',
          recordId: record.id,
        };
      });

    setAttendance(attendanceMap);
  }, [members, initialAttendance, selectedEventId]);

  // Fetch attendance for selected event
  const fetchAttendanceForEvent = useCallback(async (eventId: string) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('event_id', eventId);

    if (!error && data) {
      const attendanceMap: AttendanceState = {};
      
      members.forEach((member) => {
        attendanceMap[member.id] = {
          status: 'absent',
          notes: '',
        };
      });

      data.forEach((record: AttendanceRecord) => {
        attendanceMap[record.member_id] = {
          status: record.status,
          notes: record.notes || '',
          recordId: record.id,
        };
      });

      setAttendance(attendanceMap);
      setLastUpdate(new Date());
    }
  }, [supabase, members]);

  // Set up realtime subscription
  useEffect(() => {
    if (!selectedEventId || !divisionId) return;

    const channel = supabase
      .channel(`attendance-${selectedEventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${selectedEventId}`,
        },
        (payload) => {
          console.log('Realtime attendance update:', payload);
          // Refetch attendance on any change
          fetchAttendanceForEvent(selectedEventId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEventId, divisionId, supabase, fetchAttendanceForEvent]);

  // Handle event selection change
  const handleEventChange = async (eventId: string) => {
    setSelectedEventId(eventId);
    await fetchAttendanceForEvent(eventId);
  };

  // Toggle attendance status
  const toggleAttendance = (memberId: string) => {
    if (!userCanRecord) return;

    setAttendance((prev) => {
      const current = prev[memberId];
      const nextStatus = current.status === 'present' ? 'absent' : 'present';
      return {
        ...prev,
        [memberId]: {
          ...current,
          status: nextStatus,
        },
      };
    });
  };

  // Update notes
  const updateNotes = (memberId: string, notes: string) => {
    if (!userCanRecord) return;

    setAttendance((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        notes,
      },
    }));
  };

  // Save attendance records
  const saveAttendance = async () => {
    if (!selectedEventId || !userCanRecord) return;

    setSaving(true);
    const selectedEvent = events.find((e) => e.id === selectedEventId);

    try {
      // Prepare upsert data
      const records = Object.entries(attendance).map(([memberId, data]) => ({
        member_id: memberId,
        event_id: selectedEventId,
        date: selectedEvent?.date_time?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: data.status,
        notes: data.notes || null,
        recorded_by: profile.id,
      }));

      // Delete existing records for this event and insert new ones
      await supabase
        .from('attendance_records')
        .delete()
        .eq('event_id', selectedEventId);

      const { error } = await supabase
        .from('attendance_records')
        .insert(records);

      if (error) throw error;

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate attendance summary
  const presentCount = Object.values(attendance).filter((a) => a.status === 'present').length;
  const totalCount = members.length;
  const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Handle new event created
  const handleEventCreated = (newEvent: Event) => {
    setEvents((prev) => [newEvent, ...prev]);
    setSelectedEventId(newEvent.id);
  };

  // For regular members, show read-only view
  if (isMemberRole) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Attendance</h2>
        <p className="text-sm text-gray-500 italic">
          Your attendance records are managed by your division leader.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Attendance Tracking</h2>
            {lastUpdate && (
              <p className="text-xs text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          {(divisionId || hasGlobalAccess(profile.role)) && userCanRecord && (
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              + New Event
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

        {(divisionId || hasGlobalAccess(profile.role)) && events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No upcoming services or events.</p>
            {userCanRecord && (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="mt-3 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create First Event
              </button>
            )}
          </div>
        ) : divisionId && (
          <>
            {/* Event selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Event
              </label>
              <select
                value={selectedEventId || ''}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date_time).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance summary */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                📊 {attendancePercent}% Present ({presentCount}/{totalCount})
              </p>
            </div>

            {/* Member attendance grid */}
            {members.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No members in your division yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {members.map((member) => {
                  const memberAttendance = attendance[member.id] || { status: 'absent', notes: '' };
                  const isPresent = memberAttendance.status === 'present';

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isPresent ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleAttendance(member.id)}
                        disabled={!userCanRecord}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          isPresent
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white border-gray-300'
                        } ${!userCanRecord ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        {isPresent && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Member info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </p>
                      </div>

                      {/* Notes input */}
                      <input
                        type="text"
                        value={memberAttendance.notes}
                        onChange={(e) => updateNotes(member.id, e.target.value)}
                        placeholder="Notes..."
                        disabled={!userCanRecord}
                        className="w-32 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />

                      {/* Status badge */}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          isPresent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save button */}
            {userCanRecord && members.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={saveAttendance}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Attendance'}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {(divisionId || hasGlobalAccess(profile.role)) && userCanRecord && (
        <CreateEventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          divisionId={divisionId || 'global'}
          userId={profile.id}
          onEventCreated={handleEventCreated}
        />
      )}
    </>
  );
}
