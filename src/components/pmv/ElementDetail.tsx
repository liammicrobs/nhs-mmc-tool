'use client';

import { useMMCStore } from '@/lib/store';
import { computeElementPMV } from '@/lib/calculations/pmv';
import { PackageEditor } from './PackageEditor';
import type { MMCCategory, PMVElement } from '@/types';

const MMC_CATEGORIES: { value: MMCCategory; label: string }[] = [
  { value: 0, label: 'Cat 0 - Design & process' },
  { value: 1, label: 'Cat 1 - 3D primary structural systems' },
  { value: 2, label: 'Cat 2 - 2D panelised systems' },
  { value: 3, label: 'Cat 3 - Components & sub-assemblies' },
  { value: 4, label: 'Cat 4 - Additive manufacturing' },
  { value: 5, label: 'Cat 5 - Pre-manufacturing (non-structural)' },
  { value: 6, label: 'Cat 6 - Traditional building products' },
  { value: 7, label: 'Cat 7 - Site process' },
];

interface ElementDetailProps {
  elementId: string;
}

export function ElementDetail({ elementId }: ElementDetailProps) {
  const element = useMMCStore((s) =>
    s.pmvCalculation.elements.find((el) => el.id === elementId)
  );
  const updatePMVElement = useMMCStore((s) => s.updatePMVElement);

  if (!element) {
    return (
      <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm p-6 flex items-center justify-center h-full">
        <p className="text-nhs-grey-2 text-sm">Element not found</p>
      </div>
    );
  }

  const elementPMV = computeElementPMV(element);

  const handleCategoryToggle = (cat: MMCCategory) => {
    const current = element.mmcCategories;
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat].sort((a, b) => a - b);
    updatePMVElement(elementId, { mmcCategories: updated });
  };

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header with element PMV */}
      <div className="px-6 py-4 border-b border-nhs-grey-4 bg-nhs-pale-grey/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-nhs-grey-2">{element.number}</span>
            <h2 className="text-lg font-bold text-nhs-black">{element.name}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-nhs-grey-1 block">Element PMV</span>
            <span className="text-2xl font-bold text-nhs-blue">{elementPMV.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Element name (editable for custom) */}
        {element.isCustom && (
          <div>
            <label className="block text-sm font-medium text-nhs-grey-1 mb-1">Element Name</label>
            <input
              type="text"
              value={element.name}
              onChange={(e) => updatePMVElement(elementId, { name: e.target.value })}
              placeholder="Enter element name..."
              className="!text-sm !py-1.5"
            />
          </div>
        )}

        {/* BCIS % */}
        <div>
          <label className="block text-sm font-medium text-nhs-grey-1 mb-1">
            BCIS % of Build Cost
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={element.bcisPercentage || ''}
              onChange={(e) =>
                updatePMVElement(elementId, {
                  bcisPercentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
              placeholder="0.0"
              min={0}
              max={100}
              step={0.1}
              className="!text-sm !py-1.5 !w-32"
            />
            <span className="text-sm text-nhs-grey-1">%</span>
          </div>
        </div>

        {/* MMC Categories */}
        <div>
          <label className="block text-sm font-medium text-nhs-grey-1 mb-2">MMC Categories</label>
          <div className="grid grid-cols-1 gap-2">
            {MMC_CATEGORIES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={element.mmcCategories.includes(value)}
                    onChange={() => handleCategoryToggle(value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      element.mmcCategories.includes(value)
                        ? 'bg-nhs-blue border-nhs-blue'
                        : 'border-nhs-grey-3 bg-white group-hover:border-nhs-blue'
                    }`}
                  >
                    {element.mmcCategories.includes(value) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className={`text-sm ${
                    element.mmcCategories.includes(value)
                      ? 'text-nhs-black font-medium'
                      : 'text-nhs-grey-1'
                  }`}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-nhs-grey-1 mb-1">Description</label>
          <textarea
            value={element.description}
            onChange={(e) => updatePMVElement(elementId, { description: e.target.value })}
            placeholder="Notes about this element..."
            rows={3}
            className="!text-sm !py-1.5 resize-none"
          />
        </div>

        {/* Divider */}
        <hr className="border-nhs-grey-4" />

        {/* Package Editor */}
        <PackageEditor elementId={elementId} packages={element.packages} />
      </div>
    </div>
  );
}

export function ElementDetailPlaceholder() {
  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm flex items-center justify-center h-full">
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-nhs-grey-3 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
        <p className="text-nhs-grey-2 text-sm font-medium">Select an element from the browser</p>
        <p className="text-nhs-grey-3 text-xs mt-1">Choose a building element to view and edit its details</p>
      </div>
    </div>
  );
}
