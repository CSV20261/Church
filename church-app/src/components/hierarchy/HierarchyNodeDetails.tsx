'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface HierarchyNodeDetailsProps {
  node: {
    id: string;
    data: {
      label: string;
      level: string;
      levelLabel: string;
      leader: string;
      location?: string;
      colors: { bg: string; border: string; text: string };
      rawData: Record<string, unknown>;
    };
  };
  onClose: () => void;
}

interface NodeStats {
  membersCount: number;
  eventsCount: number;
  loading: boolean;
}

export default function HierarchyNodeDetails({ node, onClose }: HierarchyNodeDetailsProps) {
  const [stats, setStats] = useState<NodeStats>({ membersCount: 0, eventsCount: 0, loading: true });
  const supabase = createClient();

  const { label, levelLabel, leader, location, colors, rawData } = node.data;

  useEffect(() => {
    const fetchStats = async () => {
      setStats(prev => ({ ...prev, loading: true }));
      
      try {
        // For now, just show basic info - can expand to fetch real counts
        // This would need proper queries based on the hierarchy level
        setStats({
          membersCount: 0,
          eventsCount: 0,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching node stats:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [node.id, supabase]);

  return (
    <div className="absolute right-4 top-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div 
        className="p-4 text-white"
        style={{ backgroundColor: colors.border }}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider opacity-80">{levelLabel}</span>
            <h3 className="text-lg font-bold mt-1">{label}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Leader info */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Leader</p>
          <p className="font-medium text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
              👤
            </span>
            {leader}
          </p>
        </div>

        {/* Location */}
        {location && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-gray-700 flex items-center gap-2">
              <span>📍</span>
              {location}
            </p>
          </div>
        )}

        {/* ID for reference */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ID</p>
          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
            {String(rawData.id || '')}
          </p>
        </div>

        {/* Stats */}
        {!stats.loading && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.membersCount}</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.eventsCount}</p>
              <p className="text-xs text-gray-500">Events</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            className="w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.bg,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onClick={() => {
              // TODO: Navigate to detailed view
              console.log('View details for:', rawData);
            }}
          >
            View Full Details →
          </button>
        </div>
      </div>
    </div>
  );
}
