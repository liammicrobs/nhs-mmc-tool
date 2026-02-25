'use client';

import { useMMCStore } from '@/lib/store';
import { computePackagePMV } from '@/lib/calculations/pmv';
import { v4 as uuid } from 'uuid';
import type { PMVPackage } from '@/types';

interface PackageEditorProps {
  elementId: string;
  packages: PMVPackage[];
}

function PackageCard({
  elementId,
  pkg,
  index,
}: {
  elementId: string;
  pkg: PMVPackage;
  index: number;
}) {
  const updatePackage = useMMCStore((s) => s.updatePackage);
  const removePackage = useMMCStore((s) => s.removePackage);
  const pmv = computePackagePMV(pkg);

  return (
    <div className="border border-nhs-grey-4 rounded-lg p-4 bg-nhs-pale-grey/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-nhs-black">Package {index + 1}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-nhs-blue">
            PMV: {pmv.toFixed(1)}%
          </span>
          <button
            type="button"
            onClick={() => removePackage(elementId, pkg.id)}
            className="text-nhs-grey-2 hover:text-rag-red transition-colors"
            title="Remove package"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Description</label>
          <input
            type="text"
            value={pkg.description}
            onChange={(e) => updatePackage(elementId, pkg.id, { description: e.target.value })}
            placeholder="Package description..."
            className="!text-sm !py-1.5"
          />
        </div>

        {/* Value + Prelims + Labour row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Total Value (GBP)</label>
            <input
              type="number"
              value={pkg.totalValue || ''}
              onChange={(e) => updatePackage(elementId, pkg.id, { totalValue: Number(e.target.value) || 0 })}
              placeholder="0"
              min={0}
              step={1000}
              className="!text-sm !py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Prelims %</label>
            <input
              type="number"
              value={pkg.prelimsPercent || ''}
              onChange={(e) => updatePackage(elementId, pkg.id, { prelimsPercent: Number(e.target.value) || 0 })}
              placeholder="0"
              min={0}
              max={100}
              step={0.1}
              className="!text-sm !py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Labour %</label>
            <input
              type="number"
              value={pkg.labourPercent || ''}
              onChange={(e) => updatePackage(elementId, pkg.id, { labourPercent: Number(e.target.value) || 0 })}
              placeholder="0"
              min={0}
              max={100}
              step={0.1}
              className="!text-sm !py-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PackageEditor({ elementId, packages }: PackageEditorProps) {
  const addPackageToElement = useMMCStore((s) => s.addPackageToElement);

  const handleAddPackage = () => {
    addPackageToElement(elementId, {
      id: uuid(),
      description: '',
      totalValue: 0,
      prelimsPercent: 0,
      labourPercent: 0,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-nhs-black">Packages</h3>
        <button
          type="button"
          onClick={handleAddPackage}
          className="flex items-center gap-1.5 text-sm font-semibold text-nhs-blue hover:text-nhs-dark-blue transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Package
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-nhs-grey-4 rounded-lg">
          <svg className="w-8 h-8 mx-auto text-nhs-grey-3 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm text-nhs-grey-2">No packages added yet</p>
          <p className="text-xs text-nhs-grey-3 mt-1">
            Add packages to define the PMV for this element
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg, idx) => (
            <PackageCard
              key={pkg.id}
              elementId={elementId}
              pkg={pkg}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
