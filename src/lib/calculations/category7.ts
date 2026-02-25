import { Category7Assessment } from '@/types';

export function computeCategory7Score(assessment: Category7Assessment): { score: number; maxScore: number; percentage: number } {
  const totalItems = assessment.items.length;
  const adoptedCount = assessment.items.filter(i => i.adopted).length;
  return {
    score: adoptedCount,
    maxScore: totalItems,
    percentage: totalItems > 0 ? (adoptedCount / totalItems) * 100 : 0,
  };
}
