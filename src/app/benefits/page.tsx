'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { useMMCStore } from '@/lib/store';
import { PageHeader, SectionCard, ScoreSlider, ProgressBar } from '@/components/ui';
import { computeBenefitCategoryAverage, computePointsBudget } from '@/lib/calculations';
import { BenefitCategory, BenefitItem } from '@/types';

const CATEGORY_ORDER: { key: BenefitCategory; label: string }[] = [
  { key: 'faster', label: 'Faster' },
  { key: 'better', label: 'Better' },
  { key: 'sustainable_legacy', label: 'Sustainable Legacy' },
  { key: 'economic', label: 'Economic' },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-nhs-grey-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AttendeesInput({
  attendees,
  onChange,
}: {
  attendees: string[];
  onChange: (attendees: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const addAttendee = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !attendees.includes(trimmed)) {
      onChange([...attendees, trimmed]);
      setInputValue('');
    }
  }, [inputValue, attendees, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAttendee();
    }
    if (e.key === 'Backspace' && inputValue === '' && attendees.length > 0) {
      onChange(attendees.slice(0, -1));
    }
  };

  const removeAttendee = (index: number) => {
    onChange(attendees.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-nhs-black mb-1">Workshop Attendees</label>
      <div className="flex flex-wrap items-center gap-2 p-2 border-2 border-[var(--input-border)] rounded focus-within:border-[var(--input-focus)] focus-within:shadow-[0_0_0_3px_rgba(0,94,184,0.2)] transition-all min-h-[44px]">
        {attendees.map((name, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 bg-nhs-pale-grey text-nhs-black text-sm px-2.5 py-1 rounded-full border border-nhs-grey-4"
          >
            {name}
            <button
              onClick={() => removeAttendee(index)}
              className="ml-0.5 text-nhs-grey-2 hover:text-rag-red transition-colors leading-none text-base"
              aria-label={`Remove ${name}`}
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addAttendee}
          placeholder={attendees.length === 0 ? 'Type a name and press Enter...' : 'Add another...'}
          className="!border-0 !shadow-none !p-0 !min-w-[150px] flex-1 text-sm focus:!ring-0 focus:!border-0"
        />
      </div>
      <p className="text-xs text-nhs-grey-2 mt-1">Press Enter to add each attendee name</p>
    </div>
  );
}

function PointsBudgetBanner({ items }: { items: BenefitItem[] }) {
  const budget = computePointsBudget(items);
  const usedPercent = Math.min((budget.used / 100) * 100, 100);
  const barColor = !budget.valid ? 'var(--rag-red)' : budget.remaining <= 10 ? 'var(--rag-amber)' : 'var(--nhs-blue)';

  return (
    <div className={`rounded-lg border-2 p-5 ${budget.valid ? 'border-nhs-grey-4 bg-white' : 'border-rag-red bg-red-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-nhs-black">Points Budget</h3>
          <p className="text-sm text-nhs-grey-1">Distribute 100 points across all benefit items</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${budget.valid ? 'text-nhs-blue' : 'text-rag-red'}`}>
            {budget.remaining}
          </div>
          <div className="text-sm text-nhs-grey-1">of 100 remaining</div>
        </div>
      </div>
      <ProgressBar value={usedPercent} label={`${budget.used} points used`} color={barColor} height="lg" />
      {!budget.valid && (
        <div className="mt-3 flex items-center gap-2 text-rag-red text-sm font-semibold">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Budget exceeded by {Math.abs(budget.remaining)} points. Reduce points allocation to continue.
        </div>
      )}
    </div>
  );
}

function BenefitItemCard({
  item,
  onUpdate,
}: {
  item: BenefitItem;
  onUpdate: (id: string, updates: Partial<BenefitItem>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-nhs-grey-4 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h4 className="text-sm font-semibold text-nhs-black flex-1">{item.name}</h4>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-nhs-blue hover:underline whitespace-nowrap"
        >
          {expanded ? 'Hide notes' : 'Add notes'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Importance slider */}
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Importance</label>
          <ScoreSlider
            value={item.importance}
            onChange={(value) => onUpdate(item.id, { importance: value })}
            min={1}
            max={10}
            leftLabel="Low"
            rightLabel="High"
            colorMode="benefit"
          />
        </div>

        {/* Points input */}
        <div>
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Points</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={item.points || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                onUpdate(item.id, { points: val });
              }}
              className="!w-20 !py-1.5 !text-sm text-center font-semibold"
              placeholder="0"
            />
            <span className="text-xs text-nhs-grey-2">out of 100</span>
          </div>
        </div>
      </div>

      {/* Expandable description */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-nhs-grey-4">
          <label className="block text-xs font-medium text-nhs-grey-1 mb-1">Notes / Description</label>
          <textarea
            value={item.description}
            onChange={(e) => onUpdate(item.id, { description: e.target.value })}
            rows={3}
            className="!text-sm"
            placeholder="Add notes about this benefit driver..."
          />
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  label,
  items,
  allItems,
  onUpdate,
  defaultOpen,
}: {
  category: BenefitCategory;
  label: string;
  items: BenefitItem[];
  allItems: BenefitItem[];
  onUpdate: (id: string, updates: Partial<BenefitItem>) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const average = computeBenefitCategoryAverage(allItems, category);
  const categoryPoints = items.reduce((sum, i) => sum + i.points, 0);

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-nhs-grey-4 bg-nhs-pale-grey/50 hover:bg-nhs-pale-grey transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ChevronIcon open={open} />
          <div>
            <h2 className="text-lg font-bold text-nhs-black">{label}</h2>
            <p className="text-sm text-nhs-grey-1">
              {items.length} items - {categoryPoints} points allocated
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-nhs-grey-1">Average Importance</div>
            <div className="text-xl font-bold text-nhs-blue">{average.toFixed(1)}</div>
          </div>
        </div>
      </button>

      {open && (
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <BenefitItemCard key={item.id} item={item} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BenefitsPage() {
  const { benefitsScorecard, updateBenefitItem, setBenefitsAttendees } = useMMCStore();
  const { items, workshopAttendees } = benefitsScorecard;

  return (
    <div>
      <PageHeader
        stepNumber={2}
        title="Benefits Scorecard"
        description="Score client benefit drivers across Faster, Better, Sustainable Legacy, and Economic categories."
      />

      <div className="space-y-6">
        {/* Workshop Attendees */}
        <SectionCard title="Workshop Information">
          <AttendeesInput attendees={workshopAttendees} onChange={setBenefitsAttendees} />
        </SectionCard>

        {/* Points Budget Banner */}
        <PointsBudgetBanner items={items} />

        {/* Category Sections */}
        {CATEGORY_ORDER.map((cat, index) => {
          const categoryItems = items.filter((i) => i.category === cat.key);
          return (
            <CategorySection
              key={cat.key}
              category={cat.key}
              label={cat.label}
              items={categoryItems}
              allItems={items}
              onUpdate={updateBenefitItem}
              defaultOpen={index === 0}
            />
          );
        })}
      </div>
    </div>
  );
}
