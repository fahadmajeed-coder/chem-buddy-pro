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
  Sc: { name: 'Scandium', symbol: 'Sc', mass: 44.956, number: 21 },
  Ti: { name: 'Titanium', symbol: 'Ti', mass: 47.867, number: 22 },
  V: { name: 'Vanadium', symbol: 'V', mass: 50.942, number: 23 },
  Cr: { name: 'Chromium', symbol: 'Cr', mass: 51.996, number: 24 },
  Mn: { name: 'Manganese', symbol: 'Mn', mass: 54.938, number: 25 },
  Fe: { name: 'Iron', symbol: 'Fe', mass: 55.845, number: 26 },
  Co: { name: 'Cobalt', symbol: 'Co', mass: 58.933, number: 27 },
  Ni: { name: 'Nickel', symbol: 'Ni', mass: 58.693, number: 28 },
  Cu: { name: 'Copper', symbol: 'Cu', mass: 63.546, number: 29 },
  Zn: { name: 'Zinc', symbol: 'Zn', mass: 65.38, number: 30 },
  Ga: { name: 'Gallium', symbol: 'Ga', mass: 69.723, number: 31 },
  Ge: { name: 'Germanium', symbol: 'Ge', mass: 72.630, number: 32 },
  As: { name: 'Arsenic', symbol: 'As', mass: 74.922, number: 33 },
  Se: { name: 'Selenium', symbol: 'Se', mass: 78.971, number: 34 },
  Br: { name: 'Bromine', symbol: 'Br', mass: 79.904, number: 35 },
  Kr: { name: 'Krypton', symbol: 'Kr', mass: 83.798, number: 36 },
  Rb: { name: 'Rubidium', symbol: 'Rb', mass: 85.468, number: 37 },
  Sr: { name: 'Strontium', symbol: 'Sr', mass: 87.62, number: 38 },
  Y: { name: 'Yttrium', symbol: 'Y', mass: 88.906, number: 39 },
  Zr: { name: 'Zirconium', symbol: 'Zr', mass: 91.224, number: 40 },
  Mo: { name: 'Molybdenum', symbol: 'Mo', mass: 95.95, number: 42 },
  Pd: { name: 'Palladium', symbol: 'Pd', mass: 106.42, number: 46 },
  Ag: { name: 'Silver', symbol: 'Ag', mass: 107.868, number: 47 },
  Cd: { name: 'Cadmium', symbol: 'Cd', mass: 112.414, number: 48 },
  In: { name: 'Indium', symbol: 'In', mass: 114.818, number: 49 },
  Sn: { name: 'Tin', symbol: 'Sn', mass: 118.710, number: 50 },
  Sb: { name: 'Antimony', symbol: 'Sb', mass: 121.760, number: 51 },
  Te: { name: 'Tellurium', symbol: 'Te', mass: 127.60, number: 52 },
  I: { name: 'Iodine', symbol: 'I', mass: 126.904, number: 53 },
  Xe: { name: 'Xenon', symbol: 'Xe', mass: 131.293, number: 54 },
  Cs: { name: 'Cesium', symbol: 'Cs', mass: 132.905, number: 55 },
  Ba: { name: 'Barium', symbol: 'Ba', mass: 137.327, number: 56 },
  La: { name: 'Lanthanum', symbol: 'La', mass: 138.905, number: 57 },
  Ce: { name: 'Cerium', symbol: 'Ce', mass: 140.116, number: 58 },
  W: { name: 'Tungsten', symbol: 'W', mass: 183.84, number: 74 },
  Pt: { name: 'Platinum', symbol: 'Pt', mass: 195.084, number: 78 },
  Au: { name: 'Gold', symbol: 'Au', mass: 196.967, number: 79 },
  Hg: { name: 'Mercury', symbol: 'Hg', mass: 200.592, number: 80 },
  Tl: { name: 'Thallium', symbol: 'Tl', mass: 204.38, number: 81 },
  Pb: { name: 'Lead', symbol: 'Pb', mass: 207.2, number: 82 },
  Bi: { name: 'Bismuth', symbol: 'Bi', mass: 208.980, number: 83 },
  U: { name: 'Uranium', symbol: 'U', mass: 238.029, number: 92 },
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
  // --- NEW COMPOUNDS ---
  'H2O2': { formula: 'H2O2', name: 'Hydrogen Peroxide', uses: 'Disinfectant, bleaching agent, rocket propellant' },
  'NaHCO3': { formula: 'NaHCO3', name: 'Sodium Bicarbonate', uses: 'Baking soda, antacid, fire extinguisher' },
  'Ca(OH)2': { formula: 'Ca(OH)2', name: 'Calcium Hydroxide', uses: 'Slaked lime, water treatment, mortar' },
  'MgSO4': { formula: 'MgSO4', name: 'Magnesium Sulfate', uses: 'Epsom salt, fertilizer, bath salts' },
  'KCl': { formula: 'KCl', name: 'Potassium Chloride', uses: 'Salt substitute, fertilizer, medical IV fluids' },
  'BaSO4': { formula: 'BaSO4', name: 'Barium Sulfate', uses: 'X-ray contrast agent, paint filler, drilling mud' },
  'Na2SO4': { formula: 'Na2SO4', name: 'Sodium Sulfate', uses: 'Detergent filler, glass manufacturing, drying agent' },
  'ZnO': { formula: 'ZnO', name: 'Zinc Oxide', uses: 'Sunscreen, rubber vulcanization, ceramics' },
  'Fe2O3': { formula: 'Fe2O3', name: 'Iron(III) Oxide', uses: 'Rust pigment, thermite, magnetic storage' },
  'Al2O3': { formula: 'Al2O3', name: 'Aluminium Oxide', uses: 'Abrasive (corundum), ceramics, catalyst support' },
  'SiO2': { formula: 'SiO2', name: 'Silicon Dioxide', uses: 'Sand, glass making, desiccant (silica gel)' },
  'CaSO4': { formula: 'CaSO4', name: 'Calcium Sulfate', uses: 'Plaster of Paris, drywall, soil conditioner' },
  'NH4NO3': { formula: 'NH4NO3', name: 'Ammonium Nitrate', uses: 'Fertilizer, cold packs, explosive (ANFO)' },
  'K2Cr2O7': { formula: 'K2Cr2O7', name: 'Potassium Dichromate', uses: 'Oxidizing agent, titrant, leather tanning' },
  'Na2S2O3': { formula: 'Na2S2O3', name: 'Sodium Thiosulfate', uses: 'Photography fixer, dechlorinator, antidote for cyanide' },
  'HCHO': { formula: 'HCHO', name: 'Formaldehyde', uses: 'Preservative (formalin), plastics, disinfectant' },
  'C3H8O3': { formula: 'C3H8O3', name: 'Glycerol', uses: 'Moisturizer, sweetener, nitroglycerin production' },
  'C12H22O11': { formula: 'C12H22O11', name: 'Sucrose', uses: 'Table sugar, food industry, fermentation feedstock' },
  'C6H8O7': { formula: 'C6H8O7', name: 'Citric Acid', uses: 'Food flavoring, cleaning agent, chelating agent' },
  'C2H4O2': { formula: 'C2H4O2', name: 'Glycolaldehyde', uses: 'Simplest sugar, interstellar molecule, organic synthesis' },
  'MgO': { formula: 'MgO', name: 'Magnesium Oxide', uses: 'Refractory material, antacid, insulation' },
  'CaO': { formula: 'CaO', name: 'Calcium Oxide', uses: 'Quicklime, cement, steel refining' },
  'SO2': { formula: 'SO2', name: 'Sulfur Dioxide', uses: 'Food preservative, bleaching agent, precursor to H2SO4' },
  'SO3': { formula: 'SO3', name: 'Sulfur Trioxide', uses: 'Sulfuric acid production, sulfonation agent' },
  'NO2': { formula: 'NO2', name: 'Nitrogen Dioxide', uses: 'Nitric acid production, smog component, oxidizer' },
  'CO': { formula: 'CO', name: 'Carbon Monoxide', uses: 'Reducing agent in metallurgy, syngas, fuel' },
  'PCl5': { formula: 'PCl5', name: 'Phosphorus Pentachloride', uses: 'Chlorinating agent, catalyst, organic synthesis' },
  'POCl3': { formula: 'POCl3', name: 'Phosphoryl Chloride', uses: 'Semiconductor manufacturing, flame retardant production' },
  'KI': { formula: 'KI', name: 'Potassium Iodide', uses: 'Thyroid protection, analytical reagent, table salt additive' },
  'NaF': { formula: 'NaF', name: 'Sodium Fluoride', uses: 'Toothpaste, water fluoridation, insecticide' },
  'LiOH': { formula: 'LiOH', name: 'Lithium Hydroxide', uses: 'CO2 scrubber in spacecraft, lithium grease, battery electrolyte' },
  'Mg(OH)2': { formula: 'Mg(OH)2', name: 'Magnesium Hydroxide', uses: 'Milk of magnesia (antacid/laxative), wastewater treatment' },
  'FeCl3': { formula: 'FeCl3', name: 'Iron(III) Chloride', uses: 'PCB etching, water treatment, catalyst' },
  'SnCl2': { formula: 'SnCl2', name: 'Tin(II) Chloride', uses: 'Reducing agent, tin plating, food antioxidant' },
};

// Common chemistry Q&A
const qaDatabase: { patterns: RegExp[]; answer: string }[] = [
  // --- FUNDAMENTALS ---
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
  // --- THERMODYNAMICS ---
  {
    patterns: [/enthalpy/i, /what is .*\bH\b/i, /heat of reaction/i, /exothermic.*endothermic/i],
    answer: '**Enthalpy (ΔH)** is the heat exchanged at constant pressure.\n\n- **Exothermic (ΔH < 0):** Releases heat (e.g., combustion)\n- **Endothermic (ΔH > 0):** Absorbs heat (e.g., melting ice)\n\n**Hess\'s Law:** ΔH is path-independent — total enthalpy change is the sum of steps.\n\n**Standard enthalpy of formation (ΔHf°):** Heat to form 1 mol compound from elements in standard states.',
  },
  {
    patterns: [/entropy/i, /disorder/i, /second law/i],
    answer: '**Entropy (S)** measures the disorder or randomness of a system.\n\n**Second Law of Thermodynamics:** The total entropy of the universe always increases for spontaneous processes.\n\n- Gases have higher S than liquids > solids\n- More particles = more entropy\n- Higher temperature = more entropy\n\n**ΔS_universe = ΔS_system + ΔS_surroundings > 0** for spontaneous processes.',
  },
  {
    patterns: [/gibbs/i, /free energy/i, /spontan/i],
    answer: '**Gibbs Free Energy (ΔG)** determines spontaneity:\n\n**ΔG = ΔH - TΔS**\n\n- **ΔG < 0:** Spontaneous (favorable)\n- **ΔG = 0:** At equilibrium\n- **ΔG > 0:** Non-spontaneous\n\n**Relationship to equilibrium:** ΔG° = -RT ln(K)\n\nA reaction can be non-spontaneous at one temperature but spontaneous at another!',
  },
  {
    patterns: [/hess.*law/i, /hess/i],
    answer: '**Hess\'s Law:** The total enthalpy change for a reaction is the same regardless of the pathway.\n\n**Application:** If a reaction can be broken into steps:\nΔH_total = ΔH₁ + ΔH₂ + ΔH₃ + ...\n\n**Example:** Finding ΔH for C + ½O₂ → CO using:\n- C + O₂ → CO₂ (ΔH₁ = -393.5 kJ)\n- CO + ½O₂ → CO₂ (ΔH₂ = -283.0 kJ)\n- ΔH = ΔH₁ - ΔH₂ = -110.5 kJ',
  },
  // --- KINETICS ---
  {
    patterns: [/reaction rate/i, /rate law/i, /kinetics/i, /rate of reaction/i],
    answer: '**Chemical Kinetics** studies reaction rates.\n\n**Rate Law:** Rate = k[A]^m[B]^n\n- k = rate constant\n- m, n = reaction orders (determined experimentally)\n\n**Factors affecting rate:**\n- Temperature (↑T = ↑rate, Arrhenius equation)\n- Concentration of reactants\n- Surface area\n- Catalysts\n\n**Arrhenius equation:** k = Ae^(-Ea/RT)',
  },
  {
    patterns: [/activation energy/i, /arrhenius/i, /Ea\b/i],
    answer: '**Activation Energy (Eₐ)** is the minimum energy required for a reaction to occur.\n\n**Arrhenius Equation:** k = Ae^(-Eₐ/RT)\n- k = rate constant\n- A = pre-exponential factor\n- Eₐ = activation energy (J/mol)\n- R = 8.314 J/(mol·K)\n- T = temperature (K)\n\n**Catalysts lower Eₐ** without being consumed, speeding up both forward and reverse reactions equally.',
  },
  {
    patterns: [/reaction order/i, /first order/i, /second order/i, /zero order/i, /half.life/i],
    answer: '**Reaction Orders:**\n\n**Zero order:** Rate = k\n- [A] = [A]₀ - kt\n- t½ = [A]₀ / 2k\n\n**First order:** Rate = k[A]\n- ln[A] = ln[A]₀ - kt\n- t½ = 0.693 / k\n\n**Second order:** Rate = k[A]²\n- 1/[A] = 1/[A]₀ + kt\n- t½ = 1 / (k[A]₀)\n\nPlot concentration data to determine order from linearity.',
  },
  {
    patterns: [/catalyst/i, /catalysis/i, /enzyme/i],
    answer: '**Catalysts** speed up reactions by lowering activation energy (Eₐ) without being consumed.\n\n**Types:**\n- **Homogeneous:** Same phase as reactants (e.g., H⁺ in ester hydrolysis)\n- **Heterogeneous:** Different phase (e.g., Pt surface in catalytic converter)\n- **Enzymes:** Biological catalysts, highly specific, follow Michaelis-Menten kinetics\n\n**Key:** Catalysts do NOT change ΔG or equilibrium position — they only speed up reaching equilibrium.',
  },
  // --- ELECTROCHEMISTRY ---
  {
    patterns: [/electrochemistry/i, /galvanic/i, /voltaic/i, /electrochemical cell/i],
    answer: '**Electrochemistry** studies the relationship between electricity and chemical reactions.\n\n**Galvanic (Voltaic) Cell:** Spontaneous reaction generates electricity\n- Anode (−): Oxidation occurs\n- Cathode (+): Reduction occurs\n- Salt bridge maintains electrical neutrality\n\n**Cell potential:** E°cell = E°cathode − E°anode\n\n**Positive E° = spontaneous**',
  },
  {
    patterns: [/electrolysis/i, /electrolytic/i, /faraday/i],
    answer: '**Electrolysis** uses electrical energy to drive non-spontaneous reactions.\n\n**Faraday\'s Laws:**\n1. Mass deposited ∝ charge passed (m = MIt/nF)\n2. For same charge, mass ∝ equivalent weight\n\n**Faraday constant (F)** = 96,485 C/mol e⁻\n\n**Applications:** Electroplating, aluminum refining, water splitting, chlor-alkali process.',
  },
  {
    patterns: [/nernst/i, /cell potential/i, /electrode potential/i, /standard reduction/i],
    answer: '**Nernst Equation** gives cell potential at non-standard conditions:\n\n**E = E° - (RT/nF)ln(Q)**\n\nAt 25°C: **E = E° - (0.0592/n)log(Q)**\n\nWhere:\n- E° = standard cell potential\n- n = electrons transferred\n- F = 96,485 C/mol\n- Q = reaction quotient\n\n**When Q = K:** E = 0 (equilibrium)',
  },
  // --- ACID-BASE CHEMISTRY ---
  {
    patterns: [/strong acid/i, /list.*acid/i, /common acid/i],
    answer: '**Strong Acids** (fully dissociate in water):\n- **HCl** — Hydrochloric acid\n- **HBr** — Hydrobromic acid\n- **HI** — Hydroiodic acid\n- **HNO₃** — Nitric acid\n- **H₂SO₄** — Sulfuric acid\n- **HClO₄** — Perchloric acid\n\n**Strong Bases:**\n- **NaOH** — Sodium hydroxide\n- **KOH** — Potassium hydroxide\n- **Ca(OH)₂** — Calcium hydroxide\n- **Ba(OH)₂** — Barium hydroxide',
  },
  {
    patterns: [/weak acid/i, /Ka\b/i, /acid dissociation/i, /pKa/i],
    answer: '**Weak Acids** partially dissociate: HA ⇌ H⁺ + A⁻\n\n**Acid Dissociation Constant:** Kₐ = [H⁺][A⁻] / [HA]\n\n**pKₐ = -log(Kₐ)** — smaller pKₐ = stronger acid\n\n**Common weak acids & pKₐ values:**\n- Acetic acid (CH₃COOH): pKₐ = 4.76\n- Carbonic acid (H₂CO₃): pKₐ₁ = 6.35\n- Phosphoric acid (H₃PO₄): pKₐ₁ = 2.15\n- Hydrofluoric acid (HF): pKₐ = 3.17',
  },
  {
    patterns: [/conjugate/i, /acid.base pair/i, /bronsted/i, /lowry/i],
    answer: '**Brønsted-Lowry Theory:**\n- **Acid:** Proton (H⁺) donor\n- **Base:** Proton acceptor\n\n**Conjugate Pairs:**\n- HCl (acid) → Cl⁻ (conjugate base)\n- NH₃ (base) → NH₄⁺ (conjugate acid)\n\n**Key Relationship:** Kₐ × Kᵦ = Kw = 1.0 × 10⁻¹⁴\n\nStrong acid → weak conjugate base, and vice versa.',
  },
  {
    patterns: [/lewis acid/i, /lewis base/i, /lewis theory/i],
    answer: '**Lewis Acid-Base Theory:**\n- **Lewis Acid:** Electron pair acceptor (e.g., BF₃, AlCl₃, H⁺)\n- **Lewis Base:** Electron pair donor (e.g., NH₃, H₂O, OH⁻)\n\nBroader than Brønsted-Lowry — includes reactions without H⁺ transfer.\n\n**Example:** BF₃ + NH₃ → F₃B-NH₃\nBF₃ accepts the lone pair from NH₃.',
  },
  // --- BONDING & STRUCTURE ---
  {
    patterns: [/ionic bond/i, /ionic compound/i, /what is.*ionic/i],
    answer: '**Ionic Bonds** form by transfer of electrons between metals and nonmetals.\n\n**Characteristics:**\n- High melting/boiling points\n- Conduct electricity when dissolved or melted\n- Form crystal lattices\n- Generally soluble in water\n\n**Lattice Energy:** Energy released when ions form a crystal. Higher charge and smaller ions = stronger lattice.',
  },
  {
    patterns: [/covalent bond/i, /covalent compound/i, /what is.*covalent/i, /sharing electron/i],
    answer: '**Covalent Bonds** form by sharing of electron pairs between nonmetals.\n\n**Types:**\n- **Single bond:** 1 shared pair (σ bond)\n- **Double bond:** 2 shared pairs (1σ + 1π)\n- **Triple bond:** 3 shared pairs (1σ + 2π)\n\n**Polar vs Nonpolar:**\n- Polar: Unequal sharing (e.g., H-Cl, ΔEN > 0.4)\n- Nonpolar: Equal sharing (e.g., Cl-Cl, ΔEN ≈ 0)',
  },
  {
    patterns: [/VSEPR/i, /molecular geometry/i, /molecular shape/i, /bond angle/i],
    answer: '**VSEPR Theory** predicts molecular geometry from electron pairs:\n\n| Electron Pairs | Geometry | Bond Angle | Example |\n|---|---|---|---|\n| 2 | Linear | 180° | CO₂ |\n| 3 | Trigonal planar | 120° | BF₃ |\n| 4 | Tetrahedral | 109.5° | CH₄ |\n| 5 | Trigonal bipyramidal | 90°/120° | PCl₅ |\n| 6 | Octahedral | 90° | SF₆ |\n\nLone pairs compress bond angles slightly.',
  },
  {
    patterns: [/hybridization/i, /sp3/i, /sp2/i, /hybrid orbital/i],
    answer: '**Hybridization** mixes atomic orbitals to form new hybrid orbitals:\n\n- **sp** (2 regions): Linear, 180° (e.g., BeCl₂, C₂H₂)\n- **sp²** (3 regions): Trigonal planar, 120° (e.g., BF₃, C₂H₄)\n- **sp³** (4 regions): Tetrahedral, 109.5° (e.g., CH₄, H₂O)\n- **sp³d** (5 regions): Trigonal bipyramidal (e.g., PCl₅)\n- **sp³d²** (6 regions): Octahedral (e.g., SF₆)\n\nCount electron domains (bonds + lone pairs) to determine hybridization.',
  },
  {
    patterns: [/electronegativity/i, /pauling scale/i, /polarity/i],
    answer: '**Electronegativity** measures an atom\'s ability to attract shared electrons.\n\n**Pauling Scale** (most common):\n- F = 4.0 (highest)\n- O = 3.5, N = 3.0, Cl = 3.0\n- C = 2.5, H = 2.1\n- Na = 0.9, Cs = 0.7 (lowest)\n\n**Bond polarity from ΔEN:**\n- 0-0.4: Nonpolar covalent\n- 0.4-1.7: Polar covalent\n- >1.7: Ionic',
  },
  {
    patterns: [/intermolecular/i, /van der waals/i, /hydrogen bond/i, /dipole/i, /london/i],
    answer: '**Intermolecular Forces** (weakest to strongest):\n\n1. **London Dispersion Forces:** Present in ALL molecules. Strength ↑ with molecular size/surface area.\n2. **Dipole-Dipole:** Between polar molecules. Align +/- ends.\n3. **Hydrogen Bonding:** Special dipole-dipole when H bonds to F, O, or N. Very strong.\n\n**Effects:** ↑ IMFs → ↑ boiling point, ↑ viscosity, ↑ surface tension\n\n**Example:** H₂O has high BP (100°C) due to hydrogen bonding despite low MW.',
  },
  // --- ORGANIC CHEMISTRY ---
  {
    patterns: [/functional group/i, /organic.*group/i],
    answer: '**Common Functional Groups:**\n\n- **-OH:** Hydroxyl (alcohols)\n- **-COOH:** Carboxyl (carboxylic acids)\n- **-NH₂:** Amino (amines)\n- **C=O:** Carbonyl (aldehydes/ketones)\n- **-COO-:** Ester\n- **-O-:** Ether\n- **-X (F,Cl,Br,I):** Halide (alkyl halides)\n- **-SH:** Thiol\n- **C=C:** Alkene\n- **C≡C:** Alkyne\n\nFunctional groups determine chemical reactivity and properties.',
  },
  {
    patterns: [/alkane/i, /alkene/i, /alkyne/i, /hydrocarbon/i, /saturated/i, /unsaturated/i],
    answer: '**Hydrocarbons:**\n\n**Alkanes (CₙH₂ₙ₊₂):** Single bonds only, saturated\n- Methane (CH₄), Ethane (C₂H₆), Propane (C₃H₈)\n\n**Alkenes (CₙH₂ₙ):** One C=C double bond, unsaturated\n- Ethene (C₂H₄), Propene (C₃H₆)\n\n**Alkynes (CₙH₂ₙ₋₂):** One C≡C triple bond\n- Ethyne/Acetylene (C₂H₂)\n\n**Naming:** meth- (1C), eth- (2C), prop- (3C), but- (4C), pent- (5C), hex- (6C)',
  },
  {
    patterns: [/isomer/i, /structural isomer/i, /stereoisomer/i],
    answer: '**Isomers** are molecules with the same formula but different arrangements.\n\n**Types:**\n1. **Structural (Constitutional):** Different connectivity (e.g., butane vs isobutane)\n2. **Geometric (cis/trans):** Different spatial arrangement around C=C\n3. **Enantiomers:** Mirror images, not superimposable (chirality)\n4. **Diastereomers:** Stereoisomers that aren\'t mirror images\n\n**Chirality:** A carbon with 4 different substituents is a chiral center (R/S designation).',
  },
  {
    patterns: [/polymer/i, /polymerization/i, /monomer/i],
    answer: '**Polymers** are large molecules made of repeating monomer units.\n\n**Types of Polymerization:**\n- **Addition:** Monomers add without losing atoms (e.g., polyethylene from ethylene)\n- **Condensation:** Monomers join with loss of small molecule like H₂O (e.g., nylon, polyester)\n\n**Common Polymers:**\n- **Polyethylene (PE):** Bags, bottles\n- **PVC:** Pipes, cables\n- **Nylon:** Fibers, textiles\n- **Proteins:** Amino acid polymers\n- **DNA:** Nucleotide polymers',
  },
  // --- NUCLEAR CHEMISTRY ---
  {
    patterns: [/radioactiv/i, /nuclear decay/i, /alpha.*decay/i, /beta.*decay/i, /gamma.*ray/i],
    answer: '**Radioactive Decay** — unstable nuclei emit radiation:\n\n- **Alpha (α):** Emits ⁴₂He. Mass -4, atomic # -2. Stopped by paper.\n- **Beta (β⁻):** Neutron → proton + electron. Atomic # +1. Stopped by aluminum.\n- **Beta (β⁺):** Proton → neutron + positron. Atomic # -1.\n- **Gamma (γ):** High-energy photon. No mass/charge change. Needs lead/concrete.\n\n**Half-life:** t½ — time for half the sample to decay.\nN = N₀(½)^(t/t½)',
  },
  {
    patterns: [/fission/i, /fusion/i, /nuclear energy/i],
    answer: '**Nuclear Fission:** Heavy nucleus splits into lighter nuclei + energy.\n- Used in nuclear reactors and atomic bombs\n- Example: ²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n + energy\n\n**Nuclear Fusion:** Light nuclei combine to form heavier nucleus + energy.\n- Powers the sun and stars\n- Example: ²H + ³H → ⁴He + n + energy\n\n**E = mc²** — mass converted to enormous energy in both processes.',
  },
  // --- SOLUTIONS & COLLIGATIVE PROPERTIES ---
  {
    patterns: [/solubility/i, /soluble/i, /insoluble/i, /dissolve/i, /precipitation/i, /solubility rule/i],
    answer: '**Solubility Rules (in water):**\n\n**Always Soluble:**\n- All Na⁺, K⁺, NH₄⁺ salts\n- All nitrates (NO₃⁻) and acetates\n- Most chlorides (except AgCl, PbCl₂, Hg₂Cl₂)\n\n**Generally Insoluble:**\n- Most carbonates (CO₃²⁻), phosphates (PO₄³⁻)\n- Most sulfides (S²⁻), hydroxides (OH⁻)\n- Exceptions: Na⁺, K⁺, NH₄⁺, Ca²⁺, Ba²⁺ salts\n\n**Ksp** (solubility product) quantifies equilibrium of sparingly soluble salts.',
  },
  {
    patterns: [/colligative/i, /boiling point elevation/i, /freezing point depression/i, /osmotic/i, /raoult/i],
    answer: '**Colligative Properties** depend only on the number of solute particles:\n\n1. **Boiling Point Elevation:** ΔTb = iKbm\n2. **Freezing Point Depression:** ΔTf = iKfm\n3. **Osmotic Pressure:** π = iMRT\n4. **Vapor Pressure Lowering:** Raoult\'s Law: P = x·P°\n\nWhere:\n- i = van\'t Hoff factor (# particles per formula unit)\n- Kb, Kf = molal constants\n- m = molality',
  },
  {
    patterns: [/molality/i, /molal\b/i],
    answer: '**Molality (m)** = moles of solute / kilograms of solvent\n\nUnlike molarity, molality is **temperature-independent** because it uses mass instead of volume.\n\n**Example:** 1 mol NaCl in 1 kg water = 1 m NaCl\n\n**Used in:** Colligative property calculations (ΔTb, ΔTf)',
  },
  // --- STOICHIOMETRY ---
  {
    patterns: [/stoichiometry/i, /mole ratio/i, /limiting reagent/i, /limiting reactant/i],
    answer: '**Stoichiometry** uses mole ratios from balanced equations to calculate amounts.\n\n**Steps:**\n1. Balance the equation\n2. Convert given amount to moles\n3. Use mole ratio to find moles of desired substance\n4. Convert to desired units\n\n**Limiting Reagent:** The reactant that runs out first, determining max product.\n\n**Percent Yield** = (actual yield / theoretical yield) × 100%',
  },
  {
    patterns: [/empirical formula/i, /molecular formula/i],
    answer: '**Empirical Formula:** Simplest whole-number ratio of atoms.\n**Molecular Formula:** Actual number of atoms in a molecule.\n\n**Finding Empirical Formula from % composition:**\n1. Assume 100g sample → convert % to grams\n2. Convert grams to moles for each element\n3. Divide all by the smallest # of moles\n4. Round to nearest whole numbers\n\n**Example:** C = 40%, H = 6.7%, O = 53.3%\n→ CH₂O (empirical) → C₆H₁₂O₆ (molecular, if MW = 180)',
  },
  // --- SPECTROSCOPY ---
  {
    patterns: [/beer.lambert/i, /beer.*law/i, /absorbance/i, /spectrophotometry/i],
    answer: '**Beer-Lambert Law:** A = εlc\n\nWhere:\n- A = absorbance (no units)\n- ε = molar absorptivity (L/(mol·cm))\n- l = path length (cm)\n- c = concentration (mol/L)\n\n**Transmittance:** T = I/I₀\n**A = -log(T) = 2 - log(%T)**\n\nUsed in UV-Vis spectrophotometry to determine concentration from absorbance.',
  },
  {
    patterns: [/chromatography/i, /HPLC/i, /GC\b/i, /thin layer/i, /TLC/i],
    answer: '**Chromatography** separates mixtures based on differential partitioning.\n\n**Types:**\n- **TLC (Thin Layer):** Quick qualitative analysis, Rf = distance of spot / distance of solvent\n- **Column:** Gravity-driven separation through packed column\n- **HPLC:** High-pressure liquid chromatography, quantitative analysis\n- **GC (Gas):** Volatile compounds, uses carrier gas\n- **Ion Exchange:** Separates ions by charge\n\n**Key terms:** Mobile phase (solvent), stationary phase (solid/liquid support)',
  },
  // --- ANALYTICAL CHEMISTRY ---
  {
    patterns: [/standard deviation/i, /precision/i, /accuracy/i, /significant figure/i],
    answer: '**Precision vs Accuracy:**\n- **Precision:** How close repeated measurements are to each other\n- **Accuracy:** How close a measurement is to the true value\n\n**Significant Figures Rules:**\n1. All non-zero digits are significant\n2. Zeros between non-zero digits are significant\n3. Leading zeros are NOT significant\n4. Trailing zeros after decimal point ARE significant\n\n**Standard Deviation:** s = √[Σ(xᵢ - x̄)² / (n-1)]',
  },
  {
    patterns: [/ppm\b/i, /ppb\b/i, /parts per/i, /concentration unit/i],
    answer: '**Concentration Units:**\n\n- **Molarity (M):** mol/L\n- **Molality (m):** mol/kg solvent\n- **Normality (N):** eq/L\n- **ppm:** mg/L or mg/kg (1 ppm = 1 mg/L for dilute aqueous)\n- **ppb:** µg/L or µg/kg\n- **% w/v:** g solute per 100 mL solution\n- **% w/w:** g solute per 100 g solution\n- **% v/v:** mL solute per 100 mL solution\n\n**Conversions:** ppm = mg/L; ppb = µg/L; 1 ppm = 1000 ppb',
  },
  // --- ADDITIONAL CONCEPTS ---
  {
    patterns: [/molar volume/i, /STP/i, /standard temperature/i],
    answer: '**Standard Temperature and Pressure (STP):**\n- Temperature: 0°C (273.15 K)\n- Pressure: 1 atm (101.325 kPa)\n\n**At STP:** 1 mole of any ideal gas occupies **22.4 L**\n\n**At SATP (25°C, 1 bar):** 1 mol gas ≈ 24.8 L\n\nUseful for converting between moles and volume of gases.',
  },
  {
    patterns: [/dalton/i, /partial pressure/i],
    answer: '**Dalton\'s Law of Partial Pressures:**\n\nP_total = P₁ + P₂ + P₃ + ...\n\nEach gas in a mixture exerts pressure independently.\n\n**Mole fraction:** χᵢ = nᵢ / n_total\n**Partial pressure:** Pᵢ = χᵢ × P_total\n\n**Example:** Air at 1 atm:\n- P(N₂) ≈ 0.78 atm\n- P(O₂) ≈ 0.21 atm',
  },
  {
    patterns: [/boyle/i, /charles/i, /gay.lussac/i, /combined gas/i],
    answer: '**Gas Laws:**\n\n**Boyle\'s Law** (constant T): P₁V₁ = P₂V₂\n**Charles\'s Law** (constant P): V₁/T₁ = V₂/T₂\n**Gay-Lussac\'s Law** (constant V): P₁/T₁ = P₂/T₂\n**Combined Gas Law:** P₁V₁/T₁ = P₂V₂/T₂\n**Avogadro\'s Law** (constant T,P): V₁/n₁ = V₂/n₂\n\nAll combine into: **PV = nRT** (ideal gas law)',
  },
  {
    patterns: [/crystal field/i, /ligand field/i, /coordination/i, /complex ion/i, /transition metal.*color/i],
    answer: '**Coordination Chemistry:**\n\nTransition metals form **complex ions** with ligands (Lewis bases).\n\n**Common Ligands:** H₂O, NH₃, CN⁻, Cl⁻, OH⁻, CO, en (ethylenediamine)\n\n**Crystal Field Theory:** Ligands split d-orbital energy levels.\n- **Strong field (low spin):** CN⁻, CO, NH₃ → large splitting → diamagnetic\n- **Weak field (high spin):** H₂O, Cl⁻, F⁻ → small splitting → paramagnetic\n\n**Colors arise** from d-d electron transitions absorbing visible light.',
  },
  {
    patterns: [/periodic trend/i, /atomic radius/i, /ionization energy/i, /electron affinity/i],
    answer: '**Periodic Trends:**\n\n**Atomic Radius:** ↓ group: increases (more shells) → period: decreases (more protons)\n**Ionization Energy:** ↓ group: decreases → period: increases\n**Electron Affinity:** ↓ group: less negative → period: more negative (halogens highest)\n**Electronegativity:** ↓ group: decreases → period: increases (F is highest)\n\n**Exceptions:** Noble gases have very low EA. Group 2/15 have higher IE than expected (filled/half-filled stability).',
  },
  {
    patterns: [/valence/i, /valency/i, /oxidation state/i, /oxidation number/i],
    answer: '**Oxidation State Rules:**\n\n1. Free elements = 0\n2. Monoatomic ions = charge\n3. H = +1 (except metal hydrides: -1)\n4. O = -2 (except peroxides: -1, OF₂: +2)\n5. F = always -1\n6. Sum of oxidation states = charge of species\n\n**Common oxidation states:**\n- Na, K: +1 | Ca, Mg: +2\n- Fe: +2, +3 | Cu: +1, +2\n- Mn: +2, +4, +7 | Cr: +3, +6',
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
  "Explain Gibbs free energy",
  "What are functional groups?",
  "Explain electronegativity",
  "What is Beer-Lambert law?",
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

  // Check for pOH calculation
  const pohMatch = trimmed.match(/pOH\s*(?:of\s+)?\[?OH-?\]?\s*=?\s*([\d.eE-]+)/i);
  if (pohMatch) {
    const conc = parseFloat(pohMatch[1]);
    if (conc > 0) {
      const pOH = -Math.log10(conc);
      const pH = 14 - pOH;
      return `**pOH Calculation:**\n\n[OH⁻] = ${conc} M\npOH = -log₁₀(${conc}) = **${pOH.toFixed(2)}**\npH = 14 - pOH = **${pH.toFixed(2)}**\n\nThis solution is **${pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral'}**.`;
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

  // Default response — no longer shows search online since AI mode handles that
  return `I couldn't find a specific answer for that in my offline database.\n\nI can help with:\n- **Molar mass calculations** — try "molar mass of H2SO4"\n- **Compound info** — try "tell me about NaCl" or just type "H2O"\n- **Element lookup** — try "element Fe"\n- **pH calculations** — try "pH of 0.001 M"\n- **Chemistry concepts** — try "what is molarity?"\n- **Thermodynamics** — try "what is Gibbs free energy?"\n- **Kinetics** — try "what is activation energy?"\n- **Organic chemistry** — try "what are functional groups?"\n- **Electrochemistry** — try "what is the Nernst equation?"\n\n💡 **Tip:** Switch to AI mode for unlimited chemistry questions!`;
}
