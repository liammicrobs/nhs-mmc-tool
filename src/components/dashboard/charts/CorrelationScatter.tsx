'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CorrelationResult } from '@/types';

interface CorrelationScatterProps {
  data: CorrelationResult;
  xLabel: string;
  yLabel: string;
  color?: string;
}

export function CorrelationScatter({
  data,
  xLabel,
  yLabel,
  color = '#005EB8',
}: CorrelationScatterProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-nhs-grey-1">
          {xLabel} vs {yLabel}
        </span>
        <span className="text-xs font-mono bg-nhs-pale-grey px-2 py-1 rounded">
          R&sup2; = {data.rSquared.toFixed(3)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDEE" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#425563' }}
            axisLine={{ stroke: '#AEB7BD' }}
            label={{ value: xLabel, position: 'insideBottom', offset: -2, fontSize: 11, fill: '#425563' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#425563' }}
            axisLine={{ stroke: '#AEB7BD' }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#425563' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #AEB7BD',
              fontSize: 12,
            }}
            formatter={(value: number | undefined) => (value ?? 0).toFixed(1)}
          />
          <Scatter data={data.points} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
