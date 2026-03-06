'use client';

import { useState } from 'react';
import { useMMCStore } from '@/lib/store';
import { PageHeader, SectionCard, ProgressBar, RAGBadge } from '@/components/ui';
import {
  computeCategory0ItemScore,
  computeSubcategoryScore,
  computeCategory0Total,
} from '@/lib/calculations';
import type { RAGStatus, Category0Item, Category0Subcategory } from '@/types';

function getRAGStatus(percentage: number): RAGStatus {
  if (percentage >= 70) return 'green';
  if (percentage >= 50) return 'amber';
  return 'red';
}

function getRAGColor(status: RAGStatus): string {
  switch (status) {
    case 'green': return 'var(--rag-green)';
    case 'amber': return 'var(--rag-amber)';
    case 'red': return 'var(--rag-red)';
  }
}

function ThresholdBreakdown({ item }: { item: Category0Item }) {
  if (item.type !== 'percentage_threshold' || item.thresholds.length === 0) return null;

  const sorted = [...item.thresholds].sort((a, b) => a.minPercent - b.minPercent);
  const labels: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (next) {
      labels.push(`${current.minPercent}-${next.minPercent - 1}% = +${current.score}`);
    } else {
      labels.push(`${current.minPercent}%+ = +${current.score}`);
    }
  }
  // Add the "below first threshold" case if first threshold starts above 0
  if (sorted[0].minPercent > 0) {
    labels.unshift(`< ${sorted[0].minPercent}% = 0`);
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {labels.map((label, idx) => (
        <span
          key={idx}
          className="text-[11px] px-2 py-0.5 rounded-full bg-nhs-pale-grey text-nhs-grey-1 font-medium"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function CategoryItemRow({
  item,
  subcategoryId,
}: {
  item: Category0Item;
  subcategoryId: string;
}) {
  const updateCategory0Item = useMMCStore((s) => s.updateCategory0Item);
  const score = computeCategory0ItemScore(item);

  const handleToggle = () => {
    updateCategory0Item(subcategoryId, item.id, { value: !item.value });
  };

  const handlePercentageChange = (pct: number) => {
    updateCategory0Item(subcategoryId, item.id, { percentage: pct });
  };

  const handleNameChange = (name: string) => {
    updateCategory0Item(subcategoryId, item.id, { name });
  };

  return (
    <div className="py-4 border-b border-nhs-grey-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={item.value}
            onClick={handleToggle}
            className={`
              relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
              border-2 border-transparent transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue
              ${item.value ? 'bg-nhs-blue' : 'bg-nhs-grey-3'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
                ring-0 transition-transform duration-200 ease-in-out
                ${item.value ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>

          <div className="flex-1 min-w-0">
            {item.isCustom ? (
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter description for this item..."
                className="text-sm font-medium text-nhs-black w-full !py-1 !px-2 !border !border-nhs-grey-3 rounded"
              />
            ) : (
              <span className={`text-sm font-medium ${item.value ? 'text-nhs-black' : 'text-nhs-grey-2'}`}>
                {item.name}
              </span>
            )}

            {/* Percentage slider for threshold items when toggled on */}
            {item.type === 'percentage_threshold' && item.value && (
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-nhs-grey-1 whitespace-nowrap w-8">0%</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={item.percentage}
                      onChange={(e) => handlePercentageChange(Number(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--nhs-blue) 0%, var(--nhs-blue) ${item.percentage}%, var(--nhs-grey-4) ${item.percentage}%, var(--nhs-grey-4) 100%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-nhs-grey-1 whitespace-nowrap w-8">100%</span>
                  <span className="w-12 text-center font-bold text-sm text-nhs-blue">
                    {item.percentage}%
                  </span>
                </div>
                <ThresholdBreakdown item={item} />
              </div>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div className="shrink-0 flex items-center gap-1.5">
          <span
            className={`
              text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full
              ${score > 0 ? 'bg-nhs-blue text-white' : 'bg-nhs-grey-4 text-nhs-grey-2'}
            `}
          >
            {score}
          </span>
          <span className="text-[11px] text-nhs-grey-2">/ {item.maxScore}</span>
        </div>
      </div>
    </div>
  );
}

function SubcategoryAccordion({ subcategory }: { subcategory: Category0Subcategory }) {
  const [isOpen, setIsOpen] = useState(false);
  const { score, maxScore } = computeSubcategoryScore(subcategory);
  const completedCount = subcategory.items.filter(
    (item) => computeCategory0ItemScore(item) > 0
  ).length;

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-nhs-pale-grey/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-nhs-dark-blue text-white flex items-center justify-center font-bold text-sm">
            {subcategory.number}
          </span>
          <div>
            <h3 className="text-base font-bold text-nhs-black">{subcategory.name}</h3>
            <span className="text-xs text-nhs-grey-1">
              {completedCount} / {subcategory.items.length} completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-nhs-grey-1">
            {score} / {maxScore}
          </span>
          <svg
            className={`w-5 h-5 text-nhs-grey-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-4 border-t border-nhs-grey-4">
          {subcategory.items.map((item) => (
            <CategoryItemRow
              key={item.id}
              item={item}
              subcategoryId={subcategory.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Category0Page() {
  const category0Assessment = useMMCStore((s) => s.category0Assessment);
  const { score, maxScore, percentage } = computeCategory0Total(category0Assessment);
  const ragStatus = getRAGStatus(percentage);

  return (
    <div>
      <PageHeader
        stepNumber={4}
        title="Category 0 Assessment"
        description="Assess design standardisation, BIM, and stakeholder engagement."
      />

      {/* Score overview */}
      <SectionCard
        title="Category 0 Score"
        headerRight={<RAGBadge status={ragStatus} size="lg" />}
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-nhs-black">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-sm font-medium text-nhs-grey-1">
              {score} / {maxScore} points
            </span>
          </div>
          <ProgressBar
            value={percentage}
            color={getRAGColor(ragStatus)}
            height="lg"
          />
        </div>
      </SectionCard>

      {/* Sub-category accordions */}
      <div className="mt-6 space-y-3">
        {category0Assessment.subcategories.map((subcategory) => (
          <SubcategoryAccordion key={subcategory.id} subcategory={subcategory} />
        ))}
      </div>
    </div>
  );
}
