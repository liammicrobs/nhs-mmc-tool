'use client';

import { useState } from 'react';
import { useMMCStore } from '@/lib/store';
import { PageHeader, SectionCard, ProgressBar, RAGBadge } from '@/components/ui';
import { computeCategory7Score } from '@/lib/calculations/category7';
import type { RAGStatus, Category7Item } from '@/types';

function getRAGStatus(percentage: number): RAGStatus {
  if (percentage >= 65) return 'green';
  if (percentage >= 55) return 'amber';
  return 'red';
}

function getRAGColor(status: RAGStatus): string {
  switch (status) {
    case 'green': return 'var(--rag-green)';
    case 'amber': return 'var(--rag-amber)';
    case 'red': return 'var(--rag-red)';
  }
}

function InnovationItem({ item }: { item: Category7Item }) {
  const updateCategory7Item = useMMCStore((s) => s.updateCategory7Item);
  const [showNotes, setShowNotes] = useState(item.description.length > 0);

  const handleToggle = () => {
    updateCategory7Item(item.id, { adopted: !item.adopted });
  };

  const handleNameChange = (name: string) => {
    updateCategory7Item(item.id, { name });
  };

  const handleDescriptionChange = (description: string) => {
    updateCategory7Item(item.id, { description });
  };

  return (
    <div
      className={`
        py-4 px-5 border-b border-nhs-grey-4 last:border-b-0 transition-colors
        ${item.adopted ? 'border-l-4 border-l-rag-green bg-green-50/30' : 'border-l-4 border-l-transparent'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={item.adopted}
            onClick={handleToggle}
            className={`
              relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
              border-2 border-transparent transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue
              ${item.adopted ? 'bg-nhs-blue' : 'bg-nhs-grey-3'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
                ring-0 transition-transform duration-200 ease-in-out
                ${item.adopted ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>

          <div className="flex-1 min-w-0">
            {item.isCustom ? (
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter custom innovation name..."
                className="text-sm font-medium text-nhs-black w-full py-1 px-2 border border-nhs-grey-3 rounded focus:outline-none focus:ring-2 focus:ring-nhs-blue focus:border-nhs-blue"
              />
            ) : (
              <span className={`text-sm font-medium ${item.adopted ? 'text-nhs-black' : 'text-nhs-grey-2'}`}>
                {item.name}
              </span>
            )}

            {/* Notes toggle */}
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="mt-1 flex items-center gap-1 text-xs text-nhs-blue hover:text-nhs-dark-blue transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add notes
              </button>
            ) : (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-nhs-grey-1 font-medium">Notes</span>
                  <button
                    type="button"
                    onClick={() => setShowNotes(false)}
                    className="text-xs text-nhs-grey-2 hover:text-nhs-grey-1 transition-colors"
                  >
                    Hide notes
                  </button>
                </div>
                <textarea
                  value={item.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Describe how this innovation is being adopted..."
                  rows={2}
                  className="w-full text-sm text-nhs-black py-1.5 px-2.5 border border-nhs-grey-3 rounded resize-y focus:outline-none focus:ring-2 focus:ring-nhs-blue focus:border-nhs-blue"
                />
              </div>
            )}
          </div>
        </div>

        {/* Score indicator */}
        <div className="shrink-0 flex items-center gap-1.5">
          <span
            className={`
              text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full
              ${item.adopted ? 'bg-nhs-blue text-white' : 'bg-nhs-grey-4 text-nhs-grey-2'}
            `}
          >
            {item.adopted ? 1 : 0}
          </span>
          <span className="text-[11px] text-nhs-grey-2">/ 1</span>
        </div>
      </div>
    </div>
  );
}

export default function Category7Page() {
  const category7Assessment = useMMCStore((s) => s.category7Assessment);
  const { score, maxScore, percentage } = computeCategory7Score(category7Assessment);
  const ragStatus = getRAGStatus(percentage);

  return (
    <div>
      <PageHeader
        stepNumber={6}
        title="Category 7 Assessment"
        description="Assess site process innovations and technology adoption."
      />

      {/* Score overview */}
      <SectionCard
        title="Category 7 Score"
        headerRight={<RAGBadge status={ragStatus} size="lg" />}
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-nhs-black">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-sm font-medium text-nhs-grey-1">
              {score} / {maxScore} innovations adopted
            </span>
          </div>
          <ProgressBar
            value={percentage}
            color={getRAGColor(ragStatus)}
            height="lg"
          />
        </div>
      </SectionCard>

      {/* Process innovations list */}
      <div className="mt-6">
        <SectionCard
          title="Process Innovations"
          subtitle={`${score} of ${maxScore} innovations adopted`}
        >
          <div className="-mx-6 -my-6">
            {category7Assessment.items.map((item) => (
              <InnovationItem key={item.id} item={item} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
