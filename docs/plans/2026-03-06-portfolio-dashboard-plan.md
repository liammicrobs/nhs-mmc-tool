# MMC Portfolio Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an integrated portfolio analytics dashboard that consumes `.mmc.json` exports and produces cross-project analysis matching the ProCure23 PowerPoint analysis.

**Architecture:** New `/dashboard` route group within the existing Next.js app, with its own Zustand store (`nhs-mmc-dashboard` localStorage key), dedicated sidebar, and 5 pages (Import, Exec Summary, Benefits, PMV, Project Deep-Dive). Reuses existing types, validation, calculations, and UI components.

**Tech Stack:** Next.js 15 (App Router), React 19, Zustand 5, Recharts 3, Zod 4, Tailwind CSS 4, Vitest 3.

**Design doc:** `docs/plans/2026-03-06-portfolio-dashboard-design.md`

---

## Task 1: Dashboard Types

**Files:**
- Create: `src/types/dashboard.ts`
- Modify: `src/types/index.ts`

**Step 1: Create dashboard types**

Create `src/types/dashboard.ts`:

```typescript
import { MMCAssessmentState, ExecutiveSummary, RAGStatus, BuildingTypology, BuildType, BusinessCaseStage } from './index';

export interface DashboardProject {
  id: string;
  importedAt: string;              // ISO date string
  label: string;                    // Display name (trust + PSCP)
  assessment: MMCAssessmentState;
  summary: ExecutiveSummary;        // Pre-computed on import
}

export interface DashboardPortfolio {
  projects: DashboardProject[];
}

// Aggregate types for charts
export interface TypologyScores {
  typology: BuildingTypology | 'all';
  category0Avg: number;
  pmvAvg: number;
  category7Avg: number;
  combinedAvg: number;
  count: number;
}

export interface BusinessCaseScores {
  stage: BusinessCaseStage;
  category0Avg: number;
  pmvAvg: number;
  category7Avg: number;
  combinedAvg: number;
  count: number;
}

export interface CorrelationPoint {
  projectLabel: string;
  x: number;
  y: number;
}

export interface CorrelationResult {
  points: CorrelationPoint[];
  rSquared: number;
  slope: number;
  intercept: number;
}

export interface BenefitCategoryDistribution {
  projectLabel: string;
  faster: number;
  better: number;
  sustainable_legacy: number;
  economic: number;
}

export interface ElementUtilisation {
  elementName: string;
  section: string;
  avgPmvPotential: number;
  avgUtilisation: number;
  gap: number;
  projectCount: number;
}
```

**Step 2: Export from barrel**

Add to `src/types/index.ts` at the end:

```typescript
export * from './dashboard';
```

**Step 3: Commit**

```bash
git add src/types/dashboard.ts src/types/index.ts
git commit -m "feat(dashboard): add portfolio dashboard types"
```

---

## Task 2: Dashboard Zustand Store

**Files:**
- Create: `src/lib/store/dashboard-store.ts`

**Step 1: Create the store**

Create `src/lib/store/dashboard-store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MMCAssessmentState, DashboardProject, ExecutiveSummary } from '@/types';
import { computeExecutiveSummary } from '@/lib/calculations/executive-summary';

interface DashboardStore {
  projects: DashboardProject[];

  // Actions
  addProject: (assessment: MMCAssessmentState) => { added: boolean; reason?: string };
  addProjects: (assessments: MMCAssessmentState[]) => { added: number; skipped: number; errors: string[] };
  removeProject: (id: string) => void;
  clearAll: () => void;
  getProject: (id: string) => DashboardProject | undefined;
}

function makeLabel(state: MMCAssessmentState): string {
  const trust = state.projectDetails.trustClientName || 'Unknown Trust';
  const pscp = state.projectDetails.pscpName;
  return pscp ? `${trust} - ${pscp}` : trust;
}

function isDuplicate(existing: DashboardProject[], assessment: MMCAssessmentState): boolean {
  const label = makeLabel(assessment);
  const typology = assessment.projectDetails.buildingTypology;
  const stage = assessment.projectDetails.businessCaseStage;
  return existing.some(
    p => makeLabel(p.assessment) === label &&
         p.assessment.projectDetails.buildingTypology === typology &&
         p.assessment.projectDetails.businessCaseStage === stage
  );
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (assessment) => {
        const existing = get().projects;
        if (isDuplicate(existing, assessment)) {
          return { added: false, reason: 'Duplicate project detected' };
        }
        const summary = computeExecutiveSummary(assessment);
        const project: DashboardProject = {
          id: uuidv4(),
          importedAt: new Date().toISOString(),
          label: makeLabel(assessment),
          assessment,
          summary,
        };
        set({ projects: [...existing, project] });
        return { added: true };
      },

      addProjects: (assessments) => {
        let added = 0;
        let skipped = 0;
        const errors: string[] = [];
        for (const assessment of assessments) {
          const result = get().addProject(assessment);
          if (result.added) {
            added++;
          } else {
            skipped++;
            if (result.reason) errors.push(result.reason);
          }
        }
        return { added, skipped, errors };
      },

      removeProject: (id) => {
        set({ projects: get().projects.filter(p => p.id !== id) });
      },

      clearAll: () => set({ projects: [] }),

      getProject: (id) => get().projects.find(p => p.id === id),
    }),
    {
      name: 'nhs-mmc-dashboard',
    }
  )
);
```

**Step 2: Commit**

```bash
git add src/lib/store/dashboard-store.ts
git commit -m "feat(dashboard): add dashboard Zustand store with persistence"
```

---

## Task 3: Portfolio Calculation Functions

**Files:**
- Create: `src/lib/calculations/portfolio.ts`
- Create: `src/lib/calculations/__tests__/portfolio.test.ts`

**Step 1: Write failing tests**

Create `src/lib/calculations/__tests__/portfolio.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  computePortfolioAverages,
  computeScoresByTypology,
  computeScoresByBusinessCase,
  computeCorrelation,
  computeBenefitDistributions,
  computeRSquared,
} from '../portfolio';
import type { DashboardProject } from '@/types';

// Minimal factory for test projects
function makeProject(overrides: {
  cat0?: number; pmv?: number; cat7?: number; overall?: number;
  typology?: string; stage?: string;
  benefits?: { faster: number; better: number; sustainable_legacy: number; economic: number };
}): DashboardProject {
  return {
    id: Math.random().toString(),
    importedAt: new Date().toISOString(),
    label: 'Test Project',
    assessment: {
      projectDetails: {
        trustClientName: 'Test',
        pscpName: 'PSCP',
        projectDescription: '',
        projectNarrative: '',
        buildingTypology: (overrides.typology as any) || 'acute',
        buildType: 'new_build',
        businessCaseStage: (overrides.stage as any) || 'obc',
        ribaStage: '3',
        refurbishmentPercentage: 0,
        gfaSqm: 1000,
        team: [],
        revisions: [],
        workshopAttendees: [],
      },
      benefitsScorecard: {
        items: overrides.benefits ? [
          { id: '1', category: 'faster', name: 'F', importance: 5, points: overrides.benefits.faster, description: '' },
          { id: '2', category: 'better', name: 'B', importance: 5, points: overrides.benefits.better, description: '' },
          { id: '3', category: 'sustainable_legacy', name: 'S', importance: 5, points: overrides.benefits.sustainable_legacy, description: '' },
          { id: '4', category: 'economic', name: 'E', importance: 5, points: overrides.benefits.economic, description: '' },
        ] : [],
        workshopAttendees: [],
      },
      constraintsScorecard: { items: [], workshopAttendees: [] },
      category0Assessment: { subcategories: [] },
      pmvCalculation: {
        carbonChecks: { structure: true, superstructure: true, externalWalls: true, internalFinishes: true, fittings: true, services: true },
        elements: [],
        supplierReturns: [],
      },
      category7Assessment: { items: [] },
    },
    summary: {
      category0Score: overrides.cat0 ?? 50,
      category0Weighted: (overrides.cat0 ?? 50) * 0.15,
      pmvScore: overrides.pmv ?? 60,
      category7Score: overrides.cat7 ?? 40,
      category7Weighted: (overrides.cat7 ?? 40) * 0.15,
      overallMMCPercentage: overrides.overall ?? 70,
      benchmarks: [],
      pmvDistribution: [],
    },
  };
}

describe('computePortfolioAverages', () => {
  it('returns zero for empty portfolio', () => {
    const result = computePortfolioAverages([]);
    expect(result.category0Avg).toBe(0);
    expect(result.count).toBe(0);
  });

  it('computes correct averages', () => {
    const projects = [
      makeProject({ cat0: 60, pmv: 70, cat7: 50, overall: 75 }),
      makeProject({ cat0: 80, pmv: 50, cat7: 30, overall: 65 }),
    ];
    const result = computePortfolioAverages(projects);
    expect(result.category0Avg).toBe(70);
    expect(result.pmvAvg).toBe(60);
    expect(result.category7Avg).toBe(40);
    expect(result.combinedAvg).toBe(70);
    expect(result.count).toBe(2);
  });
});

describe('computeScoresByTypology', () => {
  it('groups by typology', () => {
    const projects = [
      makeProject({ cat0: 60, typology: 'acute' }),
      makeProject({ cat0: 80, typology: 'acute' }),
      makeProject({ cat0: 50, typology: 'primary_care' }),
    ];
    const result = computeScoresByTypology(projects);
    const acute = result.find(r => r.typology === 'acute');
    expect(acute?.category0Avg).toBe(70);
    expect(acute?.count).toBe(2);
    const pc = result.find(r => r.typology === 'primary_care');
    expect(pc?.category0Avg).toBe(50);
    expect(pc?.count).toBe(1);
  });
});

describe('computeScoresByBusinessCase', () => {
  it('groups by business case stage', () => {
    const projects = [
      makeProject({ cat0: 60, stage: 'soc' }),
      makeProject({ cat0: 40, stage: 'fbc' }),
    ];
    const result = computeScoresByBusinessCase(projects);
    expect(result.find(r => r.stage === 'soc')?.category0Avg).toBe(60);
    expect(result.find(r => r.stage === 'fbc')?.category0Avg).toBe(40);
  });
});

describe('computeRSquared', () => {
  it('returns 1 for perfect correlation', () => {
    const points = [
      { projectLabel: 'A', x: 1, y: 2 },
      { projectLabel: 'B', x: 2, y: 4 },
      { projectLabel: 'C', x: 3, y: 6 },
    ];
    const result = computeRSquared(points);
    expect(result).toBeCloseTo(1, 5);
  });

  it('returns 0 for no data', () => {
    expect(computeRSquared([])).toBe(0);
  });
});

describe('computeBenefitDistributions', () => {
  it('computes point distributions', () => {
    const projects = [
      makeProject({ benefits: { faster: 20, better: 30, sustainable_legacy: 25, economic: 25 } }),
    ];
    const result = computeBenefitDistributions(projects);
    expect(result).toHaveLength(1);
    expect(result[0].faster).toBe(20);
    expect(result[0].better).toBe(30);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/calculations/__tests__/portfolio.test.ts`
Expected: FAIL - module not found

**Step 3: Implement portfolio calculations**

Create `src/lib/calculations/portfolio.ts`:

```typescript
import type {
  DashboardProject,
  TypologyScores,
  BusinessCaseScores,
  CorrelationPoint,
  CorrelationResult,
  BenefitCategoryDistribution,
  ElementUtilisation,
  BuildingTypology,
  BusinessCaseStage,
  BenefitCategory,
} from '@/types';

export function computePortfolioAverages(projects: DashboardProject[]): TypologyScores {
  if (projects.length === 0) {
    return { typology: 'all', category0Avg: 0, pmvAvg: 0, category7Avg: 0, combinedAvg: 0, count: 0 };
  }
  const n = projects.length;
  return {
    typology: 'all',
    category0Avg: projects.reduce((s, p) => s + p.summary.category0Score, 0) / n,
    pmvAvg: projects.reduce((s, p) => s + p.summary.pmvScore, 0) / n,
    category7Avg: projects.reduce((s, p) => s + p.summary.category7Score, 0) / n,
    combinedAvg: projects.reduce((s, p) => s + p.summary.overallMMCPercentage, 0) / n,
    count: n,
  };
}

export function computeScoresByTypology(projects: DashboardProject[]): TypologyScores[] {
  const groups = new Map<BuildingTypology, DashboardProject[]>();
  for (const p of projects) {
    const t = p.assessment.projectDetails.buildingTypology;
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(p);
  }
  return Array.from(groups.entries()).map(([typology, group]) => ({
    ...computePortfolioAverages(group),
    typology,
  }));
}

export function computeScoresByBusinessCase(projects: DashboardProject[]): BusinessCaseScores[] {
  const stageOrder: BusinessCaseStage[] = ['soc', 'obc', 'fbc', 'pc'];
  const groups = new Map<BusinessCaseStage, DashboardProject[]>();
  for (const p of projects) {
    const s = p.assessment.projectDetails.businessCaseStage;
    if (s === 'na') continue;
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s)!.push(p);
  }
  return stageOrder
    .filter(s => groups.has(s))
    .map(stage => {
      const group = groups.get(stage)!;
      const avg = computePortfolioAverages(group);
      return {
        stage,
        category0Avg: avg.category0Avg,
        pmvAvg: avg.pmvAvg,
        category7Avg: avg.category7Avg,
        combinedAvg: avg.combinedAvg,
        count: avg.count,
      };
    });
}

export function computeRSquared(points: CorrelationPoint[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return 0;

  const r = numerator / denominator;
  return r * r;
}

export function computeCorrelation(
  projects: DashboardProject[],
  xFn: (p: DashboardProject) => number,
  yFn: (p: DashboardProject) => number,
): CorrelationResult {
  const points: CorrelationPoint[] = projects.map(p => ({
    projectLabel: p.label,
    x: xFn(p),
    y: yFn(p),
  }));

  const rSquared = computeRSquared(points);

  // Compute slope and intercept for trendline
  const n = points.length;
  if (n < 2) return { points, rSquared: 0, slope: 0, intercept: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  return { points, rSquared, slope, intercept };
}

export function computeBenefitDistributions(projects: DashboardProject[]): BenefitCategoryDistribution[] {
  return projects.map(p => {
    const items = p.assessment.benefitsScorecard.items;
    const byCategory = (cat: BenefitCategory) =>
      items.filter(i => i.category === cat).reduce((s, i) => s + i.points, 0);

    return {
      projectLabel: p.label,
      faster: byCategory('faster'),
      better: byCategory('better'),
      sustainable_legacy: byCategory('sustainable_legacy'),
      economic: byCategory('economic'),
    };
  });
}

export function computeBenefitCategoryAveragesByTypology(
  projects: DashboardProject[],
): Map<string, { faster: number; better: number; sustainable_legacy: number; economic: number }> {
  const groups = new Map<string, DashboardProject[]>();
  for (const p of projects) {
    const t = p.assessment.projectDetails.buildingTypology;
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(p);
  }

  const result = new Map();
  for (const [typology, group] of groups) {
    const dists = computeBenefitDistributions(group);
    const n = dists.length;
    result.set(typology, {
      faster: dists.reduce((s, d) => s + d.faster, 0) / n,
      better: dists.reduce((s, d) => s + d.better, 0) / n,
      sustainable_legacy: dists.reduce((s, d) => s + d.sustainable_legacy, 0) / n,
      economic: dists.reduce((s, d) => s + d.economic, 0) / n,
    });
  }
  return result;
}

export function computeElementUtilisation(projects: DashboardProject[]): ElementUtilisation[] {
  const elementMap = new Map<string, { name: string; section: string; pmvPotentials: number[]; utilisations: number[] }>();

  for (const p of projects) {
    for (const el of p.assessment.pmvCalculation.elements) {
      if (!elementMap.has(el.name)) {
        elementMap.set(el.name, { name: el.name, section: el.section, pmvPotentials: [], utilisations: [] });
      }
      const entry = elementMap.get(el.name)!;
      entry.pmvPotentials.push(el.bcisPercentage);

      // Utilisation = whether the element has packages (active use)
      const hasPackages = el.packages.length > 0;
      entry.utilisations.push(hasPackages ? 1 : 0);
    }
  }

  return Array.from(elementMap.values()).map(entry => {
    const n = entry.pmvPotentials.length;
    const avgPotential = entry.pmvPotentials.reduce((s, v) => s + v, 0) / n;
    const avgUtil = entry.utilisations.reduce((s, v) => s + v, 0) / n * 100;
    return {
      elementName: entry.name,
      section: entry.section,
      avgPmvPotential: avgPotential,
      avgUtilisation: avgUtil,
      gap: avgPotential - avgUtil,
      projectCount: n,
    };
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/calculations/__tests__/portfolio.test.ts`
Expected: ALL PASS

**Step 5: Add export to barrel**

Add to `src/lib/calculations/index.ts`:

```typescript
export * from './portfolio';
```

**Step 6: Commit**

```bash
git add src/lib/calculations/portfolio.ts src/lib/calculations/__tests__/portfolio.test.ts src/lib/calculations/index.ts
git commit -m "feat(dashboard): add portfolio calculation functions with tests"
```

---

## Task 4: Dashboard Layout Components

**Files:**
- Create: `src/components/dashboard/DashboardSidebar.tsx`
- Create: `src/components/dashboard/DashboardLayoutShell.tsx`
- Create: `src/app/dashboard/layout.tsx`

**Step 1: Create DashboardSidebar**

Create `src/components/dashboard/DashboardSidebar.tsx`:

```typescript
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages } from '@/lib/calculations/portfolio';
import { RAGBadge } from '@/components/ui';
import { computeRAG } from '@/lib/calculations/executive-summary';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Import & Portfolio',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    path: '/dashboard/executive-summary',
    label: 'Executive Summary',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    path: '/dashboard/benefits',
    label: 'Benefits Analysis',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    path: '/dashboard/pmv',
    label: 'PMV Analysis',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
];

function MetricGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-blue-200">{label}</span>
        <span className="font-bold" style={{ color }}>{value.toFixed(1)}%</span>
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

function ragColor(pct: number): string {
  if (pct >= 70) return 'var(--rag-green, #007F3B)';
  if (pct >= 50) return 'var(--rag-amber, #FFB81C)';
  return 'var(--rag-red, #DA291C)';
}

export function DashboardSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const projects = useDashboardStore((s) => s.projects);
  const averages = computePortfolioAverages(projects);

  return (
    <aside className={`w-64 bg-sidebar-bg text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-[translate] duration-200 ease-in-out md:relative md:translate-x-0 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-blue-800 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-nhs-blue font-bold text-sm">NHS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Portfolio Dashboard</h1>
            <p className="text-[10px] text-blue-300">{projects.length} project{projects.length !== 1 ? 's' : ''} loaded</p>
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
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-white text-nhs-dark-blue' : 'bg-blue-800 text-blue-300'
                  }`}>
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
      {projects.length > 0 && (
        <div className="mx-3 my-4 p-4 bg-white/10 rounded-xl ring-1 ring-white/10 shrink-0">
          <MetricGauge label="Avg Category 0" value={averages.category0Avg} color={ragColor(averages.category0Avg)} />
          <MetricGauge label="Avg PMV" value={averages.pmvAvg} color={ragColor(averages.pmvAvg)} />
          <MetricGauge label="Avg Category 7" value={averages.category7Avg} color={ragColor(averages.category7Avg)} />
          <div className="mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-200">Avg Combined</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg" style={{ color: ragColor(averages.combinedAvg) }}>
                  {averages.combinedAvg.toFixed(1)}%
                </span>
                <RAGBadge status={computeRAG(averages.combinedAvg, 70)} size="sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Switch to Assessment Tool */}
      <div className="p-4 border-t border-blue-800 shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Assessment Tool
        </Link>
      </div>
    </aside>
  );
}
```

**Step 2: Create DashboardLayoutShell**

Create `src/components/dashboard/DashboardLayoutShell.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

export function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleClose = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center h-14 bg-sidebar-bg px-4 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1 -ml-1"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <span className="text-white text-sm font-bold">Portfolio Dashboard</span>
        </div>
        <div className="w-6" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={handleClose} />
        )}
        <DashboardSidebar isOpen={sidebarOpen} onClose={handleClose} />
        <main className="flex-1 overflow-y-auto bg-nhs-pale-grey">
          <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
```

Note: `max-w-6xl` instead of `max-w-5xl` - slightly wider for dashboard charts.

**Step 3: Create dashboard layout route**

Create `src/app/dashboard/layout.tsx`:

```typescript
import { DashboardLayoutShell } from '@/components/dashboard/DashboardLayoutShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
```

**Step 4: Update root layout to not wrap dashboard routes**

Modify `src/app/layout.tsx` - the dashboard has its own layout, so we need a route group approach. Actually, since Next.js App Router supports nested layouts that override parent layouts via route groups, the simplest approach is:

The dashboard layout at `src/app/dashboard/layout.tsx` will provide its own shell. But the root `layout.tsx` currently wraps ALL pages in `<LayoutShell>`. We need to restructure so dashboard pages use `DashboardLayoutShell` instead.

**Move existing assessment pages into a route group:**

This requires restructuring:
1. Create `src/app/(assessment)/` route group
2. Move all assessment pages into it
3. Create `src/app/(assessment)/layout.tsx` with the `LayoutShell`
4. Update root `layout.tsx` to just provide html/body without `LayoutShell`

Files to move:
- `src/app/page.tsx` -> `src/app/(assessment)/page.tsx`
- `src/app/project-details/` -> `src/app/(assessment)/project-details/`
- `src/app/benefits/` -> `src/app/(assessment)/benefits/`
- `src/app/constraints/` -> `src/app/(assessment)/constraints/`
- `src/app/category-0/` -> `src/app/(assessment)/category-0/`
- `src/app/pmv/` -> `src/app/(assessment)/pmv/`
- `src/app/category-7/` -> `src/app/(assessment)/category-7/`
- `src/app/summary/` -> `src/app/(assessment)/summary/`

Create `src/app/(assessment)/layout.tsx`:

```typescript
import { LayoutShell } from '@/components/layout/LayoutShell';
import { InstallBanner } from '@/components/ui/InstallBanner';

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutShell>{children}</LayoutShell>
      <InstallBanner />
    </>
  );
}
```

Update `src/app/layout.tsx` to remove LayoutShell:

```typescript
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#003087',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  title: "NHS MMC Assessment Tool",
  description: "Modern Methods of Construction Assessment Tool for NHS Healthcare Projects",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MMC Tool',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add dashboard layout with sidebar and route groups"
```

---

## Task 5: Import & Portfolio Page

**Files:**
- Create: `src/components/dashboard/FileDropZone.tsx`
- Create: `src/components/dashboard/PortfolioTable.tsx`
- Create: `src/components/dashboard/MetricCards.tsx`
- Create: `src/app/dashboard/page.tsx`

**Step 1: Create FileDropZone**

Create `src/components/dashboard/FileDropZone.tsx`:

```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import { MMCAssessmentSchema } from '@/lib/validation/assessment-schema';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import type { MMCAssessmentState } from '@/types';

interface FileResult {
  name: string;
  success: boolean;
  error?: string;
}

export function FileDropZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addProject = useDashboardStore((s) => s.addProject);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setProcessing(true);
    const fileResults: FileResult[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.json') && !file.name.endsWith('.mmc.json')) {
        fileResults.push({ name: file.name, success: false, error: 'Not a JSON file' });
        continue;
      }

      try {
        const text = await file.text();
        const raw = JSON.parse(text);
        const result = MMCAssessmentSchema.safeParse(raw);

        if (!result.success) {
          fileResults.push({ name: file.name, success: false, error: 'Invalid MMC assessment format' });
          continue;
        }

        const addResult = addProject(result.data as MMCAssessmentState);
        if (addResult.added) {
          fileResults.push({ name: file.name, success: true });
        } else {
          fileResults.push({ name: file.name, success: false, error: addResult.reason || 'Could not add project' });
        }
      } catch {
        fileResults.push({ name: file.name, success: false, error: 'Failed to parse file' });
      }
    }

    setResults(fileResults);
    setProcessing(false);
    // Clear results after 5 seconds
    setTimeout(() => setResults([]), 5000);
  }, [addProject]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-nhs-blue bg-nhs-blue/5'
            : 'border-nhs-grey-3 hover:border-nhs-blue/50 hover:bg-nhs-pale-grey/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.mmc.json"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <svg className="w-12 h-12 mx-auto mb-4 text-nhs-grey-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-lg font-semibold text-nhs-black mb-1">
          {processing ? 'Processing...' : 'Drop MMC assessment files here'}
        </p>
        <p className="text-sm text-nhs-grey-2">
          or click to browse for .mmc.json files
        </p>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {r.success ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{r.name}</span>
              {r.error && <span className="text-xs">- {r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create MetricCards**

Create `src/components/dashboard/MetricCards.tsx`:

```typescript
'use client';

import { RAGBadge } from '@/components/ui';
import { computeRAG } from '@/lib/calculations/executive-summary';
import type { RAGStatus } from '@/types';

interface MetricCardProps {
  label: string;
  value: number;
  benchmark?: number;
  suffix?: string;
  size?: 'sm' | 'lg';
}

export function MetricCard({ label, value, benchmark = 70, suffix = '%', size = 'sm' }: MetricCardProps) {
  const rag: RAGStatus = computeRAG(value, benchmark);

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 p-4 shadow-sm">
      <p className="text-xs text-nhs-grey-2 font-medium uppercase tracking-wide">{label}</p>
      <div className="flex items-end justify-between mt-2">
        <span className={`font-bold text-nhs-black ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>
          {value.toFixed(1)}{suffix}
        </span>
        <RAGBadge status={rag} size="sm" />
      </div>
    </div>
  );
}

interface MetricCardsRowProps {
  category0: number;
  pmv: number;
  category7: number;
  combined: number;
  projectCount: number;
}

export function MetricCardsRow({ category0, pmv, category7, combined, projectCount }: MetricCardsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg border border-nhs-grey-4 p-4 shadow-sm">
        <p className="text-xs text-nhs-grey-2 font-medium uppercase tracking-wide">Projects</p>
        <span className="text-2xl font-bold text-nhs-black mt-2 block">{projectCount}</span>
      </div>
      <MetricCard label="Avg Category 0" value={category0} benchmark={70} />
      <MetricCard label="Avg PMV" value={pmv} benchmark={70} />
      <MetricCard label="Avg Category 7" value={category7} benchmark={65} />
      <MetricCard label="Avg Combined MMC" value={combined} benchmark={70} size="lg" />
    </div>
  );
}
```

**Step 3: Create PortfolioTable**

Create `src/components/dashboard/PortfolioTable.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { RAGBadge } from '@/components/ui';
import { computeRAG } from '@/lib/calculations/executive-summary';
import type { DashboardProject, BuildingTypology, BuildType, BusinessCaseStage } from '@/types';

const TYPOLOGY_LABELS: Record<BuildingTypology, string> = {
  acute: 'Acute',
  primary_care: 'Primary Care',
  specialist: 'Specialist',
  mental_health: 'Mental Health',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

const BUILD_TYPE_LABELS: Record<BuildType, string> = {
  new_build: 'New Build',
  refurbishment: 'Refurbishment',
  mixed: 'Mixed',
};

const STAGE_LABELS: Record<BusinessCaseStage, string> = {
  na: 'N/A',
  soc: 'SOC',
  obc: 'OBC',
  fbc: 'FBC',
  pc: 'PC',
};

type SortField = 'label' | 'typology' | 'buildType' | 'stage' | 'overall';
type SortDir = 'asc' | 'desc';

export function PortfolioTable() {
  const projects = useDashboardStore((s) => s.projects);
  const removeProject = useDashboardStore((s) => s.removeProject);
  const [sortField, setSortField] = useState<SortField>('label');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (projects.length === 0) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'label': return a.label.localeCompare(b.label) * dir;
      case 'typology': return a.assessment.projectDetails.buildingTypology.localeCompare(b.assessment.projectDetails.buildingTypology) * dir;
      case 'buildType': return a.assessment.projectDetails.buildType.localeCompare(b.assessment.projectDetails.buildType) * dir;
      case 'stage': return a.assessment.projectDetails.businessCaseStage.localeCompare(b.assessment.projectDetails.businessCaseStage) * dir;
      case 'overall': return (a.summary.overallMMCPercentage - b.summary.overallMMCPercentage) * dir;
      default: return 0;
    }
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide cursor-pointer hover:bg-white/10"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-[10px]">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-lg border border-nhs-grey-4 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-nhs-dark-blue">
              <SortHeader field="label">Project</SortHeader>
              <SortHeader field="typology">Typology</SortHeader>
              <SortHeader field="buildType">Build Type</SortHeader>
              <SortHeader field="stage">Stage</SortHeader>
              <SortHeader field="overall">Overall MMC</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">RAG</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((p, i) => (
              <tr key={p.id} className={`border-t border-nhs-grey-4 hover:bg-nhs-pale-grey/50 ${i % 2 === 0 ? '' : 'bg-nhs-pale-grey/30'}`}>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/project/${p.id}`} className="text-sm font-medium text-nhs-blue hover:underline">
                    {p.label}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-nhs-grey-1">
                  {TYPOLOGY_LABELS[p.assessment.projectDetails.buildingTypology]}
                </td>
                <td className="px-4 py-3 text-sm text-nhs-grey-1">
                  {BUILD_TYPE_LABELS[p.assessment.projectDetails.buildType]}
                </td>
                <td className="px-4 py-3 text-sm text-nhs-grey-1">
                  {STAGE_LABELS[p.assessment.projectDetails.businessCaseStage]}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-nhs-black">
                  {p.summary.overallMMCPercentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <RAGBadge status={computeRAG(p.summary.overallMMCPercentage, 70)} size="sm" />
                </td>
                <td className="px-4 py-3">
                  {confirmDelete === p.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => { removeProject(p.id); setConfirmDelete(null); }}
                        className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="text-xs text-nhs-grey-2 hover:underline">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(p.id)}
                      className="text-nhs-grey-3 hover:text-red-500 transition-colors"
                      aria-label="Delete project">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 4: Create Import page**

Create `src/app/dashboard/page.tsx`:

```typescript
'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { FileDropZone } from '@/components/dashboard/FileDropZone';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { MetricCardsRow } from '@/components/dashboard/MetricCards';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages } from '@/lib/calculations/portfolio';

export default function DashboardImportPage() {
  const projects = useDashboardStore((s) => s.projects);
  const averages = computePortfolioAverages(projects);

  return (
    <div className="space-y-6">
      <PageHeader
        step="Dashboard"
        title="Import & Portfolio"
        description="Import MMC assessment exports to build your portfolio for cross-project analysis."
      />

      <SectionCard title="Import Assessments" subtitle="Drag and drop .mmc.json files exported from the assessment tool">
        <FileDropZone />
      </SectionCard>

      {projects.length > 0 && (
        <>
          <MetricCardsRow
            category0={averages.category0Avg}
            pmv={averages.pmvAvg}
            category7={averages.category7Avg}
            combined={averages.combinedAvg}
            projectCount={averages.count}
          />

          <SectionCard title="Portfolio" subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} imported`}>
            <PortfolioTable />
          </SectionCard>
        </>
      )}
    </div>
  );
}
```

**Step 5: Verify build compiles**

Run: `npx next build`
Expected: Build succeeds with no errors

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add import page with drag-and-drop and portfolio table"
```

---

## Task 6: Executive Summary Page

**Files:**
- Create: `src/components/dashboard/charts/TypologyBarChart.tsx`
- Create: `src/components/dashboard/charts/BusinessCaseLineChart.tsx`
- Create: `src/components/dashboard/charts/CorrelationScatter.tsx`
- Create: `src/app/dashboard/executive-summary/page.tsx`

**Step 1: Create TypologyBarChart**

Create `src/components/dashboard/charts/TypologyBarChart.tsx`:

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TypologyScores, BuildingTypology } from '@/types';

const TYPOLOGY_LABELS: Record<string, string> = {
  acute: 'Acute',
  primary_care: 'Primary Care',
  specialist: 'Specialist',
  mental_health: 'Mental Health',
  infrastructure: 'Infrastructure',
  mixed: 'Mixed',
  new_build: 'New Build',
  refurbishment: 'Refurbishment',
  other: 'Other',
  all: 'All Projects',
};

const COLORS = {
  category0: '#005EB8',
  pmv: '#00A499',
  category7: '#41B6E6',
  combined: '#0072CE',
};

interface Props {
  data: TypologyScores[];
  title?: string;
}

export function TypologyBarChart({ data, title }: Props) {
  const chartData = data.map(d => ({
    name: TYPOLOGY_LABELS[d.typology] || d.typology,
    'Category 0': Number(d.category0Avg.toFixed(1)),
    'PMV': Number(d.pmvAvg.toFixed(1)),
    'Category 7': Number(d.category7Avg.toFixed(1)),
    'Combined': Number(d.combinedAvg.toFixed(1)),
    count: d.count,
  }));

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-nhs-black mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8DDE0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <ReferenceLine y={70} stroke="#007F3B" strokeDasharray="5 5" label={{ value: 'Target 70%', position: 'right', fontSize: 10 }} />
          <Bar dataKey="Category 0" fill={COLORS.category0} radius={[2, 2, 0, 0]} />
          <Bar dataKey="PMV" fill={COLORS.pmv} radius={[2, 2, 0, 0]} />
          <Bar dataKey="Category 7" fill={COLORS.category7} radius={[2, 2, 0, 0]} />
          <Bar dataKey="Combined" fill={COLORS.combined} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Create BusinessCaseLineChart**

Create `src/components/dashboard/charts/BusinessCaseLineChart.tsx`:

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BusinessCaseScores } from '@/types';

const STAGE_LABELS: Record<string, string> = {
  soc: 'SOC',
  obc: 'OBC',
  fbc: 'FBC',
  pc: 'PC',
};

const COLORS = {
  category0: '#005EB8',
  pmv: '#00A499',
  category7: '#41B6E6',
  combined: '#0072CE',
};

interface Props {
  data: BusinessCaseScores[];
}

export function BusinessCaseLineChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: STAGE_LABELS[d.stage] || d.stage,
    'Category 0': Number(d.category0Avg.toFixed(1)),
    'PMV': Number(d.pmvAvg.toFixed(1)),
    'Category 7': Number(d.category7Avg.toFixed(1)),
    'Combined': Number(d.combinedAvg.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8DDE0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={70} stroke="#007F3B" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="Category 0" stroke={COLORS.category0} strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="PMV" stroke={COLORS.pmv} strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="Category 7" stroke={COLORS.category7} strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="Combined" stroke={COLORS.combined} strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Create CorrelationScatter**

Create `src/components/dashboard/charts/CorrelationScatter.tsx`:

```typescript
'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line as RechartsLine } from 'recharts';
import type { CorrelationResult } from '@/types';

interface Props {
  data: CorrelationResult;
  xLabel: string;
  yLabel: string;
  color?: string;
}

export function CorrelationScatter({ data, xLabel, yLabel, color = '#005EB8' }: Props) {
  // Generate trendline points
  const xValues = data.points.map(p => p.x);
  const xMin = Math.min(...xValues, 0);
  const xMax = Math.max(...xValues, 100);
  const trendlineData = [
    { x: xMin, y: data.slope * xMin + data.intercept },
    { x: xMax, y: data.slope * xMax + data.intercept },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-nhs-grey-1">{xLabel} vs {yLabel}</span>
        <span className="text-xs font-mono bg-nhs-pale-grey px-2 py-1 rounded">
          R² = {data.rSquared.toFixed(4)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8DDE0" />
          <XAxis type="number" dataKey="x" name={xLabel} domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: xLabel, position: 'bottom', fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name={yLabel} domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: yLabel, angle: -90, position: 'left', fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data.points} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 4: Create Executive Summary page**

Create `src/app/dashboard/executive-summary/page.tsx`:

```typescript
'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { MetricCardsRow } from '@/components/dashboard/MetricCards';
import { TypologyBarChart } from '@/components/dashboard/charts/TypologyBarChart';
import { BusinessCaseLineChart } from '@/components/dashboard/charts/BusinessCaseLineChart';
import { CorrelationScatter } from '@/components/dashboard/charts/CorrelationScatter';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import {
  computePortfolioAverages,
  computeScoresByTypology,
  computeScoresByBusinessCase,
  computeCorrelation,
} from '@/lib/calculations/portfolio';
import Link from 'next/link';

export default function ExecutiveSummaryPage() {
  const projects = useDashboardStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader step="Dashboard" title="Executive Summary" description="Cross-project analysis of MMC scores." />
        <SectionCard title="No Data">
          <p className="text-nhs-grey-2">
            Import projects on the <Link href="/dashboard" className="text-nhs-blue hover:underline">Import page</Link> to view analysis.
          </p>
        </SectionCard>
      </div>
    );
  }

  const averages = computePortfolioAverages(projects);
  const byTypology = computeScoresByTypology(projects);
  const byStage = computeScoresByBusinessCase(projects);

  const cat0VsPmv = computeCorrelation(projects, p => p.summary.category0Score, p => p.summary.pmvScore);
  const cat0VsCat7 = computeCorrelation(projects, p => p.summary.category0Score, p => p.summary.category7Score);
  const cat0VsCombined = computeCorrelation(projects, p => p.summary.category0Score, p => p.summary.overallMMCPercentage);

  return (
    <div className="space-y-6">
      <PageHeader step="Dashboard" title="Executive Summary" description="Aggregate analysis across all imported projects, matching the ProCure23 analysis methodology." />

      <MetricCardsRow
        category0={averages.category0Avg}
        pmv={averages.pmvAvg}
        category7={averages.category7Avg}
        combined={averages.combinedAvg}
        projectCount={averages.count}
      />

      {byTypology.length > 1 && (
        <SectionCard title="Scores by Typology" subtitle="Category scores compared across building typologies">
          <TypologyBarChart data={byTypology} />
        </SectionCard>
      )}

      {byStage.length > 1 && (
        <SectionCard title="Scores by Business Case Stage" subtitle="How scores change from SOC through to FBC">
          <BusinessCaseLineChart data={byStage} />
        </SectionCard>
      )}

      {projects.length >= 3 && (
        <SectionCard title="Standardisation Correlation (R²)" subtitle="Impact of Category 0 (standardisation) on other scores">
          <div className="grid md:grid-cols-3 gap-6">
            <CorrelationScatter data={cat0VsPmv} xLabel="Category 0" yLabel="PMV" color="#00A499" />
            <CorrelationScatter data={cat0VsCat7} xLabel="Category 0" yLabel="Category 7" color="#41B6E6" />
            <CorrelationScatter data={cat0VsCombined} xLabel="Category 0" yLabel="Combined MMC" color="#0072CE" />
          </div>
          <div className="mt-4 p-4 bg-nhs-pale-grey rounded-lg">
            <p className="text-sm text-nhs-grey-1">
              <strong>Interpretation:</strong> R² values close to 0 indicate low correlation between standardisation and the dependent variable.
              Values above 0.3 suggest moderate correlation. The ProCure23 analysis found R² of 0.006 (PMV), 0.189 (Combined), suggesting
              standardisation has limited direct impact on PMV scores but some influence on combined outcomes.
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add executive summary page with typology, stage, and correlation charts"
```

---

## Task 7: Benefits Analysis Page

**Files:**
- Create: `src/components/dashboard/charts/BenefitsStackedChart.tsx`
- Create: `src/app/dashboard/benefits/page.tsx`

**Step 1: Create BenefitsStackedChart**

Create `src/components/dashboard/charts/BenefitsStackedChart.tsx`:

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BenefitCategoryDistribution } from '@/types';

const COLORS = {
  faster: '#41B6E6',
  better: '#005EB8',
  sustainable_legacy: '#00A499',
  economic: '#0072CE',
};

interface Props {
  data: BenefitCategoryDistribution[];
  stacked?: boolean;
}

export function BenefitsStackedChart({ data, stacked = true }: Props) {
  const chartData = data.map(d => ({
    name: d.projectLabel.length > 20 ? d.projectLabel.slice(0, 20) + '...' : d.projectLabel,
    Faster: d.faster,
    Better: d.better,
    'Sustainable Legacy': d.sustainable_legacy,
    Economic: d.economic,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(350, data.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8DDE0" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Faster" stackId={stacked ? 'a' : undefined} fill={COLORS.faster} />
        <Bar dataKey="Better" stackId={stacked ? 'a' : undefined} fill={COLORS.better} />
        <Bar dataKey="Sustainable Legacy" stackId={stacked ? 'a' : undefined} fill={COLORS.sustainable_legacy} />
        <Bar dataKey="Economic" stackId={stacked ? 'a' : undefined} fill={COLORS.economic} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create Benefits Analysis page**

Create `src/app/dashboard/benefits/page.tsx`:

```typescript
'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { TypologyBarChart } from '@/components/dashboard/charts/TypologyBarChart';
import { BenefitsStackedChart } from '@/components/dashboard/charts/BenefitsStackedChart';
import { CorrelationScatter } from '@/components/dashboard/charts/CorrelationScatter';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import {
  computeBenefitDistributions,
  computeBenefitCategoryAveragesByTypology,
  computeCorrelation,
} from '@/lib/calculations/portfolio';
import Link from 'next/link';
import type { BenefitCategory } from '@/types';

const CATEGORY_LABELS: Record<BenefitCategory, string> = {
  faster: 'Faster',
  better: 'Better',
  sustainable_legacy: 'Sustainable Legacy',
  economic: 'Economic',
};

export default function BenefitsAnalysisPage() {
  const projects = useDashboardStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader step="Dashboard" title="Benefits Analysis" description="Cross-project benefits scorecard analysis." />
        <SectionCard title="No Data">
          <p className="text-nhs-grey-2">
            Import projects on the <Link href="/dashboard" className="text-nhs-blue hover:underline">Import page</Link> to view analysis.
          </p>
        </SectionCard>
      </div>
    );
  }

  const distributions = computeBenefitDistributions(projects);
  const byTypology = computeBenefitCategoryAveragesByTypology(projects);

  // Compute average benefit points per category for all projects
  const avgDist = {
    faster: distributions.reduce((s, d) => s + d.faster, 0) / distributions.length,
    better: distributions.reduce((s, d) => s + d.better, 0) / distributions.length,
    sustainable_legacy: distributions.reduce((s, d) => s + d.sustainable_legacy, 0) / distributions.length,
    economic: distributions.reduce((s, d) => s + d.economic, 0) / distributions.length,
  };

  // Sort categories by average score
  const rankedCategories = (Object.entries(avgDist) as [BenefitCategory, number][])
    .sort(([, a], [, b]) => b - a);

  // Typology comparison chart data
  const typologyChartData = Array.from(byTypology.entries()).map(([typology, avgs]) => ({
    typology: typology as any,
    category0Avg: avgs.faster,
    pmvAvg: avgs.better,
    category7Avg: avgs.sustainable_legacy,
    combinedAvg: avgs.economic,
    count: projects.filter(p => p.assessment.projectDetails.buildingTypology === typology).length,
  }));

  // Benefits impact correlations
  const benefitsVsCat0 = computeCorrelation(
    projects,
    p => p.assessment.benefitsScorecard.items.reduce((s, i) => s + i.points, 0) / 4,
    p => p.summary.category0Score,
  );
  const benefitsVsPmv = computeCorrelation(
    projects,
    p => p.assessment.benefitsScorecard.items.reduce((s, i) => s + i.points, 0) / 4,
    p => p.summary.pmvScore,
  );
  const benefitsVsCombined = computeCorrelation(
    projects,
    p => p.assessment.benefitsScorecard.items.reduce((s, i) => s + i.points, 0) / 4,
    p => p.summary.overallMMCPercentage,
  );

  return (
    <div className="space-y-6">
      <PageHeader step="Dashboard" title="Benefits Analysis" description="Benefit scorecard distribution and correlation analysis across the portfolio." />

      {/* Category Rankings */}
      <SectionCard title="Benefit Category Rankings" subtitle="Average point allocation across all projects (100-point budget)">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {rankedCategories.map(([cat, avg], i) => (
            <div key={cat} className="bg-nhs-pale-grey rounded-lg p-4 text-center">
              <p className="text-xs text-nhs-grey-2 font-medium">#{i + 1}</p>
              <p className="text-sm font-semibold text-nhs-black mt-1">{CATEGORY_LABELS[cat]}</p>
              <p className="text-2xl font-bold text-nhs-blue mt-2">{avg.toFixed(1)}</p>
              <p className="text-xs text-nhs-grey-2">avg points</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Distribution per project */}
      <SectionCard title="Benefits Distribution" subtitle="100-point allocation across benefit categories per project">
        <BenefitsStackedChart data={distributions} stacked={true} />
      </SectionCard>

      {/* Benefits by typology */}
      {byTypology.size > 1 && (
        <SectionCard title="Benefits by Typology" subtitle="Average point allocation by building typology">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nhs-dark-blue text-white">
                  <th className="px-4 py-2 text-left">Typology</th>
                  <th className="px-4 py-2 text-right">Faster</th>
                  <th className="px-4 py-2 text-right">Better</th>
                  <th className="px-4 py-2 text-right">Sustainable Legacy</th>
                  <th className="px-4 py-2 text-right">Economic</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(byTypology.entries()).map(([typology, avgs]) => (
                  <tr key={typology} className="border-t border-nhs-grey-4">
                    <td className="px-4 py-2 font-medium capitalize">{typology.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-right">{avgs.faster.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right">{avgs.better.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right">{avgs.sustainable_legacy.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right">{avgs.economic.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Correlation */}
      {projects.length >= 3 && (
        <SectionCard title="Benefits Impact Correlation" subtitle="How does the benefits profile correlate with MMC scores?">
          <div className="grid md:grid-cols-3 gap-6">
            <CorrelationScatter data={benefitsVsCat0} xLabel="Benefits Avg" yLabel="Category 0" color="#005EB8" />
            <CorrelationScatter data={benefitsVsPmv} xLabel="Benefits Avg" yLabel="PMV" color="#00A499" />
            <CorrelationScatter data={benefitsVsCombined} xLabel="Benefits Avg" yLabel="Combined" color="#0072CE" />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add benefits analysis page with distribution and correlation charts"
```

---

## Task 8: PMV Analysis Page

**Files:**
- Create: `src/components/dashboard/charts/ElementBarChart.tsx`
- Create: `src/app/dashboard/pmv/page.tsx`

**Step 1: Create ElementBarChart**

Create `src/components/dashboard/charts/ElementBarChart.tsx`:

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ElementUtilisation } from '@/types';

const SECTION_COLORS: Record<string, string> = {
  structure: '#005EB8',
  architecture: '#00A499',
  building_services: '#41B6E6',
};

interface Props {
  data: ElementUtilisation[];
  maxItems?: number;
  dataKey?: 'avgPmvPotential' | 'avgUtilisation' | 'gap';
  label?: string;
}

export function ElementBarChart({ data, maxItems = 20, dataKey = 'avgPmvPotential', label = 'PMV Potential %' }: Props) {
  const sorted = [...data]
    .sort((a, b) => b[dataKey] - a[dataKey])
    .slice(0, maxItems);

  const chartData = sorted.map(d => ({
    name: d.elementName.length > 30 ? d.elementName.slice(0, 30) + '...' : d.elementName,
    value: Number(d[dataKey].toFixed(1)),
    section: d.section,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(400, sorted.length * 28)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 150, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D8DDE0" />
        <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: label, position: 'bottom', fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 2, 2, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={SECTION_COLORS[entry.section] || '#768692'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create PMV Analysis page**

Create `src/app/dashboard/pmv/page.tsx`:

```typescript
'use client';

import { PageHeader, SectionCard } from '@/components/ui';
import { MetricCard } from '@/components/dashboard/MetricCards';
import { ElementBarChart } from '@/components/dashboard/charts/ElementBarChart';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages, computeElementUtilisation } from '@/lib/calculations/portfolio';
import Link from 'next/link';

export default function PMVAnalysisPage() {
  const projects = useDashboardStore((s) => s.projects);

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader step="Dashboard" title="PMV Analysis" description="BCIS element and PMV analysis across the portfolio." />
        <SectionCard title="No Data">
          <p className="text-nhs-grey-2">
            Import projects on the <Link href="/dashboard" className="text-nhs-blue hover:underline">Import page</Link> to view analysis.
          </p>
        </SectionCard>
      </div>
    );
  }

  const averages = computePortfolioAverages(projects);
  const elements = computeElementUtilisation(projects);

  // Carbon compliance rate
  const carbonPassCount = projects.filter(p => {
    const c = p.assessment.pmvCalculation.carbonChecks;
    return c.structure && c.superstructure && c.externalWalls && c.internalFinishes && c.fittings && c.services;
  }).length;
  const carbonPassRate = (carbonPassCount / projects.length) * 100;

  // Low-utilised elements (high potential, low usage)
  const lowUtilised = elements
    .filter(e => e.avgPmvPotential > 50 && e.avgUtilisation < 20)
    .sort((a, b) => b.gap - a.gap);

  // High-cost elements (high utilisation)
  const highUtilised = elements
    .filter(e => e.avgUtilisation > 30)
    .sort((a, b) => b.avgPmvPotential - a.avgPmvPotential);

  // Section averages
  const sectionAvgs = ['structure', 'architecture', 'building_services'].map(section => {
    const sectionEls = elements.filter(e => e.section === section);
    const avg = sectionEls.length > 0
      ? sectionEls.reduce((s, e) => s + e.avgPmvPotential, 0) / sectionEls.length
      : 0;
    return { section, avg };
  });

  return (
    <div className="space-y-6">
      <PageHeader step="Dashboard" title="PMV Analysis" description="Pre-Manufactured Value analysis across BCIS elements and project portfolio." />

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Avg PMV" value={averages.pmvAvg} benchmark={70} />
        <MetricCard label="Carbon Compliance" value={carbonPassRate} benchmark={100} suffix="%" />
        {sectionAvgs.map(s => (
          <MetricCard key={s.section} label={`${s.section.replace('_', ' ')} Avg`} value={s.avg} benchmark={60} />
        ))}
      </div>

      {/* BCIS Element Trends */}
      <SectionCard title="BCIS Element PMV Potential" subtitle="Average PMV potential by element across all projects, colour-coded by section">
        <div className="flex gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#005EB8]"></span> Structure</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#00A499]"></span> Architecture</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#41B6E6]"></span> Building Services</span>
        </div>
        <ElementBarChart data={elements} maxItems={25} dataKey="avgPmvPotential" label="Avg PMV Potential %" />
      </SectionCard>

      {/* Low-utilised elements */}
      {lowUtilised.length > 0 && (
        <SectionCard title="Low-Utilised Elements" subtitle="High PMV potential but low utilisation across projects - opportunities for improvement">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nhs-dark-blue text-white">
                  <th className="px-4 py-2 text-left">Element</th>
                  <th className="px-4 py-2 text-left">Section</th>
                  <th className="px-4 py-2 text-right">PMV Potential %</th>
                  <th className="px-4 py-2 text-right">Utilisation %</th>
                  <th className="px-4 py-2 text-right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {lowUtilised.slice(0, 15).map((e, i) => (
                  <tr key={e.elementName} className={`border-t border-nhs-grey-4 ${i % 2 ? 'bg-nhs-pale-grey/30' : ''}`}>
                    <td className="px-4 py-2 font-medium">{e.elementName}</td>
                    <td className="px-4 py-2 capitalize">{e.section.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-right">{e.avgPmvPotential.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right">{e.avgUtilisation.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-rag-red">{e.gap.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* High-cost elements */}
      {highUtilised.length > 0 && (
        <SectionCard title="High-Utilisation Elements" subtitle="Elements with highest usage across projects - key PMV contributors">
          <ElementBarChart data={highUtilised} maxItems={15} dataKey="avgUtilisation" label="Utilisation %" />
        </SectionCard>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add PMV analysis page with element trends and utilisation tables"
```

---

## Task 9: Project Deep-Dive Page

**Files:**
- Create: `src/app/dashboard/project/[id]/page.tsx`

**Step 1: Create the page**

Create `src/app/dashboard/project/[id]/page.tsx`:

```typescript
'use client';

import { use } from 'react';
import Link from 'next/link';
import { PageHeader, SectionCard, RAGBadge } from '@/components/ui';
import { MetricCard } from '@/components/dashboard/MetricCards';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { computePortfolioAverages } from '@/lib/calculations/portfolio';
import { computeRAG } from '@/lib/calculations/executive-summary';
import { computeElementPMV } from '@/lib/calculations/pmv';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import type { BenefitCategory } from '@/types';

const TYPOLOGY_LABELS: Record<string, string> = {
  acute: 'Acute', primary_care: 'Primary Care', specialist: 'Specialist',
  mental_health: 'Mental Health', infrastructure: 'Infrastructure', other: 'Other',
};
const BUILD_TYPE_LABELS: Record<string, string> = {
  new_build: 'New Build', refurbishment: 'Refurbishment', mixed: 'Mixed',
};
const STAGE_LABELS: Record<string, string> = {
  na: 'N/A', soc: 'SOC', obc: 'OBC', fbc: 'FBC', pc: 'PC',
};
const CATEGORY_LABELS: Record<BenefitCategory, string> = {
  faster: 'Faster', better: 'Better', sustainable_legacy: 'Sustainable Legacy', economic: 'Economic',
};

const SECTION_COLORS = ['#005EB8', '#00A499', '#41B6E6'];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projects = useDashboardStore((s) => s.projects);
  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader step="Dashboard" title="Project Not Found" description="" />
        <SectionCard title="Error">
          <p className="text-nhs-grey-2">
            Project not found. <Link href="/dashboard" className="text-nhs-blue hover:underline">Return to portfolio</Link>.
          </p>
        </SectionCard>
      </div>
    );
  }

  const averages = computePortfolioAverages(projects);
  const pd = project.assessment.projectDetails;
  const s = project.summary;

  // Benefits data for radar
  const benefitPoints = (['faster', 'better', 'sustainable_legacy', 'economic'] as BenefitCategory[]).map(cat => {
    const items = project.assessment.benefitsScorecard.items.filter(i => i.category === cat);
    const total = items.reduce((sum, i) => sum + i.points, 0);
    const avgItems = projects.flatMap(p => p.assessment.benefitsScorecard.items.filter(i => i.category === cat));
    const portfolioAvg = avgItems.length > 0 ? avgItems.reduce((s, i) => s + i.points, 0) / projects.length : 0;
    return {
      category: CATEGORY_LABELS[cat],
      project: total,
      portfolio: Number(portfolioAvg.toFixed(1)),
    };
  });

  // PMV section pie data
  const sectionPie = s.pmvDistribution.map((d, i) => ({
    name: d.section.replace('_', ' '),
    value: Number(d.totalPmv.toFixed(1)),
    color: SECTION_COLORS[i],
  })).filter(d => d.value > 0);

  // Category 0 pass/fail
  const cat0Items = project.assessment.category0Assessment.subcategories.flatMap(sc => sc.items);
  const cat0Passed = cat0Items.filter(i => i.type === 'yes_no' ? i.value : i.percentage > 0).length;

  // Category 7 adopted
  const cat7Items = project.assessment.category7Assessment.items;
  const cat7Adopted = cat7Items.filter(i => i.adopted).length;

  // PMV elements with packages
  const activeElements = project.assessment.pmvCalculation.elements
    .filter(el => el.packages.length > 0)
    .map(el => ({ ...el, pmv: computeElementPMV(el) }))
    .sort((a, b) => b.pmv - a.pmv);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-nhs-grey-2">
        <Link href="/dashboard" className="hover:text-nhs-blue">Portfolio</Link>
        <span>/</span>
        <span className="text-nhs-black font-medium">{project.label}</span>
      </div>

      <PageHeader step="" title={project.label} description={pd.projectDescription} />

      {/* Project info badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 bg-nhs-blue/10 text-nhs-blue text-xs font-semibold rounded-full">
          {TYPOLOGY_LABELS[pd.buildingTypology] || pd.buildingTypology}
        </span>
        <span className="px-3 py-1 bg-nhs-blue/10 text-nhs-blue text-xs font-semibold rounded-full">
          {BUILD_TYPE_LABELS[pd.buildType]}
        </span>
        <span className="px-3 py-1 bg-nhs-blue/10 text-nhs-blue text-xs font-semibold rounded-full">
          {STAGE_LABELS[pd.businessCaseStage]}
        </span>
        <span className="px-3 py-1 bg-nhs-blue/10 text-nhs-blue text-xs font-semibold rounded-full">
          RIBA {pd.ribaStage}
        </span>
        {pd.gfaSqm > 0 && (
          <span className="px-3 py-1 bg-nhs-pale-grey text-nhs-grey-1 text-xs font-semibold rounded-full">
            {pd.gfaSqm.toLocaleString()} sqm GFA
          </span>
        )}
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Category 0" value={s.category0Score} benchmark={70} />
        <MetricCard label="PMV" value={s.pmvScore} benchmark={70} />
        <MetricCard label="Category 7" value={s.category7Score} benchmark={65} />
        <MetricCard label="Overall MMC" value={s.overallMMCPercentage} benchmark={70} size="lg" />
      </div>

      {/* vs Portfolio comparison */}
      <SectionCard title="Portfolio Comparison" subtitle="This project compared to the portfolio average">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Category 0', proj: s.category0Score, avg: averages.category0Avg },
            { label: 'PMV', proj: s.pmvScore, avg: averages.pmvAvg },
            { label: 'Category 7', proj: s.category7Score, avg: averages.category7Avg },
            { label: 'Combined', proj: s.overallMMCPercentage, avg: averages.combinedAvg },
          ].map(item => {
            const diff = item.proj - item.avg;
            return (
              <div key={item.label} className="bg-nhs-pale-grey rounded-lg p-3 text-center">
                <p className="text-xs text-nhs-grey-2">{item.label}</p>
                <p className="text-lg font-bold text-nhs-black">{item.proj.toFixed(1)}%</p>
                <p className={`text-xs font-semibold ${diff >= 0 ? 'text-rag-green' : 'text-rag-red'}`}>
                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% vs avg
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Benefits Radar */}
      {benefitPoints.some(b => b.project > 0) && (
        <SectionCard title="Benefits Profile" subtitle="Point allocation compared to portfolio average">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={benefitPoints}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 50]} tick={{ fontSize: 10 }} />
              <Radar name="This Project" dataKey="project" stroke="#005EB8" fill="#005EB8" fillOpacity={0.3} />
              <Radar name="Portfolio Avg" dataKey="portfolio" stroke="#00A499" fill="#00A499" fillOpacity={0.1} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* PMV Section Distribution */}
      {sectionPie.length > 0 && (
        <SectionCard title="PMV Distribution by Section">
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={sectionPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {sectionPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {sectionPie.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: s.color }}></span>
                  <span className="text-sm capitalize">{s.name}: {s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Active PMV Elements */}
      {activeElements.length > 0 && (
        <SectionCard title="PMV Elements" subtitle="Elements with packages and their PMV contribution">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nhs-dark-blue text-white">
                  <th className="px-4 py-2 text-left">Element</th>
                  <th className="px-4 py-2 text-left">Section</th>
                  <th className="px-4 py-2 text-right">BCIS %</th>
                  <th className="px-4 py-2 text-right">Element PMV %</th>
                  <th className="px-4 py-2 text-right">Packages</th>
                </tr>
              </thead>
              <tbody>
                {activeElements.map((el, i) => (
                  <tr key={el.id} className={`border-t border-nhs-grey-4 ${i % 2 ? 'bg-nhs-pale-grey/30' : ''}`}>
                    <td className="px-4 py-2 font-medium">{el.name}</td>
                    <td className="px-4 py-2 capitalize">{el.section.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-right">{el.bcisPercentage.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{el.pmv.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right">{el.packages.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Category 0 Summary */}
      <SectionCard title="Category 0 Summary" subtitle={`${cat0Passed} of ${cat0Items.length} items passed`}>
        <div className="w-full bg-nhs-grey-4 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${cat0Items.length > 0 ? (cat0Passed / cat0Items.length) * 100 : 0}%`,
              backgroundColor: s.category0Score >= 70 ? 'var(--rag-green)' : s.category0Score >= 50 ? 'var(--rag-amber)' : 'var(--rag-red)',
            }}
          />
        </div>
      </SectionCard>

      {/* Category 7 Summary */}
      <SectionCard title="Category 7 Innovations" subtitle={`${cat7Adopted} of ${cat7Items.length} innovations adopted`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {cat7Items.map(item => (
            <div key={item.id} className={`px-3 py-2 rounded text-xs ${item.adopted ? 'bg-green-50 text-green-800' : 'bg-nhs-pale-grey text-nhs-grey-2'}`}>
              {item.adopted ? '\u2713' : '\u2717'} {item.name}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add project deep-dive page with comparison and detail views"
```

---

## Task 10: Wire Up Existing Sidebar + Final Integration

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/ui/PageHeader.tsx`

**Step 1: Add Dashboard link to assessment sidebar**

In `src/components/layout/Sidebar.tsx`, add a "Dashboard" link in the nav section, after the Home link and before the step divider. Add this block:

```typescript
// After the Home link and before the divider
<Link
  href="/dashboard"
  onClick={onClose}
  className={`flex items-center gap-3 px-3 py-2.5 mx-2 mb-2 rounded-lg text-sm transition-colors ${
    pathname.startsWith('/dashboard')
      ? 'bg-white/15 text-white font-semibold'
      : 'text-blue-200 hover:bg-white/10 hover:text-white'
  }`}
>
  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
    pathname.startsWith('/dashboard') ? 'bg-white text-nhs-dark-blue' : 'bg-blue-800 text-blue-300'
  }`}>
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  </span>
  Dashboard
</Link>
```

**Step 2: Make PageHeader flexible for dashboard use**

Check if `PageHeader` already supports a string `step` prop. Looking at the existing component, it likely expects a number. Update it to accept `string | number`:

In `src/components/ui/PageHeader.tsx`, ensure the `step` prop accepts both string and number types so "Dashboard" can be passed as the step label.

**Step 3: Run build**

Run: `npx next build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add dashboard link to assessment sidebar and finalize integration"
```

---

## Task 11: Manual Verification & Polish

**Step 1: Start dev server and test the full flow**

Run: `npm run dev`

Test sequence:
1. Visit `/` - verify Dashboard link appears in sidebar
2. Click Dashboard - verify `/dashboard` loads with drop zone
3. Export a test assessment from the assessment tool (fill in some data, click Save)
4. Drop the `.mmc.json` file onto the dashboard import zone
5. Verify project appears in portfolio table
6. Click Executive Summary - verify charts render
7. Click Benefits - verify distribution charts
8. Click PMV - verify element analysis
9. Click a project row - verify deep-dive page

**Step 2: Fix any issues discovered**

Address any TypeScript errors, missing imports, or layout issues.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix(dashboard): polish and bug fixes from integration testing"
```

---

## Summary of Files Created/Modified

**New files (16):**
- `src/types/dashboard.ts`
- `src/lib/store/dashboard-store.ts`
- `src/lib/calculations/portfolio.ts`
- `src/lib/calculations/__tests__/portfolio.test.ts`
- `src/components/dashboard/DashboardSidebar.tsx`
- `src/components/dashboard/DashboardLayoutShell.tsx`
- `src/components/dashboard/FileDropZone.tsx`
- `src/components/dashboard/MetricCards.tsx`
- `src/components/dashboard/PortfolioTable.tsx`
- `src/components/dashboard/charts/TypologyBarChart.tsx`
- `src/components/dashboard/charts/BusinessCaseLineChart.tsx`
- `src/components/dashboard/charts/CorrelationScatter.tsx`
- `src/components/dashboard/charts/BenefitsStackedChart.tsx`
- `src/components/dashboard/charts/ElementBarChart.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/executive-summary/page.tsx`
- `src/app/dashboard/benefits/page.tsx`
- `src/app/dashboard/pmv/page.tsx`
- `src/app/dashboard/project/[id]/page.tsx`
- `src/app/(assessment)/layout.tsx`

**Modified files (4):**
- `src/types/index.ts` (add dashboard export)
- `src/lib/calculations/index.ts` (add portfolio export)
- `src/app/layout.tsx` (remove LayoutShell, push to route group)
- `src/components/layout/Sidebar.tsx` (add Dashboard link)

**Moved files (8):**
- All assessment pages from `src/app/` to `src/app/(assessment)/`
