// Building Typology options
export type BuildingTypology = 'acute' | 'primary_care' | 'specialist' | 'mental_health' | 'infrastructure' | 'other';
export type BuildType = 'new_build' | 'refurbishment' | 'mixed';
export type BusinessCaseStage = 'na' | 'soc' | 'obc' | 'fbc' | 'pc';
export type RIBAStage = '0' | '1' | '2' | '3' | '4' | '5' | '6';
export type RAGStatus = 'red' | 'amber' | 'green';
export type BenefitCategory = 'faster' | 'better' | 'sustainable_legacy' | 'economic';
export type MMCCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type PMVSection = 'structure' | 'architecture' | 'building_services';

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  organisation: string;
  primaryContact: string;
}

export interface Revision {
  version: number;
  date: string;
  description: string;
}

export interface ProjectDetails {
  trustClientName: string;
  pscpName: string;
  projectDescription: string;
  projectNarrative: string;
  buildingTypology: BuildingTypology;
  buildType: BuildType;
  businessCaseStage: BusinessCaseStage;
  ribaStage: RIBAStage;
  refurbishmentPercentage: number;
  gfaSqm: number;
  team: TeamMember[];
  revisions: Revision[];
  workshopAttendees: string[];
}

export interface BenefitItem {
  id: string;
  category: BenefitCategory;
  name: string;
  importance: number;       // 1-10
  points: number;           // from 100-point distribution
  description: string;
}

export interface BenefitsScorecard {
  items: BenefitItem[];
  workshopAttendees: string[];
}

export interface ConstraintItem {
  id: string;
  name: string;
  score: number;            // 1-10 (unconstrained to constrained)
  description: string;
}

export interface ConstraintsScorecard {
  items: ConstraintItem[];
  workshopAttendees: string[];
}

export interface PercentageThreshold {
  minPercent: number;
  score: number;
}

export interface Category0Item {
  id: string;
  subcategoryId: string;
  name: string;
  type: 'yes_no' | 'percentage_threshold';
  value: boolean;
  percentage: number;
  thresholds: PercentageThreshold[];
  maxScore: number;
  description: string;
  isCustom: boolean;
}

export interface Category0Subcategory {
  id: string;
  number: number;
  name: string;
  items: Category0Item[];
}

export interface Category0Assessment {
  subcategories: Category0Subcategory[];
}

export interface PMVPackage {
  id: string;
  description: string;
  totalValue: number;
  prelimsPercent: number;
  labourPercent: number;
}

export interface PMVElement {
  id: string;
  number: string;
  name: string;
  section: PMVSection;
  sectionGroup: string;
  bcisPercentage: number;
  mmcCategories: MMCCategory[];
  description: string;
  packages: PMVPackage[];
  isCustom: boolean;
}

export interface SupplierReturn {
  elementId: string;
  packageId: string;
  supplierValue: number;
  supplierPrelimsPercent: number;
  supplierLabourPercent: number;
  notes: string;
}

export interface PMVCalculation {
  carbonChecks: {
    structure: boolean;
    superstructure: boolean;
    externalWalls: boolean;
    internalFinishes: boolean;
    fittings: boolean;
    services: boolean;
  };
  elements: PMVElement[];
  supplierReturns: SupplierReturn[];
}

export interface Category7Item {
  id: string;
  name: string;
  adopted: boolean;
  description: string;
  isCustom: boolean;
}

export interface Category7Assessment {
  items: Category7Item[];
}

export interface BenchmarkResult {
  metric: string;
  score: number;
  benchmark: number;
  rag: RAGStatus;
  gap: number;
}

export interface SectionPMV {
  section: PMVSection;
  averagePmv: number;
  totalPmv: number;
  proportion: number;
}

export interface ExecutiveSummary {
  category0Score: number;
  category0Weighted: number;
  pmvScore: number;
  category7Score: number;
  category7Weighted: number;
  overallMMCPercentage: number;
  benchmarks: BenchmarkResult[];
  pmvDistribution: SectionPMV[];
}

export interface MMCAssessmentState {
  projectDetails: ProjectDetails;
  benefitsScorecard: BenefitsScorecard;
  constraintsScorecard: ConstraintsScorecard;
  category0Assessment: Category0Assessment;
  pmvCalculation: PMVCalculation;
  category7Assessment: Category7Assessment;
}
