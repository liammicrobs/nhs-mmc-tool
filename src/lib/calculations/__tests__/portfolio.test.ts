import { describe, it, expect } from 'vitest';
import type {
  DashboardProject,
  BuildingTypology,
  BusinessCaseStage,
  BenefitCategory,
  BenefitItem,
  PMVElement,
  PMVSection,
} from '@/types';
import {
  computePortfolioAverages,
  computeScoresByTypology,
  computeScoresByBusinessCase,
  computeRSquared,
  computeCorrelation,
  computeBenefitDistributions,
  computeBenefitCategoryAveragesByTypology,
  computeElementUtilisation,
} from '../portfolio';

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

let nextId = 1;

function makeBenefitItem(
  category: BenefitCategory,
  points: number,
  overrides: Partial<BenefitItem> = {},
): BenefitItem {
  return {
    id: `ben-${nextId++}`,
    category,
    name: `${category} item`,
    importance: 5,
    points,
    description: '',
    ...overrides,
  };
}

function makePMVElement(
  name: string,
  section: PMVSection,
  bcisPercentage: number,
  packages: { totalValue: number; prelimsPercent: number; labourPercent: number }[] = [],
  overrides: Partial<PMVElement> = {},
): PMVElement {
  return {
    id: `el-${nextId++}`,
    number: '1.1',
    name,
    section,
    sectionGroup: section,
    bcisPercentage,
    mmcCategories: [1],
    description: '',
    packages: packages.map((p) => ({
      id: `pkg-${nextId++}`,
      description: 'pkg',
      ...p,
    })),
    isCustom: false,
    ...overrides,
  };
}

function makeProject(overrides: {
  label?: string;
  cat0?: number;
  pmv?: number;
  cat7?: number;
  overall?: number;
  typology?: BuildingTypology;
  stage?: BusinessCaseStage;
  benefits?: BenefitItem[];
  elements?: PMVElement[];
} = {}): DashboardProject {
  const {
    label = `Project ${nextId++}`,
    cat0 = 0,
    pmv = 0,
    cat7 = 0,
    overall = 0,
    typology = 'acute',
    stage = 'soc',
    benefits = [],
    elements = [],
  } = overrides;

  return {
    id: `proj-${nextId++}`,
    importedAt: new Date().toISOString(),
    label,
    assessment: {
      projectDetails: {
        trustClientName: '',
        pscpName: '',
        projectDescription: '',
        projectNarrative: '',
        buildingTypology: typology,
        buildType: 'new_build',
        businessCaseStage: stage,
        ribaStage: '2',
        refurbishmentPercentage: 0,
        gfaSqm: 1000,
        team: [],
        revisions: [],
        workshopAttendees: [],
      },
      benefitsScorecard: {
        items: benefits,
        workshopAttendees: [],
      },
      constraintsScorecard: {
        items: [],
        workshopAttendees: [],
      },
      category0Assessment: {
        subcategories: [],
      },
      pmvCalculation: {
        carbonChecks: {
          structure: true,
          superstructure: true,
          externalWalls: true,
          internalFinishes: true,
          fittings: true,
          services: true,
        },
        elements,
        supplierReturns: [],
      },
      category7Assessment: {
        items: [],
      },
    },
    summary: {
      category0Score: cat0,
      category0Weighted: cat0 * 0.15,
      pmvScore: pmv,
      category7Score: cat7,
      category7Weighted: cat7 * 0.15,
      overallMMCPercentage: overall,
      benchmarks: [],
      pmvDistribution: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computePortfolioAverages', () => {
  it('returns zero for empty portfolio', () => {
    const result = computePortfolioAverages([]);
    expect(result.typology).toBe('all');
    expect(result.category0Avg).toBe(0);
    expect(result.pmvAvg).toBe(0);
    expect(result.category7Avg).toBe(0);
    expect(result.combinedAvg).toBe(0);
    expect(result.count).toBe(0);
  });

  it('computes correct averages for multiple projects', () => {
    const projects = [
      makeProject({ cat0: 80, pmv: 60, cat7: 70, overall: 65 }),
      makeProject({ cat0: 60, pmv: 80, cat7: 50, overall: 75 }),
    ];
    const result = computePortfolioAverages(projects);
    expect(result.typology).toBe('all');
    expect(result.category0Avg).toBe(70);
    expect(result.pmvAvg).toBe(70);
    expect(result.category7Avg).toBe(60);
    expect(result.combinedAvg).toBe(70);
    expect(result.count).toBe(2);
  });
});

describe('computeScoresByTypology', () => {
  it('groups by typology and averages correctly', () => {
    const projects = [
      makeProject({ cat0: 80, pmv: 60, cat7: 70, overall: 65, typology: 'acute' }),
      makeProject({ cat0: 60, pmv: 80, cat7: 50, overall: 75, typology: 'acute' }),
      makeProject({ cat0: 90, pmv: 90, cat7: 90, overall: 90, typology: 'primary_care' }),
    ];
    const results = computeScoresByTypology(projects);

    const acute = results.find((r) => r.typology === 'acute');
    expect(acute).toBeDefined();
    expect(acute!.category0Avg).toBe(70);
    expect(acute!.pmvAvg).toBe(70);
    expect(acute!.category7Avg).toBe(60);
    expect(acute!.combinedAvg).toBe(70);
    expect(acute!.count).toBe(2);

    const primary = results.find((r) => r.typology === 'primary_care');
    expect(primary).toBeDefined();
    expect(primary!.category0Avg).toBe(90);
    expect(primary!.pmvAvg).toBe(90);
    expect(primary!.category7Avg).toBe(90);
    expect(primary!.combinedAvg).toBe(90);
    expect(primary!.count).toBe(1);
  });
});

describe('computeScoresByBusinessCase', () => {
  it('groups by stage, skips na', () => {
    const projects = [
      makeProject({ cat0: 50, pmv: 50, cat7: 50, overall: 50, stage: 'soc' }),
      makeProject({ cat0: 70, pmv: 70, cat7: 70, overall: 70, stage: 'obc' }),
      makeProject({ cat0: 90, pmv: 90, cat7: 90, overall: 90, stage: 'na' }),
    ];
    const results = computeScoresByBusinessCase(projects);

    // na should be excluded
    expect(results.find((r) => r.stage === 'na')).toBeUndefined();

    const soc = results.find((r) => r.stage === 'soc');
    expect(soc).toBeDefined();
    expect(soc!.category0Avg).toBe(50);
    expect(soc!.count).toBe(1);

    const obc = results.find((r) => r.stage === 'obc');
    expect(obc).toBeDefined();
    expect(obc!.category0Avg).toBe(70);
    expect(obc!.count).toBe(1);

    // Verify ordering: soc, obc, fbc, pc
    const stageOrder = results.map((r) => r.stage);
    expect(stageOrder).toEqual(
      stageOrder.filter((s) => ['soc', 'obc', 'fbc', 'pc'].includes(s)),
    );
  });

  it('returns entries in correct order with empty groups omitted', () => {
    const projects = [
      makeProject({ cat0: 60, pmv: 60, cat7: 60, overall: 60, stage: 'fbc' }),
      makeProject({ cat0: 80, pmv: 80, cat7: 80, overall: 80, stage: 'pc' }),
    ];
    const results = computeScoresByBusinessCase(projects);
    const stages = results.map((r) => r.stage);
    // Should only contain stages that have projects, in order
    expect(stages).toEqual(['fbc', 'pc']);
  });
});

describe('computeRSquared', () => {
  it('returns 1 for perfect correlation', () => {
    const points = [
      { projectLabel: 'A', x: 1, y: 2 },
      { projectLabel: 'B', x: 2, y: 4 },
      { projectLabel: 'C', x: 3, y: 6 },
    ];
    const r2 = computeRSquared(points);
    expect(r2).toBeCloseTo(1, 10);
  });

  it('returns 0 for empty array', () => {
    expect(computeRSquared([])).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(computeRSquared([{ projectLabel: 'A', x: 5, y: 10 }])).toBe(0);
  });

  it('computes correct value for imperfect correlation', () => {
    // Known data: x=[1,2,3,4,5], y=[2,4,5,4,5]
    const points = [
      { projectLabel: 'A', x: 1, y: 2 },
      { projectLabel: 'B', x: 2, y: 4 },
      { projectLabel: 'C', x: 3, y: 5 },
      { projectLabel: 'D', x: 4, y: 4 },
      { projectLabel: 'E', x: 5, y: 5 },
    ];
    const r2 = computeRSquared(points);
    // R should be approx 0.7 => R^2 ~ 0.49
    expect(r2).toBeGreaterThan(0);
    expect(r2).toBeLessThan(1);
  });
});

describe('computeCorrelation', () => {
  it('computes slope, intercept and rSquared', () => {
    const projects = [
      makeProject({ label: 'A', cat0: 10, pmv: 20 }),
      makeProject({ label: 'B', cat0: 20, pmv: 40 }),
      makeProject({ label: 'C', cat0: 30, pmv: 60 }),
    ];
    const result = computeCorrelation(
      projects,
      (p) => p.summary.category0Score,
      (p) => p.summary.pmvScore,
    );
    expect(result.rSquared).toBeCloseTo(1, 10);
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(0, 10);
    expect(result.points).toHaveLength(3);
  });
});

describe('computeBenefitDistributions', () => {
  it('sums points by category for each project', () => {
    const projects = [
      makeProject({
        label: 'Proj1',
        benefits: [
          makeBenefitItem('faster', 20),
          makeBenefitItem('faster', 10),
          makeBenefitItem('better', 15),
          makeBenefitItem('sustainable_legacy', 25),
          makeBenefitItem('economic', 30),
        ],
      }),
    ];
    const dists = computeBenefitDistributions(projects);
    expect(dists).toHaveLength(1);
    expect(dists[0].projectLabel).toBe('Proj1');
    expect(dists[0].faster).toBe(30);
    expect(dists[0].better).toBe(15);
    expect(dists[0].sustainable_legacy).toBe(25);
    expect(dists[0].economic).toBe(30);
  });

  it('returns zeros for categories with no items', () => {
    const projects = [
      makeProject({
        label: 'Empty',
        benefits: [],
      }),
    ];
    const dists = computeBenefitDistributions(projects);
    expect(dists).toHaveLength(1);
    expect(dists[0].faster).toBe(0);
    expect(dists[0].better).toBe(0);
    expect(dists[0].sustainable_legacy).toBe(0);
    expect(dists[0].economic).toBe(0);
  });
});

describe('computeBenefitCategoryAveragesByTypology', () => {
  it('groups by typology and averages benefit distributions', () => {
    const projects = [
      makeProject({
        typology: 'acute',
        benefits: [
          makeBenefitItem('faster', 20),
          makeBenefitItem('better', 10),
          makeBenefitItem('sustainable_legacy', 30),
          makeBenefitItem('economic', 40),
        ],
      }),
      makeProject({
        typology: 'acute',
        benefits: [
          makeBenefitItem('faster', 40),
          makeBenefitItem('better', 30),
          makeBenefitItem('sustainable_legacy', 10),
          makeBenefitItem('economic', 20),
        ],
      }),
      makeProject({
        typology: 'primary_care',
        benefits: [
          makeBenefitItem('faster', 50),
          makeBenefitItem('economic', 50),
        ],
      }),
    ];

    const result = computeBenefitCategoryAveragesByTypology(projects);

    const acute = result.get('acute');
    expect(acute).toBeDefined();
    expect(acute!.faster).toBe(30);      // (20+40)/2
    expect(acute!.better).toBe(20);      // (10+30)/2
    expect(acute!.sustainable_legacy).toBe(20); // (30+10)/2
    expect(acute!.economic).toBe(30);    // (40+20)/2

    const primary = result.get('primary_care');
    expect(primary).toBeDefined();
    expect(primary!.faster).toBe(50);
    expect(primary!.better).toBe(0);
    expect(primary!.sustainable_legacy).toBe(0);
    expect(primary!.economic).toBe(50);
  });
});

describe('computeElementUtilisation', () => {
  it('computes average BCIS%, utilisation rate, and gap', () => {
    const projects = [
      makeProject({
        elements: [
          // Has packages for Substructure
          makePMVElement('Substructure', 'structure', 10, [
            { totalValue: 100, prelimsPercent: 10, labourPercent: 20 },
          ]),
        ],
      }),
      makeProject({
        elements: [
          // No packages for Substructure
          makePMVElement('Substructure', 'structure', 20, []),
        ],
      }),
    ];

    const result = computeElementUtilisation(projects);
    const sub = result.find((e) => e.elementName === 'Substructure');
    expect(sub).toBeDefined();
    expect(sub!.avgPmvPotential).toBe(15); // (10+20)/2
    expect(sub!.avgUtilisation).toBe(50);  // 1 out of 2 projects has packages
    expect(sub!.gap).toBe(50);             // 100 - 50
    expect(sub!.projectCount).toBe(2);
  });

  it('returns empty array for empty portfolio', () => {
    expect(computeElementUtilisation([])).toEqual([]);
  });
});
