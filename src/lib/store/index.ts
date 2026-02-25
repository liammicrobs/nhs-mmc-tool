import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MMCAssessmentState,
  ProjectDetails,
  BenefitItem,
  ConstraintItem,
  Category0Item,
  PMVElement,
  PMVPackage,
  Category7Item,
  SupplierReturn,
  TeamMember,
  PMVCalculation,
} from '@/types';
import { createDefaultBenefitItems } from '@/lib/data/benefits-seed';
import { createDefaultConstraintItems } from '@/lib/data/constraints-seed';
import { initCategory0 } from '@/lib/data/category0-seed';
import { createDefaultPMVElements } from '@/lib/data/pmv-elements-seed';
import { createDefaultCategory7Items } from '@/lib/data/category7-seed';

const defaultProjectDetails: ProjectDetails = {
  trustClientName: '',
  pscpName: '',
  projectDescription: '',
  projectNarrative: '',
  buildingTypology: 'acute',
  buildType: 'new_build',
  businessCaseStage: 'na',
  ribaStage: '1',
  refurbishmentPercentage: 0,
  gfaSqm: 0,
  team: [],
  revisions: [],
  workshopAttendees: [],
};

const createDefaultState = (): MMCAssessmentState => ({
  projectDetails: defaultProjectDetails,
  benefitsScorecard: {
    items: createDefaultBenefitItems(),
    workshopAttendees: [],
  },
  constraintsScorecard: {
    items: createDefaultConstraintItems(),
    workshopAttendees: [],
  },
  category0Assessment: {
    subcategories: initCategory0(),
  },
  pmvCalculation: {
    carbonChecks: {
      structure: false,
      superstructure: false,
      externalWalls: false,
      internalFinishes: false,
      fittings: false,
      services: false,
    },
    elements: createDefaultPMVElements(),
    supplierReturns: [],
  },
  category7Assessment: {
    items: createDefaultCategory7Items(),
  },
});

interface MMCStore extends MMCAssessmentState {
  // Project details actions
  updateProjectDetails: (details: Partial<ProjectDetails>) => void;
  addTeamMember: (member: TeamMember) => void;
  removeTeamMember: (id: string) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;

  // Benefits actions
  updateBenefitItem: (id: string, updates: Partial<BenefitItem>) => void;
  setBenefitsAttendees: (attendees: string[]) => void;

  // Constraints actions
  updateConstraintItem: (id: string, updates: Partial<ConstraintItem>) => void;
  setConstraintsAttendees: (attendees: string[]) => void;

  // Category 0 actions
  updateCategory0Item: (subcategoryId: string, itemId: string, updates: Partial<Category0Item>) => void;

  // PMV actions
  updateCarbonCheck: (key: keyof PMVCalculation['carbonChecks'], value: boolean) => void;
  updatePMVElement: (id: string, updates: Partial<PMVElement>) => void;
  addPackageToElement: (elementId: string, pkg: PMVPackage) => void;
  updatePackage: (elementId: string, packageId: string, updates: Partial<PMVPackage>) => void;
  removePackage: (elementId: string, packageId: string) => void;
  addSupplierReturn: (sr: SupplierReturn) => void;
  updateSupplierReturn: (elementId: string, packageId: string, updates: Partial<SupplierReturn>) => void;

  // Category 7 actions
  updateCategory7Item: (id: string, updates: Partial<Category7Item>) => void;

  // Global actions
  resetAssessment: () => void;
  loadAssessment: (state: MMCAssessmentState) => void;
  getState: () => MMCAssessmentState;
}

export const useMMCStore = create<MMCStore>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),

      updateProjectDetails: (details) => set(state => ({
        projectDetails: { ...state.projectDetails, ...details }
      })),

      addTeamMember: (member) => set(state => ({
        projectDetails: { ...state.projectDetails, team: [...state.projectDetails.team, member] }
      })),

      removeTeamMember: (id) => set(state => ({
        projectDetails: { ...state.projectDetails, team: state.projectDetails.team.filter(m => m.id !== id) }
      })),

      updateTeamMember: (id, updates) => set(state => ({
        projectDetails: {
          ...state.projectDetails,
          team: state.projectDetails.team.map(m => m.id === id ? { ...m, ...updates } : m)
        }
      })),

      updateBenefitItem: (id, updates) => set(state => ({
        benefitsScorecard: {
          ...state.benefitsScorecard,
          items: state.benefitsScorecard.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }
      })),

      setBenefitsAttendees: (attendees) => set(state => ({
        benefitsScorecard: { ...state.benefitsScorecard, workshopAttendees: attendees }
      })),

      updateConstraintItem: (id, updates) => set(state => ({
        constraintsScorecard: {
          ...state.constraintsScorecard,
          items: state.constraintsScorecard.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }
      })),

      setConstraintsAttendees: (attendees) => set(state => ({
        constraintsScorecard: { ...state.constraintsScorecard, workshopAttendees: attendees }
      })),

      updateCategory0Item: (subcategoryId, itemId, updates) => set(state => ({
        category0Assessment: {
          subcategories: state.category0Assessment.subcategories.map(sc =>
            sc.id === subcategoryId
              ? { ...sc, items: sc.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
              : sc
          )
        }
      })),

      updateCarbonCheck: (key, value) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          carbonChecks: { ...state.pmvCalculation.carbonChecks, [key]: value }
        }
      })),

      updatePMVElement: (id, updates) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          elements: state.pmvCalculation.elements.map(el => el.id === id ? { ...el, ...updates } : el)
        }
      })),

      addPackageToElement: (elementId, pkg) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          elements: state.pmvCalculation.elements.map(el =>
            el.id === elementId ? { ...el, packages: [...el.packages, pkg] } : el
          )
        }
      })),

      updatePackage: (elementId, packageId, updates) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          elements: state.pmvCalculation.elements.map(el =>
            el.id === elementId
              ? { ...el, packages: el.packages.map(p => p.id === packageId ? { ...p, ...updates } : p) }
              : el
          )
        }
      })),

      removePackage: (elementId, packageId) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          elements: state.pmvCalculation.elements.map(el =>
            el.id === elementId
              ? { ...el, packages: el.packages.filter(p => p.id !== packageId) }
              : el
          )
        }
      })),

      addSupplierReturn: (sr) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          supplierReturns: [...state.pmvCalculation.supplierReturns, sr]
        }
      })),

      updateSupplierReturn: (elementId, packageId, updates) => set(state => ({
        pmvCalculation: {
          ...state.pmvCalculation,
          supplierReturns: state.pmvCalculation.supplierReturns.map(sr =>
            sr.elementId === elementId && sr.packageId === packageId ? { ...sr, ...updates } : sr
          )
        }
      })),

      updateCategory7Item: (id, updates) => set(state => ({
        category7Assessment: {
          ...state.category7Assessment,
          items: state.category7Assessment.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }
      })),

      resetAssessment: () => set(createDefaultState()),

      loadAssessment: (newState) => set(newState),

      getState: () => {
        const { projectDetails, benefitsScorecard, constraintsScorecard, category0Assessment, pmvCalculation, category7Assessment } = get();
        return { projectDetails, benefitsScorecard, constraintsScorecard, category0Assessment, pmvCalculation, category7Assessment };
      },
    }),
    {
      name: 'nhs-mmc-assessment',
    }
  )
);
