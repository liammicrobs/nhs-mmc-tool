'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { FileDropZone } from '@/components/dashboard/FileDropZone';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { MetricCardsRow } from '@/components/dashboard/MetricCards';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages } from '@/lib/calculations/portfolio';

export default function DashboardImportPage() {
  const projects = useDashboardStore((s) => s.projects);
  const averages = computePortfolioAverages(projects);

  return (
    <div className="space-y-6">
      <PageHeader
        stepNumber="Dashboard"
        title="Import & Portfolio"
        description="Import MMC assessment exports to build your portfolio for cross-project analysis."
      />

      <SectionCard title="Import Assessments" subtitle="Drag and drop .mmc.json files exported from the assessment tool">
        <FileDropZone />
      </SectionCard>

      {projects.length > 0 && (
        <>
          <MetricCardsRow
            category0={averages.category0Avg}
            pmv={averages.pmvAvg}
            category7={averages.category7Avg}
            combined={averages.combinedAvg}
            projectCount={averages.count}
          />
          <SectionCard title="Portfolio" subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} imported`}>
            <PortfolioTable />
          </SectionCard>
        </>
      )}
    </div>
  );
}
