'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { BenefitsStackedChart } from '@/components/dashboard/charts/BenefitsStackedChart';
import { CorrelationScatter } from '@/components/dashboard/charts/CorrelationScatter';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import {
  computeBenefitDistributions,
  computeBenefitCategoryAveragesByTypology,
  computeCorrelation,
} from '@/lib/calculations/portfolio';
import Link from 'next/link';
import type { BenefitCategory } from '@/types';

const CATEGORY_LABELS: Record<BenefitCategory, string> = {
  faster: 'Faster',
  better: 'Better',
  sustainable_legacy: 'Sustainable Legacy',
  economic: 'Economic',
};

const CATEGORIES: BenefitCategory[] = ['faster', 'better', 'sustainable_legacy', 'economic'];

function computeCategoryRankings(
  distributions: { faster: number; better: number; sustainable_legacy: number; economic: number }[],
) {
  if (distributions.length === 0) return [];

  const n = distributions.length;
  const averages = CATEGORIES.map((cat) => ({
    category: cat,
    avgPoints: distributions.reduce((sum, d) => sum + d[cat], 0) / n,
  }));

  averages.sort((a, b) => b.avgPoints - a.avgPoints);

  return averages;
}

function benefitsAvg(d: { faster: number; better: number; sustainable_legacy: number; economic: number }): number {
  return (d.faster + d.better + d.sustainable_legacy + d.economic) / 4;
}

export default function BenefitsAnalysisPage() {
  const projects = useDashboardStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          stepNumber="Dashboard"
          title="Benefits Analysis"
          description="Analysis of benefit point distributions across the portfolio."
        />
        <SectionCard title="No Data">
          <p className="text-nhs-grey-1">
            No projects have been imported yet. Import assessments from the{' '}
            <Link href="/dashboard" className="text-nhs-blue underline hover:text-nhs-dark-blue">
              Dashboard
            </Link>{' '}
            to view benefits analysis.
          </p>
        </SectionCard>
      </div>
    );
  }

  const distributions = computeBenefitDistributions(projects);
  const rankings = computeCategoryRankings(distributions);
  const typologyAverages = computeBenefitCategoryAveragesByTypology(projects);
  const typologyEntries = Array.from(typologyAverages.entries());

  // Correlation data: x = average of all 4 benefit points per project
  const benefitsVsCat0 = computeCorrelation(
    projects,
    (p) => {
      const dist = distributions.find((d) => d.projectLabel === p.label);
      return dist ? benefitsAvg(dist) : 0;
    },
    (p) => p.summary.category0Score,
  );

  const benefitsVsPmv = computeCorrelation(
    projects,
    (p) => {
      const dist = distributions.find((d) => d.projectLabel === p.label);
      return dist ? benefitsAvg(dist) : 0;
    },
    (p) => p.summary.pmvScore,
  );

  const benefitsVsCombined = computeCorrelation(
    projects,
    (p) => {
      const dist = distributions.find((d) => d.projectLabel === p.label);
      return dist ? benefitsAvg(dist) : 0;
    },
    (p) => p.summary.overallMMCPercentage,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        stepNumber="Dashboard"
        title="Benefits Analysis"
        description="Analysis of benefit point distributions across the portfolio."
      />

      {/* Benefit Category Rankings */}
      <SectionCard
        title="Benefit Category Rankings"
        subtitle="Categories ranked by average points across all projects"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {rankings.map((r, i) => (
            <div
              key={r.category}
              className="bg-nhs-pale-grey rounded-lg p-4 text-center"
            >
              <div className="text-sm font-semibold text-nhs-grey-1 mb-1">
                #{i + 1}
              </div>
              <div className="text-sm text-nhs-grey-1 mb-2">
                {CATEGORY_LABELS[r.category]}
              </div>
              <div className="text-2xl font-bold text-nhs-black">
                {r.avgPoints.toFixed(1)}
              </div>
              <div className="text-xs text-nhs-grey-2">avg points</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Benefits Distribution */}
      <SectionCard
        title="Benefits Distribution"
        subtitle="Per-project benefit point allocation across categories"
      >
        <BenefitsStackedChart data={distributions} />
      </SectionCard>

      {/* Benefits by Typology */}
      {typologyEntries.length > 1 && (
        <SectionCard
          title="Benefits by Typology"
          subtitle="Average benefit points grouped by building typology"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nhs-grey-4">
                  <th className="text-left py-3 px-4 font-semibold text-nhs-grey-1">
                    Typology
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">
                    Faster
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">
                    Better
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">
                    Sustainable Legacy
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">
                    Economic
                  </th>
                </tr>
              </thead>
              <tbody>
                {typologyEntries.map(([typ, avgs]) => (
                  <tr
                    key={typ}
                    className="border-b border-nhs-grey-4 last:border-b-0"
                  >
                    <td className="py-3 px-4 font-medium text-nhs-black capitalize">
                      {typ.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right text-nhs-grey-1">
                      {avgs.faster.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-nhs-grey-1">
                      {avgs.better.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-nhs-grey-1">
                      {avgs.sustainable_legacy.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-nhs-grey-1">
                      {avgs.economic.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Benefits Impact Correlation */}
      {projects.length >= 3 && (
        <SectionCard
          title="Benefits Impact Correlation"
          subtitle="How average benefit scores relate to assessment metrics"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <CorrelationScatter
              data={benefitsVsCat0}
              xLabel="Benefits Avg"
              yLabel="Category 0"
              color="#005EB8"
            />
            <CorrelationScatter
              data={benefitsVsPmv}
              xLabel="Benefits Avg"
              yLabel="PMV"
              color="#00A499"
            />
            <CorrelationScatter
              data={benefitsVsCombined}
              xLabel="Benefits Avg"
              yLabel="Combined MMC"
              color="#0072CE"
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
