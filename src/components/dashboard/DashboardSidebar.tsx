'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages } from '@/lib/calculations/portfolio';
import { computeRAG } from '@/lib/calculations/executive-summary';
import { RAGBadge } from '@/components/ui';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Import & Portfolio',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    path: '/dashboard/executive-summary',
    label: 'Executive Summary',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    path: '/dashboard/benefits',
    label: 'Benefits Analysis',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    path: '/dashboard/pmv',
    label: 'PMV Analysis',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
];

const BENCHMARKS = {
  category0: 70,
  pmv: 70,
  category7: 65,
  overall: 70,
};

export function DashboardSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const projects = useDashboardStore((s) => s.projects);

  // Compute live portfolio metrics
  const averages = computePortfolioAverages(projects);
  const hasProjects = projects.length > 0;

  const metrics = hasProjects
    ? [
        { label: 'Avg Cat 0', value: averages.category0Avg, rag: computeRAG(averages.category0Avg, BENCHMARKS.category0) },
        { label: 'Avg PMV', value: averages.pmvAvg, rag: computeRAG(averages.pmvAvg, BENCHMARKS.pmv) },
        { label: 'Avg Cat 7', value: averages.category7Avg, rag: computeRAG(averages.category7Avg, BENCHMARKS.category7) },
        { label: 'Combined', value: averages.combinedAvg, rag: computeRAG(averages.combinedAvg, BENCHMARKS.overall) },
      ]
    : null;

  return (
    <aside
      className={`w-64 bg-sidebar-bg text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-[translate] duration-200 ease-in-out md:relative md:translate-x-0 overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-800 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-nhs-blue font-bold text-sm">NHS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Portfolio Dashboard</h1>
            <p className="text-[10px] text-blue-300">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-white text-nhs-dark-blue' : 'bg-blue-800 text-blue-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Live Metrics */}
      {metrics && (
        <div className="mx-3 my-4 p-4 bg-white/10 rounded-xl ring-1 ring-white/10 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Live</span>
            </span>
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Portfolio</span>
          </div>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-xs text-blue-200">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{m.value.toFixed(1)}%</span>
                  <RAGBadge status={m.rag} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Tool link */}
      <div className="p-4 border-t border-blue-800 shrink-0">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="w-6 h-6 rounded-full bg-blue-800 text-blue-300 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </span>
          Assessment Tool
        </Link>
      </div>
    </aside>
  );
}
