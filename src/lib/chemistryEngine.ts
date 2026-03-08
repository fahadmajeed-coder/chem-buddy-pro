// Periodic table data (atomic masses)
export const elements: Record<string, { name: string; symbol: string; mass: number; number: number }> = {
  H: { name: 'Hydrogen', symbol: 'H', mass: 1.008, number: 1 },
  He: { name: 'Helium', symbol: 'He', mass: 4.003, number: 2 },
  Li: { name: 'Lithium', symbol: 'Li', mass: 6.941, number: 3 },
  Be: { name: 'Beryllium', symbol: 'Be', mass: 9.012, number: 4 },
  B: { name: 'Boron', symbol: 'B', mass: 10.81, number: 5 },
  C: { name: 'Carbon', symbol: 'C', mass: 12.011, number: 6 },
  N: { name: 'Nitrogen', symbol: 'N', mass: 14.007, number: 7 },
  O: { name: 'Oxygen', symbol: 'O', mass: 15.999, number: 8 },
  F: { name: 'Fluorine', symbol: 'F', mass: 18.998, number: 9 },
  Ne: { name: 'Neon', symbol: 'Ne', mass: 20.180, number: 10 },
  Na: { name: 'Sodium', symbol: 'Na', mass: 22.990, number: 11 },
  Mg: { name: 'Magnesium', symbol: 'Mg', mass: 24.305, number: 12 },
  Al: { name: 'Aluminium', symbol: 'Al', mass: 26.982, number: 13 },
  Si: { name: 'Silicon', symbol: 'Si', mass: 28.086, number: 14 },
  P: { name: 'Phosphorus', symbol: 'P', mass: 30.974, number: 15 },
  S: { name: 'Sulfur', symbol: 'S', mass: 32.065, number: 16 },
  Cl: { name: 'Chlorine', symbol: 'Cl', mass: 35.453, number: 17 },
  Ar: { name: 'Argon', symbol: 'Ar', mass: 39.948, number: 18 },
  K: { name: 'Potassium', symbol: 'K', mass: 39.098, number: 19 },
  Ca: { name: 'Calcium', symbol: 'Ca', mass: 40.078, number: 20 },
  Ti: { name: 'Titanium', symbol: 'Ti', mass: 47.867, number: 22 },
  Cr: { name: 'Chromium', symbol: 'Cr', mass: 51.996, number: 24 },
  Mn: { name: 'Manganese', symbol: 'Mn', mass: 54.938, number: 25 },
  Fe: { name: 'Iron', symbol: 'Fe', mass: 55.845, number: 26 },
  Co: { name: 'Cobalt', symbol: 'Co', mass: 58.933, number: 27 },
  Ni: { name: 'Nickel', symbol: 'Ni', mass: 58.693, number: 28 },
  Cu: { name: 'Copper', symbol: 'Cu', mass: 63.546, number: 29 },
  Zn: { name: 'Zinc', symbol: 'Zn', mass: 65.38, number: 30 },
  Br: { name: 'Bromine', symbol: 'Br', mass: 79.904, number: 35 },
  Ag: { name: 'Silver', symbol: 'Ag', mass: 107.868, number: 47 },
  I: { name: 'Iodine', symbol: 'I', mass: 126.904, number: 53 },
  Ba: { name: 'Barium', symbol: 'Ba', mass: 137.327, number: 56 },
  Au: { name: 'Gold', symbol: 'Au', mass: 196.967, number: 79 },
  Hg: { name: 'Mercury', symbol: 'Hg', mass: 200.592, number: 80 },
  Pb: { name: 'Lead', symbol: 'Pb', mass: 207.2, number: 82 },
};

// Parse chemical formula like "H2O", "NaCl", "Ca(OH)2", "H2SO4"
export function parseFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  const stack: Record<string, number>[] = [{}];

  let i = 0;
  while (i < formula.length) {
    if (formula[i] === '(') {
      stack.push({});
      i++;
    } else if (formula[i] === ')') {
      i++;
      let numStr = '';
      while (i < formula.length && /\d/.test(formula[i])) {
        numStr += formula[i++];
      }
      const multiplier = numStr ? parseInt(numStr) : 1;
      const top = stack.pop()!;
      const current = stack[stack.length - 1];
      for (const [el, count] of Object.entries(top)) {
        current[el] = (current[el] || 0) + count * multiplier;
      }
    } else if (/[A-Z]/.test(formula[i])) {
      let symbol = formula[i++];
      while (i < formula.length && /[a-z]/.test(formula[i])) {
        symbol += formula[i++];
      }
      let numStr = '';
      while (i < formula.length && /\d/.test(formula[i])) {
        numStr += formula[i++];
      }
      const count = numStr ? parseInt(numStr) : 1;
      const current = stack[stack.length - 1];
      current[symbol] = (current[symbol] || 0) + count;
    } else {
      i++;
    }
  }

  Object.assign(result, stack[0]);
  return result;
}

// Calculate molar mass from formula
export function calculateMolarMass(formula: string): { mass: number; breakdown: { element: string; count: number; mass: number }[] } | null {
  try {
    const parsed = parseFormula(formula);
    const breakdown: { element: string; count: number; mass: number }[] = [];
    let total = 0;

    for (const [symbol, count] of Object.entries(parsed)) {
      const el = elements[symbol];
      if (!el) return null;
      const contribution = el.mass * count;
      breakdown.push({ element: symbol, count, mass: contribution });
      total += contribution;
    }

    return { mass: total, breakdown };
  } catch {
    return null;
  }
}

// Common compounds database
const compounds: Record<string, { formula: string; name: string; uses: string }> = {
  'H2O': { formula: 'H2O', name: 'Water', uses: 'Universal solvent, essential for life' },
  'NaCl': { formula: 'NaCl', name: 'Sodium Chloride', uses: 'Table salt, preservative, saline solutions' },
  'HCl': { formula: 'HCl', name: 'Hydrochloric Acid', uses: 'Stomach acid, industrial cleaning, pH control' },
  'H2SO4': { formula: 'H2SO4', name: 'Sulfuric Acid', uses: 'Battery acid, fertilizer production, dehydrating agent' },
  'NaOH': { formula: 'NaOH', name: 'Sodium Hydroxide', uses: 'Soap making, drain cleaner, pH adjustment' },
  'HNO3': { formula: 'HNO3', name: 'Nitric Acid', uses: 'Fertilizers, explosives, metal etching' },
  'CaCO3': { formula: 'CaCO3', name: 'Calcium Carbonate', uses: 'Limestone, antacids, chalk' },
  'NH3': { formula: 'NH3', name: 'Ammonia', uses: 'Fertilizers, cleaning agents, refrigerant' },
  'CH4': { formula: 'CH4', name: 'Methane', uses: 'Natural gas, fuel, chemical feedstock' },
  'CO2': { formula: 'CO2', name: 'Carbon Dioxide', uses: 'Carbonation, fire extinguishers, photosynthesis' },
  'C2H5OH': { formula: 'C2H5OH', name: 'Ethanol', uses: 'Beverages, disinfectant, fuel additive' },
  'C6H12O6': { formula: 'C6H12O6', name: 'Glucose', uses: 'Energy source, food industry, IV solutions' },
  'KMnO4': { formula: 'KMnO4', name: 'Potassium Permanganate', uses: 'Oxidizer, water treatment, antiseptic' },
  'FeSO4': { formula: 'FeSO4', name: 'Ferrous Sulfate', uses: 'Iron supplement, water treatment, ink production' },
  'AgNO3': { formula: 'AgNO3', name: 'Silver Nitrate', uses: 'Photography, antiseptic, analytical chemistry' },
  'CuSO4': { formula: 'CuSO4', name: 'Copper Sulfate', uses: 'Fungicide, electroplating, analytical reagent' },
  'Na2CO3': { formula: 'Na2CO3', name: 'Sodium Carbonate', uses: 'Washing soda, glass making, water softening' },
  'KOH': { formula: 'KOH', name: 'Potassium Hydroxide', uses: 'Soap making, electrolyte, food processing' },
  'H3PO4': { formula: 'H3PO4', name: 'Phosphoric Acid', uses: 'Fertilizers, rust removal, food additive (cola)' },
  'CH3COOH': { formula: 'CH3COOH', name: 'Acetic Acid', uses: 'Vinegar, chemical synthesis, preservative' },
};

// Common chemistry Q&A
const qaDatabase: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/what is molarity/i, /define molarity/i, /molarity meaning/i],
    answer: '**Molarity (M)** is the number of moles of solute per liter of solution.\n\n**Formula:** M = moles of solute / liters of solution\n\n**Example:** 0.5 mol NaCl in 1 L = 0.5 M NaCl',
  },
  {
    patterns: [/what is normality/i, /define normality/i, /normality meaning/i],
    answer: '**Normality (N)** is the number of gram equivalents of solute per liter of solution.\n\n**Formula:** N = Molarity × n-factor\n\nThe n-factor depends on the reaction type (acid-base: H⁺/OH⁻ donated, redox: electrons transferred).',
  },
  {
    patterns: [/what is pH/i, /define pH/i, /pH scale/i, /how.*pH.*work/i],
    answer: '**pH** measures how acidic or basic a solution is on a scale of 0-14.\n\n**Formula:** pH = -log₁₀[H⁺]\n\n- pH < 7 → Acidic\n- pH = 7 → Neutral\n- pH > 7 → Basic\n\n**Example:** [H⁺] = 0.001 M → pH = 3',
  },
  {
    patterns: [/what is a mole/i, /define mole/i, /avogadro/i],
    answer: '**A mole** is 6.022 × 10²³ particles (Avogadro\'s number).\n\nIt\'s the bridge between atomic-scale and lab-scale chemistry.\n\n**1 mole of any element** = its atomic mass in grams\n- 1 mol C = 12.011 g\n- 1 mol H₂O = 18.015 g',
  },
  {
    patterns: [/dilution/i, /how.*dilute/i, /C1V1/i, /M1V1/i],
    answer: '**Dilution Formula:** C₁V₁ = C₂V₂\n\nWhere:\n- C₁ = initial concentration\n- V₁ = initial volume\n- C₂ = final concentration\n- V₂ = final volume\n\n**Example:** Dilute 2M HCl to 0.5M:\n2 × V₁ = 0.5 × 1000 mL → V₁ = 250 mL',
  },
  {
    patterns: [/percent.*composition/i, /mass percent/i, /weight percent/i],
    answer: '**Percent Composition** = (mass of element / molar mass of compound) × 100%\n\n**Example for H₂O:**\n- %H = (2.016 / 18.015) × 100 = 11.19%\n- %O = (15.999 / 18.015) × 100 = 88.81%',
  },
  {
    patterns: [/titration/i, /how.*titrat/i],
    answer: '**Titration** is a technique to determine the concentration of an unknown solution.\n\n**At the equivalence point:** n₁M₁V₁ = n₂M₂V₂\n\nCommon indicators:\n- **Phenolphthalein:** colorless → pink (pH 8.2-10)\n- **Methyl orange:** red → yellow (pH 3.1-4.4)\n- **Litmus:** red → blue (pH 5-8)',
  },
  {
    patterns: [/ideal gas/i, /PV.*nRT/i, /gas law/i],
    answer: '**Ideal Gas Law:** PV = nRT\n\n- P = pressure (atm)\n- V = volume (L)\n- n = moles\n- R = 0.0821 L·atm/(mol·K)\n- T = temperature (K)\n\n**At STP** (0°C, 1 atm): 1 mol gas = 22.4 L',
  },
  {
    patterns: [/electron config/i, /electron.*arrangement/i, /orbital/i],
    answer: '**Electron Configuration** follows:\n1. **Aufbau principle:** Fill lowest energy orbitals first\n2. **Pauli exclusion:** Max 2 electrons per orbital\n3. **Hund\'s rule:** One electron per degenerate orbital before pairing\n\n**Order:** 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶...',
  },
  {
    patterns: [/oxidation/i, /redox/i, /reduction/i],
    answer: '**Redox Reactions** involve electron transfer:\n\n- **Oxidation:** Loss of electrons (increase in oxidation state)\n- **Reduction:** Gain of electrons (decrease in oxidation state)\n- **OIL RIG:** Oxidation Is Loss, Reduction Is Gain\n\nThe substance oxidized is the **reducing agent**, and vice versa.',
  },
  {
    patterns: [/buffer/i, /henderson/i, /hasselbalch/i],
    answer: '**Buffer Solutions** resist pH changes.\n\n**Henderson-Hasselbalch equation:**\npH = pKₐ + log([A⁻]/[HA])\n\n**Common buffers:**\n- Acetic acid / Sodium acetate (pH 3.7-5.8)\n- Phosphate buffer (pH 5.8-8.0)\n- Tris buffer (pH 7.0-9.0)',
  },
  {
    patterns: [/equilibrium/i, /le chatelier/i, /Keq/i],
    answer: '**Chemical Equilibrium:** Rate of forward rxn = Rate of reverse rxn\n\n**Keq = [products] / [reactants]**\n\n**Le Chatelier\'s Principle:** A system at equilibrium will shift to counteract any stress:\n- Add reactant → shifts right\n- Remove product → shifts right\n- Increase T (exothermic) → shifts left',
  },
];

// Suggestion prompts
export const suggestedPrompts = [
  "What is the molar mass of H2SO4?",
  "Tell me about NaCl",
  "What is pH?",
  "How does titration work?",
  "Molar mass of Ca(OH)2",
  "What is a buffer solution?",
  "Explain redox reactions",
  "What is the ideal gas law?",
];

// Main response engine
export function getChemistryResponse(input: string): string {
  const trimmed = input.trim();

  // Check Q&A database FIRST (before formula parsing to avoid "pH" → P+H)
  for (const qa of qaDatabase) {
    if (qa.patterns.some(p => p.test(trimmed))) {
      return qa.answer;
    }
  }

  // Check for pH calculation
  const phMatch = trimmed.match(/pH\s*(?:of\s+)?\[?H\+?\]?\s*=?\s*([\d.eE-]+)/i) || trimmed.match(/(?:calculate|find|compute)\s+pH.*?([\d.eE-]+)\s*M/i);
  if (phMatch) {
    const conc = parseFloat(phMatch[1]);
    if (conc > 0) {
      const pH = -Math.log10(conc);
      return `**pH Calculation:**\n\n[H⁺] = ${conc} M\npH = -log₁₀(${conc}) = **${pH.toFixed(2)}**\n\nThis solution is **${pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral'}**.`;
    }
  }

  // Check for molar mass queries
  const molarMassMatch = trimmed.match(/(?:molar mass|molecular weight|MW|formula weight|mass)\s*(?:of\s+)?([A-Z][A-Za-z0-9()]+)/i);
  if (molarMassMatch) {
    const formula = molarMassMatch[1];
    const result = calculateMolarMass(formula);
    if (result) {
      const breakdown = result.breakdown.map(b => `- **${b.element}**: ${b.count} × ${elements[b.element]?.mass.toFixed(3)} = ${b.mass.toFixed(3)} g/mol`).join('\n');
      const compound = compounds[formula];
      let response = `**Molar Mass of ${formula}:** ${result.mass.toFixed(3)} g/mol\n\n**Breakdown:**\n${breakdown}`;
      if (compound) {
        response += `\n\n**Name:** ${compound.name}\n**Uses:** ${compound.uses}`;
      }
      return response;
    }
  }

  // Check for direct formula input (e.g., "H2O", "NaCl")
  const formulaMatch = trimmed.match(/^([A-Z][A-Za-z0-9()]+)$/);
  if (formulaMatch) {
    const formula = formulaMatch[1];
    const compound = compounds[formula];
    const result = calculateMolarMass(formula);

    if (result) {
      const breakdown = result.breakdown.map(b => `- **${b.element}**: ${b.count} × ${elements[b.element]?.mass.toFixed(3)} = ${b.mass.toFixed(3)} g/mol`).join('\n');
      let response = `**${compound?.name || formula}** (${formula})\n\n**Molar Mass:** ${result.mass.toFixed(3)} g/mol\n\n**Composition:**\n${breakdown}`;
      if (compound) {
        response += `\n\n**Uses:** ${compound.uses}`;
      }
      return response;
    }
  }

  // Check for "tell me about" or "what is [compound]"
  const aboutMatch = trimmed.match(/(?:tell me about|what is|info on|about)\s+([A-Z][A-Za-z0-9()]+)/i);
  if (aboutMatch) {
    const formula = aboutMatch[1];
    const compound = compounds[formula];
    const result = calculateMolarMass(formula);

    if (compound && result) {
      const breakdown = result.breakdown.map(b => `- **${b.element}**: ${b.count} × ${elements[b.element]?.mass.toFixed(3)} = ${b.mass.toFixed(3)} g/mol`).join('\n');
      return `**${compound.name}** (${compound.formula})\n\n**Molar Mass:** ${result.mass.toFixed(3)} g/mol\n\n**Composition:**\n${breakdown}\n\n**Uses:** ${compound.uses}`;
    }
    if (result) {
      const breakdown = result.breakdown.map(b => `- **${b.element}**: ${b.count} × ${elements[b.element]?.mass.toFixed(3)} = ${b.mass.toFixed(3)} g/mol`).join('\n');
      return `**${formula}**\n\n**Molar Mass:** ${result.mass.toFixed(3)} g/mol\n\n**Composition:**\n${breakdown}`;
    }
    // Check if it's an element symbol
    const el = elements[formula] || elements[formula.charAt(0).toUpperCase() + formula.slice(1).toLowerCase()];
    if (el) {
      return `**${el.name}** (${el.symbol})\n\n- **Atomic Number:** ${el.number}\n- **Atomic Mass:** ${el.mass} u`;
    }
  }

  // Check for element lookup
  const elementMatch = trimmed.match(/(?:element|atom)\s+([A-Za-z]+)/i);
  if (elementMatch) {
    const sym = elementMatch[1].charAt(0).toUpperCase() + elementMatch[1].slice(1).toLowerCase();
    const el = elements[sym] || Object.values(elements).find(e => e.name.toLowerCase() === elementMatch[1].toLowerCase());
    if (el) {
      return `**${el.name}** (${el.symbol})\n\n- **Atomic Number:** ${el.number}\n- **Atomic Mass:** ${el.mass} u`;
    }
  }


  // Check if input contains any recognizable formula
  const anyFormula = trimmed.match(/([A-Z][a-z]?(?:\d+)?(?:[A-Z][a-z]?(?:\d+)?)*(?:\((?:[A-Z][a-z]?(?:\d+)?)+\)(?:\d+)?)*)/);
  if (anyFormula) {
    const formula = anyFormula[1];
    const result = calculateMolarMass(formula);
    if (result && result.mass > 0) {
      const breakdown = result.breakdown.map(b => `- **${b.element}**: ${b.count} × ${elements[b.element]?.mass.toFixed(3)} = ${b.mass.toFixed(3)} g/mol`).join('\n');
      const compound = compounds[formula];
      let response = `I found the formula **${formula}** in your question.\n\n**Molar Mass:** ${result.mass.toFixed(3)} g/mol\n\n**Breakdown:**\n${breakdown}`;
      if (compound) {
        response += `\n\n**Name:** ${compound.name}\n**Uses:** ${compound.uses}`;
      }
      return response;
    }
  }

  // Default response
  return `I can help with:\n\n- **Molar mass calculations** — try "molar mass of H2SO4"\n- **Compound info** — try "tell me about NaCl" or just type "H2O"\n- **Element lookup** — try "element Fe"\n- **pH calculations** — try "pH of 0.001 M"\n- **Chemistry concepts** — try "what is molarity?", "how does titration work?", "what is pH?""\n\nType a chemical formula or ask a chemistry question!`;
}
