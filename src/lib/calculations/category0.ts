import { Category0Assessment, Category0Item, Category0Subcategory } from '@/types';

export function computeCategory0ItemScore(item: Category0Item): number {
  if (item.type === 'yes_no') {
    return item.value ? 1 : 0;
  }
  // percentage_threshold: must have value=true (Yes) AND a percentage
  if (!item.value) return 0;
  const pct = item.percentage;
  let score = 0;
  for (const threshold of item.thresholds) {
    if (pct >= threshold.minPercent) {
      score = threshold.score;
    }
  }
  return score;
}

export function computeSubcategoryScore(subcat: Category0Subcategory): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;
  for (const item of subcat.items) {
    score += computeCategory0ItemScore(item);
    maxScore += item.maxScore;
  }
  return { score, maxScore };
}

export function computeCategory0Total(assessment: Category0Assessment): { score: number; maxScore: number; percentage: number } {
  let totalScore = 0;
  let totalMaxScore = 0;
  for (const subcat of assessment.subcategories) {
    const { score, maxScore } = computeSubcategoryScore(subcat);
    totalScore += score;
    totalMaxScore += maxScore;
  }
  return {
    score: totalScore,
    maxScore: totalMaxScore,
    percentage: totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0,
  };
}
