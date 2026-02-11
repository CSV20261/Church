'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TithingRecord, Member, Profile, Role, ROLE_HIERARCHY } from '@/types';
import { Card } from '@/components/ui/Card';
import RecordTithingModal from './RecordTithingModal';
import TithingChart from './TithingChart';

interface TithingCardProps {
  initialTithingRecords: TithingRecord[];
  monthlyTotals: MonthlyTotal[];
  members: Member[];
  profile: Profile;
  divisionId: string | null;
}

export interface MonthlyTotal {
  month: string;
  total: number;
  label: string;
}

// Roles that can record tithing (Underdeacon and above)
const canRecordTithing = (role: Role): boolean => {
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY['underdeacon'];
};

// Roles with global access (can see all data even without specific division)
const hasGlobalAccess = (role: Role): boolean => {
  return ['apostle', 'evangelist', 'prophet', 'overseer_shepherd'].includes(role);
};

export default function TithingCard({
  initialTithingRecords,
  monthlyTotals: initialMonthlyTotals,
  members,
  profile,
  divisionId,
}: TithingCardProps) {
  const [tithingRecords, setTithingRecords] = useState<TithingRecord[]>(initialTithingRecords);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>(initialMonthlyTotals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const supabase = createClient();
  const userCanRecord = canRecordTithing(profile.role);
  const isMemberRole = profile.role === 'member';

  // Calculate current month stats
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthRecords = tithingRecords.filter(
    (r) => r.date.startsWith(currentMonth)
  );
  const currentMonthTotal = currentMonthRecords.reduce((sum, r) => sum + r.amount, 0);
  
  // Calculate compliance (unique members who tithed this month)
  const membersTithedThisMonth = new Set(currentMonthRecords.map((r) => r.member_id));
  const compliancePercent = members.length > 0 
    ? Math.round((membersTithedThisMonth.size / members.length) * 100) 
    : 0;

  // Fetch tithing records
  const fetchTithingRecords = useCallback(async () => {
    if (!divisionId) return;

    // Get member IDs for this division
    const memberIds = members.map((m) => m.id);
    if (memberIds.length === 0) return;

    const { data, error } = await supabase
      .from('tithing_records')
      .select('*')
      .in('member_id', memberIds)
      .order('date', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTithingRecords(data as TithingRecord[]);
      setLastUpdate(new Date());
      
      // Recalculate monthly totals
      recalculateMonthlyTotals(data as TithingRecord[]);
    }
  }, [supabase, divisionId, members]);

  // Recalculate monthly totals from records
  const recalculateMonthlyTotals = (records: TithingRecord[]) => {
    const totalsMap = new Map<string, number>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      totalsMap.set(monthKey, 0);
    }

    // Sum up records
    records.forEach((record) => {
      const monthKey = record.date.slice(0, 7);
      if (totalsMap.has(monthKey)) {
        totalsMap.set(monthKey, (totalsMap.get(monthKey) || 0) + record.amount);
      }
    });

    // Convert to array
    const newTotals: MonthlyTotal[] = Array.from(totalsMap.entries()).map(([month, total]) => ({
      month,
      total,
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    }));

    setMonthlyTotals(newTotals);
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!divisionId || members.length === 0) return;

    const memberIds = members.map((m) => m.id);

    const channel = supabase
      .channel(`tithing-${divisionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tithing_records',
        },
        (payload) => {
          console.log('Realtime tithing update:', payload);
          // Check if the record belongs to our division members
          const record = payload.new as TithingRecord;
          if (record && memberIds.includes(record.member_id)) {
            fetchTithingRecords();
          } else if (payload.eventType === 'DELETE') {
            fetchTithingRecords();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [divisionId, members, supabase, fetchTithingRecords]);

  // Handle new tithing recorded
  const handleTithingRecorded = (newRecord: TithingRecord) => {
    setTithingRecords((prev) => [newRecord, ...prev]);
    recalculateMonthlyTotals([newRecord, ...tithingRecords]);
    setLastUpdate(new Date());
  };

  // Get member name by ID
  const getMemberName = (memberId: string): string => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  // For regular members, show their own tithing history
  if (isMemberRole) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Your Tithing History</h2>
        <p className="text-sm text-neutral-500 italic">
          Your tithing records are managed by your division leader. Contact them for details.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Tithing Monitoring</h2>
            {lastUpdate && (
              <p className="text-xs text-neutral-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          {divisionId && userCanRecord && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Record Tithing
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium">Monthly Total</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(currentMonthTotal)}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-primary-600 font-medium">Compliance</p>
                <p className="text-xl font-bold text-blue-800">
                  {compliancePercent}%
                  <span className="text-sm font-normal text-primary-600 ml-1">
                    ({membersTithedThisMonth.size}/{members.length})
                  </span>
                </p>
              </div>
            </div>

            {/* Chart */}
            {monthlyTotals.length > 0 && (
              <div className="mb-4">
                <TithingChart data={monthlyTotals} />
              </div>
            )}

            {/* Recent records list */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Recent Contributions</h3>
              {tithingRecords.length === 0 ? (
                <p className="text-center text-neutral-500 py-4 text-sm">
                  No tithing records yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tithingRecords.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium text-neutral-800">
                          {getMemberName(record.member_id)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(record.date).toLocaleDateString()}
                          {record.payment_method && ` • ${record.payment_method}`}
                        </p>
                      </div>
                      <p className="font-semibold text-green-700">
                        {formatCurrency(record.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {divisionId && userCanRecord && (
        <RecordTithingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          members={members}
          userId={profile.id}
          onTithingRecorded={handleTithingRecorded}
        />
      )}
    </>
  );
}

