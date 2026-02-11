'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Member, TithingRecord } from '@/types';

interface RecordTithingModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  userId: string;
  onTithingRecorded: (record: TithingRecord) => void;
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';

export default function RecordTithingModal({
  isOpen,
  onClose,
  members,
  userId,
  onTithingRecorded,
}: RecordTithingModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedMemberId) {
      setError('Please select a member');
      setLoading(false);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('tithing_records')
        .insert({
          member_id: selectedMemberId,
          amount: amountNum,
          date: date,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
          recorded_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onTithingRecorded(data as TithingRecord);

      // Reset form
      setSelectedMemberId('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Error recording tithing:', err);
      setError(err instanceof Error ? err.message : 'Failed to record tithing');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Record Tithing</h2>
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
            <label htmlFor="member" className="block text-sm font-medium text-neutral-700 mb-1">
              Member *
            </label>
            <select
              id="member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 bg-white"
              required
            >
              <option value="">Select a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-1">
              Amount (R) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-1">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900"
                required
              />
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-neutral-700 mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900"
              placeholder="Any additional notes..."
              rows={2}
            />
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
              {loading ? 'Recording...' : 'Record Tithing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

