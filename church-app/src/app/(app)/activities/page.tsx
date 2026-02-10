'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalendarDays, Plus, Edit2, Trash2, MapPin, Users, Clock, X } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  location: string | null;
  organizer_id: string | null;
  activity_type: string;
  created_by: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
}

const ACTIVITY_TYPES = [
  { value: 'youth', label: 'Youth Activity', color: 'bg-blue-100 text-blue-700' },
  { value: 'outreach', label: 'Outreach', color: 'bg-green-100 text-green-700' },
  { value: 'fellowship', label: 'Fellowship', color: 'bg-purple-100 text-purple-700' },
  { value: 'training', label: 'Training', color: 'bg-orange-100 text-orange-700' },
  { value: 'community', label: 'Community Service', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');

  const supabase = createClient();

  const canManageActivities = (role: string) =>
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
        .select('id, role, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profile) setUserProfile(profile);

      // For now, we'll use the events table with a filter, or create activities
      // Since activities table may not exist, we'll simulate with events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date_time', { ascending: true });

      if (eventsError) throw eventsError;
      
      // Map events to activities format
      const activitiesData = (eventsData || []).map(e => ({
        id: e.id,
        title: e.title,
        description: null,
        date_time: e.date_time,
        location: null,
        organizer_id: e.created_by,
        activity_type: e.event_type === 'youth_meeting' ? 'youth' : 
                       e.event_type === 'special_service' ? 'fellowship' : 'other',
        created_by: e.created_by,
        created_at: e.created_at,
      }));
      
      setActivities(activitiesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', activityId);
      if (error) throw error;
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (err: any) {
      alert('Error deleting activity: ' + err.message);
    }
  }

  function getActivityTypeInfo(type: string) {
    return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[5];
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // Filter activities
  const filteredActivities = activities.filter(a => {
    if (filterType && a.activity_type !== filterType) return false;
    return true;
  });

  // Separate upcoming and past
  const now = new Date();
  const upcomingActivities = filteredActivities.filter(a => new Date(a.date_time) >= now);
  const pastActivities = filteredActivities.filter(a => new Date(a.date_time) < now);

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
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600">Plan and manage church activities</p>
        </div>
        {userProfile && canManageActivities(userProfile.role) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Plus size={20} />
            New Activity
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          {ACTIVITY_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Upcoming Activities */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Activities ({upcomingActivities.length})
        </h2>
        {upcomingActivities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No upcoming activities scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingActivities.map((activity) => {
              const typeInfo = getActivityTypeInfo(activity.activity_type);
              const { date, time } = formatDateTime(activity.date_time);
              return (
                <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {userProfile && canManageActivities(userProfile.role) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{activity.title}</h3>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
                  )}
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{date} at {time}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Activities */}
      {pastActivities.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Past Activities ({pastActivities.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Activity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pastActivities.slice(0, 10).map((activity) => {
                  const typeInfo = getActivityTypeInfo(activity.activity_type);
                  const { date } = formatDateTime(activity.date_time);
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{activity.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && userProfile && (
        <ActivityModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          userId={userProfile.id}
          onActivitySaved={(newActivity) => {
            setActivities([...activities, newActivity].sort((a, b) => 
              new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
            ));
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedActivity && userProfile && (
        <ActivityModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedActivity(null);
          }}
          userId={userProfile.id}
          activity={selectedActivity}
          onActivitySaved={(updatedActivity) => {
            setActivities(activities.map(a => a.id === updatedActivity.id ? updatedActivity : a));
            setIsEditModalOpen(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// ACTIVITY MODAL (Add/Edit)
// ============================================
function ActivityModal({ 
  isOpen, 
  onClose, 
  userId,
  activity,
  onActivitySaved 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string;
  activity?: Activity;
  onActivitySaved: (activity: any) => void;
}) {
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [dateTime, setDateTime] = useState(
    activity?.date_time ? activity.date_time.slice(0, 16) : ''
  );
  const [location, setLocation] = useState(activity?.location || '');
  const [activityType, setActivityType] = useState(activity?.activity_type || 'fellowship');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();
  const isEdit = !!activity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dateTime) {
      setError('Title and date/time are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Map activity type back to event type
      const eventType = activityType === 'youth' ? 'youth_meeting' :
                       activityType === 'fellowship' ? 'special_service' : 'other';

      const eventData = {
        title: title.trim(),
        date_time: dateTime + ':00',
        event_type: eventType,
        is_recurring: false,
      };

      let result;
      if (isEdit) {
        result = await supabase
          .from('events')
          .update(eventData)
          .eq('id', activity.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('events')
          .insert({ ...eventData, created_by: userId })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Map back to activity format
      const savedActivity = {
        id: result.data.id,
        title: result.data.title,
        description: description || null,
        date_time: result.data.date_time,
        location: location || null,
        organizer_id: result.data.created_by,
        activity_type: activityType,
        created_by: result.data.created_by,
        created_at: result.data.created_at,
      };

      onActivitySaved(savedActivity);
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
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Activity' : 'New Activity'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Activity title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Where will this take place?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              rows={3}
              placeholder="Activity details..."
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
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
