export type ProjectStatus = 'planning' | 'in-progress' | 'halted' | 'completed';

export interface FinancialData {
  availableNow: number;
  availableMonthly: number;
  emergencyFundValue: number;
  hasEmergencyFund: boolean;
  willFinance: boolean;
  maxBudget: number;
  land?: {
    hasLand: boolean;
    estimatedCost: number;
    docsCost: number;
    taxesCost: number;
    feesCost: number;
  };
}

export interface LandInfo {
  location: string;
  sizeSqm: number;
  topography: string;
  infra: {
    waterCost: number;
    powerCost: number;
    sanitationCost: number;
    accessCost: number;
  };
}

export interface HouseDefinition {
  sqm: number;
  rooms: number;
  bathrooms: number;
  additions: Array<{
    id: string;
    name: string;
    cost: number;
  }>;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  status: ProjectStatus;
  financial?: FinancialData;
  landInfo?: LandInfo;
  definition?: HouseDefinition;
  spent: number;
  overallProgress: number;
  lastVisitDate?: string;
  createdAt: any;
  updatedAt: any;
}

export interface BudgetSheet {
  id: string;
  itemName: string;
  supplier: string;
  type: 'material' | 'service' | 'item';
  quantity: string;
  value: number;
  notes: string;
  selected?: boolean;
  createdAt: any;
}

export interface ProgressLog {
  id: string;
  stage: string;
  percentage: number;
  startDate: string;
  endDate: string;
  date: any; // completion or log date
  team: string;
  notes: string;
  createdAt: any;
}

export interface Reference {
  id: string;
  title: string;
  type: 'link' | 'image';
  url: string;
  description: string;
}
