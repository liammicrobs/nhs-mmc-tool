'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { BusinessCaseScores } from '@/types';

const STAGE_LABELS: Record<string, string> = {
  soc: 'SOC',
  obc: 'OBC',
  fbc: 'FBC',
  pc: 'PC',
};

interface BusinessCaseLineChartProps {
  data: BusinessCaseScores[];
}

export function BusinessCaseLineChart({ data }: BusinessCaseLineChartProps) {
  const chartData = data.map((d) => ({
    stage: STAGE_LABELS[d.stage] ?? d.stage.toUpperCase(),
    'Category 0': Number(d.category0Avg.toFixed(1)),
    PMV: Number(d.pmvAvg.toFixed(1)),
    'Category 7': Number(d.category7Avg.toFixed(1)),
    Combined: Number(d.combinedAvg.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDEE" />
        <XAxis
          dataKey="stage"
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
        <Line
          type="monotone"
          dataKey="Category 0"
          stroke="#005EB8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="PMV"
          stroke="#00A499"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Category 7"
          stroke="#41B6E6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Combined"
          stroke="#0072CE"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
