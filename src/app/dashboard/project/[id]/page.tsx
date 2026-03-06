'use client';

import { use } from 'react';
import Link from 'next/link';
import { PageHeader, SectionCard, RAGBadge } from '@/components/ui';
import { MetricCard } from '@/components/dashboard/MetricCards';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages } from '@/lib/calculations/portfolio';
import { computeRAG } from '@/lib/calculations/executive-summary';
import { computeElementPMV } from '@/lib/calculations/pmv';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import type { BenefitCategory } from '@/types';

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const TYPOLOGY_LABELS: Record<string, string> = {
  acute: 'Acute',
  primary_care: 'Primary Care',
  specialist: 'Specialist',
  mental_health: 'Mental Health',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

const BUILD_TYPE_LABELS: Record<string, string> = {
  new_build: 'New Build',
  refurbishment: 'Refurbishment',
  mixed: 'Mixed',
};

const STAGE_LABELS: Record<string, string> = {
  na: 'N/A',
  soc: 'SOC',
  obc: 'OBC',
  fbc: 'FBC',
  pc: 'PC',
};

const CATEGORY_LABELS: Record<BenefitCategory, string> = {
  faster: 'Faster',
  better: 'Better',
  sustainable_legacy: 'Sustainable Legacy',
  economic: 'Economic',
};

const SECTION_COLORS = ['#005EB8', '#00A499', '#41B6E6'];

const SECTION_LABELS: Record<string, string> = {
  structure: 'Structure',
  architecture: 'Architecture',
  building_services: 'Building Services',
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projects = useDashboardStore((s) => s.projects);
  const project = projects.find((p) => p.id === id);

  // ------ Not found ------
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <h1 className="text-2xl font-bold text-nhs-black">Project Not Found</h1>
        <p className="text-nhs-grey-1">
          The project you are looking for does not exist in the portfolio.
        </p>
        <Link
          href="/dashboard"
          className="text-nhs-blue font-semibold hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ------ Derived data ------
  const { assessment, summary } = project;
  const details = assessment.projectDetails;
  const portfolioAvg = computePortfolioAverages(projects);

  // Benefits radar data
  const benefitCategories: BenefitCategory[] = [
    'faster',
    'better',
    'sustainable_legacy',
    'economic',
  ];

  const projectBenefitPoints: Record<BenefitCategory, number> = {
    faster: 0,
    better: 0,
    sustainable_legacy: 0,
    economic: 0,
  };
  for (const item of assessment.benefitsScorecard.items) {
    if (benefitCategories.includes(item.category)) {
      projectBenefitPoints[item.category] += item.points;
    }
  }

  // Portfolio average benefit points
  const portfolioBenefitPoints: Record<BenefitCategory, number> = {
    faster: 0,
    better: 0,
    sustainable_legacy: 0,
    economic: 0,
  };
  for (const p of projects) {
    for (const item of p.assessment.benefitsScorecard.items) {
      if (benefitCategories.includes(item.category)) {
        portfolioBenefitPoints[item.category] += item.points;
      }
    }
  }
  const n = projects.length;
  if (n > 0) {
    for (const cat of benefitCategories) {
      portfolioBenefitPoints[cat] /= n;
    }
  }

  const hasBenefitsData = assessment.benefitsScorecard.items.length > 0;
  const radarData = benefitCategories.map((cat) => ({
    category: CATEGORY_LABELS[cat],
    project: projectBenefitPoints[cat],
    portfolio: parseFloat(portfolioBenefitPoints[cat].toFixed(1)),
  }));

  // PMV distribution pie data
  const pieData = (summary.pmvDistribution || [])
    .filter((s) => s.totalPmv > 0)
    .map((s) => ({
      name: SECTION_LABELS[s.section] || s.section,
      value: parseFloat(s.totalPmv.toFixed(1)),
    }));

  // Active PMV elements
  const activeElements = assessment.pmvCalculation.elements
    .filter((el) => el.packages.length > 0)
    .map((el) => ({
      ...el,
      elementPmv: computeElementPMV(el),
    }))
    .sort((a, b) => b.elementPmv - a.elementPmv);

  // Category 0 pass/fail
  const allCat0Items = assessment.category0Assessment.subcategories.flatMap(
    (sub) => sub.items,
  );
  const passedItems = allCat0Items.filter((item) => {
    if (item.type === 'yes_no') return item.value === true;
    if (item.type === 'percentage_threshold') return item.percentage > 0;
    return false;
  });
  const cat0PassRate =
    allCat0Items.length > 0
      ? (passedItems.length / allCat0Items.length) * 100
      : 0;
  const cat0RAG = computeRAG(summary.category0Score, 70);

  // Category 7 items
  const cat7Items = assessment.category7Assessment.items;

  // Portfolio comparison diffs
  const diffs = [
    {
      label: 'Category 0',
      project: summary.category0Score,
      avg: portfolioAvg.category0Avg,
    },
    {
      label: 'PMV',
      project: summary.pmvScore,
      avg: portfolioAvg.pmvAvg,
    },
    {
      label: 'Category 7',
      project: summary.category7Score,
      avg: portfolioAvg.category7Avg,
    },
    {
      label: 'Combined',
      project: summary.overallMMCPercentage,
      avg: portfolioAvg.combinedAvg,
    },
  ];

  // Info badges data
  const badges: string[] = [];
  if (details.buildingTypology)
    badges.push(TYPOLOGY_LABELS[details.buildingTypology] || details.buildingTypology);
  if (details.buildType)
    badges.push(BUILD_TYPE_LABELS[details.buildType] || details.buildType);
  if (details.businessCaseStage)
    badges.push(STAGE_LABELS[details.businessCaseStage] || details.businessCaseStage);
  if (details.ribaStage) badges.push(`RIBA ${details.ribaStage}`);
  if (details.gfaSqm > 0)
    badges.push(`${details.gfaSqm.toLocaleString()} sqm GFA`);

  // RAG color map for progress bar
  const RAG_COLORS: Record<string, string> = {
    green: '#007F3B',
    amber: '#ED8B00',
    red: '#DA291C',
  };

  // ------ Render ------
  return (
    <div className="space-y-6">
      {/* (a) Breadcrumb */}
      <nav className="text-sm text-nhs-grey-1">
        <Link href="/dashboard" className="text-nhs-blue hover:underline">
          Portfolio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-nhs-black font-medium">{project.label}</span>
      </nav>

      {/* (b) PageHeader */}
      <PageHeader
        stepNumber=""
        title={project.label}
        description={details.projectDescription}
      />

      {/* (c) Project info badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 bg-nhs-blue/10 text-nhs-blue text-xs font-semibold rounded-full"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* (d) Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Category 0" value={summary.category0Score} benchmark={70} />
        <MetricCard label="PMV" value={summary.pmvScore} benchmark={70} />
        <MetricCard label="Category 7" value={summary.category7Score} benchmark={65} />
        <MetricCard
          label="Overall MMC"
          value={summary.overallMMCPercentage}
          benchmark={70}
          size="lg"
        />
      </div>

      {/* (e) Portfolio Comparison */}
      <SectionCard title="Portfolio Comparison" subtitle="How this project compares to the portfolio average">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {diffs.map((d) => {
            const diff = d.project - d.avg;
            const isPositive = diff >= 0;
            return (
              <div
                key={d.label}
                className="bg-nhs-pale-grey/50 rounded-lg p-4 text-center"
              >
                <p className="text-xs font-semibold text-nhs-grey-1 uppercase tracking-wide mb-1">
                  {d.label}
                </p>
                <p className="text-xl font-bold text-nhs-black">
                  {d.project.toFixed(1)}%
                </p>
                <p
                  className={`text-sm font-semibold mt-1 ${
                    isPositive ? 'text-rag-green' : 'text-rag-red'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {diff.toFixed(1)}% vs avg
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* (f) Benefits Radar */}
      {hasBenefitsData && (
        <SectionCard title="Benefits Radar" subtitle="Project benefit distribution vs portfolio average">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar
                  name="This Project"
                  dataKey="project"
                  stroke="#005EB8"
                  fill="#005EB8"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Portfolio Avg"
                  dataKey="portfolio"
                  stroke="#00A499"
                  fill="#00A499"
                  fillOpacity={0.1}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* (g) PMV Section Distribution */}
      {pieData.length > 0 && (
        <SectionCard title="PMV Section Distribution" subtitle="Pre-Manufactured Value breakdown by building section">
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={SECTION_COLORS[idx % SECTION_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* (h) Active PMV Elements */}
      {activeElements.length > 0 && (
        <SectionCard
          title="Active PMV Elements"
          subtitle={`${activeElements.length} element${activeElements.length !== 1 ? 's' : ''} with packages assigned`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nhs-grey-4 text-left">
                  <th className="pb-2 font-semibold text-nhs-grey-1">Element</th>
                  <th className="pb-2 font-semibold text-nhs-grey-1">Section</th>
                  <th className="pb-2 font-semibold text-nhs-grey-1 text-right">
                    BCIS %
                  </th>
                  <th className="pb-2 font-semibold text-nhs-grey-1 text-right">
                    Element PMV %
                  </th>
                  <th className="pb-2 font-semibold text-nhs-grey-1 text-right">
                    Packages
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeElements.map((el) => (
                  <tr
                    key={el.id}
                    className="border-b border-nhs-grey-4/50 hover:bg-nhs-pale-grey/30"
                  >
                    <td className="py-2 font-medium text-nhs-black">{el.name}</td>
                    <td className="py-2 text-nhs-grey-1">
                      {SECTION_LABELS[el.section] || el.section}
                    </td>
                    <td className="py-2 text-right">{el.bcisPercentage.toFixed(1)}%</td>
                    <td className="py-2 text-right font-semibold">
                      {el.elementPmv.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right">{el.packages.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* (i) Category 0 Summary */}
      {allCat0Items.length > 0 && (
        <SectionCard
          title="Category 0 Summary"
          subtitle="Pre-manufacturing planning and design assessment"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-nhs-black">
                {passedItems.length} of {allCat0Items.length} items passed
              </span>
              <RAGBadge status={cat0RAG} size="sm" />
            </div>
            <div className="w-full bg-nhs-grey-4 rounded-full overflow-hidden h-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, cat0PassRate))}%`,
                  backgroundColor: RAG_COLORS[cat0RAG],
                }}
              />
            </div>
            <p className="text-xs text-nhs-grey-1">
              Score: {summary.category0Score.toFixed(1)}% (benchmark: 70%)
            </p>
          </div>
        </SectionCard>
      )}

      {/* (j) Category 7 Innovations */}
      {cat7Items.length > 0 && (
        <SectionCard
          title="Category 7 Innovations"
          subtitle={`${cat7Items.filter((i) => i.adopted).length} of ${cat7Items.length} innovations adopted`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {cat7Items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  item.adopted
                    ? 'bg-rag-green/10 text-rag-green'
                    : 'bg-nhs-grey-4/50 text-nhs-grey-2'
                }`}
              >
                <span className="flex-shrink-0">
                  {item.adopted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </span>
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
