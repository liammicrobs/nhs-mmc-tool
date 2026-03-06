import { MMCAssessmentState, ExecutiveSummary, RAGStatus, BuildingTypology, BuildType, BusinessCaseStage } from './index';

export interface DashboardProject {
  id: string;
  importedAt: string;
  label: string;
  assessment: MMCAssessmentState;
  summary: ExecutiveSummary;
}

export interface DashboardPortfolio {
  projects: DashboardProject[];
}

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
