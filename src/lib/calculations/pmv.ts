import { PMVCalculation, PMVElement, PMVPackage, PMVSection, SectionPMV } from '@/types';

export function computePackagePMV(pkg: PMVPackage): number {
  return Math.max(0, (1 - pkg.prelimsPercent / 100 - pkg.labourPercent / 100)) * 100;
}

export function computeElementPMV(element: PMVElement): number {
  if (element.packages.length === 0) return 0;
  const totalValue = element.packages.reduce((sum, p) => sum + p.totalValue, 0);
  if (totalValue === 0) return 0;
  const weightedPmv = element.packages.reduce(
    (sum, p) => sum + (computePackagePMV(p) / 100) * p.totalValue, 0
  );
  return (weightedPmv / totalValue) * 100;
}

export function computeElementProjectContribution(element: PMVElement): number {
  return (computeElementPMV(element) / 100) * (element.bcisPercentage / 100);
}

export function allCarbonChecksPass(calc: PMVCalculation): boolean {
  const c = calc.carbonChecks;
  return c.structure && c.superstructure && c.externalWalls && c.internalFinishes && c.fittings && c.services;
}

export function computeTotalPMV(calc: PMVCalculation): number {
  if (!allCarbonChecksPass(calc)) return 0;
  return calc.elements.reduce((sum, el) => sum + computeElementProjectContribution(el), 0) * 100;
}

export function computeSectionPMV(calc: PMVCalculation): SectionPMV[] {
  if (!allCarbonChecksPass(calc)) {
    return [
      { section: 'structure', averagePmv: 0, totalPmv: 0, proportion: 0 },
      { section: 'architecture', averagePmv: 0, totalPmv: 0, proportion: 0 },
      { section: 'building_services', averagePmv: 0, totalPmv: 0, proportion: 0 },
    ];
  }

  const sections: PMVSection[] = ['structure', 'architecture', 'building_services'];
  const totalProjectPmv = computeTotalPMV(calc);

  return sections.map(section => {
    const sectionElements = calc.elements.filter(el => el.section === section);
    const activeSectionElements = sectionElements.filter(el => el.packages.length > 0);

    const avgPmv = activeSectionElements.length > 0
      ? activeSectionElements.reduce((sum, el) => sum + computeElementPMV(el), 0) / activeSectionElements.length
      : 0;

    const sectionTotal = sectionElements.reduce((sum, el) => sum + computeElementProjectContribution(el), 0) * 100;

    return {
      section,
      averagePmv: avgPmv,
      totalPmv: sectionTotal,
      proportion: totalProjectPmv > 0 ? sectionTotal / totalProjectPmv : 0,
    };
  });
}
