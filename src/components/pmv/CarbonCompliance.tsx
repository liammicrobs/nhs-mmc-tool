'use client';

import { useMMCStore } from '@/lib/store';
import { allCarbonChecksPass } from '@/lib/calculations/pmv';
import type { PMVCalculation } from '@/types';

const CARBON_CHECKS: { key: keyof PMVCalculation['carbonChecks']; label: string }[] = [
  { key: 'structure', label: 'Structure - carbon assessment completed' },
  { key: 'superstructure', label: 'Superstructure - carbon assessment completed' },
  { key: 'externalWalls', label: 'External Walls - carbon assessment completed' },
  { key: 'internalFinishes', label: 'Internal Finishes - carbon assessment completed' },
  { key: 'fittings', label: 'Fittings - carbon assessment completed' },
  { key: 'services', label: 'Services - carbon assessment completed' },
];

export function CarbonCompliance() {
  const carbonChecks = useMMCStore((s) => s.pmvCalculation.carbonChecks);
  const pmvCalculation = useMMCStore((s) => s.pmvCalculation);
  const updateCarbonCheck = useMMCStore((s) => s.updateCarbonCheck);

  const allPass = allCarbonChecksPass(pmvCalculation);
  const passedCount = Object.values(carbonChecks).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-nhs-grey-4 bg-nhs-pale-grey/50">
        <div>
          <h2 className="text-lg font-bold text-nhs-black">Carbon Compliance Gate</h2>
          <p className="text-sm text-nhs-grey-1 mt-0.5">
            {passedCount} / {CARBON_CHECKS.length} checks confirmed
          </p>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded ${
            allPass
              ? 'bg-rag-green text-white'
              : 'bg-rag-amber text-nhs-black'
          }`}
        >
          {allPass ? 'PASSED' : 'INCOMPLETE'}
        </span>
      </div>

      <div className="p-6">
        {/* Status banner */}
        {allPass ? (
          <div className="mb-4 p-3 rounded bg-rag-green/10 border border-rag-green/30">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-rag-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-rag-green">
                All carbon compliance checks confirmed. PMV calculation is active.
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded bg-rag-amber/10 border border-rag-amber/30">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-rag-amber" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-sm font-semibold text-nhs-black">
                All carbon compliance checks must be confirmed before PMV can be calculated.
              </span>
            </div>
          </div>
        )}

        {/* Checkbox list */}
        <div className="space-y-3">
          {CARBON_CHECKS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={carbonChecks[key]}
                  onChange={(e) => updateCarbonCheck(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    carbonChecks[key]
                      ? 'bg-nhs-blue border-nhs-blue'
                      : 'border-nhs-grey-3 bg-white group-hover:border-nhs-blue'
                  }`}
                >
                  {carbonChecks[key] && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
              <span
                className={`text-sm ${
                  carbonChecks[key] ? 'text-nhs-black font-medium' : 'text-nhs-grey-1'
                }`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
