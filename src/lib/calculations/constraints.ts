import { ConstraintItem, RAGStatus } from '@/types';

export function computeConstraintAverage(items: ConstraintItem[]): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, i) => sum + i.score, 0) / items.length;
}

export function getConstraintSeverity(score: number): RAGStatus {
  if (score <= 3) return 'green';
  if (score <= 7) return 'amber';
  return 'red';
}

export function computeConstraintSeverityCounts(items: ConstraintItem[]): Record<RAGStatus, number> {
  return items.reduce((acc, item) => {
    const severity = getConstraintSeverity(item.score);
    acc[severity]++;
    return acc;
  }, { green: 0, amber: 0, red: 0 } as Record<RAGStatus, number>);
}
