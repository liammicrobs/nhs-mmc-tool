'use client';

import { useState, KeyboardEvent } from 'react';
import { useMMCStore } from '@/lib/store';
import { PageHeader, SectionCard, ScoreSlider, RAGBadge } from '@/components/ui';
import {
  computeConstraintAverage,
  getConstraintSeverity,
  computeConstraintSeverityCounts,
} from '@/lib/calculations';
import type { RAGStatus } from '@/types';

const SEVERITY_COLORS: Record<RAGStatus, string> = {
  green: 'var(--rag-green)',
  amber: 'var(--rag-amber)',
  red: 'var(--rag-red)',
};

export default function ConstraintsPage() {
  const {
    constraintsScorecard,
    updateConstraintItem,
    setConstraintsAttendees,
  } = useMMCStore();

  const { items, workshopAttendees } = constraintsScorecard;

  const [attendeeInput, setAttendeeInput] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Calculations
  const average = computeConstraintAverage(items);
  const overallSeverity = getConstraintSeverity(average);
  const severityCounts = computeConstraintSeverityCounts(items);

  // Attendee chip management
  const addAttendee = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !workshopAttendees.includes(trimmed)) {
      setConstraintsAttendees([...workshopAttendees, trimmed]);
    }
    setAttendeeInput('');
  };

  const removeAttendee = (name: string) => {
    setConstraintsAttendees(workshopAttendees.filter((a) => a !== name));
  };

  const handleAttendeeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAttendee(attendeeInput);
    }
    if (e.key === 'Backspace' && attendeeInput === '' && workshopAttendees.length > 0) {
      removeAttendee(workshopAttendees[workshopAttendees.length - 1]);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        stepNumber={3}
        title="Constraints Scorecard"
        description="Assess project constraints from unconstrained to constrained."
      />

      {/* Workshop Attendees */}
      <SectionCard title="Workshop Attendees" subtitle="Record who participated in the constraints scoring workshop">
        <div className="flex flex-wrap items-center gap-2 p-2 border-2 border-[var(--input-border)] rounded min-h-[48px] focus-within:border-[var(--input-focus)] focus-within:shadow-[0_0_0_3px_rgba(0,94,184,0.2)] transition-all">
          {workshopAttendees.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 bg-nhs-pale-grey text-nhs-black text-sm px-2.5 py-1 rounded-full border border-nhs-grey-4"
            >
              {name}
              <button
                type="button"
                onClick={() => removeAttendee(name)}
                className="text-nhs-grey-2 hover:text-rag-red ml-0.5 font-bold leading-none"
                aria-label={`Remove ${name}`}
              >
                x
              </button>
            </span>
          ))}
          <input
            type="text"
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            onKeyDown={handleAttendeeKeyDown}
            onBlur={() => {
              if (attendeeInput.trim()) addAttendee(attendeeInput);
            }}
            placeholder={workshopAttendees.length === 0 ? 'Type a name and press Enter...' : 'Add another...'}
            className="flex-1 min-w-[160px] !border-0 !shadow-none !p-0 !outline-none text-sm"
          />
        </div>
      </SectionCard>

      {/* Overall Constraint Level */}
      <SectionCard
        title="Overall Constraint Level"
        headerRight={<RAGBadge status={overallSeverity} size="lg" />}
      >
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-nhs-grey-1">Average constraint score</span>
              <span className="text-3xl font-bold" style={{ color: SEVERITY_COLORS[overallSeverity] }}>
                {average.toFixed(1)}
              </span>
            </div>
            <div className="w-full h-3 bg-nhs-grey-4 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(average / 10) * 100}%`,
                  backgroundColor: SEVERITY_COLORS[overallSeverity],
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-nhs-grey-2">1 - Unconstrained</span>
              <span className="text-xs text-nhs-grey-2">10 - Constrained</span>
            </div>
          </div>
          <div className="flex gap-3 ml-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-rag-green text-white flex items-center justify-center font-bold text-lg">
                {severityCounts.green}
              </div>
              <span className="text-[10px] text-nhs-grey-2 mt-1 block">Low</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-rag-amber text-nhs-black flex items-center justify-center font-bold text-lg">
                {severityCounts.amber}
              </div>
              <span className="text-[10px] text-nhs-grey-2 mt-1 block">Medium</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-rag-red text-white flex items-center justify-center font-bold text-lg">
                {severityCounts.red}
              </div>
              <span className="text-[10px] text-nhs-grey-2 mt-1 block">High</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Constraint Items */}
      <SectionCard title="Constraint Assessment" subtitle="Score each constraint from 1 (unconstrained) to 10 (constrained)">
        <div className="space-y-4">
          {items.map((item, index) => {
            const severity = getConstraintSeverity(item.score);
            const isExpanded = expandedItems.has(item.id);

            return (
              <div
                key={item.id}
                className="border border-nhs-grey-4 rounded-lg p-4 hover:border-nhs-grey-3 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-mono text-nhs-grey-2 w-6 text-right flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm font-medium text-nhs-black">
                    {item.name}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SEVERITY_COLORS[severity] }}
                    title={`${severity.toUpperCase()} - Score: ${item.score}`}
                  />
                  <RAGBadge status={severity} size="sm" />
                </div>

                <div className="ml-9">
                  <ScoreSlider
                    value={item.score}
                    onChange={(value) => updateConstraintItem(item.id, { score: value })}
                    colorMode="constraint"
                    leftLabel="Unconstrained"
                    rightLabel="Constrained"
                  />
                </div>

                <div className="ml-9 mt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    className="text-xs text-nhs-blue hover:text-nhs-dark-blue flex items-center gap-1"
                  >
                    <span className="inline-block transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      &#9654;
                    </span>
                    {isExpanded ? 'Hide notes' : 'Add notes'}
                  </button>

                  {isExpanded && (
                    <textarea
                      value={item.description}
                      onChange={(e) => updateConstraintItem(item.id, { description: e.target.value })}
                      placeholder="Describe the constraint context, rationale for scoring, and any mitigations..."
                      rows={3}
                      className="mt-2 text-sm"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Constraint Heatmap */}
      <SectionCard title="Constraint Heatmap" subtitle="Visual summary of all constraint severity levels">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {items.map((item, index) => {
            const severity = getConstraintSeverity(item.score);
            return (
              <div
                key={item.id}
                title={`${item.name} - Score: ${item.score}/10`}
                className="aspect-square rounded cursor-default flex items-center justify-center text-xs font-bold transition-transform hover:scale-110"
                style={{
                  backgroundColor: SEVERITY_COLORS[severity],
                  color: severity === 'amber' ? 'var(--nhs-black)' : 'white',
                }}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-nhs-grey-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--rag-green)' }} />
            <span>Low (1-3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--rag-amber)' }} />
            <span>Medium (4-7)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--rag-red)' }} />
            <span>High (8-10)</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
