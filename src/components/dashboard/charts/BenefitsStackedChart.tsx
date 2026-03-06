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
} from 'recharts';
import type { BenefitCategoryDistribution } from '@/types';

interface BenefitsStackedChartProps {
  data: BenefitCategoryDistribution[];
  stacked?: boolean;
}

function truncateLabel(label: string, maxLen = 20): string {
  return label.length > maxLen ? label.slice(0, maxLen) + '...' : label;
}

export function BenefitsStackedChart({
  data,
  stacked = true,
}: BenefitsStackedChartProps) {
  const chartData = data.map((d) => ({
    projectLabel: truncateLabel(d.projectLabel),
    Faster: d.faster,
    Better: d.better,
    'Sustainable Legacy': d.sustainable_legacy,
    Economic: d.economic,
  }));

  const height = Math.max(350, data.length * 40);
  const stackProps = stacked ? { stackId: 'a' } : {};

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDEE" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#425563' }}
          axisLine={{ stroke: '#AEB7BD' }}
        />
        <YAxis
          type="category"
          dataKey="projectLabel"
          tick={{ fontSize: 12, fill: '#425563' }}
          axisLine={{ stroke: '#AEB7BD' }}
          width={110}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #AEB7BD',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Faster" fill="#41B6E6" radius={[0, 0, 0, 0]} {...stackProps} />
        <Bar dataKey="Better" fill="#005EB8" radius={[0, 0, 0, 0]} {...stackProps} />
        <Bar dataKey="Sustainable Legacy" fill="#00A499" radius={[0, 0, 0, 0]} {...stackProps} />
        <Bar dataKey="Economic" fill="#0072CE" radius={[0, 0, 0, 0]} {...stackProps} />
      </BarChart>
    </ResponsiveContainer>
  );
}
