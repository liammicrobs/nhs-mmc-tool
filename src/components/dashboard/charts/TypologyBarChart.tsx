'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TypologyScores } from '@/types';

const TYPOLOGY_LABELS: Record<string, string> = {
  acute: 'Acute',
  primary_care: 'Primary Care',
  specialist: 'Specialist',
  mental_health: 'Mental Health',
  infrastructure: 'Infrastructure',
  other: 'Other',
  all: 'All',
};

interface TypologyBarChartProps {
  data: TypologyScores[];
  title?: string;
}

export function TypologyBarChart({ data, title }: TypologyBarChartProps) {
  const chartData = data.map((d) => ({
    typology: TYPOLOGY_LABELS[d.typology] ?? d.typology,
    'Category 0': Number(d.category0Avg.toFixed(1)),
    PMV: Number(d.pmvAvg.toFixed(1)),
    'Category 7': Number(d.category7Avg.toFixed(1)),
    Combined: Number(d.combinedAvg.toFixed(1)),
  }));

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-nhs-grey-1 mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDEE" />
          <XAxis
            dataKey="typology"
            tick={{ fontSize: 12, fill: '#425563' }}
            axisLine={{ stroke: '#AEB7BD' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#425563' }}
            axisLine={{ stroke: '#AEB7BD' }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #AEB7BD',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            y={70}
            stroke="#009639"
            strokeDasharray="6 4"
            label={{ value: 'Target 70%', position: 'right', fontSize: 11, fill: '#009639' }}
          />
          <Bar dataKey="Category 0" fill="#005EB8" radius={[2, 2, 0, 0]} />
          <Bar dataKey="PMV" fill="#00A499" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Category 7" fill="#41B6E6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Combined" fill="#0072CE" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
