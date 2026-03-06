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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function averageScores(
  projects: DashboardProject[],
  typology: BuildingTypology | 'all',
): TypologyScores {
  const n = projects.length;
  if (n === 0) {
    return { typology, category0Avg: 0, pmvAvg: 0, category7Avg: 0, combinedAvg: 0, count: 0 };
  }

  const cat0Sum = projects.reduce((s, p) => s + p.summary.category0Score, 0);
  const pmvSum = projects.reduce((s, p) => s + p.summary.pmvScore, 0);
  const cat7Sum = projects.reduce((s, p) => s + p.summary.category7Score, 0);
  const combinedSum = projects.reduce((s, p) => s + p.summary.overallMMCPercentage, 0);

  return {
    typology,
    category0Avg: cat0Sum / n,
    pmvAvg: pmvSum / n,
    category7Avg: cat7Sum / n,
    combinedAvg: combinedSum / n,
    count: n,
  };
}

// ---------------------------------------------------------------------------
// 1. Portfolio-wide averages
// ---------------------------------------------------------------------------

export function computePortfolioAverages(projects: DashboardProject[]): TypologyScores {
  return averageScores(projects, 'all');
}

// ---------------------------------------------------------------------------
// 2. Scores grouped by building typology
// ---------------------------------------------------------------------------

export function computeScoresByTypology(projects: DashboardProject[]): TypologyScores[] {
  const groups = new Map<BuildingTypology, DashboardProject[]>();

  for (const p of projects) {
    const typ = p.assessment.projectDetails.buildingTypology;
    if (!groups.has(typ)) groups.set(typ, []);
    groups.get(typ)!.push(p);
  }

  return Array.from(groups.entries()).map(([typ, group]) => averageScores(group, typ));
}

// ---------------------------------------------------------------------------
// 3. Scores grouped by business case stage (skipping 'na')
// ---------------------------------------------------------------------------

const STAGE_ORDER: BusinessCaseStage[] = ['soc', 'obc', 'fbc', 'pc'];

export function computeScoresByBusinessCase(projects: DashboardProject[]): BusinessCaseScores[] {
  const groups = new Map<BusinessCaseStage, DashboardProject[]>();

  for (const p of projects) {
    const stage = p.assessment.projectDetails.businessCaseStage;
    if (stage === 'na') continue;
    if (!groups.has(stage)) groups.set(stage, []);
    groups.get(stage)!.push(p);
  }

  return STAGE_ORDER
    .filter((stage) => groups.has(stage))
    .map((stage) => {
      const group = groups.get(stage)!;
      const n = group.length;
      return {
        stage,
        category0Avg: group.reduce((s, p) => s + p.summary.category0Score, 0) / n,
        pmvAvg: group.reduce((s, p) => s + p.summary.pmvScore, 0) / n,
        category7Avg: group.reduce((s, p) => s + p.summary.category7Score, 0) / n,
        combinedAvg: group.reduce((s, p) => s + p.summary.overallMMCPercentage, 0) / n,
        count: n,
      };
    });
}

// ---------------------------------------------------------------------------
// 4. Compute R-squared from correlation points (Pearson's R^2)
// ---------------------------------------------------------------------------

export function computeRSquared(points: CorrelationPoint[]): number {
  const n = points.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) return 0;

  const r = (n * sumXY - sumX * sumY) / denominator;
  return r * r;
}

// ---------------------------------------------------------------------------
// 5. Full correlation with trendline (slope + intercept)
// ---------------------------------------------------------------------------

export function computeCorrelation(
  projects: DashboardProject[],
  xFn: (p: DashboardProject) => number,
  yFn: (p: DashboardProject) => number,
): CorrelationResult {
  const points: CorrelationPoint[] = projects.map((p) => ({
    projectLabel: p.label,
    x: xFn(p),
    y: yFn(p),
  }));

  const rSquared = computeRSquared(points);

  // Least-squares linear regression: y = slope * x + intercept
  const n = points.length;
  if (n < 2) {
    return { points, rSquared, slope: 0, intercept: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = denom === 0 ? 0 : (sumY - slope * sumX) / n;

  return { points, rSquared, slope, intercept };
}

// ---------------------------------------------------------------------------
// 6. Benefit point distributions per project
// ---------------------------------------------------------------------------

const BENEFIT_CATEGORIES: BenefitCategory[] = ['faster', 'better', 'sustainable_legacy', 'economic'];

export function computeBenefitDistributions(
  projects: DashboardProject[],
): BenefitCategoryDistribution[] {
  return projects.map((p) => {
    const items = p.assessment.benefitsScorecard.items;
    const dist: BenefitCategoryDistribution = {
      projectLabel: p.label,
      faster: 0,
      better: 0,
      sustainable_legacy: 0,
      economic: 0,
    };

    for (const item of items) {
      if (BENEFIT_CATEGORIES.includes(item.category)) {
        dist[item.category] += item.points;
      }
    }

    return dist;
  });
}

// ---------------------------------------------------------------------------
// 7. Benefit averages grouped by typology
// ---------------------------------------------------------------------------

export function computeBenefitCategoryAveragesByTypology(
  projects: DashboardProject[],
): Map<string, { faster: number; better: number; sustainable_legacy: number; economic: number }> {
  const dists = computeBenefitDistributions(projects);

  // Group distributions by typology
  const groups = new Map<string, BenefitCategoryDistribution[]>();
  for (let i = 0; i < projects.length; i++) {
    const typ = projects[i].assessment.projectDetails.buildingTypology;
    if (!groups.has(typ)) groups.set(typ, []);
    groups.get(typ)!.push(dists[i]);
  }

  const result = new Map<
    string,
    { faster: number; better: number; sustainable_legacy: number; economic: number }
  >();

  for (const [typ, group] of groups) {
    const n = group.length;
    result.set(typ, {
      faster: group.reduce((s, d) => s + d.faster, 0) / n,
      better: group.reduce((s, d) => s + d.better, 0) / n,
      sustainable_legacy: group.reduce((s, d) => s + d.sustainable_legacy, 0) / n,
      economic: group.reduce((s, d) => s + d.economic, 0) / n,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// 8. PMV element utilisation across portfolio
// ---------------------------------------------------------------------------

export function computeElementUtilisation(
  projects: DashboardProject[],
): ElementUtilisation[] {
  if (projects.length === 0) return [];

  // Collect all element data keyed by element name
  const elementMap = new Map<
    string,
    {
      section: string;
      bcisValues: number[];
      hasPackagesCount: number;
      totalAppearances: number;
    }
  >();

  for (const project of projects) {
    const elements = project.assessment.pmvCalculation.elements;
    for (const el of elements) {
      if (!elementMap.has(el.name)) {
        elementMap.set(el.name, {
          section: el.section,
          bcisValues: [],
          hasPackagesCount: 0,
          totalAppearances: 0,
        });
      }
      const entry = elementMap.get(el.name)!;
      entry.bcisValues.push(el.bcisPercentage);
      entry.totalAppearances += 1;
      if (el.packages.length > 0) {
        entry.hasPackagesCount += 1;
      }
    }
  }

  return Array.from(elementMap.entries()).map(([name, data]) => {
    const avgPmvPotential =
      data.bcisValues.reduce((s, v) => s + v, 0) / data.bcisValues.length;
    const avgUtilisation =
      (data.hasPackagesCount / data.totalAppearances) * 100;
    return {
      elementName: name,
      section: data.section,
      avgPmvPotential,
      avgUtilisation,
      gap: 100 - avgUtilisation,
      projectCount: data.totalAppearances,
    };
  });
}
