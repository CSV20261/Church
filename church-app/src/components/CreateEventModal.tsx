'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Event } from '@/types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  divisionId: string;
  userId: string;
  onEventCreated: (event: Event) => void;
}

type EventType = 'service' | 'meeting' | 'celebration' | 'outreach' | 'funeral' | 'wedding' | 'baptism' | 'other';

export default function CreateEventModal({
  isOpen,
  onClose,
  divisionId,
  userId,
  onEventCreated,
}: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [eventType, setEventType] = useState<EventType>('service');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          title: title.trim(),
          date_time: eventDate + (startTime ? `T${startTime}:00` : 'T00:00:00'),
          start_time: startTime || null,
          event_type: eventType,
          priestship_id: divisionId === 'global' ? null : divisionId,
          created_by: userId,
          is_recurring: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onEventCreated(data as Event);

      // Reset form
      setTitle('');
      setEventDate('');
      setStartTime('');
      setEventType('service');
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get today's date for min value
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Create New Event</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
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
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900"
              placeholder="Sunday Service"
              required
            />
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-neutral-700 mb-1">
              Event Type
            </label>
            <select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 bg-white"
            >
              <option value="service">Service</option>
              <option value="meeting">Meeting</option>
              <option value="celebration">Celebration</option>
              <option value="outreach">Outreach</option>
              <option value="funeral">Funeral</option>
              <option value="wedding">Wedding</option>
              <option value="baptism">Baptism</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-neutral-700 mb-1">
                Date *
              </label>
              <input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900"
                required
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-neutral-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

