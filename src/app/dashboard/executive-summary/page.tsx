'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { MetricCardsRow } from '@/components/dashboard/MetricCards';
import { TypologyBarChart } from '@/components/dashboard/charts/TypologyBarChart';
import { BusinessCaseLineChart } from '@/components/dashboard/charts/BusinessCaseLineChart';
import { CorrelationScatter } from '@/components/dashboard/charts/CorrelationScatter';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import {
  computePortfolioAverages,
  computeScoresByTypology,
  computeScoresByBusinessCase,
  computeCorrelation,
} from '@/lib/calculations/portfolio';
import Link from 'next/link';

function getCorrelationInterpretation(rSquared: number): string {
  if (rSquared >= 0.7) return 'Strong positive correlation';
  if (rSquared >= 0.4) return 'Moderate correlation';
  if (rSquared >= 0.2) return 'Weak correlation';
  return 'Little to no correlation';
}

export default function ExecutiveSummaryPage() {
  const projects = useDashboardStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          stepNumber="Dashboard"
          title="Executive Summary"
          description="Portfolio-level analysis of MMC assessment scores."
        />
        <SectionCard title="No Data">
          <p className="text-nhs-grey-1">
            No projects have been imported yet. Import assessments from the{' '}
            <Link href="/dashboard" className="text-nhs-blue underline hover:text-nhs-dark-blue">
              Dashboard
            </Link>{' '}
            to view the executive summary.
          </p>
        </SectionCard>
      </div>
    );
  }

  const portfolio = computePortfolioAverages(projects);
  const typologyScores = computeScoresByTypology(projects);
  const businessCaseScores = computeScoresByBusinessCase(projects);

  const cat0VsPmv = computeCorrelation(
    projects,
    (p) => p.summary.category0Score,
    (p) => p.summary.pmvScore,
  );
  const cat0VsCat7 = computeCorrelation(
    projects,
    (p) => p.summary.category0Score,
    (p) => p.summary.category7Score,
  );
  const cat0VsCombined = computeCorrelation(
    projects,
    (p) => p.summary.category0Score,
    (p) => p.summary.overallMMCPercentage,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        stepNumber="Dashboard"
        title="Executive Summary"
        description="Portfolio-level analysis of MMC assessment scores."
      />

      <MetricCardsRow
        category0={portfolio.category0Avg}
        pmv={portfolio.pmvAvg}
        category7={portfolio.category7Avg}
        combined={portfolio.combinedAvg}
        projectCount={projects.length}
      />

      {typologyScores.length > 1 && (
        <SectionCard title="Scores by Typology" subtitle="Average scores grouped by building typology">
          <TypologyBarChart data={typologyScores} />
        </SectionCard>
      )}

      {businessCaseScores.length > 1 && (
        <SectionCard title="Scores by Business Case Stage" subtitle="Average scores across business case stages">
          <BusinessCaseLineChart data={businessCaseScores} />
        </SectionCard>
      )}

      {projects.length >= 3 && (
        <SectionCard
          title="Standardisation Correlation (R\u00B2)"
          subtitle="How Category 0 scores relate to other metrics"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <CorrelationScatter
              data={cat0VsPmv}
              xLabel="Cat 0"
              yLabel="PMV"
              color="#00A499"
            />
            <CorrelationScatter
              data={cat0VsCat7}
              xLabel="Cat 0"
              yLabel="Cat 7"
              color="#41B6E6"
            />
            <CorrelationScatter
              data={cat0VsCombined}
              xLabel="Cat 0"
              yLabel="Combined"
              color="#0072CE"
            />
          </div>
          <div className="mt-4 p-4 bg-nhs-pale-grey rounded-lg">
            <p className="text-sm text-nhs-grey-1">
              <span className="font-semibold">Cat 0 vs PMV:</span>{' '}
              {getCorrelationInterpretation(cat0VsPmv.rSquared)} (R&sup2; = {cat0VsPmv.rSquared.toFixed(3)}).{' '}
              <span className="font-semibold">Cat 0 vs Cat 7:</span>{' '}
              {getCorrelationInterpretation(cat0VsCat7.rSquared)} (R&sup2; = {cat0VsCat7.rSquared.toFixed(3)}).{' '}
              <span className="font-semibold">Cat 0 vs Combined:</span>{' '}
              {getCorrelationInterpretation(cat0VsCombined.rSquared)} (R&sup2; = {cat0VsCombined.rSquared.toFixed(3)}).
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
