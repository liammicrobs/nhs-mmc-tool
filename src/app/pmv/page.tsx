'use client';

import { useState, useMemo } from 'react';
import { useMMCStore } from '@/lib/store';
import { PageHeader } from '@/components/ui';
import { CarbonCompliance } from '@/components/pmv/CarbonCompliance';
import { ElementBrowser } from '@/components/pmv/ElementBrowser';
import { ElementDetail, ElementDetailPlaceholder } from '@/components/pmv/ElementDetail';
import { PMVSummaryPanel } from '@/components/pmv/PMVSummaryPanel';
import { SupplierReturnPanel } from '@/components/pmv/SupplierReturn';

type ActiveTab = 'assessment' | 'supplier';

export default function PMVPage() {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('assessment');
  const [carbonOpen, setCarbonOpen] = useState(true);

  const elements = useMMCStore((s) => s.pmvCalculation.elements);

  const totalBcis = useMemo(() => {
    return elements.reduce((sum, el) => sum + el.bcisPercentage, 0);
  }, [elements]);

  const bcisWarning = totalBcis > 0 && Math.abs(totalBcis - 100) > 2;

  return (
    <div>
      <PageHeader
        stepNumber={5}
        title="PMV Calculation"
        description="Calculate Pre-Manufactured Value across all BCIS building elements."
      />

      {/* Carbon Compliance (collapsible) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setCarbonOpen(!carbonOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-nhs-grey-1 hover:text-nhs-black transition-colors mb-2"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${carbonOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          Carbon Compliance Gate
        </button>
        {carbonOpen && <CarbonCompliance />}
      </div>

      {/* BCIS allocation banner */}
      <div
        className={`mb-4 px-4 py-2.5 rounded-lg border flex items-center justify-between ${
          bcisWarning
            ? 'bg-rag-amber/5 border-rag-amber/30'
            : totalBcis > 0
            ? 'bg-rag-green/5 border-rag-green/20'
            : 'bg-nhs-pale-grey border-nhs-grey-4'
        }`}
      >
        <span className="text-sm text-nhs-grey-1">
          BCIS Total Allocated:
        </span>
        <span
          className={`text-sm font-bold ${
            bcisWarning
              ? totalBcis > 100
                ? 'text-rag-red'
                : 'text-rag-amber'
              : totalBcis > 0
              ? 'text-rag-green'
              : 'text-nhs-grey-2'
          }`}
        >
          {totalBcis.toFixed(1)}%
          {bcisWarning && (
            <span className="font-normal text-xs text-nhs-grey-2 ml-2">
              (should be close to 100%)
            </span>
          )}
        </span>
      </div>

      {/* Tab switch: Assessment vs Supplier Return */}
      <div className="flex gap-1 mb-4 border-b border-nhs-grey-4">
        <button
          type="button"
          onClick={() => setActiveTab('assessment')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'assessment'
              ? 'border-nhs-blue text-nhs-blue'
              : 'border-transparent text-nhs-grey-2 hover:text-nhs-black'
          }`}
        >
          PMV Assessment
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('supplier')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'supplier'
              ? 'border-nhs-blue text-nhs-blue'
              : 'border-transparent text-nhs-grey-2 hover:text-nhs-black'
          }`}
        >
          Supplier Returns
        </button>
      </div>

      {/* Assessment tab */}
      {activeTab === 'assessment' && (
        <>
          {/* Element browser + detail panel */}
          <div className="flex gap-4 mb-6" style={{ height: '600px' }}>
            {/* Left sidebar: Element browser */}
            <div className="w-[300px] shrink-0">
              <ElementBrowser
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            </div>

            {/* Right panel: Element detail */}
            <div className="flex-1 min-w-0">
              {selectedElementId ? (
                <ElementDetail elementId={selectedElementId} />
              ) : (
                <ElementDetailPlaceholder />
              )}
            </div>
          </div>

          {/* PMV Summary */}
          <PMVSummaryPanel />
        </>
      )}

      {/* Supplier Return tab */}
      {activeTab === 'supplier' && <SupplierReturnPanel />}
    </div>
  );
}
