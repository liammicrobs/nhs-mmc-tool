'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ElementUtilisation } from '@/types';

const SECTION_COLORS: Record<string, string> = {
  structure: '#005EB8',
  architecture: '#00A499',
  building_services: '#41B6E6',
};

interface ElementBarChartProps {
  data: ElementUtilisation[];
  maxItems?: number;
  dataKey?: 'avgPmvPotential' | 'avgUtilisation' | 'gap';
  label?: string;
}

function truncate(name: string, max: number): string {
  return name.length > max ? name.slice(0, max) + '...' : name;
}

export function ElementBarChart({
  data,
  maxItems = 20,
  dataKey = 'avgPmvPotential',
  label = 'PMV Potential %',
}: ElementBarChartProps) {
  const sorted = [...data]
    .sort((a, b) => b[dataKey] - a[dataKey])
    .slice(0, maxItems);

  const chartData = sorted.map((d) => ({
    name: truncate(d.elementName, 30),
    value: Number(d[dataKey].toFixed(1)),
    section: d.section,
  }));

  const height = Math.max(400, sorted.length * 28);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 150, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDEE" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#425563' }}
          axisLine={{ stroke: '#AEB7BD' }}
          label={{
            value: label,
            position: 'insideBottom',
            offset: -10,
            fontSize: 12,
            fill: '#425563',
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#425563' }}
          axisLine={{ stroke: '#AEB7BD' }}
          width={140}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #AEB7BD',
            fontSize: 12,
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}%`, label]}
        />
        <Bar dataKey="value" radius={[0, 2, 2, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={SECTION_COLORS[entry.section] ?? '#768692'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
