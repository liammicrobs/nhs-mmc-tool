'use client';

import { useMemo } from 'react';
import { useMMCStore } from '@/lib/store';
import { computePackagePMV } from '@/lib/calculations/pmv';
import type { PMVElement, PMVPackage, SupplierReturn as SupplierReturnType } from '@/types';

function computeSupplierPMV(sr: SupplierReturnType): number {
  return Math.max(0, (1 - sr.supplierPrelimsPercent / 100 - sr.supplierLabourPercent / 100)) * 100;
}

function SupplierReturnRow({
  element,
  pkg,
  supplierReturn,
}: {
  element: PMVElement;
  pkg: PMVPackage;
  supplierReturn: SupplierReturnType | undefined;
}) {
  const addSupplierReturn = useMMCStore((s) => s.addSupplierReturn);
  const updateSupplierReturn = useMMCStore((s) => s.updateSupplierReturn);

  const projectPMV = computePackagePMV(pkg);

  // Initialize supplier return if it does not exist
  const ensureSupplierReturn = () => {
    if (!supplierReturn) {
      addSupplierReturn({
        elementId: element.id,
        packageId: pkg.id,
        supplierValue: 0,
        supplierPrelimsPercent: 0,
        supplierLabourPercent: 0,
        notes: '',
      });
    }
  };

  const handleUpdate = (updates: Partial<SupplierReturnType>) => {
    ensureSupplierReturn();
    updateSupplierReturn(element.id, pkg.id, updates);
  };

  const supplierPMV = supplierReturn ? computeSupplierPMV(supplierReturn) : 0;
  const delta = supplierReturn ? supplierPMV - projectPMV : 0;
  const absDelta = Math.abs(delta);

  return (
    <div className="border border-nhs-grey-4 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-mono text-nhs-grey-2">{element.number}</span>
          <span className="text-sm font-bold text-nhs-black ml-2">{element.name}</span>
          {pkg.description && (
            <span className="text-xs text-nhs-grey-2 ml-2">- {pkg.description}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-nhs-grey-1">Project PMV: {projectPMV.toFixed(1)}%</span>
          {supplierReturn && (
            <>
              <span className="text-xs font-semibold text-nhs-blue">
                Supplier PMV: {supplierPMV.toFixed(1)}%
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  absDelta <= 5
                    ? 'bg-rag-green/10 text-rag-green'
                    : absDelta <= 15
                    ? 'bg-rag-amber/10 text-nhs-black'
                    : 'bg-rag-red/10 text-rag-red'
                }`}
              >
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Supplier Value (GBP)</label>
          <input
            type="number"
            value={supplierReturn?.supplierValue || ''}
            onChange={(e) => handleUpdate({ supplierValue: Number(e.target.value) || 0 })}
            onFocus={ensureSupplierReturn}
            placeholder="0"
            min={0}
            step={1000}
            className="!text-sm !py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Supplier Prelims %</label>
          <input
            type="number"
            value={supplierReturn?.supplierPrelimsPercent || ''}
            onChange={(e) => handleUpdate({ supplierPrelimsPercent: Number(e.target.value) || 0 })}
            onFocus={ensureSupplierReturn}
            placeholder="0"
            min={0}
            max={100}
            step={0.1}
            className="!text-sm !py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Supplier Labour %</label>
          <input
            type="number"
            value={supplierReturn?.supplierLabourPercent || ''}
            onChange={(e) => handleUpdate({ supplierLabourPercent: Number(e.target.value) || 0 })}
            onFocus={ensureSupplierReturn}
            placeholder="0"
            min={0}
            max={100}
            step={0.1}
            className="!text-sm !py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Notes</label>
          <input
            type="text"
            value={supplierReturn?.notes || ''}
            onChange={(e) => handleUpdate({ notes: e.target.value })}
            onFocus={ensureSupplierReturn}
            placeholder="Notes..."
            className="!text-sm !py-1.5"
          />
        </div>
      </div>
    </div>
  );
}

export function SupplierReturnPanel() {
  const elements = useMMCStore((s) => s.pmvCalculation.elements);
  const supplierReturns = useMMCStore((s) => s.pmvCalculation.supplierReturns);

  // Get all element-package pairs where elements have packages
  const elementPackagePairs = useMemo(() => {
    const pairs: { element: PMVElement; pkg: PMVPackage }[] = [];
    for (const el of elements) {
      for (const pkg of el.packages) {
        pairs.push({ element: el, pkg });
      }
    }
    return pairs;
  }, [elements]);

  const findSupplierReturn = (elementId: string, packageId: string) =>
    supplierReturns.find(
      (sr) => sr.elementId === elementId && sr.packageId === packageId
    );

  if (elementPackagePairs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm p-6">
        <div className="text-center py-8">
          <svg className="w-10 h-10 mx-auto text-nhs-grey-3 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-nhs-grey-2 font-medium">No packages to compare</p>
          <p className="text-xs text-nhs-grey-3 mt-1">
            Add packages to elements in the assessment tab to enable supplier return comparisons
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-nhs-grey-4 bg-nhs-pale-grey/50">
        <h2 className="text-lg font-bold text-nhs-black">Supplier Returns</h2>
        <p className="text-sm text-nhs-grey-1 mt-0.5">
          Compare supplier PMV values against the project team assessment.
          {elementPackagePairs.length} package{elementPackagePairs.length !== 1 ? 's' : ''} available for comparison.
        </p>
      </div>
      <div className="p-6 space-y-3">
        {elementPackagePairs.map(({ element, pkg }) => (
          <SupplierReturnRow
            key={`${element.id}-${pkg.id}`}
            element={element}
            pkg={pkg}
            supplierReturn={findSupplierReturn(element.id, pkg.id)}
          />
        ))}
      </div>
    </div>
  );
}
