import { Category0Subcategory } from '@/types';
import { v4 as uuid } from 'uuid';

export const createDefaultCategory0 = (): Category0Subcategory[] => [
  {
    id: uuid(), number: 1, name: 'Project Briefing',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Standard model of care', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Standardised / best practice adjacencies adopted', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Standard Schedule of accommodation (HBNs)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Digital optimisation tools (mass motion or similar)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
    ]
  },
  {
    id: uuid(), number: 2, name: 'Shell & Core Design',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Standardised grid layout', type: 'percentage_threshold', value: false, percentage: 0, thresholds: [{ minPercent: 0, score: 1 }, { minPercent: 75, score: 2 }, { minPercent: 85, score: 3 }], maxScore: 3, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Standardised facade geometries', type: 'percentage_threshold', value: false, percentage: 0, thresholds: [{ minPercent: 0, score: 1 }, { minPercent: 75, score: 2 }, { minPercent: 85, score: 3 }], maxScore: 3, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Standard floor to floor heights across a project / programme', type: 'percentage_threshold', value: false, percentage: 0, thresholds: [{ minPercent: 0, score: 1 }, { minPercent: 75, score: 2 }, { minPercent: 85, score: 3 }], maxScore: 3, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Standard core arrangements (stairs and lifts)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Standard circulation spaces (corridor widths etc)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Stacking assessment', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Creation of clusters (rooms and services)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
    ]
  },
  {
    id: uuid(), number: 3, name: 'Room & Fit-out Design',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Utilisation of repeatable rooms (Programme / framework)', type: 'percentage_threshold', value: false, percentage: 0, thresholds: [{ minPercent: 0, score: 1 }, { minPercent: 75, score: 2 }, { minPercent: 85, score: 3 }], maxScore: 3, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Utilisation of standard assemblies (Programme / framework)', type: 'percentage_threshold', value: false, percentage: 0, thresholds: [{ minPercent: 0, score: 1 }, { minPercent: 75, score: 2 }, { minPercent: 85, score: 3 }], maxScore: 3, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Use of standard components schedule (Programme / framework)', type: 'percentage_threshold', value: false, percentage: 0, thresholds: [{ minPercent: 0, score: 1 }, { minPercent: 75, score: 2 }, { minPercent: 85, score: 3 }], maxScore: 3, description: '', isCustom: false },
    ]
  },
  {
    id: uuid(), number: 4, name: 'Stakeholder Engagement',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Plans supported by quality metrics (time, distance)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: '3D visualisation supporting plans', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'A/VR visualisation to demonstrate to client', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
    ]
  },
  {
    id: uuid(), number: 5, name: 'Building Information Management & SEAMS',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Development of project EIR', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Development of project IEP / BEP', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Use of BIM to coordinate and clash detect (level 1 - 2)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Design stage BIM (including embedded data)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Design stage BIM (including H&S / CDM assessments)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Design stage BIM (including automated RDS, CDM etc)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Design stage BIM (including 4D programme)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Design stage BIM (including 5D cost modelling)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Design stage BIM (including carbon modelling)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Use of CDE (Common Data Environment)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'SEAMS brief', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
    ]
  },
  {
    id: uuid(), number: 6, name: 'Preconstruction Works',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Digital mapping (Matterport, Point cloud etc)', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
      { id: uuid(), subcategoryId: '', name: 'Digital below ground service mapping for coordination', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: false },
    ]
  },
  {
    id: uuid(), number: 7, name: 'Other (project-specific)',
    items: [
      { id: uuid(), subcategoryId: '', name: 'Description to be added if applicable', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: true },
      { id: uuid(), subcategoryId: '', name: 'Description to be added if applicable', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: true },
      { id: uuid(), subcategoryId: '', name: 'Description to be added if applicable', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: true },
      { id: uuid(), subcategoryId: '', name: 'Description to be added if applicable', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: true },
      { id: uuid(), subcategoryId: '', name: 'Description to be added if applicable', type: 'yes_no', value: false, percentage: 0, thresholds: [], maxScore: 1, description: '', isCustom: true },
    ]
  },
];

// Wire up subcategoryId references after creation
export const initCategory0 = (): Category0Subcategory[] => {
  const subcats = createDefaultCategory0();
  for (const subcat of subcats) {
    for (const item of subcat.items) {
      item.subcategoryId = subcat.id;
    }
  }
  return subcats;
};
