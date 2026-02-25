'use client';

import { useMemo } from 'react';
import { useMMCStore } from '@/lib/store';
import { computeTotalPMV, computeSectionPMV, allCarbonChecksPass } from '@/lib/calculations/pmv';
import { RAGBadge, ProgressBar } from '@/components/ui';
import type { RAGStatus, PMVSection } from '@/types';

function getPMVRAGStatus(pmv: number): RAGStatus {
  if (pmv >= 55) return 'green';
  if (pmv >= 35) return 'amber';
  return 'red';
}

function getRAGColor(status: RAGStatus): string {
  switch (status) {
    case 'green': return 'var(--rag-green)';
    case 'amber': return 'var(--rag-amber)';
    case 'red': return 'var(--rag-red)';
  }
}

const SECTION_LABELS: Record<PMVSection, string> = {
  structure: 'Structure',
  architecture: 'Architecture',
  building_services: 'Building Services',
};

export function PMVSummaryPanel() {
  const pmvCalculation = useMMCStore((s) => s.pmvCalculation);

  const carbonPass = allCarbonChecksPass(pmvCalculation);
  const totalPMV = computeTotalPMV(pmvCalculation);
  const sectionBreakdown = computeSectionPMV(pmvCalculation);

  const totalBcis = useMemo(() => {
    return pmvCalculation.elements.reduce((sum, el) => sum + el.bcisPercentage, 0);
  }, [pmvCalculation.elements]);

  const ragStatus = getPMVRAGStatus(totalPMV);

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-nhs-grey-4 bg-nhs-pale-grey/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-nhs-black">PMV Summary</h2>
          {carbonPass && <RAGBadge status={ragStatus} size="lg" />}
        </div>
      </div>

      <div className="p-6">
        {!carbonPass ? (
          <div className="text-center py-6">
            <svg className="w-10 h-10 mx-auto text-nhs-grey-3 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-sm font-semibold text-nhs-grey-1">N/A - Carbon checks incomplete</p>
            <p className="text-xs text-nhs-grey-2 mt-1">Complete all carbon compliance checks to calculate PMV</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total PMV */}
            <div className="text-center">
              <span className="text-4xl font-bold text-nhs-blue">{totalPMV.toFixed(1)}%</span>
              <p className="text-sm text-nhs-grey-1 mt-1">Total Pre-Manufactured Value</p>
              <div className="mt-3 max-w-md mx-auto">
                <ProgressBar value={totalPMV} color={getRAGColor(ragStatus)} height="lg" />
              </div>
            </div>

            {/* Section breakdown */}
            <div className="grid grid-cols-3 gap-4">
              {sectionBreakdown.map((section) => {
                const sectionRag = getPMVRAGStatus(section.averagePmv);
                return (
                  <div key={section.section} className="text-center p-3 rounded-lg bg-nhs-pale-grey/50">
                    <span className="text-xs font-semibold text-nhs-grey-1 uppercase tracking-wider">
                      {SECTION_LABELS[section.section]}
                    </span>
                    <div className="mt-1">
                      <span className="text-xl font-bold text-nhs-black">
                        {section.averagePmv.toFixed(1)}%
                      </span>
                      <span className="text-xs text-nhs-grey-2 block mt-0.5">
                        avg PMV
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={section.proportion * 100}
                        color={getRAGColor(sectionRag)}
                        height="sm"
                      />
                      <span className="text-[11px] text-nhs-grey-2 mt-1 block">
                        {(section.proportion * 100).toFixed(1)}% of total
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BCIS allocation counter */}
            <div
              className={`p-3 rounded-lg border ${
                Math.abs(totalBcis - 100) <= 2
                  ? 'bg-rag-green/5 border-rag-green/20'
                  : totalBcis > 0
                  ? 'bg-rag-amber/5 border-rag-amber/20'
                  : 'bg-nhs-pale-grey border-nhs-grey-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-nhs-grey-1">BCIS % Allocated</span>
                <span
                  className={`text-sm font-bold ${
                    Math.abs(totalBcis - 100) <= 2
                      ? 'text-rag-green'
                      : totalBcis > 100
                      ? 'text-rag-red'
                      : 'text-nhs-black'
                  }`}
                >
                  {totalBcis.toFixed(1)}%
                </span>
              </div>
              {Math.abs(totalBcis - 100) > 2 && totalBcis > 0 && (
                <p className="text-xs text-nhs-grey-2 mt-1">
                  BCIS percentages should sum close to 100%. Currently {totalBcis < 100 ? 'under' : 'over'}-allocated by {Math.abs(totalBcis - 100).toFixed(1)}%.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
