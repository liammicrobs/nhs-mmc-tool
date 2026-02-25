import { ConstraintItem } from '@/types';
import { v4 as uuid } from 'uuid';

export const createDefaultConstraintItems = (): ConstraintItem[] => [
  { id: uuid(), name: 'Building application / typology (i.e. complexity of service provided)', score: 5, description: '' },
  { id: uuid(), name: 'Access to site', score: 5, description: '' },
  { id: uuid(), name: 'Site topography', score: 5, description: '' },
  { id: uuid(), name: 'Site location and constraints (transport)', score: 5, description: '' },
  { id: uuid(), name: 'Planning restrictions (visual / aesthetic / policy)', score: 5, description: '' },
  { id: uuid(), name: 'Storage on site', score: 5, description: '' },
  { id: uuid(), name: 'Construction programme duration', score: 5, description: '' },
  { id: uuid(), name: 'Site disruption impact', score: 5, description: '' },
  { id: uuid(), name: 'Logistics - space on site', score: 5, description: '' },
  { id: uuid(), name: 'Logistics - site craneage', score: 5, description: '' },
  { id: uuid(), name: 'Access to labour (local labour)', score: 5, description: '' },
  { id: uuid(), name: 'Location of supply chain', score: 5, description: '' },
  { id: uuid(), name: 'Social factors (e.g. local spend, legacy)', score: 5, description: '' },
  { id: uuid(), name: 'Environmental factors (local site ecology)', score: 5, description: '' },
  { id: uuid(), name: 'Economic / Capital Investment / Budget', score: 5, description: '' },
  { id: uuid(), name: 'Future flexibility requirements', score: 5, description: '' },
  { id: uuid(), name: 'Performance requirements', score: 5, description: '' },
  { id: uuid(), name: 'Health & Safety', score: 5, description: '' },
  { id: uuid(), name: 'Other - to be confirmed', score: 5, description: '' },
  { id: uuid(), name: 'Other - to be confirmed', score: 5, description: '' },
];
