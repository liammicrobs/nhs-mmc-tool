import { BenefitItem } from '@/types';
import { v4 as uuid } from 'uuid';

export const createDefaultBenefitItems = (): BenefitItem[] => [
  // FASTER (5 items)
  { id: uuid(), category: 'faster', name: 'Scope and briefing time', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'faster', name: 'Design time', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'faster', name: 'Approval / engagement time', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'faster', name: 'Construction / delivery time', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'faster', name: 'Commissioning / handover time', importance: 5, points: 0, description: '' },
  // BETTER (7 items)
  { id: uuid(), category: 'better', name: 'Service user experience', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'better', name: 'Staff experience', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'better', name: 'Throughput of patients', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'better', name: 'Improved handover - less defects', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'better', name: 'Reduction in maintenance', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'better', name: 'Quality / Specification of products / elements', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'better', name: 'Flexibility and adaptability', importance: 5, points: 0, description: '' },
  // SUSTAINABLE LEGACY (8 items)
  { id: uuid(), category: 'sustainable_legacy', name: 'Reduction in embodied carbon', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Reduction in operational carbon', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Climate change resilient', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Reduction in construction waste', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Reduction in operational waste', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Contribution to levelling up / opportunities for local community', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Training and education opportunities', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'sustainable_legacy', name: 'Sustainable workforce opportunities', importance: 5, points: 0, description: '' },
  // ECONOMIC (5 items)
  { id: uuid(), category: 'economic', name: 'Reduction in capital expenditure', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'economic', name: 'Insurance and warranty requirements', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'economic', name: 'Contract form and impact', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'economic', name: 'Cash flow / spending profile', importance: 5, points: 0, description: '' },
  { id: uuid(), category: 'economic', name: 'Reduction in operational expenditure', importance: 5, points: 0, description: '' },
];
