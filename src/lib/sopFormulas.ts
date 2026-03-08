// SOP-derived formulas ready for the Analytical Test section
// These match the SavedFormula interface used by FormulaBuilder & AnalyticalTestSection

export interface SOPFormulaDefinition {
  sopId: string;
  name: string;
  description: string;
  expression: string;
  variables: { id: string; name: string; description: string; defaultValue: string; testValue: string }[];
  unit: string;
}

export const SOP_FORMULAS: SOPFormulaDefinition[] = [
  {
    sopId: 'moisture',
    name: 'Moisture %',
    description: 'Moisture determination by oven drying method (AOAC)',
    expression: '100 - ((W2 - W1) / SW * 100)',
    variables: [
      { id: 'w1', name: 'W1', description: 'Weight of empty petri dish (g)', defaultValue: '', testValue: '25.0' },
      { id: 'w2', name: 'W2', description: 'Weight of dish + dried sample (g)', defaultValue: '', testValue: '29.5' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '5', testValue: '5' },
    ],
    unit: '%',
  },
  {
    sopId: 'ash',
    name: 'Ash %',
    description: 'Total ash by ignition in muffle furnace (550-650°C)',
    expression: '(W2 - W1) / SW * 100',
    variables: [
      { id: 'w1', name: 'W1', description: 'Weight of empty crucible (g)', defaultValue: '', testValue: '15.0' },
      { id: 'w2', name: 'W2', description: 'Weight of crucible + ash (g)', defaultValue: '', testValue: '15.12' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '2', testValue: '2' },
    ],
    unit: '%',
  },
  {
    sopId: 'ether-extract',
    name: 'Ether Extract / Crude Fat %',
    description: 'Fat determination by Soxhlet extraction',
    expression: '(W2 - W1) / SW * 100',
    variables: [
      { id: 'w1', name: 'W1', description: 'Weight of empty flask (g)', defaultValue: '', testValue: '85.0' },
      { id: 'w2', name: 'W2', description: 'Weight of flask + extracted fat (g)', defaultValue: '', testValue: '85.15' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '3', testValue: '3' },
    ],
    unit: '%',
  },
  {
    sopId: 'crude-fiber',
    name: 'Crude Fiber %',
    description: 'Crude fiber by acid-alkali digestion',
    expression: '(W1 - W2) / SW * 100',
    variables: [
      { id: 'w1', name: 'W1', description: 'Dry weight after digestion (g)', defaultValue: '', testValue: '1.85' },
      { id: 'w2', name: 'W2', description: 'Ash weight after ignition (g)', defaultValue: '', testValue: '1.75' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '2', testValue: '2' },
    ],
    unit: '%',
  },
  {
    sopId: 'crude-protein',
    name: 'Crude Protein % (Kjeldahl)',
    description: 'CP by Kjeldahl method (Factor = 17.5 for 0.5g sample, 10ml distillation, 100ml dilution)',
    expression: '17.5 * TR',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml of 0.1N H₂SO₄)', defaultValue: '', testValue: '2.5' },
    ],
    unit: '%',
  },
  {
    sopId: 'crude-protein-custom',
    name: 'Crude Protein % (Custom Factor)',
    description: 'CP with custom parameters: factor = (N × 14.0067 × VD × 6.25 × 100) / (SW × 1000 × DV)',
    expression: '(Norm * 14.0067 * VD * 6.25 * 100) / (SW * 1000 * DV) * TR',
    variables: [
      { id: 'norm', name: 'Norm', description: 'Normality of H₂SO₄', defaultValue: '0.1', testValue: '0.1' },
      { id: 'vd', name: 'VD', description: 'Volume of dilution (ml)', defaultValue: '100', testValue: '100' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '0.5', testValue: '0.5' },
      { id: 'dv', name: 'DV', description: 'Distillation sample volume (ml)', defaultValue: '10', testValue: '10' },
      { id: 'tr', name: 'TR', description: 'Titration reading (ml)', defaultValue: '', testValue: '2.5' },
    ],
    unit: '%',
  },
  {
    sopId: 'koh-solubility',
    name: 'KOH Solubility %',
    description: 'Protein Dispersibility Index (Factor = 87.5 for 0.1g sample)',
    expression: '(TR * 87.5 * 100) / CP',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml)', defaultValue: '', testValue: '0.4' },
      { id: 'cp', name: 'CP', description: 'Crude Protein % of sample', defaultValue: '', testValue: '44.5' },
    ],
    unit: '%',
  },
  {
    sopId: 'true-protein',
    name: 'True Protein %',
    description: 'True protein by TCA precipitation (Factor = 8.75 for 1g sample)',
    expression: '(TR * 8.75 * 100) / CP',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml)', defaultValue: '', testValue: '4.8' },
      { id: 'cp', name: 'CP', description: 'Crude Protein % of sample', defaultValue: '', testValue: '44.5' },
    ],
    unit: '%',
  },
  {
    sopId: 'npn',
    name: 'Non-Protein Nitrogen %',
    description: 'NPN by TCA filtrate (Factor = 8.75)',
    expression: '(TR * 8.75) / 6.25',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml)', defaultValue: '', testValue: '0.3' },
    ],
    unit: '%',
  },
  {
    sopId: 'npn-alt',
    name: 'NPN % (from CP & TP)',
    description: 'NPN calculated from CP and True Protein titration',
    expression: '(CP - (TR_TP * 8.75)) / 6.25',
    variables: [
      { id: 'cp', name: 'CP', description: 'Crude Protein %', defaultValue: '', testValue: '44.5' },
      { id: 'tr_tp', name: 'TR_TP', description: 'True Protein titration reading (ml)', defaultValue: '', testValue: '4.8' },
    ],
    unit: '%',
  },
  {
    sopId: 'aia',
    name: 'Acid Insoluble Ash %',
    description: 'AIA determination by HCl digestion',
    expression: '(W2 - W1) / SW * 100',
    variables: [
      { id: 'w1', name: 'W1', description: 'Weight of empty crucible (g)', defaultValue: '', testValue: '15.0' },
      { id: 'w2', name: 'W2', description: 'Weight of crucible + AIA (g)', defaultValue: '', testValue: '15.05' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '5', testValue: '5' },
    ],
    unit: '%',
  },
  {
    sopId: 'ffa',
    name: 'Free Fatty Acid %',
    description: 'FFA by NaOH titration (oleic acid MW = 282)',
    expression: '(0.1 * 282 * TR * 100) / (SW * 1000)',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml of 0.1N NaOH)', defaultValue: '', testValue: '1.2' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '5', testValue: '5' },
    ],
    unit: '%',
  },
  {
    sopId: 'pov',
    name: 'Peroxide Value (meq/kg)',
    description: 'POV by sodium thiosulfate titration',
    expression: '(TR * 0.01 * 1000) / SW',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml of 0.01N Na₂S₂O₃)', defaultValue: '', testValue: '3.5' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '5', testValue: '5' },
    ],
    unit: 'meq/kg',
  },
  {
    sopId: 'rise-in-ph',
    name: 'Rise in pH',
    description: 'Urease activity assessment for soybean meal',
    expression: 'U - P',
    variables: [
      { id: 'u', name: 'U', description: 'pH of urea buffer beaker', defaultValue: '', testValue: '7.15' },
      { id: 'p', name: 'P', description: 'pH of phosphate buffer beaker', defaultValue: '', testValue: '7.00' },
    ],
    unit: 'pH units',
  },
  {
    sopId: 'cv-mixer',
    name: 'CV of Mixer %',
    description: 'Coefficient of Variation from spectrophotometer readings (enter mean and std dev)',
    expression: '(SD / Mean) * 100',
    variables: [
      { id: 'sd', name: 'SD', description: 'Standard Deviation of readings', defaultValue: '', testValue: '0.015' },
      { id: 'mean', name: 'Mean', description: 'Mean of readings', defaultValue: '', testValue: '0.25' },
    ],
    unit: '%',
  },
  {
    sopId: 'glucosinolate',
    name: 'Glucosinolate (μmol/g)',
    description: 'Glucosinolate by BaCl₂ precipitation',
    expression: '(W2 - W1) * 428.4637 / SW',
    variables: [
      { id: 'w1', name: 'W1', description: 'Weight of empty crucible (g)', defaultValue: '', testValue: '15.0' },
      { id: 'w2', name: 'W2', description: 'Weight of crucible + residue (g)', defaultValue: '', testValue: '15.003' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '10', testValue: '10' },
    ],
    unit: 'μmol/g',
  },
  {
    sopId: 'calcium-wet',
    name: 'Calcium % (Wet Digestion)',
    description: 'Calcium for grains & feed by EDTA titration (Factor = 4)',
    expression: 'TR * 4',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml of 0.01N EDTA)', defaultValue: '', testValue: '2.1' },
    ],
    unit: '%',
  },
  {
    sopId: 'calcium-acid',
    name: 'Calcium % (Acid Digestion)',
    description: 'Calcium for DCP, MCP & Limestone by EDTA titration (Factor = 80)',
    expression: 'TR * 80',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml of 0.01N EDTA)', defaultValue: '', testValue: '0.45' },
    ],
    unit: '%',
  },
  {
    sopId: 'lysine',
    name: 'Available Lysine %',
    description: 'Lysine determination by spectrophotometric method',
    expression: '(Blank * (Y - X) * 22.747 * 100) / (SW * 1000)',
    variables: [
      { id: 'blank', name: 'Blank', description: 'Blank absorbance reading', defaultValue: '', testValue: '0.65' },
      { id: 'x', name: 'X', description: 'Sample X absorbance (without propionic acid)', defaultValue: '', testValue: '0.42' },
      { id: 'y', name: 'Y', description: 'Sample Y absorbance (with propionic acid)', defaultValue: '', testValue: '0.58' },
      { id: 'sw', name: 'SW', description: 'Sample weight (g)', defaultValue: '0.213', testValue: '0.213' },
    ],
    unit: '%',
  },
  {
    sopId: 'pepsin-digestibility',
    name: 'Pepsin Digestibility %',
    description: 'Pepsin digestibility test (Factor = 21.875)',
    expression: '(TR * 21.875 * 100) / CP',
    variables: [
      { id: 'tr', name: 'TR', description: 'Titration reading (ml)', defaultValue: '', testValue: '2.0' },
      { id: 'cp', name: 'CP', description: 'Crude Protein %', defaultValue: '', testValue: '50' },
    ],
    unit: '%',
  },
];

/**
 * Convert an SOP formula definition to a SavedFormula compatible object
 */
export function sopFormulaToSavedFormula(def: SOPFormulaDefinition): {
  id: string;
  name: string;
  description: string;
  expression: string;
  variables: { id: string; name: string; description: string; defaultValue: string; testValue: string }[];
  createdAt: number;
} {
  return {
    id: `sop-${def.sopId}`,
    name: `[SOP] ${def.name}`,
    description: `${def.description} (Unit: ${def.unit})`,
    expression: def.expression,
    variables: def.variables,
    createdAt: Date.now(),
  };
}
