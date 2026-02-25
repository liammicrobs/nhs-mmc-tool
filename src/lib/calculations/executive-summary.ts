import { RAGStatus, BenchmarkResult, ExecutiveSummary, MMCAssessmentState } from '@/types';
import { computeCategory0Total } from './category0';
import { computeTotalPMV, computeSectionPMV } from './pmv';
import { computeCategory7Score } from './category7';

export function computeRAG(score: number, benchmark: number): RAGStatus {
  if (score >= benchmark) return 'green';
  if (score >= benchmark * 0.85) return 'amber';
  return 'red';
}

export function computeOverallMMC(cat0Pct: number, pmvPct: number, cat7Pct: number): number {
  return (cat0Pct * 0.15) + pmvPct + (cat7Pct * 0.15);
}

const DEFAULT_BENCHMARKS = {
  category0: 70,
  pmv: 70,
  category7: 65,
  overall: 70,
};

export function computeExecutiveSummary(state: MMCAssessmentState): ExecutiveSummary {
  const cat0 = computeCategory0Total(state.category0Assessment);
  const pmvScore = computeTotalPMV(state.pmvCalculation);
  const cat7 = computeCategory7Score(state.category7Assessment);

  const cat0Weighted = cat0.percentage * 0.15;
  const cat7Weighted = cat7.percentage * 0.15;
  const overall = computeOverallMMC(cat0.percentage, pmvScore, cat7.percentage);

  const benchmarks: BenchmarkResult[] = [
    { metric: 'Category 0', score: cat0.percentage, benchmark: DEFAULT_BENCHMARKS.category0, rag: computeRAG(cat0.percentage, DEFAULT_BENCHMARKS.category0), gap: cat0.percentage - DEFAULT_BENCHMARKS.category0 },
    { metric: 'PMV', score: pmvScore, benchmark: DEFAULT_BENCHMARKS.pmv, rag: computeRAG(pmvScore, DEFAULT_BENCHMARKS.pmv), gap: pmvScore - DEFAULT_BENCHMARKS.pmv },
    { metric: 'Category 7', score: cat7.percentage, benchmark: DEFAULT_BENCHMARKS.category7, rag: computeRAG(cat7.percentage, DEFAULT_BENCHMARKS.category7), gap: cat7.percentage - DEFAULT_BENCHMARKS.category7 },
    { metric: 'Overall MMC', score: overall, benchmark: DEFAULT_BENCHMARKS.overall, rag: computeRAG(overall, DEFAULT_BENCHMARKS.overall), gap: overall - DEFAULT_BENCHMARKS.overall },
  ];

  return {
    category0Score: cat0.percentage,
    category0Weighted: cat0Weighted,
    pmvScore,
    category7Score: cat7.percentage,
    category7Weighted: cat7Weighted,
    overallMMCPercentage: overall,
    benchmarks,
    pmvDistribution: computeSectionPMV(state.pmvCalculation),
  };
}
