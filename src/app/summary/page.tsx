'use client';

import { useState, useEffect } from 'react';
import { useMMCStore } from '@/lib/store';
import { computeExecutiveSummary } from '@/lib/calculations/executive-summary';
import { computeAllCategoryAverages } from '@/lib/calculations/benefits';
import { computeConstraintAverage } from '@/lib/calculations/constraints';
import { allCarbonChecksPass } from '@/lib/calculations/pmv';
import { RAGStatus, BenchmarkResult, SectionPMV } from '@/types';
import { PageHeader, SectionCard, RAGBadge } from '@/components/ui';
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// NHS colour palette
const NHS_COLORS = {
  darkBlue: '#003087',
  blue: '#005EB8',
  brightBlue: '#0072CE',
  lightBlue: '#41B6E6',
  green: '#007F3B',
  aquaGreen: '#00A499',
  amber: '#FFB81C',
  red: '#DA291C',
};

const PIE_COLORS = [NHS_COLORS.darkBlue, NHS_COLORS.blue, NHS_COLORS.lightBlue];

const SECTION_LABELS: Record<string, string> = {
  structure: 'Structure',
  architecture: 'Architecture',
  building_services: 'Building Services',
};

const BENEFIT_LABELS: Record<string, string> = {
  faster: 'Faster',
  better: 'Better',
  sustainable_legacy: 'Sustainable Legacy',
  economic: 'Economic',
};

function ragColor(rag: RAGStatus): string {
  if (rag === 'green') return NHS_COLORS.green;
  if (rag === 'amber') return NHS_COLORS.amber;
  return NHS_COLORS.red;
}

function ragBorderClass(rag: RAGStatus): string {
  if (rag === 'green') return 'border-rag-green';
  if (rag === 'amber') return 'border-rag-amber';
  return 'border-rag-red';
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------
function MetricCard({
  title,
  score,
  subtitle,
  rag,
  hero,
  carbonFail,
}: {
  title: string;
  score: number;
  subtitle?: string;
  rag: RAGStatus;
  hero?: boolean;
  carbonFail?: boolean;
}) {
  const borderClass = hero ? `border-2 ${ragBorderClass(rag)}` : 'border border-nhs-grey-4';
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-5 flex flex-col gap-2 ${borderClass} ${
        hero ? 'ring-1 ring-offset-1 ring-nhs-blue/20' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-nhs-grey-1 uppercase tracking-wide">{title}</span>
        <RAGBadge status={rag} size={hero ? 'lg' : 'md'} />
      </div>
      <div className={`font-bold ${hero ? 'text-4xl' : 'text-3xl'} text-nhs-black`}>
        {carbonFail ? 'N/A' : `${score.toFixed(1)}%`}
      </div>
      {subtitle && !carbonFail && (
        <span className="text-xs text-nhs-grey-2">{subtitle}</span>
      )}
      {!carbonFail && (
        <div className="w-full bg-nhs-grey-4 rounded-full h-1.5 mt-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, score))}%`,
              backgroundColor: ragColor(rag),
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Benchmark Table
// ---------------------------------------------------------------------------
function BenchmarkTable({ benchmarks }: { benchmarks: BenchmarkResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-nhs-grey-4">
            <th className="text-left py-3 px-4 font-semibold text-nhs-grey-1">Metric</th>
            <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">Score</th>
            <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">Benchmark</th>
            <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">Gap</th>
            <th className="text-center py-3 px-4 font-semibold text-nhs-grey-1">RAG</th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((b) => {
            const positive = b.gap >= 0;
            return (
              <tr key={b.metric} className="border-b border-nhs-grey-4 last:border-b-0">
                <td className="py-3 px-4 font-medium text-nhs-black">{b.metric}</td>
                <td className="py-3 px-4 text-right font-semibold">{b.score.toFixed(1)}%</td>
                <td className="py-3 px-4 text-right text-nhs-grey-1">{b.benchmark.toFixed(1)}%</td>
                <td className="py-3 px-4 text-right">
                  <span className={positive ? 'text-rag-green font-semibold' : 'text-rag-red font-semibold'}>
                    {positive ? '+' : ''}
                    {b.gap.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <RAGBadge status={b.rag} size="sm" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PMV Donut Chart
// ---------------------------------------------------------------------------
function PMVDonutChart({ distribution, totalPmv }: { distribution: SectionPMV[]; totalPmv: number }) {
  const chartData = distribution.map((d) => ({
    name: SECTION_LABELS[d.section] ?? d.section,
    value: d.proportion * 100,
    averagePmv: d.averagePmv,
  }));

  // If all zeroes, show a placeholder
  const allZero = chartData.every((d) => d.value === 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allZero ? [{ name: 'No data', value: 100 }] : chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={allZero ? 0 : 2}
              dataKey="value"
              stroke="none"
            >
              {allZero ? (
                <Cell fill="#D8DDE0" />
              ) : (
                chartData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))
              )}
            </Pie>
            <Tooltip
              formatter={(value?: number | string) => `${Number(value ?? 0).toFixed(1)}%`}
              contentStyle={{ borderRadius: 8, border: '1px solid #D8DDE0', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-nhs-black">{totalPmv.toFixed(1)}%</div>
            <div className="text-xs text-nhs-grey-2">Total PMV</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {distribution.map((d, idx) => (
          <div key={d.section} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx] }} />
            <span className="text-nhs-grey-1">{SECTION_LABELS[d.section]}</span>
            <span className="font-semibold text-nhs-black">{(d.proportion * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Benefits vs Constraints Radar
// ---------------------------------------------------------------------------
function BenefitsConstraintsRadar({
  benefitAverages,
  constraintAverage,
}: {
  benefitAverages: Record<string, number>;
  constraintAverage: number;
}) {
  const radarData = Object.entries(benefitAverages).map(([key, value]) => ({
    subject: BENEFIT_LABELS[key] ?? key,
    benefits: value,
    constraints: constraintAverage,
  }));

  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#D8DDE0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4C6272', fontSize: 12 }} />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={{ fill: '#768692', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Benefits"
            dataKey="benefits"
            stroke={NHS_COLORS.blue}
            fill={NHS_COLORS.blue}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Constraints"
            dataKey="constraints"
            stroke={NHS_COLORS.amber}
            fill={NHS_COLORS.amber}
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D8DDE0', fontSize: 13 }} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: NHS_COLORS.blue }} />
          <span className="text-nhs-grey-1">Benefits (average importance)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: NHS_COLORS.amber }} />
          <span className="text-nhs-grey-1">Constraint baseline</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PMV Section Breakdown (Horizontal Bar Chart)
// ---------------------------------------------------------------------------
function PMVSectionBreakdown({ distribution }: { distribution: SectionPMV[] }) {
  const barData = distribution.map((d) => ({
    section: SECTION_LABELS[d.section] ?? d.section,
    averagePmv: Number(d.averagePmv.toFixed(1)),
    contribution: Number(d.totalPmv.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8DDE0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#4C6272', fontSize: 12 }} unit="%" />
            <YAxis
              type="category"
              dataKey="section"
              width={120}
              tick={{ fill: '#4C6272', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value?: number | string, name?: string) => [
                `${Number(value ?? 0).toFixed(1)}%`,
                name === 'averagePmv' ? 'Average PMV' : 'Project Contribution',
              ]}
              contentStyle={{ borderRadius: 8, border: '1px solid #D8DDE0', fontSize: 13 }}
            />
            <Bar dataKey="averagePmv" name="Average PMV" fill={NHS_COLORS.blue} radius={[0, 4, 4, 0]} />
            <Bar
              dataKey="contribution"
              name="Project Contribution"
              fill={NHS_COLORS.lightBlue}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail rows */}
      <div className="space-y-3">
        {distribution.map((d, idx) => (
          <div key={d.section} className="flex items-center gap-4">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }} />
            <span className="w-32 text-sm font-medium text-nhs-black">
              {SECTION_LABELS[d.section]}
            </span>
            <div className="flex-1 bg-nhs-grey-4 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, d.averagePmv))}%`,
                  backgroundColor: PIE_COLORS[idx],
                }}
              />
            </div>
            <span className="w-20 text-sm text-right font-semibold text-nhs-black">
              {d.averagePmv.toFixed(1)}%
            </span>
            <span className="w-28 text-xs text-right text-nhs-grey-2">
              Contribution: {d.totalPmv.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formula visualiser
// ---------------------------------------------------------------------------
function FormulaVisualiser({
  cat0,
  cat0Weighted,
  pmv,
  cat7,
  cat7Weighted,
  overall,
}: {
  cat0: number;
  cat0Weighted: number;
  pmv: number;
  cat7: number;
  cat7Weighted: number;
  overall: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-center py-4">
      <FormulaBlock label="Category 0" value={`${cat0.toFixed(1)}%`} sub="x 15%" />
      <FormulaOperator>+</FormulaOperator>
      <FormulaBlock label="PMV" value={`${pmv.toFixed(1)}%`} sub="x 70%" />
      <FormulaOperator>+</FormulaOperator>
      <FormulaBlock label="Category 7" value={`${cat7.toFixed(1)}%`} sub="x 15%" />
      <FormulaOperator>=</FormulaOperator>
      <div className="bg-nhs-blue text-white rounded-lg px-6 py-3 shadow-md">
        <div className="text-xs font-medium opacity-80 mb-0.5">Overall MMC</div>
        <div className="text-2xl font-bold">{overall.toFixed(1)}%</div>
        <div className="text-[10px] opacity-70 mt-0.5">
          ({cat0Weighted.toFixed(1)} + {pmv.toFixed(1)} + {cat7Weighted.toFixed(1)})
        </div>
      </div>
    </div>
  );
}

function FormulaBlock({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-nhs-pale-grey border border-nhs-grey-4 rounded-lg px-5 py-3">
      <div className="text-xs font-medium text-nhs-grey-1 mb-0.5">{label}</div>
      <div className="text-xl font-bold text-nhs-black">{value}</div>
      <div className="text-[10px] text-nhs-grey-2 mt-0.5">{sub}</div>
    </div>
  );
}

function FormulaOperator({ children }: { children: React.ReactNode }) {
  return <span className="text-2xl font-bold text-nhs-grey-2">{children}</span>;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function SummaryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const state = useMMCStore((s) => s.getState)();
  const summary = computeExecutiveSummary(state);
  const benefitAverages = computeAllCategoryAverages(state.benefitsScorecard.items);
  const constraintAvg = computeConstraintAverage(state.constraintsScorecard.items);
  const carbonPass = allCarbonChecksPass(state.pmvCalculation);

  // Find RAG for each metric from benchmarks
  const ragFor = (metric: string): RAGStatus => {
    const b = summary.benchmarks.find((bm) => bm.metric === metric);
    return b?.rag ?? 'red';
  };

  if (!mounted) {
    return (
      <div className="space-y-8">
        <PageHeader
          stepNumber={7}
          title="Executive Summary"
          description="Combined MMC assessment score with RAG benchmarking and visual dashboards."
        />
        <div className="flex items-center justify-center py-20 text-nhs-grey-2">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        stepNumber={7}
        title="Executive Summary"
        description="Combined MMC assessment score with RAG benchmarking and visual dashboards."
      />

      {/* ============================================================ */}
      {/* Row 1: Key Metrics */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Category 0"
          score={summary.category0Score}
          subtitle={`Weighted: ${summary.category0Weighted.toFixed(1)}%`}
          rag={ragFor('Category 0')}
        />
        <MetricCard
          title="PMV Score"
          score={summary.pmvScore}
          rag={ragFor('PMV')}
          carbonFail={!carbonPass}
        />
        <MetricCard
          title="Category 7"
          score={summary.category7Score}
          subtitle={`Weighted: ${summary.category7Weighted.toFixed(1)}%`}
          rag={ragFor('Category 7')}
        />
        <MetricCard
          title="Overall MMC"
          score={summary.overallMMCPercentage}
          rag={ragFor('Overall MMC')}
          hero
        />
      </div>

      {/* ============================================================ */}
      {/* Row 2: Benchmark Table */}
      {/* ============================================================ */}
      <SectionCard title="RAG Benchmarking" subtitle="Performance against NHS MMC thresholds">
        <BenchmarkTable benchmarks={summary.benchmarks} />
      </SectionCard>

      {/* ============================================================ */}
      {/* Row 3: Charts */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="PMV Distribution" subtitle="Pre-Manufactured Value by section">
          <PMVDonutChart distribution={summary.pmvDistribution} totalPmv={summary.pmvScore} />
        </SectionCard>

        <SectionCard title="Benefits vs Constraints" subtitle="Importance ratings and constraint baseline">
          <BenefitsConstraintsRadar
            benefitAverages={benefitAverages}
            constraintAverage={constraintAvg}
          />
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/* Row 4: PMV Section Breakdown */}
      {/* ============================================================ */}
      <SectionCard title="PMV by Section" subtitle="Average PMV and project contribution per section">
        <PMVSectionBreakdown distribution={summary.pmvDistribution} />
      </SectionCard>

      {/* ============================================================ */}
      {/* Row 5: Formula */}
      {/* ============================================================ */}
      <SectionCard title="MMC Score Formula" subtitle="How the overall score is calculated">
        <FormulaVisualiser
          cat0={summary.category0Score}
          cat0Weighted={summary.category0Weighted}
          pmv={summary.pmvScore}
          cat7={summary.category7Score}
          cat7Weighted={summary.category7Weighted}
          overall={summary.overallMMCPercentage}
        />
      </SectionCard>
    </div>
  );
}
