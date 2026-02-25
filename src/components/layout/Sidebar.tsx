'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMMCStore } from '@/lib/store';
import { computeCategory0Total } from '@/lib/calculations/category0';
import { computeTotalPMV, allCarbonChecksPass } from '@/lib/calculations/pmv';
import { computeCategory7Score } from '@/lib/calculations/category7';
import { computeOverallMMC } from '@/lib/calculations/executive-summary';
import { MMCAssessmentSchema } from '@/lib/validation/assessment-schema';
import type { MMCAssessmentState } from '@/types';

const STEPS = [
  { path: '/project-details', label: 'Project Details', number: 1 },
  { path: '/benefits', label: 'Benefits', number: 2 },
  { path: '/constraints', label: 'Constraints', number: 3 },
  { path: '/category-0', label: 'Category 0', number: 4 },
  { path: '/pmv', label: 'PMV Calculation', number: 5 },
  { path: '/category-7', label: 'Category 7', number: 6 },
  { path: '/summary', label: 'Summary', number: 7 },
];

function ragColor(percentage: number): string {
  if (percentage >= 70) return 'var(--rag-green, #00703c)';
  if (percentage >= 50) return 'var(--rag-amber, #ffb81c)';
  return 'var(--rag-red, #da291c)';
}

function MetricGauge({ label, value, displayValue, color }: {
  label: string;
  value: number;
  displayValue?: string;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-blue-200">{label}</span>
        <span className="font-bold" style={{ color }}>{displayValue ?? `${value.toFixed(1)}%`}</span>
      </div>
      <div className="w-full h-2.5 bg-blue-900/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [saveLoadOpen, setSaveLoadOpen] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const category0Assessment = useMMCStore((s) => s.category0Assessment);
  const pmvCalculation = useMMCStore((s) => s.pmvCalculation);
  const category7Assessment = useMMCStore((s) => s.category7Assessment);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSaveLoadOpen(false);
      }
    }
    if (saveLoadOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [saveLoadOpen]);

  // Compute live metrics
  const cat0Result = computeCategory0Total(category0Assessment);
  const cat0Pct = cat0Result.percentage;

  const carbonPass = allCarbonChecksPass(pmvCalculation);
  const pmvPct = computeTotalPMV(pmvCalculation);

  const cat7Result = computeCategory7Score(category7Assessment);
  const cat7Pct = cat7Result.percentage;

  const overallPct = computeOverallMMC(cat0Pct, pmvPct, cat7Pct);

  // Save assessment as JSON
  const handleSave = () => {
    const state = useMMCStore.getState().getState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mmc-assessment-${new Date().toISOString().slice(0, 10)}.mmc.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveLoadOpen(false);
  };

  // Load assessment from JSON
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.mmc.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = JSON.parse(reader.result as string);
          const result = MMCAssessmentSchema.safeParse(raw);
          if (!result.success) {
            alert('Invalid assessment file. The file structure does not match the expected format.');
            return;
          }
          useMMCStore.getState().loadAssessment(result.data as MMCAssessmentState);
        } catch {
          alert('Invalid file format. Please select a valid .mmc.json file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setSaveLoadOpen(false);
  };

  // Export PDF
  const handleExportPDF = async () => {
    setPdfExporting(true);
    try {
      const { generateAndDownloadReport } = await import('@/lib/pdf/ReportGenerator');
      const state = useMMCStore.getState().getState();
      await generateAndDownloadReport(state);
    } catch {
      alert('PDF export failed. Please try again.');
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <aside className={`w-64 bg-sidebar-bg text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-[translate] duration-200 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-blue-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-nhs-blue font-bold text-sm">NHS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">MMC Assessment</h1>
            <p className="text-[10px] text-blue-300">Tool v3.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Home link */}
        <Link
          href="/"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 mx-2 mb-2 rounded-lg text-sm transition-colors ${
            pathname === '/'
              ? 'bg-white/15 text-white font-semibold'
              : 'text-blue-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
            pathname === '/' ? 'bg-white text-nhs-dark-blue' : 'bg-blue-800 text-blue-300'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </span>
          Home
        </Link>
        <div className="border-b border-blue-800 mx-4 mb-2" />
        <ul className="space-y-1 px-2">
          {STEPS.map((step) => {
            const isActive = pathname === step.path;
            return (
              <li key={step.path}>
                <Link
                  href={step.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-white text-nhs-dark-blue' : 'bg-blue-800 text-blue-300'
                  }`}>
                    {step.number}
                  </span>
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Live Metrics */}
      <div className="mx-3 my-4 p-4 bg-white/10 rounded-xl ring-1 ring-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Live</span>
          </span>
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Metrics</span>
        </div>
        <MetricGauge label="Cat 0" value={cat0Pct} color={ragColor(cat0Pct)} />
        <MetricGauge
          label="PMV"
          value={carbonPass ? pmvPct : 0}
          displayValue={carbonPass ? `${pmvPct.toFixed(1)}%` : 'N/A'}
          color={carbonPass ? ragColor(pmvPct) : 'var(--rag-red, #da291c)'}
        />
        <MetricGauge label="Cat 7" value={cat7Pct} color={ragColor(cat7Pct)} />
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm text-blue-200">Overall</span>
            <span className="text-2xl font-bold" style={{ color: ragColor(overallPct) }}>{overallPct.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-blue-900/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, overallPct))}%`,
                backgroundColor: ragColor(overallPct),
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-blue-800 space-y-2">
        <button
          onClick={handleExportPDF}
          disabled={pdfExporting}
          className="w-full py-2 px-3 bg-white text-nhs-dark-blue rounded text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pdfExporting ? 'Generating PDF...' : 'Export PDF'}
        </button>

        {/* Save / Load with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSaveLoadOpen(!saveLoadOpen)}
            className="w-full py-2 px-3 bg-transparent border border-blue-400 text-blue-200 rounded text-sm hover:bg-white/10 transition-colors"
          >
            Save / Load
          </button>

          {saveLoadOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#003087] border border-blue-400 rounded-lg shadow-xl overflow-hidden z-50">
              <button
                onClick={handleSave}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors text-left"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <div>
                  <div className="font-semibold">Save Assessment</div>
                  <div className="text-xs text-blue-300">Download as .mmc.json file</div>
                </div>
              </button>
              <div className="border-t border-blue-600" />
              <button
                onClick={handleLoad}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors text-left"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <div className="font-semibold">Load Assessment</div>
                  <div className="text-xs text-blue-300">Open a .mmc.json file</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
