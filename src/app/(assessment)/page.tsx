'use client';

import Link from 'next/link';
import { SectionCard } from '@/components/ui';

const WORKFLOW_STEPS = [
  { number: 1, name: 'Project Details', description: 'Capture trust, PSCP, typology and project team information', path: '/project-details' },
  { number: 2, name: 'Benefits', description: 'Score and weight MMC benefit categories with workshop attendees', path: '/benefits' },
  { number: 3, name: 'Constraints', description: 'Assess project constraints that may limit MMC adoption', path: '/constraints' },
  { number: 4, name: 'Category 0', description: 'Evaluate pre-manufacturing planning and design considerations', path: '/category-0' },
  { number: 5, name: 'PMV Calculation', description: 'Calculate Pre-Manufactured Value across structure, architecture and services', path: '/pmv' },
  { number: 6, name: 'Category 7', description: 'Assess site processes and logistics for off-site manufacturing', path: '/category-7' },
  { number: 7, name: 'Summary', description: 'View overall MMC score with RAG benchmarking and visual dashboards', path: '/summary' },
];

const RAG_THRESHOLDS = [
  { label: 'Green', threshold: '>= 70%', color: 'bg-rag-green' },
  { label: 'Amber', threshold: '>= 50%', color: 'bg-rag-amber' },
  { label: 'Red', threshold: '< 50%', color: 'bg-rag-red' },
];

export default function LandingPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-nhs-dark-blue text-white rounded-lg p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <span className="text-nhs-blue font-bold text-lg">NHS</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">MMC Assessment Tool</h1>
            <p className="text-blue-200 text-sm">Modern Methods of Construction - Scoring & Benchmarking</p>
          </div>
        </div>
        <span className="inline-block text-xs bg-white/20 px-2 py-0.5 rounded font-medium">v3.0</span>
      </div>

      {/* Purpose */}
      <SectionCard title="About This Tool" subtitle="What it does and who it's for">
        <div className="space-y-3 text-sm text-nhs-grey-1 leading-relaxed">
          <p>
            This tool supports NHS healthcare construction projects in assessing and scoring their
            adoption of Modern Methods of Construction (MMC). It replaces the legacy Excel workbook
            with an interactive, guided workflow.
          </p>
          <p>
            Complete each step to build a comprehensive MMC assessment covering benefits analysis,
            constraints evaluation, Category 0 and Category 7 scoring, and Pre-Manufactured Value
            (PMV) calculation. Results are benchmarked against NHS thresholds using RAG status
            indicators.
          </p>
        </div>
      </SectionCard>

      {/* Workflow Overview */}
      <SectionCard title="Assessment Workflow" subtitle="Seven steps from project setup to executive summary">
        <div className="space-y-3">
          {WORKFLOW_STEPS.map((step, idx) => (
            <Link
              key={step.path}
              href={step.path}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-nhs-pale-grey transition-colors group"
            >
              {/* Step number + connector line */}
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-nhs-blue text-white flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-nhs-bright-blue transition-colors">
                  {step.number}
                </span>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className="w-0.5 h-4 bg-nhs-grey-4 mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="pt-1">
                <span className="font-semibold text-nhs-black text-sm group-hover:text-nhs-blue transition-colors">
                  {step.name}
                </span>
                <p className="text-xs text-nhs-grey-2 mt-0.5">{step.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      {/* CTA */}
      <div className="flex justify-center">
        <Link
          href="/project-details"
          className="inline-flex items-center gap-2 bg-nhs-blue text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-nhs-bright-blue transition-colors shadow-sm"
        >
          Begin Assessment
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* Scoring Methodology */}
      <SectionCard title="Scoring Methodology" subtitle="How the overall MMC score is calculated">
        <div className="space-y-4">
          {/* Formula */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-center py-2">
            <div className="bg-nhs-pale-grey border border-nhs-grey-4 rounded px-4 py-2">
              <div className="text-[10px] text-nhs-grey-2 uppercase font-medium">Category 0</div>
              <div className="text-sm font-bold text-nhs-black">15%</div>
            </div>
            <span className="text-lg font-bold text-nhs-grey-3">+</span>
            <div className="bg-nhs-pale-grey border border-nhs-grey-4 rounded px-4 py-2">
              <div className="text-[10px] text-nhs-grey-2 uppercase font-medium">PMV</div>
              <div className="text-sm font-bold text-nhs-black">70%</div>
            </div>
            <span className="text-lg font-bold text-nhs-grey-3">+</span>
            <div className="bg-nhs-pale-grey border border-nhs-grey-4 rounded px-4 py-2">
              <div className="text-[10px] text-nhs-grey-2 uppercase font-medium">Category 7</div>
              <div className="text-sm font-bold text-nhs-black">15%</div>
            </div>
            <span className="text-lg font-bold text-nhs-grey-3">=</span>
            <div className="bg-nhs-dark-blue text-white rounded px-4 py-2">
              <div className="text-[10px] uppercase font-medium opacity-80">Overall MMC</div>
              <div className="text-sm font-bold">100%</div>
            </div>
          </div>

          {/* RAG thresholds */}
          <div className="flex justify-center gap-6 pt-2">
            {RAG_THRESHOLDS.map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-sm">
                <span className={`w-3 h-3 rounded-full ${t.color}`} />
                <span className="text-nhs-grey-1">
                  <span className="font-medium">{t.label}</span> {t.threshold}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
