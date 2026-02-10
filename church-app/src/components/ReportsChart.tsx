'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface ReportTypeCount {
  type: string;
  count: number;
  color: string;
}

interface ReportsChartProps {
  data: ReportTypeCount[];
}

const typeLabels: Record<string, string> = {
  wellness: 'Wellness',
  absence: 'Absence',
  prayer_need: 'Prayer',
  follow_up: 'Follow-up',
  other: 'Other',
};

export default function ReportsChart({ data }: ReportsChartProps) {
  const chartData = data.map((d) => ({
    name: typeLabels[d.type] || d.type,
    value: d.count,
    color: d.color,
  }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={25}
            outerRadius={45}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value as number, 'Reports']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px' }}
            iconSize={8}
            layout="horizontal"
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
