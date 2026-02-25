'use client';

import { useState, useMemo } from 'react';
import { useMMCStore } from '@/lib/store';
import type { PMVElement, PMVSection } from '@/types';

interface ElementBrowserProps {
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
}

const SECTION_CONFIG: { section: PMVSection; label: string }[] = [
  { section: 'structure', label: 'Structure' },
  { section: 'architecture', label: 'Architecture' },
  { section: 'building_services', label: 'Building Services' },
];

function ElementRow({
  element,
  isSelected,
  onSelect,
}: {
  element: PMVElement;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasPackages = element.packages.length > 0;
  const hasBcis = element.bcisPercentage > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 rounded transition-colors ${
        isSelected
          ? 'bg-nhs-blue text-white'
          : 'text-nhs-black hover:bg-nhs-pale-grey'
      }`}
    >
      <span className={`font-mono text-xs shrink-0 ${isSelected ? 'text-blue-200' : 'text-nhs-grey-2'}`}>
        {element.number}
      </span>
      <span className="truncate flex-1 text-[13px]">{element.name}</span>
      {(hasPackages || hasBcis) && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isSelected ? 'bg-white' : 'bg-nhs-blue'
        }`} />
      )}
    </button>
  );
}

export function ElementBrowser({ selectedElementId, onSelectElement }: ElementBrowserProps) {
  const elements = useMMCStore((s) => s.pmvCalculation.elements);
  const [expandedSections, setExpandedSections] = useState<Set<PMVSection>>(
    new Set(['structure', 'architecture', 'building_services'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (section: PMVSection) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Group elements by section, then by sectionGroup
  const groupedElements = useMemo(() => {
    const filtered = searchQuery.trim()
      ? elements.filter(
          (el) =>
            el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            el.number.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : elements;

    const sections = new Map<
      PMVSection,
      Map<string, PMVElement[]>
    >();

    for (const el of filtered) {
      if (!sections.has(el.section)) {
        sections.set(el.section, new Map());
      }
      const sectionMap = sections.get(el.section)!;
      if (!sectionMap.has(el.sectionGroup)) {
        sectionMap.set(el.sectionGroup, []);
      }
      sectionMap.get(el.sectionGroup)!.push(el);
    }

    return sections;
  }, [elements, searchQuery]);

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b border-nhs-grey-4">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nhs-grey-2"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements..."
            className="!text-sm !py-1.5 !pl-8 !pr-3 !border-nhs-grey-3"
          />
        </div>
      </div>

      {/* Tree navigation */}
      <div className="flex-1 overflow-y-auto py-1">
        {SECTION_CONFIG.map(({ section, label }) => {
          const sectionGroups = groupedElements.get(section);
          const count = sectionGroups
            ? Array.from(sectionGroups.values()).reduce((sum, els) => sum + els.length, 0)
            : 0;
          const isExpanded = expandedSections.has(section);

          if (count === 0 && searchQuery.trim()) return null;

          return (
            <div key={section}>
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-nhs-pale-grey/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-nhs-grey-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <span className="text-sm font-bold text-nhs-black">{label}</span>
                </div>
                <span className="text-xs text-nhs-grey-2 bg-nhs-pale-grey px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </button>

              {/* Section groups + elements */}
              {isExpanded && sectionGroups && (
                <div className="ml-2">
                  {Array.from(sectionGroups.entries()).map(([groupName, els]) => (
                    <div key={groupName} className="mb-1">
                      <div className="px-3 py-1">
                        <span className="text-[11px] font-semibold text-nhs-grey-2 uppercase tracking-wider">
                          {groupName}
                        </span>
                      </div>
                      <div className="ml-1">
                        {els.map((el) => (
                          <ElementRow
                            key={el.id}
                            element={el}
                            isSelected={el.id === selectedElementId}
                            onSelect={() => onSelectElement(el.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
