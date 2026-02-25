import { PMVElement } from '@/types';
import { v4 as uuid } from 'uuid';

export const createDefaultPMVElements = (): PMVElement[] => [
  // ============================================================
  // STRUCTURE
  // ============================================================

  // SUBSTRUCTURE
  { id: uuid(), number: '1.1', name: 'Substructure (excluding site prep and drainage)', section: 'structure', sectionGroup: 'SUBSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // SUPERSTRUCTURE - Frame
  { id: uuid(), number: '2.1', name: 'Frame', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.1.1', name: 'Frame - Concrete', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.1.2', name: 'Frame - Steel', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.1.3', name: 'Frame - Timber', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.1.4', name: 'Frame - Other', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // SUPERSTRUCTURE - Upper Floors
  { id: uuid(), number: '2.2', name: 'Upper floors', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.2.1', name: 'Upper floors - Concrete', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.2.2', name: 'Upper floors - Steel', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.2.3', name: 'Upper floors - Timber', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.2.4', name: 'Upper floors - Other', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // SUPERSTRUCTURE - Roof
  { id: uuid(), number: '2.3', name: 'Roof', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // SUPERSTRUCTURE - Other structural (TBC)
  { id: uuid(), number: '2.4.1', name: 'TBC on project basis', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '2.4.2', name: 'TBC on project basis', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '2.4.3', name: 'TBC on project basis', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '2.4.4', name: 'TBC on project basis', section: 'structure', sectionGroup: 'SUPERSTRUCTURE', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },

  // ============================================================
  // ARCHITECTURE
  // ============================================================

  // External Walls
  { id: uuid(), number: '2.5', name: 'External Walls', section: 'architecture', sectionGroup: 'External Walls', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.5.1', name: 'External Walls - Interleaf and boarding', section: 'architecture', sectionGroup: 'External Walls', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.5.2', name: 'External Walls - External facade', section: 'architecture', sectionGroup: 'External Walls', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.5.3', name: 'External Walls - Lightweight panels', section: 'architecture', sectionGroup: 'External Walls', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.5.4', name: 'External Walls - Louvres etc', section: 'architecture', sectionGroup: 'External Walls', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '2.5.5', name: 'External Walls - Other', section: 'architecture', sectionGroup: 'External Walls', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Windows and External Doors
  { id: uuid(), number: '2.6', name: 'Windows and External Doors', section: 'architecture', sectionGroup: 'Windows and External Doors', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Internal Walls and Partitions
  { id: uuid(), number: '2.7', name: 'Internal Walls and Partitions', section: 'architecture', sectionGroup: 'Internal Walls and Partitions', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Internal Doors
  { id: uuid(), number: '2.8', name: 'Internal Doors', section: 'architecture', sectionGroup: 'Internal Doors', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Wall Finishes
  { id: uuid(), number: '3.1', name: 'Wall Finishes', section: 'architecture', sectionGroup: 'Finishes', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Floor Finishes
  { id: uuid(), number: '3.2', name: 'Floor Finishes', section: 'architecture', sectionGroup: 'Finishes', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Ceiling Finishes
  { id: uuid(), number: '3.3', name: 'Ceiling Finishes', section: 'architecture', sectionGroup: 'Finishes', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Fixed Fittings and Equipment
  { id: uuid(), number: '4.1', name: 'Fixed Fittings and Equipment', section: 'architecture', sectionGroup: 'Fittings', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Other Fittings (TBC)
  { id: uuid(), number: '4.2.1', name: 'TBC on project basis', section: 'architecture', sectionGroup: 'Fittings', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '4.2.2', name: 'TBC on project basis', section: 'architecture', sectionGroup: 'Fittings', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '4.2.3', name: 'TBC on project basis', section: 'architecture', sectionGroup: 'Fittings', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '4.2.4', name: 'TBC on project basis', section: 'architecture', sectionGroup: 'Fittings', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },

  // ============================================================
  // BUILDING SERVICES
  // ============================================================

  // Sanitary Installations
  { id: uuid(), number: '5.1', name: 'Sanitary Installations (Sanitaryware)', section: 'building_services', sectionGroup: 'Sanitary', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Services Equipment
  { id: uuid(), number: '5.2', name: 'Services Equipment', section: 'building_services', sectionGroup: 'Services Equipment', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Disposal Installations
  { id: uuid(), number: '5.3', name: 'Disposal Installations', section: 'building_services', sectionGroup: 'Disposal', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Water Installations
  { id: uuid(), number: '5.4', name: 'Water Installations', section: 'building_services', sectionGroup: 'Water', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.4.1', name: 'Water treatment systems', section: 'building_services', sectionGroup: 'Water', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.4.2', name: 'Above ground drainage', section: 'building_services', sectionGroup: 'Water', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.4.3', name: 'Rainwater harvesting', section: 'building_services', sectionGroup: 'Water', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.4.4', name: 'Hot water installation', section: 'building_services', sectionGroup: 'Water', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.4.5', name: 'Cold water installation', section: 'building_services', sectionGroup: 'Water', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Heat Source
  { id: uuid(), number: '5.5', name: 'Heat Source', section: 'building_services', sectionGroup: 'HVAC', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Space Heating and Air Con
  { id: uuid(), number: '5.6', name: 'Space Heating and Air Con', section: 'building_services', sectionGroup: 'HVAC', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Ventilation Systems
  { id: uuid(), number: '5.7', name: 'Ventilation Systems', section: 'building_services', sectionGroup: 'HVAC', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Electrical Installations
  { id: uuid(), number: '5.8', name: 'Electrical Installations', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.1', name: 'Generator systems', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.2', name: 'UPS Systems', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.3', name: 'LV and distribution boards', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.4', name: 'Electrical containment', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.5', name: 'Small power systems', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.6', name: 'Lighting and lighting controls', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.8.7', name: 'Earthing and bonding', section: 'building_services', sectionGroup: 'Electrical', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Fuel Installations
  { id: uuid(), number: '5.9', name: 'Fuel Installations', section: 'building_services', sectionGroup: 'Fuel', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Lift and Conveyor Installations
  { id: uuid(), number: '5.10', name: 'Lift and Conveyor Installations', section: 'building_services', sectionGroup: 'Lifts', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Fire and Lightning Protection
  { id: uuid(), number: '5.11', name: 'Fire and Lightning Protection', section: 'building_services', sectionGroup: 'Fire Protection', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.11.1', name: 'Fire alarm', section: 'building_services', sectionGroup: 'Fire Protection', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.11.2', name: 'Lightning protection systems', section: 'building_services', sectionGroup: 'Fire Protection', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Communication, Security & Control Systems
  { id: uuid(), number: '5.12', name: 'Comm, Security & Control Systems', section: 'building_services', sectionGroup: 'Communications', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Specialist Installations
  { id: uuid(), number: '5.13', name: 'Specialist Installations', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.1', name: 'Medical gas installation', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.2', name: 'Nurse call and alarm', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.3', name: 'Digital Systems / Smart building systems', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.4', name: 'BMS and control systems', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.5', name: 'Access control systems', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.6', name: 'Pneumatic Tube Systems', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },
  { id: uuid(), number: '5.13.7', name: 'AGV or robotic systems', section: 'building_services', sectionGroup: 'Specialist', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // BWIC with Services
  { id: uuid(), number: '5.14', name: 'BWIC with Services', section: 'building_services', sectionGroup: 'BWIC', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // External services
  { id: uuid(), number: '5.15', name: 'External services (attached to building)', section: 'building_services', sectionGroup: 'External Services', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: false },

  // Other Building Services (TBC)
  { id: uuid(), number: '5.16.1', name: 'TBC on project basis', section: 'building_services', sectionGroup: 'Other Services', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '5.16.2', name: 'TBC on project basis', section: 'building_services', sectionGroup: 'Other Services', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '5.16.3', name: 'TBC on project basis', section: 'building_services', sectionGroup: 'Other Services', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
  { id: uuid(), number: '5.16.4', name: 'TBC on project basis', section: 'building_services', sectionGroup: 'Other Services', bcisPercentage: 0, mmcCategories: [], description: '', packages: [], isCustom: true },
];
