'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Edit2, Trash2, Clock, MapPin, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date_time: string;
  start_time: string | null;
  event_type: string;
  priestship_id: string | null;
  created_by: string;
  is_recurring: boolean;
  created_at: string;
  priestship?: { name: string } | null;
}

interface UserProfile {
  id: string;
  role: string;
  approval_status: string;
}

const EVENT_TYPES = [
  { value: 'sunday_service', label: 'Sunday Service', color: 'bg-blue-100 text-blue-700' },
  { value: 'wednesday_service', label: 'Wednesday Service', color: 'bg-purple-100 text-purple-700' },
  { value: 'prayer_meeting', label: 'Prayer Meeting', color: 'bg-green-100 text-green-700' },
  { value: 'youth_meeting', label: 'Youth Meeting', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'special_service', label: 'Special Service', color: 'bg-red-100 text-red-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const supabase = createClient();

  const canManageEvents = (role: string) =>
    ['apostle', 'overseer', 'elder', 'priest', 'underdeacon'].includes(role);

  useEffect(() => {
    fetchUserAndEvents();
  }, []);

  async function fetchUserAndEvents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, approval_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`*, priestship:priestships(name)`)
        .order('date_time', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err: any) {
      alert('Error deleting event: ' + err.message);
    }
  }

  function getEventTypeStyle(type: string) {
    return EVENT_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-700';
  }

  function getEventTypeLabel(type: string) {
    return EVENT_TYPES.find(t => t.value === type)?.label || type;
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(dateStr: string, startTime: string | null) {
    if (startTime) return startTime;
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  // Calendar helpers
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  }

  function getEventsForDay(day: number) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return events.filter(event => {
      const eventDate = new Date(event.date_time);
      return eventDate.getFullYear() === year && 
             eventDate.getMonth() === month && 
             eventDate.getDate() === day;
    });
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const today = new Date();

  // Upcoming events (next 7 days)
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date_time);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= weekFromNow;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Church services and events calendar</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
          </div>
          {userProfile && canManageEvents(userProfile.role) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Event
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Upcoming Events Banner */}
      {upcomingEvents.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-800 mb-2">📅 Upcoming This Week</h3>
          <div className="flex flex-wrap gap-2">
            {upcomingEvents.slice(0, 5).map(event => (
              <span key={event.id} className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full text-sm">
                <span className={`w-2 h-2 rounded-full ${getEventTypeStyle(event.event_type).split(' ')[0]}`}></span>
                {event.title} - {formatDate(event.date_time)}
              </span>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priestship</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No events scheduled. Create your first event!
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calendar size={20} className="text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{event.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} />
                          <div>
                            <p className="font-medium">{formatDate(event.date_time)}</p>
                            <p className="text-sm text-gray-500">{formatTime(event.date_time, event.start_time)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEventTypeStyle(event.event_type)}`}>
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {event.priestship?.name || 'All'}
                      </td>
                      <td className="px-6 py-4">
                        {userProfile && canManageEvents(userProfile.role) && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = today.getDate() === day && 
                             today.getMonth() === currentMonth.getMonth() && 
                             today.getFullYear() === currentMonth.getFullYear();
              
              return (
                <div
                  key={day}
                  className={`aspect-square p-1 border rounded-lg ${
                    isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs truncate px-1 rounded ${getEventTypeStyle(event.event_type)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && userProfile && (
        <EventModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          userId={userProfile.id}
          onEventSaved={(newEvent) => {
            setEvents([...events, newEvent].sort((a, b) => 
              new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
            ));
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && selectedEvent && userProfile && (
        <EventModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEvent(null);
          }}
          userId={userProfile.id}
          event={selectedEvent}
          onEventSaved={(updatedEvent) => {
            setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
            setIsEditModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// EVENT MODAL (Add/Edit)
// ============================================
function EventModal({ 
  isOpen, 
  onClose, 
  userId,
  event,
  onEventSaved 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string;
  event?: Event;
  onEventSaved: (event: any) => void;
}) {
  const [title, setTitle] = useState(event?.title || '');
  const [eventDate, setEventDate] = useState(event?.date_time?.split('T')[0] || '');
  const [startTime, setStartTime] = useState(event?.start_time || '');
  const [eventType, setEventType] = useState(event?.event_type || 'sunday_service');
  const [priestshipId, setPriestshipId] = useState(event?.priestship_id || '');
  const [priestships, setPriestships] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();
  const isEdit = !!event;

  useEffect(() => {
    fetchPriestships();
  }, []);

  async function fetchPriestships() {
    const { data } = await supabase
      .from('priestships')
      .select('id, name')
      .order('name');
    setPriestships(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      setError('Title and date are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventData = {
        title: title.trim(),
        date_time: eventDate + (startTime ? `T${startTime}:00` : 'T00:00:00'),
        start_time: startTime || null,
        event_type: eventType,
        priestship_id: priestshipId || null,
        is_recurring: false,
      };

      let result;
      if (isEdit) {
        result = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .select(`*, priestship:priestships(name)`)
          .single();
      } else {
        result = await supabase
          .from('events')
          .insert({ ...eventData, created_by: userId })
          .select(`*, priestship:priestships(name)`)
          .single();
      }

      if (result.error) throw result.error;
      onEventSaved(result.data);
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
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Event' : 'Add New Event'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Sunday Morning Service"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priestship (optional)</label>
            <select
              value={priestshipId}
              onChange={(e) => setPriestshipId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All (Global Event)</option>
              {priestships.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
