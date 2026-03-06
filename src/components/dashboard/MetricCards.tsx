'use client';

import { RAGBadge } from '@/components/ui';
import { computeRAG } from '@/lib/calculations/executive-summary';

interface MetricCardProps {
  label: string;
  value: number;
  benchmark?: number;
  suffix?: string;
  size?: 'sm' | 'lg';
}

export function MetricCard({
  label,
  value,
  benchmark = 70,
  suffix = '%',
  size = 'sm',
}: MetricCardProps) {
  const rag = computeRAG(value, benchmark);

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 p-4 shadow-sm">
      <p className="text-xs font-semibold text-nhs-grey-1 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex items-center justify-between">
        <span
          className={`font-bold text-nhs-black ${
            size === 'lg' ? 'text-3xl' : 'text-2xl'
          }`}
        >
          {value.toFixed(1)}
          {suffix}
        </span>
        <RAGBadge status={rag} size="sm" />
      </div>
    </div>
  );
}

interface MetricCardsRowProps {
  category0: number;
  pmv: number;
  category7: number;
  combined: number;
  projectCount: number;
}

export function MetricCardsRow({
  category0,
  pmv,
  category7,
  combined,
  projectCount,
}: MetricCardsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Project count card - plain number, no RAG */}
      <div className="bg-white rounded-lg border border-nhs-grey-4 p-4 shadow-sm">
        <p className="text-xs font-semibold text-nhs-grey-1 uppercase tracking-wide mb-1">
          Projects
        </p>
        <span className="text-2xl font-bold text-nhs-black">
          {projectCount}
        </span>
      </div>

      <MetricCard label="Category 0" value={category0} benchmark={70} />
      <MetricCard label="PMV" value={pmv} benchmark={70} />
      <MetricCard label="Category 7" value={category7} benchmark={65} />
      <MetricCard label="Combined" value={combined} benchmark={70} size="lg" />
    </div>
  );
}
