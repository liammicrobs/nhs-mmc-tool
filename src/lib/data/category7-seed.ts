import { Category7Item } from '@/types';
import { v4 as uuid } from 'uuid';

export const createDefaultCategory7Items = (): Category7Item[] => [
  { id: uuid(), name: 'BIM-enabled lean construction processes', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'A/VR for design coordination', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Robotic or automated construction', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: '3D scanning / point cloud surveys', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Drone surveys and monitoring', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Exoskeletons for workforce safety', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Driverless / autonomous vehicles on site', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Weatherproof enclosures', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Modular scaffolding systems', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Sacrificial temporary works', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Alternative formwork systems', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Digital construction monitoring', adopted: false, description: '', isCustom: false },
  { id: uuid(), name: 'Other - to be defined', adopted: false, description: '', isCustom: true },
  { id: uuid(), name: 'Other - to be defined', adopted: false, description: '', isCustom: true },
  { id: uuid(), name: 'Other - to be defined', adopted: false, description: '', isCustom: true },
];
