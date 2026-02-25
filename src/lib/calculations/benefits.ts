import { BenefitItem, BenefitCategory } from '@/types';

export function computeBenefitCategoryAverage(items: BenefitItem[], category: BenefitCategory): number {
  const categoryItems = items.filter(i => i.category === category);
  if (categoryItems.length === 0) return 0;
  return categoryItems.reduce((sum, i) => sum + i.importance, 0) / categoryItems.length;
}

export function computeTotalPointsUsed(items: BenefitItem[]): number {
  return items.reduce((sum, i) => sum + i.points, 0);
}

export function computePointsBudget(items: BenefitItem[]): { used: number; remaining: number; valid: boolean } {
  const used = computeTotalPointsUsed(items);
  return { used, remaining: 100 - used, valid: used <= 100 };
}

export function computeAllCategoryAverages(items: BenefitItem[]): Record<BenefitCategory, number> {
  return {
    faster: computeBenefitCategoryAverage(items, 'faster'),
    better: computeBenefitCategoryAverage(items, 'better'),
    sustainable_legacy: computeBenefitCategoryAverage(items, 'sustainable_legacy'),
    economic: computeBenefitCategoryAverage(items, 'economic'),
  };
}
