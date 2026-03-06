import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MMCAssessmentState, DashboardProject } from '@/types';
import { computeExecutiveSummary } from '@/lib/calculations/executive-summary';

interface DashboardStore {
  projects: DashboardProject[];

  // Actions
  addProject: (assessment: MMCAssessmentState) => { added: boolean; reason?: string };
  addProjects: (assessments: MMCAssessmentState[]) => { added: number; skipped: number; errors: string[] };
  removeProject: (id: string) => void;
  clearAll: () => void;
  getProject: (id: string) => DashboardProject | undefined;
}

function makeLabel(state: MMCAssessmentState): string {
  const trust = state.projectDetails.trustClientName || 'Unknown Trust';
  const pscp = state.projectDetails.pscpName;
  return pscp ? `${trust} - ${pscp}` : trust;
}

function isDuplicate(existing: DashboardProject[], assessment: MMCAssessmentState): boolean {
  const label = makeLabel(assessment);
  const typology = assessment.projectDetails.buildingTypology;
  const stage = assessment.projectDetails.businessCaseStage;
  return existing.some(
    p => makeLabel(p.assessment) === label &&
         p.assessment.projectDetails.buildingTypology === typology &&
         p.assessment.projectDetails.businessCaseStage === stage
  );
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (assessment) => {
        const existing = get().projects;
        if (isDuplicate(existing, assessment)) {
          return { added: false, reason: 'Duplicate project detected' };
        }
        const summary = computeExecutiveSummary(assessment);
        const project: DashboardProject = {
          id: uuidv4(),
          importedAt: new Date().toISOString(),
          label: makeLabel(assessment),
          assessment,
          summary,
        };
        set({ projects: [...existing, project] });
        return { added: true };
      },

      addProjects: (assessments) => {
        let added = 0;
        let skipped = 0;
        const errors: string[] = [];
        for (const assessment of assessments) {
          const result = get().addProject(assessment);
          if (result.added) {
            added++;
          } else {
            skipped++;
            if (result.reason) errors.push(result.reason);
          }
        }
        return { added, skipped, errors };
      },

      removeProject: (id) => {
        set({ projects: get().projects.filter(p => p.id !== id) });
      },

      clearAll: () => set({ projects: [] }),

      getProject: (id) => get().projects.find(p => p.id === id),
    }),
    {
      name: 'nhs-mmc-dashboard',
    }
  )
);
