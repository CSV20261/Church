'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface MonthlyGiftData {
  month: string;
  label: string;
  dreams: number;
  visions: number;
  prophecies: number;
}

interface SpiritualGiftsChartProps {
  data: MonthlyGiftData[];
}

export default function SpiritualGiftsChart({ data }: SpiritualGiftsChartProps) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={25}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            iconSize={10}
          />
          <Bar dataKey="dreams" name="Dreams" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="visions" name="Visions" fill="#22c55e" radius={[2, 2, 0, 0]} />
          <Bar dataKey="prophecies" name="Prophecies" fill="#a855f7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

