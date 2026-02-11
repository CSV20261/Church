'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthlyTotal } from './TithingCard';

interface TithingChartProps {
  data: MonthlyTotal[];
}

export default function TithingChart({ data }: TithingChartProps) {
  // Format currency for tooltip
  const formatCurrency = (value: number): string => {
    return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `R${value >= 1000 ? `${value / 1000}k` : value}`}
            width={45}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value as number), 'Total']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar 
            dataKey="total" 
            fill="#15803d" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

