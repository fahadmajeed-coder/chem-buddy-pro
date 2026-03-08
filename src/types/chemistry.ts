export interface CalculationResult {
  id: string;
  type: 'molarity' | 'normality' | 'formality' | 'conversion' | 'dilution' | 'custom';
  label: string;
  inputs: Record<string, number | string>;
  result: number;
  unit: string;
  timestamp: Date;
  locked: boolean;
}

export interface SolutionPrep {
  id: string;
  targetConcentration: number;
  targetUnit: 'M' | 'N' | 'F';
  targetVolume: number;
  volumeUnit: 'mL' | 'L';
  soluteMass?: number;
  molecularWeight?: number;
  density?: number;
  purity?: number;
}

export interface AnalyticalReport {
  id: string;
  title: string;
  date: Date;
  calculations: CalculationResult[];
  standards: Standard[];
  status: 'draft' | 'reviewed' | 'approved';
  notes: string;
}

export interface Standard {
  id: string;
  name: string;
  expectedValue: number;
  unit: string;
  tolerance: number;
  actualValue?: number;
  status?: 'pass' | 'fail' | 'pending';
}

export interface CustomSection {
  id: string;
  name: string;
  formula: string;
  variables: { name: string; label: string; unit: string }[];
  locked: boolean;
}
