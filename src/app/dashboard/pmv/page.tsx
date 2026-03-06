'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { MetricCard } from '@/components/dashboard/MetricCards';
import { ElementBarChart } from '@/components/dashboard/charts/ElementBarChart';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages, computeElementUtilisation } from '@/lib/calculations/portfolio';
import Link from 'next/link';
import type { PMVSection } from '@/types';

const SECTION_LABELS: Record<PMVSection, string> = {
  structure: 'Structure',
  architecture: 'Architecture',
  building_services: 'Building Services',
};

const SECTION_COLORS: Record<PMVSection, string> = {
  structure: '#005EB8',
  architecture: '#00A499',
  building_services: '#41B6E6',
};

export default function PMVAnalysisPage() {
  const projects = useDashboardStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          stepNumber="Dashboard"
          title="PMV Analysis"
          description="Element-level PMV potential and utilisation analysis across the portfolio."
        />
        <SectionCard title="No Data">
          <p className="text-nhs-grey-1">
            No projects have been imported yet. Import assessments from the{' '}
            <Link href="/dashboard" className="text-nhs-blue underline hover:text-nhs-dark-blue">
              Dashboard
            </Link>{' '}
            to view PMV analysis.
          </p>
        </SectionCard>
      </div>
    );
  }

  const portfolio = computePortfolioAverages(projects);
  const elements = computeElementUtilisation(projects);

  // Carbon compliance: all 6 checks must pass
  const carbonPassCount = projects.filter((p) => {
    const c = p.assessment.pmvCalculation.carbonChecks;
    return (
      c.structure &&
      c.superstructure &&
      c.externalWalls &&
      c.internalFinishes &&
      c.fittings &&
      c.services
    );
  }).length;
  const carbonPassRate = (carbonPassCount / projects.length) * 100;

  // Section averages from element utilisation data
  const sections: PMVSection[] = ['structure', 'architecture', 'building_services'];
  const sectionAverages = sections.map((section) => {
    const sectionElements = elements.filter((e) => e.section === section);
    const avg =
      sectionElements.length > 0
        ? sectionElements.reduce((sum, e) => sum + e.avgPmvPotential, 0) / sectionElements.length
        : 0;
    return { section, avg };
  });

  // Low-utilised elements: high PMV potential (>50) but low utilisation (<20)
  const lowUtilised = elements
    .filter((e) => e.avgPmvPotential > 50 && e.avgUtilisation < 20)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 15);

  // High-utilisation elements: avgUtilisation > 30
  const highUtilisation = elements.filter((e) => e.avgUtilisation > 30);

  return (
    <div className="space-y-6">
      <PageHeader
        stepNumber="Dashboard"
        title="PMV Analysis"
        description="Element-level PMV potential and utilisation analysis across the portfolio."
      />

      {/* PMV Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Avg PMV %" value={portfolio.pmvAvg} benchmark={70} />
        <MetricCard label="Carbon Compliance" value={carbonPassRate} benchmark={100} />
        {sectionAverages.map((sa) => (
          <MetricCard
            key={sa.section}
            label={`${SECTION_LABELS[sa.section]} Avg`}
            value={sa.avg}
            benchmark={70}
          />
        ))}
      </div>

      {/* BCIS Element PMV Potential */}
      <SectionCard
        title="BCIS Element PMV Potential"
        subtitle="Element-level PMV potential across the portfolio, grouped by section"
      >
        <div className="flex items-center gap-6 mb-4">
          {sections.map((section) => (
            <div key={section} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: SECTION_COLORS[section] }}
              />
              <span className="text-xs text-nhs-grey-1">{SECTION_LABELS[section]}</span>
            </div>
          ))}
        </div>
        <ElementBarChart data={elements} maxItems={25} />
      </SectionCard>

      {/* Low-Utilised Elements */}
      {lowUtilised.length > 0 && (
        <SectionCard
          title="Low-Utilised Elements"
          subtitle="Elements with high PMV potential but low utilisation - key opportunities for MMC adoption"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nhs-grey-4">
                  <th className="text-left py-3 px-4 font-semibold text-nhs-grey-1">Element</th>
                  <th className="text-left py-3 px-4 font-semibold text-nhs-grey-1">Section</th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">
                    PMV Potential %
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">
                    Utilisation %
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-nhs-grey-1">Gap</th>
                </tr>
              </thead>
              <tbody>
                {lowUtilised.map((el) => (
                  <tr
                    key={el.elementName}
                    className="border-b border-nhs-grey-4 last:border-b-0"
                  >
                    <td className="py-3 px-4 font-medium text-nhs-black">{el.elementName}</td>
                    <td className="py-3 px-4 text-nhs-grey-1 capitalize">
                      {el.section.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right text-nhs-grey-1">
                      {el.avgPmvPotential.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-nhs-grey-1">
                      {el.avgUtilisation.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-rag-red">
                      {el.gap.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* High-Utilisation Elements */}
      {highUtilisation.length > 0 && (
        <SectionCard
          title="High-Utilisation Elements"
          subtitle="Elements with the highest utilisation rates across the portfolio"
        >
          <ElementBarChart
            data={highUtilisation}
            maxItems={15}
            dataKey="avgUtilisation"
            label="Utilisation %"
          />
        </SectionCard>
      )}
    </div>
  );
}
