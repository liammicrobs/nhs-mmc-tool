import { z } from 'zod';

const TeamMemberSchema = z.object({
  id: z.string(),
  role: z.string(),
  name: z.string(),
  organisation: z.string(),
  primaryContact: z.string(),
});

const RevisionSchema = z.object({
  version: z.number(),
  date: z.string(),
  description: z.string(),
});

const ProjectDetailsSchema = z.object({
  trustClientName: z.string(),
  pscpName: z.string(),
  projectDescription: z.string(),
  projectNarrative: z.string(),
  buildingTypology: z.enum(['acute', 'primary_care', 'specialist', 'mental_health', 'infrastructure', 'other']),
  buildType: z.enum(['new_build', 'refurbishment', 'mixed']),
  businessCaseStage: z.enum(['na', 'soc', 'obc', 'fbc', 'pc']),
  ribaStage: z.enum(['0', '1', '2', '3', '4', '5', '6']),
  refurbishmentPercentage: z.number().min(0).max(100),
  gfaSqm: z.number().min(0),
  team: z.array(TeamMemberSchema),
  revisions: z.array(RevisionSchema),
  workshopAttendees: z.array(z.string()),
});

const BenefitItemSchema = z.object({
  id: z.string(),
  category: z.enum(['faster', 'better', 'sustainable_legacy', 'economic']),
  name: z.string(),
  importance: z.number().min(1).max(10),
  points: z.number().min(0).max(100),
  description: z.string(),
});

const BenefitsScorecardSchema = z.object({
  items: z.array(BenefitItemSchema),
  workshopAttendees: z.array(z.string()),
});

const ConstraintItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().min(1).max(10),
  description: z.string(),
});

const ConstraintsScorecardSchema = z.object({
  items: z.array(ConstraintItemSchema),
  workshopAttendees: z.array(z.string()),
});

const PercentageThresholdSchema = z.object({
  minPercent: z.number(),
  score: z.number(),
});

const Category0ItemSchema = z.object({
  id: z.string(),
  subcategoryId: z.string(),
  name: z.string(),
  type: z.enum(['yes_no', 'percentage_threshold']),
  value: z.boolean(),
  percentage: z.number(),
  thresholds: z.array(PercentageThresholdSchema),
  maxScore: z.number(),
  description: z.string(),
  isCustom: z.boolean(),
});

const Category0SubcategorySchema = z.object({
  id: z.string(),
  number: z.number(),
  name: z.string(),
  items: z.array(Category0ItemSchema),
});

const Category0AssessmentSchema = z.object({
  subcategories: z.array(Category0SubcategorySchema),
});

const PMVPackageSchema = z.object({
  id: z.string(),
  description: z.string(),
  totalValue: z.number(),
  prelimsPercent: z.number(),
  labourPercent: z.number(),
});

const PMVElementSchema = z.object({
  id: z.string(),
  number: z.string(),
  name: z.string(),
  section: z.enum(['structure', 'architecture', 'building_services']),
  sectionGroup: z.string(),
  bcisPercentage: z.number(),
  mmcCategories: z.array(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)])),
  description: z.string(),
  packages: z.array(PMVPackageSchema),
  isCustom: z.boolean(),
});

const SupplierReturnSchema = z.object({
  elementId: z.string(),
  packageId: z.string(),
  supplierValue: z.number(),
  supplierPrelimsPercent: z.number(),
  supplierLabourPercent: z.number(),
  notes: z.string(),
});

const CarbonChecksSchema = z.object({
  structure: z.boolean(),
  superstructure: z.boolean(),
  externalWalls: z.boolean(),
  internalFinishes: z.boolean(),
  fittings: z.boolean(),
  services: z.boolean(),
});

const PMVCalculationSchema = z.object({
  carbonChecks: CarbonChecksSchema,
  elements: z.array(PMVElementSchema),
  supplierReturns: z.array(SupplierReturnSchema),
});

const Category7ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  adopted: z.boolean(),
  description: z.string(),
  isCustom: z.boolean(),
});

const Category7AssessmentSchema = z.object({
  items: z.array(Category7ItemSchema),
});

export const MMCAssessmentSchema = z.object({
  projectDetails: ProjectDetailsSchema,
  benefitsScorecard: BenefitsScorecardSchema,
  constraintsScorecard: ConstraintsScorecardSchema,
  category0Assessment: Category0AssessmentSchema,
  pmvCalculation: PMVCalculationSchema,
  category7Assessment: Category7AssessmentSchema,
});
