// Config-driven conversion definitions for chemistry unit conversions

export interface ConversionField {
  key: string;
  label: string;
  unit: string;
  placeholder?: string;
}

export interface ConversionDef {
  id: string;
  label: string;
  desc: string;
  fields: ConversionField[];
  calculate: (get: (k: string) => number) => { value: string; unit: string } | null;
  inventoryAutoFill?: boolean;
  hints?: (inputs: Record<string, string>) => string[];
}

export interface ConversionCategory {
  id: string;
  label: string;
  icon: string;
  conversions: ConversionDef[];
}

// Helper
const g = (get: (k: string) => number, k: string) => get(k);
const safe = (v: number) => isFinite(v) && !isNaN(v);

const AVOGADRO = 6.02214076e23;
const R_CONST = 0.08206; // L·atm/(mol·K)
const R_J = 8.314; // J/(mol·K)
const FARADAY = 96485; // C/mol

export const conversionCategories: ConversionCategory[] = [
  // ─── CONCENTRATION ───
  {
    id: 'concentration',
    label: 'Concentration',
    icon: '🧪',
    conversions: [
      {
        id: 'M_to_N', label: 'M → N', desc: 'N = M × n-factor',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        calculate: (get) => {
          const m = get('molarity'), n = get('nfactor');
          return m && n ? { value: (m * n).toFixed(4), unit: 'N' } : null;
        },
      },
      {
        id: 'N_to_M', label: 'N → M', desc: 'M = N / n-factor',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        calculate: (get) => {
          const n = get('normality'), nf = get('nfactor');
          return n && nf ? { value: (n / nf).toFixed(4), unit: 'M' } : null;
        },
      },
      {
        id: 'N_to_percent', label: 'N → %w/v', desc: '%w/v = (N × EW) / 10, EW = MW / n-factor',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const n = get('normality'), mw = get('mw'), nf = get('nfactor');
          if (!n || !mw || !nf) return null;
          const ew = mw / nf;
          return { value: ((n * ew) / 10).toFixed(4), unit: '%w/v' };
        },
      },
      {
        id: 'percent_to_N', label: '%w/v → N', desc: 'N = (%w/v × 10 × n-factor) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw'), nf = get('nfactor');
          if (!pct || !mw || !nf) return null;
          return { value: ((pct * 10 * nf) / mw).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'M_to_F', label: 'M → F', desc: 'F ≈ M (for strong electrolytes)',
        fields: [{ key: 'molarity', label: 'Molarity', unit: 'M' }],
        calculate: (get) => {
          const m = get('molarity');
          return m ? { value: m.toFixed(4), unit: 'F' } : null;
        },
      },
      {
        id: 'ppm_to_M', label: 'ppm → M', desc: 'M = ppm / (MW × 1000)',
        fields: [
          { key: 'ppm', label: 'Concentration', unit: 'ppm' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const ppm = get('ppm'), mw = get('mw');
          return ppm && mw ? { value: (ppm / (mw * 1000)).toFixed(6), unit: 'M' } : null;
        },
      },
      {
        id: 'ppb_to_M', label: 'ppb → M', desc: 'M = ppb / (MW × 10⁶)',
        fields: [
          { key: 'ppb', label: 'Concentration', unit: 'ppb' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const ppb = get('ppb'), mw = get('mw');
          return ppb && mw ? { value: (ppb / (mw * 1e6)).toFixed(9), unit: 'M' } : null;
        },
      },
      {
        id: 'ppt_to_M', label: 'ppt → M', desc: 'M = ppt / (MW × 10⁹)',
        fields: [
          { key: 'ppt', label: 'Concentration', unit: 'ppt' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const ppt = get('ppt'), mw = get('mw');
          return ppt && mw ? { value: (ppt / (mw * 1e9)).toFixed(12), unit: 'M' } : null;
        },
      },
      {
        id: 'percent_to_M', label: '%w/v → M', desc: 'M = (%w/v × 10) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw');
          return pct && mw ? { value: ((pct * 10) / mw).toFixed(4), unit: 'M' } : null;
        },
      },
      {
        id: 'mgml_to_M', label: 'mg/mL → M', desc: 'M = (mg/mL) / MW',
        fields: [
          { key: 'mgml', label: 'Concentration', unit: 'mg/mL' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const c = get('mgml'), mw = get('mw');
          return c && mw ? { value: (c / mw).toFixed(6), unit: 'M' } : null;
        },
      },
      {
        id: 'ugml_to_M', label: 'µg/mL → M', desc: 'M = (µg/mL) / (MW × 1000)',
        fields: [
          { key: 'ugml', label: 'Concentration', unit: 'µg/mL' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const c = get('ugml'), mw = get('mw');
          return c && mw ? { value: (c / (mw * 1000)).toFixed(9), unit: 'M' } : null;
        },
      },
      {
        id: 'gl_to_M', label: 'g/L → M', desc: 'M = (g/L) / MW',
        fields: [
          { key: 'gl', label: 'Concentration', unit: 'g/L' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const c = get('gl'), mw = get('mw');
          return c && mw ? { value: (c / mw).toFixed(6), unit: 'M' } : null;
        },
      },
      {
        id: 'mgdl_to_mmolL', label: 'mg/dL → mmol/L', desc: 'mmol/L = (mg/dL × 10) / MW',
        fields: [
          { key: 'mgdl', label: 'Concentration', unit: 'mg/dL' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const c = get('mgdl'), mw = get('mw');
          return c && mw ? { value: ((c * 10) / mw).toFixed(4), unit: 'mmol/L' } : null;
        },
      },
      {
        id: 'meqL_to_mmolL', label: 'meq/L → mmol/L', desc: 'mmol/L = meq/L / valence',
        fields: [
          { key: 'meq', label: 'Concentration', unit: 'meq/L' },
          { key: 'valence', label: 'Valence (charge)', unit: '' },
        ],
        calculate: (get) => {
          const meq = get('meq'), v = get('valence');
          return meq && v ? { value: (meq / v).toFixed(4), unit: 'mmol/L' } : null;
        },
      },
      {
        id: 'molality', label: 'Molality', desc: 'm = mol solute / kg solvent',
        fields: [
          { key: 'moles', label: 'Moles of Solute', unit: 'mol' },
          { key: 'massSolvent', label: 'Mass of Solvent', unit: 'g' },
        ],
        calculate: (get) => {
          const mol = get('moles'), mass = get('massSolvent');
          return mol && mass ? { value: (mol / (mass / 1000)).toFixed(4), unit: 'm (mol/kg)' } : null;
        },
      },
      {
        id: 'mole_fraction', label: 'Mole Fraction', desc: 'χ = n_solute / (n_solute + n_solvent)',
        fields: [
          { key: 'nSolute', label: 'Moles of Solute', unit: 'mol' },
          { key: 'nSolvent', label: 'Moles of Solvent', unit: 'mol' },
        ],
        calculate: (get) => {
          const ns = get('nSolute'), nv = get('nSolvent');
          return ns && nv ? { value: (ns / (ns + nv)).toFixed(6), unit: 'χ' } : null;
        },
      },
      {
        id: 'osmolarity', label: 'Osmolarity', desc: 'Osm = M × i (van\'t Hoff factor)',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'i', label: 'van\'t Hoff factor (i)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const m = get('molarity'), i = get('i') || 1;
          return m ? { value: (m * i).toFixed(4), unit: 'Osm/L' } : null;
        },
      },
      {
        id: 'mass_frac_to_mole_frac', label: 'Mass → Mole Frac', desc: 'Convert mass fraction to mole fraction',
        fields: [
          { key: 'massFrac', label: 'Mass Fraction (solute)', unit: '' },
          { key: 'mwSolute', label: 'MW Solute', unit: 'g/mol' },
          { key: 'mwSolvent', label: 'MW Solvent', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const w = get('massFrac'), mw1 = get('mwSolute'), mw2 = get('mwSolvent');
          if (!w || !mw1 || !mw2) return null;
          const n1 = w / mw1;
          const n2 = (1 - w) / mw2;
          return { value: (n1 / (n1 + n2)).toFixed(6), unit: 'χ' };
        },
      },
    ],
  },

  // ─── NORMALITY & PERCENT ───
  {
    id: 'normality_percent',
    label: 'Normality & %',
    icon: '⚗️',
    conversions: [
      {
        id: 'np_N_to_wv', label: 'N → %w/v', desc: '%w/v = (N × EW) / 10, EW = MW / n-factor',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const n = get('normality'), mw = get('mw'), nf = get('nfactor');
          if (!n || !mw || !nf) return null;
          return { value: ((n * mw) / (nf * 10)).toFixed(4), unit: '%w/v' };
        },
      },
      {
        id: 'np_wv_to_N', label: '%w/v → N', desc: 'N = (% × d × 10 × n-factor) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Density', unit: 'g/mL', placeholder: '1' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw'), nf = get('nfactor'), d = get('density') || 1;
          if (!pct || !mw || !nf) return null;
          return { value: ((pct * d * 10 * nf) / mw).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'np_N_to_ww', label: 'N → %w/w', desc: '% = (N × EW × 100) / (d × 1000)',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const n = get('normality'), mw = get('mw'), nf = get('nfactor'), d = get('density');
          if (!n || !mw || !nf || !d) return null;
          const ew = mw / nf;
          return { value: ((n * ew * 100) / (d * 1000)).toFixed(4), unit: '%w/w' };
        },
      },
      {
        id: 'np_ww_to_N', label: '%w/w → N', desc: 'N = (% × d × 1000) / (EW × 100)',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/w' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw'), nf = get('nfactor'), d = get('density');
          if (!pct || !mw || !nf || !d) return null;
          const ew = mw / nf;
          return { value: ((pct * d * 1000) / (ew * 100)).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'np_N_to_ppm', label: 'N → ppm', desc: 'ppm = N × EW × 1000',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const n = get('normality'), mw = get('mw'), nf = get('nfactor');
          if (!n || !mw || !nf) return null;
          const ew = mw / nf;
          return { value: (n * ew * 1000).toFixed(4), unit: 'ppm' };
        },
      },
      {
        id: 'np_ppm_to_N', label: 'ppm → N', desc: 'N = ppm / (EW × 1000)',
        fields: [
          { key: 'ppm', label: 'Concentration', unit: 'ppm' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const ppm = get('ppm'), mw = get('mw'), nf = get('nfactor');
          if (!ppm || !mw || !nf) return null;
          const ew = mw / nf;
          return { value: (ppm / (ew * 1000)).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'np_N_to_mgL', label: 'N → mg/L', desc: 'mg/L = N × EW × 1000',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const n = get('normality'), mw = get('mw'), nf = get('nfactor');
          if (!n || !mw || !nf) return null;
          const ew = mw / nf;
          return { value: (n * ew * 1000).toFixed(4), unit: 'mg/L' };
        },
      },
      {
        id: 'np_mgL_to_N', label: 'mg/L → N', desc: 'N = (mg/L) / (EW × 1000)',
        fields: [
          { key: 'mgL', label: 'Concentration', unit: 'mg/L' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const c = get('mgL'), mw = get('mw'), nf = get('nfactor');
          if (!c || !mw || !nf) return null;
          const ew = mw / nf;
          return { value: (c / (ew * 1000)).toFixed(4), unit: 'N' };
        },
      },
    ],
  },

  // ─── DILUTION & PREP ───
  {
    id: 'dilution',
    label: 'Dilution & Prep',
    icon: '💧',
    conversions: [
      {
        id: 'dilution', label: 'Dilution', desc: 'C₁V₁ = C₂V₂',
        fields: [
          { key: 'c1', label: 'C₁ (Initial Conc.)', unit: 'M' },
          { key: 'v1', label: 'V₁ (Initial Vol.)', unit: 'mL' },
          { key: 'c2', label: 'C₂ (Final Conc.)', unit: 'M', placeholder: 'Leave blank to solve' },
          { key: 'v2', label: 'V₂ (Final Vol.)', unit: 'mL', placeholder: 'Leave blank to solve' },
        ],
        calculate: (get) => {
          const c1 = get('c1'), v1 = get('v1'), c2 = get('c2'), v2 = get('v2');
          if (c1 && v1 && c2) return { value: ((c1 * v1) / c2).toFixed(2), unit: 'mL (V₂)' };
          if (c1 && v1 && v2) return { value: ((c1 * v1) / v2).toFixed(4), unit: 'M (C₂)' };
          return null;
        },
      },
      {
        id: 'vol_for_N', label: 'Vol for N', desc: 'Volume needed for desired normality',
        fields: [
          { key: 'mass', label: 'Mass of Solute', unit: 'g' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '', placeholder: '1' },
          { key: 'normality', label: 'Desired Normality', unit: 'N' },
          { key: 'purity', label: 'Purity', unit: '%', placeholder: '100' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const mass = get('mass'), mw = get('mw'), nf = get('nfactor') || 1, n = get('normality'), pur = get('purity') || 100;
          if (!mass || !mw || !n) return null;
          const eqWt = mw / nf;
          const effMass = mass * (pur / 100);
          return { value: ((effMass / eqWt) / n * 1000).toFixed(2), unit: 'mL' };
        },
      },
      {
        id: 'N_from_mass', label: 'N from Mass', desc: 'N = (mass × purity / EqWt) / V(L)',
        fields: [
          { key: 'mass', label: 'Mass of Solute', unit: 'g' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '', placeholder: '1' },
          { key: 'volume', label: 'Volume of Solution', unit: 'mL' },
          { key: 'purity', label: 'Purity', unit: '%', placeholder: '100' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const mass = get('mass'), mw = get('mw'), nf = get('nfactor') || 1, vol = get('volume'), pur = get('purity') || 100;
          if (!mass || !mw || !vol) return null;
          const eqWt = mw / nf;
          const effMass = mass * (pur / 100);
          return { value: ((effMass / eqWt) / (vol / 1000)).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'N_from_pct', label: 'N from %', desc: 'N = (% × d × 10 × n) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%' },
          { key: 'density', label: 'Density', unit: 'g/mL' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '', placeholder: '1' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), d = get('density'), mw = get('mw'), nf = get('nfactor') || 1;
          return pct && d && mw ? { value: ((pct * d * 10 * nf) / mw).toFixed(4), unit: 'N' } : null;
        },
      },
      {
        id: 'vol_pct_to_pct', label: '% → % Vol', desc: 'V₁ = (C₂ × V₂ × d₂) / (C₁ × d₁)',
        fields: [
          { key: 'c1pct', label: 'Initial Concentration', unit: '%' },
          { key: 'c2pct', label: 'Desired Concentration', unit: '%' },
          { key: 'v2', label: 'Final Volume Needed', unit: 'mL' },
          { key: 'density', label: 'Density (stock)', unit: 'g/mL', placeholder: '1' },
          { key: 'density2', label: 'Density (final)', unit: 'g/mL', placeholder: '1' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const c1 = get('c1pct'), c2 = get('c2pct'), v2 = get('v2'), d1 = get('density') || 1, d2 = get('density2') || 1;
          return c1 && c2 && v2 ? { value: ((c2 * v2 * d2) / (c1 * d1)).toFixed(2), unit: 'mL' } : null;
        },
      },
      {
        id: 'gm_from_pellet', label: 'gm for %', desc: 'mass = (% × V × d) / purity',
        fields: [
          { key: 'desiredPct', label: 'Desired Concentration', unit: '%' },
          { key: 'volume', label: 'Volume of Solution', unit: 'mL' },
          { key: 'density', label: 'Density of Solution', unit: 'g/mL', placeholder: '1' },
          { key: 'purity', label: 'Purity of Pellet', unit: '%', placeholder: '100' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('desiredPct'), vol = get('volume'), d = get('density') || 1, pur = get('purity') || 100;
          return pct && vol ? { value: ((pct * vol * d) / pur).toFixed(4), unit: 'g' } : null;
        },
      },
    ],
  },

  // ─── PERCENT CONCENTRATIONS ───
  {
    id: 'percent',
    label: 'Percent',
    icon: '%',
    conversions: [
      {
        id: 'pct_wv', label: '%w/v', desc: '%w/v = (mass × purity / vol) × 100',
        fields: [
          { key: 'mass', label: 'Mass of Solute', unit: 'g' },
          { key: 'volume', label: 'Volume of Solution', unit: 'mL' },
          { key: 'purity', label: 'Purity', unit: '%', placeholder: '100' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const mass = get('mass'), vol = get('volume'), pur = get('purity') || 100;
          const eff = mass * (pur / 100);
          return mass && vol ? { value: ((eff / vol) * 100).toFixed(4), unit: '%w/v' } : null;
        },
      },
      {
        id: 'pct_ww', label: '%w/w', desc: '%w/w = (mass solute × purity / mass solution) × 100',
        fields: [
          { key: 'massSolute', label: 'Mass of Solute', unit: 'g' },
          { key: 'massSolution', label: 'Mass of Solution', unit: 'g', placeholder: 'Or use vol × density' },
          { key: 'volume', label: 'Volume (if no mass)', unit: 'mL', placeholder: 'Optional' },
          { key: 'density', label: 'Density', unit: 'g/mL', placeholder: 'For vol → mass' },
          { key: 'purity', label: 'Purity', unit: '%', placeholder: '100' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const ms = get('massSolute'), pur = get('purity') || 100;
          const eff = ms * (pur / 100);
          const msol = get('massSolution') || (get('volume') && get('density') ? get('volume') * get('density') : 0);
          return ms && msol ? { value: ((eff / msol) * 100).toFixed(4), unit: '%w/w' } : null;
        },
      },
      {
        id: 'pct_vv', label: '%v/v', desc: '%v/v = (vol solute / vol solution) × 100',
        fields: [
          { key: 'volSolute', label: 'Volume of Solute', unit: 'mL', placeholder: 'Or use mass ÷ density' },
          { key: 'volSolution', label: 'Volume of Solution', unit: 'mL' },
          { key: 'mass', label: 'Mass (if no vol)', unit: 'g', placeholder: 'Optional' },
          { key: 'density', label: 'Density', unit: 'g/mL', placeholder: 'For mass → vol' },
        ],
        calculate: (get) => {
          const vs = get('volSolute') || (get('mass') && get('density') ? get('mass') / get('density') : 0);
          const vt = get('volSolution');
          return vs && vt ? { value: ((vs / vt) * 100).toFixed(4), unit: '%v/v' } : null;
        },
      },
    ],
  },

  // ─── MASS / MOLE ───
  {
    id: 'mass_mole',
    label: 'Mass & Mole',
    icon: '⚖️',
    conversions: [
      {
        id: 'mass_to_mol', label: 'Mass → Moles', desc: 'mol = mass / MW',
        fields: [
          { key: 'mass', label: 'Mass', unit: 'g' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const m = get('mass'), mw = get('mw');
          return m && mw ? { value: (m / mw).toFixed(6), unit: 'mol' } : null;
        },
      },
      {
        id: 'mol_to_mass', label: 'Moles → Mass', desc: 'mass = mol × MW',
        fields: [
          { key: 'moles', label: 'Moles', unit: 'mol' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const mol = get('moles'), mw = get('mw');
          return mol && mw ? { value: (mol * mw).toFixed(4), unit: 'g' } : null;
        },
      },
      {
        id: 'mass_to_molecules', label: 'Mass → Molecules', desc: 'N = (mass / MW) × Nᴀ',
        fields: [
          { key: 'mass', label: 'Mass', unit: 'g' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const m = get('mass'), mw = get('mw');
          return m && mw ? { value: ((m / mw) * AVOGADRO).toExponential(4), unit: 'molecules' } : null;
        },
      },
      {
        id: 'mol_to_molecules', label: 'Mol → Molecules', desc: 'N = mol × Nᴀ',
        fields: [
          { key: 'moles', label: 'Moles', unit: 'mol' },
        ],
        calculate: (get) => {
          const mol = get('moles');
          return mol ? { value: (mol * AVOGADRO).toExponential(4), unit: 'molecules' } : null;
        },
      },
      {
        id: 'molecules_to_mol', label: 'Molecules → Mol', desc: 'mol = N / Nᴀ',
        fields: [
          { key: 'molecules', label: 'Number of Molecules', unit: '' },
        ],
        calculate: (get) => {
          const n = get('molecules');
          return n ? { value: (n / AVOGADRO).toExponential(6), unit: 'mol' } : null;
        },
      },
      {
        id: 'eq_weight', label: 'Eq. Weight', desc: 'Eq.Wt = MW / n-factor',
        fields: [
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        calculate: (get) => {
          const mw = get('mw'), n = get('nfactor');
          return mw && n ? { value: (mw / n).toFixed(4), unit: 'g/eq' } : null;
        },
      },
    ],
  },

  // ─── GAS LAWS ───
  {
    id: 'gas',
    label: 'Gas Laws',
    icon: '🌡️',
    conversions: [
      {
        id: 'ideal_gas_n', label: 'PV=nRT → n', desc: 'n = PV / RT',
        fields: [
          { key: 'pressure', label: 'Pressure', unit: 'atm' },
          { key: 'volume', label: 'Volume', unit: 'L' },
          { key: 'temperature', label: 'Temperature', unit: 'K' },
        ],
        calculate: (get) => {
          const p = get('pressure'), v = get('volume'), t = get('temperature');
          return p && v && t ? { value: ((p * v) / (R_CONST * t)).toFixed(6), unit: 'mol' } : null;
        },
      },
      {
        id: 'ideal_gas_v', label: 'PV=nRT → V', desc: 'V = nRT / P',
        fields: [
          { key: 'moles', label: 'Moles', unit: 'mol' },
          { key: 'temperature', label: 'Temperature', unit: 'K' },
          { key: 'pressure', label: 'Pressure', unit: 'atm' },
        ],
        calculate: (get) => {
          const n = get('moles'), t = get('temperature'), p = get('pressure');
          return n && t && p ? { value: ((n * R_CONST * t) / p).toFixed(4), unit: 'L' } : null;
        },
      },
      {
        id: 'ideal_gas_p', label: 'PV=nRT → P', desc: 'P = nRT / V',
        fields: [
          { key: 'moles', label: 'Moles', unit: 'mol' },
          { key: 'temperature', label: 'Temperature', unit: 'K' },
          { key: 'volume', label: 'Volume', unit: 'L' },
        ],
        calculate: (get) => {
          const n = get('moles'), t = get('temperature'), v = get('volume');
          return n && t && v ? { value: ((n * R_CONST * t) / v).toFixed(4), unit: 'atm' } : null;
        },
      },
      {
        id: 'gas_density', label: 'Gas Density → MW', desc: 'MW = dRT / P',
        fields: [
          { key: 'gasDensity', label: 'Gas Density', unit: 'g/L' },
          { key: 'temperature', label: 'Temperature', unit: 'K' },
          { key: 'pressure', label: 'Pressure', unit: 'atm' },
        ],
        calculate: (get) => {
          const d = get('gasDensity'), t = get('temperature'), p = get('pressure');
          return d && t && p ? { value: ((d * R_CONST * t) / p).toFixed(2), unit: 'g/mol' } : null;
        },
      },
      {
        id: 'stp_vol', label: 'STP Vol ↔ Mol', desc: 'V = n × 22.414 L/mol at STP',
        fields: [
          { key: 'moles', label: 'Moles', unit: 'mol' },
        ],
        calculate: (get) => {
          const n = get('moles');
          return n ? { value: (n * 22.414).toFixed(3), unit: 'L (STP)' } : null;
        },
      },
      {
        id: 'partial_pressure', label: 'Partial Pressure', desc: 'Pᵢ = χᵢ × P_total',
        fields: [
          { key: 'moleFrac', label: 'Mole Fraction', unit: '' },
          { key: 'pTotal', label: 'Total Pressure', unit: 'atm' },
        ],
        calculate: (get) => {
          const x = get('moleFrac'), p = get('pTotal');
          return x && p ? { value: (x * p).toFixed(4), unit: 'atm' } : null;
        },
      },
      {
        id: 'pressure_conv', label: 'Pressure Conv', desc: 'Convert between pressure units',
        fields: [
          { key: 'atm', label: 'Pressure', unit: 'atm' },
        ],
        calculate: (get) => {
          const a = get('atm');
          if (!a) return null;
          return { value: `${(a * 760).toFixed(2)} mmHg | ${(a * 101.325).toFixed(2)} kPa | ${(a * 1.01325).toFixed(4)} bar | ${(a * 14.696).toFixed(2)} psi`, unit: '' };
        },
      },
    ],
  },

  // ─── TEMPERATURE ───
  {
    id: 'temperature',
    label: 'Temperature',
    icon: '🌡️',
    conversions: [
      {
        id: 'C_to_all', label: '°C → All', desc: 'Convert Celsius to F, K, R',
        fields: [{ key: 'celsius', label: 'Temperature', unit: '°C' }],
        calculate: (get) => {
          const c = get('celsius');
          if (c === undefined || isNaN(c)) return null;
          return { value: `${((c * 9/5) + 32).toFixed(2)} °F | ${(c + 273.15).toFixed(2)} K | ${((c + 273.15) * 9/5).toFixed(2)} °R`, unit: '' };
        },
      },
      {
        id: 'F_to_C', label: '°F → °C', desc: '°C = (°F − 32) × 5/9',
        fields: [{ key: 'fahrenheit', label: 'Temperature', unit: '°F' }],
        calculate: (get) => {
          const f = get('fahrenheit');
          if (isNaN(f)) return null;
          return { value: ((f - 32) * 5/9).toFixed(2), unit: '°C' };
        },
      },
      {
        id: 'K_to_C', label: 'K → °C', desc: '°C = K − 273.15',
        fields: [{ key: 'kelvin', label: 'Temperature', unit: 'K' }],
        calculate: (get) => {
          const k = get('kelvin');
          return k ? { value: (k - 273.15).toFixed(2), unit: '°C' } : null;
        },
      },
    ],
  },

  // ─── ENERGY & SPECTROSCOPY ───
  {
    id: 'energy',
    label: 'Energy & Spectroscopy',
    icon: '⚡',
    conversions: [
      {
        id: 'kjmol_conv', label: 'kJ/mol Conv', desc: 'Convert kJ/mol to kcal/mol, eV, cm⁻¹',
        fields: [{ key: 'kjmol', label: 'Energy', unit: 'kJ/mol' }],
        calculate: (get) => {
          const e = get('kjmol');
          if (!e) return null;
          return { value: `${(e / 4.184).toFixed(3)} kcal/mol | ${(e * 1000 / 96485).toFixed(4)} eV | ${(e * 1000 / (6.626e-34 * 3e10 * AVOGADRO)).toFixed(1)} cm⁻¹`, unit: '' };
        },
      },
      {
        id: 'wavelength_to_energy', label: 'λ → Energy', desc: 'E = hc/λ',
        fields: [{ key: 'wavelength', label: 'Wavelength', unit: 'nm' }],
        calculate: (get) => {
          const lam = get('wavelength');
          if (!lam) return null;
          const E_J = (6.626e-34 * 3e8) / (lam * 1e-9);
          const E_eV = E_J / 1.602e-19;
          const E_kJmol = (E_J * AVOGADRO) / 1000;
          return { value: `${E_eV.toFixed(4)} eV | ${E_kJmol.toFixed(2)} kJ/mol | ${(1e7 / lam).toFixed(1)} cm⁻¹`, unit: '' };
        },
      },
      {
        id: 'freq_to_wavelength', label: 'ν → λ', desc: 'λ = c / ν',
        fields: [{ key: 'frequency', label: 'Frequency', unit: 'Hz' }],
        calculate: (get) => {
          const v = get('frequency');
          if (!v) return null;
          const lam = 3e8 / v;
          return { value: `${(lam * 1e9).toFixed(2)} nm | ${(lam * 1e6).toFixed(4)} µm`, unit: '' };
        },
      },
      {
        id: 'wavenumber_to_nm', label: 'cm⁻¹ → nm', desc: 'λ(nm) = 10⁷ / ṽ(cm⁻¹)',
        fields: [{ key: 'wavenumber', label: 'Wavenumber', unit: 'cm⁻¹' }],
        calculate: (get) => {
          const wn = get('wavenumber');
          return wn ? { value: (1e7 / wn).toFixed(2), unit: 'nm' } : null;
        },
      },
      {
        id: 'beer_lambert', label: 'Beer-Lambert', desc: 'A = εbc → solve any variable',
        fields: [
          { key: 'absorbance', label: 'Absorbance (A)', unit: '', placeholder: 'Leave blank to solve' },
          { key: 'epsilon', label: 'Molar Absorptivity (ε)', unit: 'L/(mol·cm)', placeholder: 'Leave blank to solve' },
          { key: 'pathLength', label: 'Path Length (b)', unit: 'cm', placeholder: '1' },
          { key: 'concentration', label: 'Concentration (c)', unit: 'M', placeholder: 'Leave blank to solve' },
        ],
        calculate: (get) => {
          const A = get('absorbance'), eps = get('epsilon'), b = get('pathLength') || 1, c = get('concentration');
          if (eps && b && c) return { value: (eps * b * c).toFixed(4), unit: 'A' };
          if (A && b && c) return { value: (A / (b * c)).toFixed(2), unit: 'L/(mol·cm)' };
          if (A && eps && b) return { value: (A / (eps * b)).toFixed(6), unit: 'M' };
          return null;
        },
      },
      {
        id: 'transmittance_abs', label: '%T ↔ A', desc: 'A = −log₁₀(%T/100)',
        fields: [{ key: 'transmittance', label: 'Transmittance', unit: '%T' }],
        calculate: (get) => {
          const t = get('transmittance');
          return t ? { value: (-Math.log10(t / 100)).toFixed(4), unit: 'A' } : null;
        },
      },
    ],
  },

  // ─── COLLIGATIVE PROPERTIES ───
  {
    id: 'colligative',
    label: 'Colligative',
    icon: '🧊',
    conversions: [
      {
        id: 'bp_elevation', label: 'BP Elevation', desc: 'ΔTb = Kb × m × i',
        fields: [
          { key: 'kb', label: 'Kb (ebullioscopic)', unit: '°C/m', placeholder: '0.512 for water' },
          { key: 'molality', label: 'Molality', unit: 'm' },
          { key: 'i', label: 'van\'t Hoff factor (i)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const kb = get('kb'), m = get('molality'), i = get('i') || 1;
          return kb && m ? { value: (kb * m * i).toFixed(4), unit: '°C' } : null;
        },
      },
      {
        id: 'fp_depression', label: 'FP Depression', desc: 'ΔTf = Kf × m × i',
        fields: [
          { key: 'kf', label: 'Kf (cryoscopic)', unit: '°C/m', placeholder: '1.86 for water' },
          { key: 'molality', label: 'Molality', unit: 'm' },
          { key: 'i', label: 'van\'t Hoff factor (i)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const kf = get('kf'), m = get('molality'), i = get('i') || 1;
          return kf && m ? { value: (kf * m * i).toFixed(4), unit: '°C' } : null;
        },
      },
      {
        id: 'osmotic_pressure', label: 'Osmotic Pressure', desc: 'π = iMRT',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'temperature', label: 'Temperature', unit: 'K' },
          { key: 'i', label: 'van\'t Hoff factor (i)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const m = get('molarity'), t = get('temperature'), i = get('i') || 1;
          return m && t ? { value: (i * m * R_CONST * t).toFixed(4), unit: 'atm' } : null;
        },
      },
      {
        id: 'raoults_law', label: 'Raoult\'s Law', desc: 'P = χ × P°',
        fields: [
          { key: 'moleFrac', label: 'Mole Fraction (solvent)', unit: '' },
          { key: 'pPure', label: 'Pure Vapor Pressure', unit: 'mmHg' },
        ],
        calculate: (get) => {
          const x = get('moleFrac'), p0 = get('pPure');
          return x && p0 ? { value: (x * p0).toFixed(2), unit: 'mmHg' } : null;
        },
      },
    ],
  },

  // ─── ELECTROCHEMISTRY ───
  {
    id: 'electrochem',
    label: 'Electrochemistry',
    icon: '🔋',
    conversions: [
      {
        id: 'nernst', label: 'Nernst Eq.', desc: 'E = E° − (RT/nF)ln(Q)',
        fields: [
          { key: 'e0', label: 'Standard Potential (E°)', unit: 'V' },
          { key: 'n', label: 'Electrons Transferred (n)', unit: '' },
          { key: 'temperature', label: 'Temperature', unit: 'K', placeholder: '298' },
          { key: 'q', label: 'Reaction Quotient (Q)', unit: '' },
        ],
        calculate: (get) => {
          const e0 = get('e0'), n = get('n'), t = get('temperature') || 298, q = get('q');
          if (!safe(e0) || !n || !q) return null;
          return { value: (e0 - (R_J * t / (n * FARADAY)) * Math.log(q)).toFixed(4), unit: 'V' };
        },
      },
      {
        id: 'faraday', label: 'Faraday\'s Law', desc: 'mass = (Q × MW) / (n × F)',
        fields: [
          { key: 'charge', label: 'Charge (Q)', unit: 'C' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'n', label: 'Electrons Transferred', unit: '' },
        ],
        calculate: (get) => {
          const q = get('charge'), mw = get('mw'), n = get('n');
          return q && mw && n ? { value: ((q * mw) / (n * FARADAY)).toFixed(6), unit: 'g' } : null;
        },
      },
      {
        id: 'charge_to_mol_e', label: 'Charge → mol e⁻', desc: 'mol e⁻ = Q / F',
        fields: [
          { key: 'charge', label: 'Charge', unit: 'C' },
        ],
        calculate: (get) => {
          const q = get('charge');
          return q ? { value: (q / FARADAY).toFixed(6), unit: 'mol e⁻' } : null;
        },
      },
    ],
  },

  // ─── pH & EQUILIBRIUM ───
  {
    id: 'ph_eq',
    label: 'pH & Equilibrium',
    icon: '⚗️',
    conversions: [
      {
        id: 'pH_to_H', label: 'pH → [H⁺]', desc: '[H⁺] = 10^(−pH)',
        fields: [{ key: 'ph', label: 'pH', unit: '' }],
        calculate: (get) => {
          const ph = get('ph');
          return safe(ph) ? { value: Math.pow(10, -ph).toExponential(4), unit: 'M' } : null;
        },
      },
      {
        id: 'H_to_pH', label: '[H⁺] → pH', desc: 'pH = −log₁₀[H⁺]',
        fields: [{ key: 'hConc', label: '[H⁺]', unit: 'M' }],
        calculate: (get) => {
          const h = get('hConc');
          return h ? { value: (-Math.log10(h)).toFixed(4), unit: 'pH' } : null;
        },
      },
      {
        id: 'pH_pOH', label: 'pH ↔ pOH', desc: 'pOH = 14 − pH',
        fields: [{ key: 'ph', label: 'pH', unit: '' }],
        calculate: (get) => {
          const ph = get('ph');
          return safe(ph) ? { value: (14 - ph).toFixed(4), unit: 'pOH' } : null;
        },
      },
      {
        id: 'Ka_pKa', label: 'Ka ↔ pKa', desc: 'pKa = −log₁₀(Ka)',
        fields: [{ key: 'ka', label: 'Ka', unit: '' }],
        calculate: (get) => {
          const ka = get('ka');
          return ka ? { value: (-Math.log10(ka)).toFixed(4), unit: 'pKa' } : null;
        },
      },
      {
        id: 'pKa_Ka', label: 'pKa → Ka', desc: 'Ka = 10^(−pKa)',
        fields: [{ key: 'pka', label: 'pKa', unit: '' }],
        calculate: (get) => {
          const pka = get('pka');
          return safe(pka) ? { value: Math.pow(10, -pka).toExponential(4), unit: 'Ka' } : null;
        },
      },
      {
        id: 'henderson', label: 'Henderson-Hasselbalch', desc: 'pH = pKa + log([A⁻]/[HA])',
        fields: [
          { key: 'pka', label: 'pKa', unit: '' },
          { key: 'conjugateBase', label: '[A⁻] (conjugate base)', unit: 'M' },
          { key: 'acid', label: '[HA] (acid)', unit: 'M' },
        ],
        calculate: (get) => {
          const pka = get('pka'), a = get('conjugateBase'), ha = get('acid');
          return safe(pka) && a && ha ? { value: (pka + Math.log10(a / ha)).toFixed(4), unit: 'pH' } : null;
        },
      },
      {
        id: 'ksp_solubility', label: 'Ksp → Solubility', desc: 'For AB: s = √Ksp; For AB₂: s = ∛(Ksp/4)',
        fields: [
          { key: 'ksp', label: 'Ksp', unit: '' },
          { key: 'stoich', label: 'Type (1=AB, 2=AB₂, 3=A₂B₃)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const ksp = get('ksp'), type = get('stoich') || 1;
          if (!ksp) return null;
          let s: number;
          if (type === 1) s = Math.sqrt(ksp);
          else if (type === 2) s = Math.pow(ksp / 4, 1/3);
          else if (type === 3) s = Math.pow(ksp / 108, 1/5);
          else s = Math.sqrt(ksp);
          return { value: s.toExponential(4), unit: 'M' };
        },
      },
    ],
  },

  // ─── RADIOACTIVITY ───
  {
    id: 'nuclear',
    label: 'Nuclear',
    icon: '☢️',
    conversions: [
      {
        id: 'halflife_decay', label: 't½ → λ', desc: 'λ = ln(2) / t½',
        fields: [{ key: 'halflife', label: 'Half-life', unit: 's' }],
        calculate: (get) => {
          const t = get('halflife');
          return t ? { value: (Math.LN2 / t).toExponential(4), unit: 's⁻¹' } : null;
        },
      },
      {
        id: 'decay_remaining', label: 'Decay Remaining', desc: 'N = N₀ × (½)^(t/t½)',
        fields: [
          { key: 'n0', label: 'Initial Amount', unit: 'g' },
          { key: 'time', label: 'Time Elapsed', unit: 's' },
          { key: 'halflife', label: 'Half-life', unit: 's' },
        ],
        calculate: (get) => {
          const n0 = get('n0'), t = get('time'), hl = get('halflife');
          return n0 && t && hl ? { value: (n0 * Math.pow(0.5, t / hl)).toFixed(6), unit: 'g' } : null;
        },
      },
      {
        id: 'bq_ci', label: 'Bq ↔ Ci', desc: '1 Ci = 3.7 × 10¹⁰ Bq',
        fields: [{ key: 'bq', label: 'Activity', unit: 'Bq' }],
        calculate: (get) => {
          const bq = get('bq');
          return bq ? { value: (bq / 3.7e10).toExponential(4), unit: 'Ci' } : null;
        },
      },
    ],
  },

  // ─── STOICHIOMETRY ───
  {
    id: 'stoich',
    label: 'Stoichiometry',
    icon: '⚖️',
    conversions: [
      {
        id: 'percent_yield', label: '% Yield', desc: '% = (actual / theoretical) × 100',
        fields: [
          { key: 'actual', label: 'Actual Yield', unit: 'g' },
          { key: 'theoretical', label: 'Theoretical Yield', unit: 'g' },
        ],
        calculate: (get) => {
          const a = get('actual'), t = get('theoretical');
          return a && t ? { value: ((a / t) * 100).toFixed(2), unit: '%' } : null;
        },
      },
      {
        id: 'theoretical_yield', label: 'Theoretical Yield', desc: 'yield = (mol reactant × ratio) × MW product',
        fields: [
          { key: 'massReactant', label: 'Mass of Reactant', unit: 'g' },
          { key: 'mwReactant', label: 'MW Reactant', unit: 'g/mol' },
          { key: 'mwProduct', label: 'MW Product', unit: 'g/mol' },
          { key: 'ratio', label: 'Stoich Ratio (prod/react)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const mr = get('massReactant'), mwr = get('mwReactant'), mwp = get('mwProduct'), ratio = get('ratio') || 1;
          if (!mr || !mwr || !mwp) return null;
          return { value: ((mr / mwr) * ratio * mwp).toFixed(4), unit: 'g' };
        },
      },
      {
        id: 'limiting_reagent', label: 'Limiting Reagent', desc: 'Compare mol/stoich ratio of two reagents',
        fields: [
          { key: 'massA', label: 'Mass Reagent A', unit: 'g' },
          { key: 'mwA', label: 'MW Reagent A', unit: 'g/mol' },
          { key: 'coeffA', label: 'Coefficient A', unit: '', placeholder: '1' },
          { key: 'massB', label: 'Mass Reagent B', unit: 'g' },
          { key: 'mwB', label: 'MW Reagent B', unit: 'g/mol' },
          { key: 'coeffB', label: 'Coefficient B', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const mA = get('massA'), mwA = get('mwA'), cA = get('coeffA') || 1;
          const mB = get('massB'), mwB = get('mwB'), cB = get('coeffB') || 1;
          if (!mA || !mwA || !mB || !mwB) return null;
          const ratioA = (mA / mwA) / cA;
          const ratioB = (mB / mwB) / cB;
          const limiting = ratioA <= ratioB ? 'A' : 'B';
          return { value: `${limiting} is limiting (A: ${ratioA.toFixed(4)}, B: ${ratioB.toFixed(4)})`, unit: '' };
        },
      },
    ],
  },

  // ─── IONIC STRENGTH & ACTIVITY ───
  {
    id: 'ionic_activity',
    label: 'Ionic & Activity',
    icon: '⚡',
    conversions: [
      {
        id: 'ionic_strength_mono', label: 'Ionic Strength (1:1)', desc: 'I = ½ Σ cᵢzᵢ² — for monovalent salt (e.g. NaCl)',
        fields: [
          { key: 'conc', label: 'Concentration', unit: 'M' },
        ],
        calculate: (get) => {
          const c = get('conc');
          return c ? { value: c.toFixed(6), unit: 'M (I)' } : null;
        },
      },
      {
        id: 'ionic_strength_general', label: 'Ionic Strength (General)', desc: 'I = ½ Σ cᵢzᵢ² — up to 3 ion types',
        fields: [
          { key: 'c1', label: 'Ion 1 Conc.', unit: 'M' },
          { key: 'z1', label: 'Ion 1 Charge', unit: '' },
          { key: 'c2', label: 'Ion 2 Conc.', unit: 'M' },
          { key: 'z2', label: 'Ion 2 Charge', unit: '' },
          { key: 'c3', label: 'Ion 3 Conc. (opt)', unit: 'M', placeholder: '0' },
          { key: 'z3', label: 'Ion 3 Charge (opt)', unit: '', placeholder: '0' },
        ],
        calculate: (get) => {
          const c1 = get('c1'), z1 = get('z1'), c2 = get('c2'), z2 = get('z2');
          const c3 = get('c3') || 0, z3 = get('z3') || 0;
          if (!c1 || !z1 || !c2 || !z2) return null;
          const I = 0.5 * (c1 * z1 * z1 + c2 * z2 * z2 + c3 * z3 * z3);
          return { value: I.toFixed(6), unit: 'M (I)' };
        },
      },
      {
        id: 'debye_huckel', label: 'Debye-Hückel γ', desc: 'log γ = -0.509 z² √I / (1 + √I) — activity coefficient',
        fields: [
          { key: 'ionicStrength', label: 'Ionic Strength (I)', unit: 'M' },
          { key: 'charge', label: 'Ion Charge (z)', unit: '' },
        ],
        calculate: (get) => {
          const I = get('ionicStrength'), z = get('charge');
          if (!I || !z) return null;
          const sqrtI = Math.sqrt(I);
          const logGamma = -0.509 * z * z * sqrtI / (1 + sqrtI);
          const gamma = Math.pow(10, logGamma);
          return { value: `${gamma.toFixed(4)} (log γ = ${logGamma.toFixed(4)})`, unit: '' };
        },
      },
      {
        id: 'extended_debye_huckel', label: 'Extended D-H γ', desc: 'log γ = -0.509 z² √I / (1 + 0.328 a √I) — with ion size',
        fields: [
          { key: 'ionicStrength', label: 'Ionic Strength (I)', unit: 'M' },
          { key: 'charge', label: 'Ion Charge (z)', unit: '' },
          { key: 'ionSize', label: 'Ion Size Parameter (å)', unit: 'Å', placeholder: '3' },
        ],
        calculate: (get) => {
          const I = get('ionicStrength'), z = get('charge'), a = get('ionSize') || 3;
          if (!I || !z) return null;
          const sqrtI = Math.sqrt(I);
          const logGamma = -0.509 * z * z * sqrtI / (1 + 0.328 * a * sqrtI);
          const gamma = Math.pow(10, logGamma);
          return { value: `${gamma.toFixed(4)} (log γ = ${logGamma.toFixed(4)})`, unit: '' };
        },
      },
      {
        id: 'davies_equation', label: 'Davies γ', desc: 'log γ = -0.509 z² (√I/(1+√I) − 0.3I) — up to I ≈ 0.5',
        fields: [
          { key: 'ionicStrength', label: 'Ionic Strength (I)', unit: 'M' },
          { key: 'charge', label: 'Ion Charge (z)', unit: '' },
        ],
        calculate: (get) => {
          const I = get('ionicStrength'), z = get('charge');
          if (!I || !z) return null;
          const sqrtI = Math.sqrt(I);
          const logGamma = -0.509 * z * z * (sqrtI / (1 + sqrtI) - 0.3 * I);
          const gamma = Math.pow(10, logGamma);
          return { value: `${gamma.toFixed(4)} (log γ = ${logGamma.toFixed(4)})`, unit: '' };
        },
      },
      {
        id: 'mean_activity_coeff', label: 'Mean γ±', desc: 'γ± = (γ₊^ν₊ · γ₋^ν₋)^(1/(ν₊+ν₋))',
        fields: [
          { key: 'gammaPlus', label: 'γ₊ (cation)', unit: '' },
          { key: 'nuPlus', label: 'ν₊ (cation stoich.)', unit: '' },
          { key: 'gammaMinus', label: 'γ₋ (anion)', unit: '' },
          { key: 'nuMinus', label: 'ν₋ (anion stoich.)', unit: '' },
        ],
        calculate: (get) => {
          const gp = get('gammaPlus'), np = get('nuPlus'), gm = get('gammaMinus'), nm = get('nuMinus');
          if (!gp || !np || !gm || !nm) return null;
          const mean = Math.pow(Math.pow(gp, np) * Math.pow(gm, nm), 1 / (np + nm));
          return { value: mean.toFixed(4), unit: 'γ±' };
        },
      },
      {
        id: 'effective_conc', label: 'Effective Conc.', desc: 'a = γ × C — thermodynamic activity',
        fields: [
          { key: 'conc', label: 'Concentration', unit: 'M' },
          { key: 'gamma', label: 'Activity Coefficient (γ)', unit: '' },
        ],
        calculate: (get) => {
          const c = get('conc'), gamma = get('gamma');
          return c && gamma ? { value: (c * gamma).toFixed(6), unit: 'M (activity)' } : null;
        },
      },
    ],
  },

  // ─── BUFFER & TITRATION ───
  {
    id: 'buffer_titration',
    label: 'Buffer & Titration',
    icon: '🔬',
    conversions: [
      {
        id: 'henderson_acid', label: 'H-H (Acid)', desc: 'pH = pKₐ + log([A⁻]/[HA]) — Henderson-Hasselbalch for acids',
        fields: [
          { key: 'pka', label: 'pKₐ', unit: '' },
          { key: 'concBase', label: '[A⁻] (conjugate base)', unit: 'M' },
          { key: 'concAcid', label: '[HA] (weak acid)', unit: 'M' },
        ],
        calculate: (get) => {
          const pka = get('pka'), cb = get('concBase'), ca = get('concAcid');
          if (!pka || !cb || !ca || ca === 0) return null;
          const pH = pka + Math.log10(cb / ca);
          return { value: pH.toFixed(4), unit: 'pH' };
        },
      },
      {
        id: 'henderson_base', label: 'H-H (Base)', desc: 'pOH = pKb + log([BH⁺]/[B]) — Henderson-Hasselbalch for bases',
        fields: [
          { key: 'pkb', label: 'pKb', unit: '' },
          { key: 'concAcid', label: '[BH⁺] (conjugate acid)', unit: 'M' },
          { key: 'concBase', label: '[B] (weak base)', unit: 'M' },
        ],
        calculate: (get) => {
          const pkb = get('pkb'), ca = get('concAcid'), cb = get('concBase');
          if (!pkb || !ca || !cb || cb === 0) return null;
          const pOH = pkb + Math.log10(ca / cb);
          const pH = 14 - pOH;
          return { value: `pH = ${pH.toFixed(4)} (pOH = ${pOH.toFixed(4)})`, unit: '' };
        },
      },
      {
        id: 'buffer_capacity', label: 'Buffer Capacity', desc: 'β = 2.303 × C × Kₐ[H⁺] / (Kₐ + [H⁺])²',
        fields: [
          { key: 'totalConc', label: 'Total Buffer Conc. (C)', unit: 'M' },
          { key: 'pka', label: 'pKₐ', unit: '' },
          { key: 'ph', label: 'pH of Solution', unit: '' },
        ],
        calculate: (get) => {
          const C = get('totalConc'), pka = get('pka'), pH = get('ph');
          if (!C || !pka || !pH) return null;
          const Ka = Math.pow(10, -pka);
          const H = Math.pow(10, -pH);
          const beta = 2.303 * C * Ka * H / Math.pow(Ka + H, 2);
          return { value: beta.toFixed(6), unit: 'mol/(L·pH)' };
        },
      },
      {
        id: 'buffer_ratio', label: 'Buffer Ratio', desc: 'Find [A⁻]/[HA] ratio needed for target pH',
        fields: [
          { key: 'pka', label: 'pKₐ', unit: '' },
          { key: 'targetPh', label: 'Target pH', unit: '' },
        ],
        calculate: (get) => {
          const pka = get('pka'), pH = get('targetPh');
          if (!pka || !pH) return null;
          const ratio = Math.pow(10, pH - pka);
          return { value: `${ratio.toFixed(4)} : 1 ([A⁻] : [HA])`, unit: '' };
        },
      },
      {
        id: 'buffer_prep', label: 'Buffer Prep', desc: 'Masses of acid & salt for target pH buffer',
        fields: [
          { key: 'pka', label: 'pKₐ', unit: '' },
          { key: 'targetPh', label: 'Target pH', unit: '' },
          { key: 'totalConc', label: 'Total Buffer Conc.', unit: 'M' },
          { key: 'volume', label: 'Volume', unit: 'mL' },
          { key: 'mwAcid', label: 'MW of Acid', unit: 'g/mol' },
          { key: 'mwSalt', label: 'MW of Salt', unit: 'g/mol' },
        ],
        calculate: (get) => {
          const pka = get('pka'), pH = get('targetPh'), C = get('totalConc'), V = get('volume');
          const mwA = get('mwAcid'), mwS = get('mwSalt');
          if (!pka || !pH || !C || !V || !mwA || !mwS) return null;
          const ratio = Math.pow(10, pH - pka);
          const cHA = C / (1 + ratio);
          const cA = C - cHA;
          const volL = V / 1000;
          const massAcid = cHA * volL * mwA;
          const massSalt = cA * volL * mwS;
          return { value: `Acid: ${massAcid.toFixed(4)} g | Salt: ${massSalt.toFixed(4)} g`, unit: '' };
        },
      },
      {
        id: 'titration_strong_strong', label: 'Strong-Strong Titr.', desc: 'Equivalence volume: V_t = C_a × V_a / C_b',
        fields: [
          { key: 'concAcid', label: 'Acid Concentration', unit: 'M' },
          { key: 'volAcid', label: 'Acid Volume', unit: 'mL' },
          { key: 'concBase', label: 'Base Concentration', unit: 'M' },
        ],
        calculate: (get) => {
          const ca = get('concAcid'), va = get('volAcid'), cb = get('concBase');
          if (!ca || !va || !cb) return null;
          const vb = (ca * va) / cb;
          return { value: `${vb.toFixed(2)} mL base needed | Equiv. pH = 7.00`, unit: '' };
        },
      },
      {
        id: 'titration_weak_strong', label: 'Weak Acid Titr. pH', desc: 'pH at any point during weak acid / strong base titration',
        fields: [
          { key: 'concAcid', label: 'Acid Concentration', unit: 'M' },
          { key: 'volAcid', label: 'Acid Volume', unit: 'mL' },
          { key: 'pka', label: 'pKₐ', unit: '' },
          { key: 'concBase', label: 'Base Concentration', unit: 'M' },
          { key: 'volBase', label: 'Base Volume Added', unit: 'mL' },
        ],
        calculate: (get) => {
          const ca = get('concAcid'), va = get('volAcid'), pka = get('pka');
          const cb = get('concBase'), vb = get('volBase');
          if (!ca || !va || !pka || !cb || vb === undefined || isNaN(vb)) return null;
          const molesAcid = ca * va / 1000;
          const molesBase = cb * vb / 1000;
          const totalVol = (va + vb) / 1000;
          const Ka = Math.pow(10, -pka);

          if (molesBase < molesAcid * 0.999) {
            // Buffer region
            const ha = molesAcid - molesBase;
            const a = molesBase;
            if (a <= 0) {
              // Initial pH of weak acid
              const H = Math.sqrt(Ka * ca);
              return { value: (-Math.log10(H)).toFixed(4), unit: 'pH (initial)' };
            }
            const pH = pka + Math.log10(a / ha);
            return { value: pH.toFixed(4), unit: 'pH (buffer region)' };
          } else if (molesBase <= molesAcid * 1.001) {
            // Equivalence point
            const cA = molesAcid / totalVol;
            const Kb = 1e-14 / Ka;
            const OH = Math.sqrt(Kb * cA);
            const pOH = -Math.log10(OH);
            return { value: (14 - pOH).toFixed(4), unit: 'pH (equiv. point)' };
          } else {
            // Excess base
            const excessOH = (molesBase - molesAcid) / totalVol;
            const pOH = -Math.log10(excessOH);
            return { value: (14 - pOH).toFixed(4), unit: 'pH (excess base)' };
          }
        },
      },
      {
        id: 'titration_polyprotic', label: 'Polyprotic Equiv.', desc: 'Equivalence volumes for polyprotic acid',
        fields: [
          { key: 'concAcid', label: 'Acid Concentration', unit: 'M' },
          { key: 'volAcid', label: 'Acid Volume', unit: 'mL' },
          { key: 'concBase', label: 'Base Concentration', unit: 'M' },
          { key: 'protons', label: 'Number of Protons', unit: '', placeholder: '2' },
        ],
        calculate: (get) => {
          const ca = get('concAcid'), va = get('volAcid'), cb = get('concBase'), n = get('protons') || 2;
          if (!ca || !va || !cb) return null;
          const equivVols = [];
          for (let i = 1; i <= n; i++) {
            equivVols.push(`EP${i}: ${((ca * va * i) / cb).toFixed(2)} mL`);
          }
          return { value: equivVols.join(' | '), unit: '' };
        },
      },
      {
        id: 'back_titration', label: 'Back Titration', desc: 'Moles analyte from excess titrant back-titration',
        fields: [
          { key: 'concExcess', label: 'Excess Reagent Conc.', unit: 'M' },
          { key: 'volExcess', label: 'Excess Reagent Vol.', unit: 'mL' },
          { key: 'concBack', label: 'Back-Titrant Conc.', unit: 'M' },
          { key: 'volBack', label: 'Back-Titrant Vol.', unit: 'mL' },
          { key: 'nfactor', label: 'n-Factor', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const ce = get('concExcess'), ve = get('volExcess'), cb = get('concBack'), vb = get('volBack');
          const nf = get('nfactor') || 1;
          if (!ce || !ve || !cb || !vb) return null;
          const molesExcess = ce * ve / 1000;
          const molesBack = cb * vb / 1000;
          const molesAnalyte = (molesExcess - molesBack) / nf;
          return { value: `${molesAnalyte.toFixed(6)} mol analyte | ${(molesAnalyte * 1000).toFixed(4)} mmol`, unit: '' };
        },
      },
    ],
  },

  // ─── SOLUBILITY & EQUILIBRIUM ───
  {
    id: 'solubility',
    label: 'Solubility',
    icon: '💎',
    conversions: [
      {
        id: 'ksp_to_solubility', label: 'Ksp → Solubility', desc: 'For AxBy: s = (Ksp / (x^x × y^y))^(1/(x+y))',
        fields: [
          { key: 'ksp', label: 'Ksp', unit: '', placeholder: 'e.g. 1.8e-10' },
          { key: 'catCoeff', label: 'Cation Stoich. (x)', unit: '', placeholder: '1' },
          { key: 'anCoeff', label: 'Anion Stoich. (y)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const ksp = get('ksp'), x = get('catCoeff') || 1, y = get('anCoeff') || 1;
          if (!ksp) return null;
          const s = Math.pow(ksp / (Math.pow(x, x) * Math.pow(y, y)), 1 / (x + y));
          return { value: `${s.toExponential(4)} M | ${(s * 1000).toExponential(4)} mM`, unit: '' };
        },
      },
      {
        id: 'common_ion_solubility', label: 'Common Ion Effect', desc: 'Solubility with common ion present',
        fields: [
          { key: 'ksp', label: 'Ksp', unit: '', placeholder: 'e.g. 1.8e-10' },
          { key: 'commonIonConc', label: 'Common Ion Conc.', unit: 'M' },
          { key: 'ionCoeff', label: 'Ion Stoich. in salt', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const ksp = get('ksp'), ci = get('commonIonConc'), n = get('ionCoeff') || 1;
          if (!ksp || !ci) return null;
          // For AB type: Ksp = s × (s + ci) ≈ s × ci when ci >> s
          const s = ksp / Math.pow(ci, n);
          return { value: `≈ ${s.toExponential(4)} M (assuming common ion >> s)`, unit: '' };
        },
      },
      {
        id: 'ion_product_vs_ksp', label: 'Q vs Ksp', desc: 'Will a precipitate form? Compare Q to Ksp',
        fields: [
          { key: 'concCation', label: 'Cation Conc.', unit: 'M' },
          { key: 'concAnion', label: 'Anion Conc.', unit: 'M' },
          { key: 'catCoeff', label: 'Cation Stoich.', unit: '', placeholder: '1' },
          { key: 'anCoeff', label: 'Anion Stoich.', unit: '', placeholder: '1' },
          { key: 'ksp', label: 'Ksp', unit: '' },
        ],
        calculate: (get) => {
          const cc = get('concCation'), ca = get('concAnion'), x = get('catCoeff') || 1, y = get('anCoeff') || 1;
          const ksp = get('ksp');
          if (!cc || !ca || !ksp) return null;
          const Q = Math.pow(cc, x) * Math.pow(ca, y);
          const verdict = Q > ksp ? '⬇️ Precipitate forms (Q > Ksp)' : Q < ksp ? '✅ No precipitate (Q < Ksp)' : '⚖️ At equilibrium (Q = Ksp)';
          return { value: `Q = ${Q.toExponential(4)} | ${verdict}`, unit: '' };
        },
      },
    ],
  },

  // ─── UNIT CONVERSIONS ───
  {
    id: 'units',
    label: 'Unit Scales',
    icon: '📏',
    conversions: [
      {
        id: 'vol_conv', label: 'Volume Conv', desc: 'Convert mL to other volume units',
        fields: [{ key: 'ml', label: 'Volume', unit: 'mL' }],
        calculate: (get) => {
          const ml = get('ml');
          if (!ml) return null;
          return { value: `${(ml / 1000).toFixed(4)} L | ${(ml * 1000).toFixed(0)} µL | ${(ml / 100).toFixed(4)} dL`, unit: '' };
        },
      },
      {
        id: 'mass_conv', label: 'Mass Conv', desc: 'Convert grams to other mass units',
        fields: [{ key: 'grams', label: 'Mass', unit: 'g' }],
        calculate: (get) => {
          const g = get('grams');
          if (!g) return null;
          return { value: `${(g * 1000).toFixed(1)} mg | ${(g * 1e6).toFixed(0)} µg | ${(g / 1000).toFixed(6)} kg`, unit: '' };
        },
      },
      {
        id: 'mol_conv', label: 'Mole Conv', desc: 'Convert mol to sub-units',
        fields: [{ key: 'mol', label: 'Amount', unit: 'mol' }],
        calculate: (get) => {
          const m = get('mol');
          if (!m) return null;
          return { value: `${(m * 1000).toFixed(3)} mmol | ${(m * 1e6).toFixed(0)} µmol | ${(m * 1e9).toFixed(0)} nmol | ${(m * 1e12).toFixed(0)} pmol`, unit: '' };
        },
      },
    ],
  },

  // ─── CONCENTRATION INTER-CONVERSIONS ───
  {
    id: 'conc_interconvert',
    label: 'Conc. Inter-Conv.',
    icon: '🔄',
    conversions: [
      {
        id: 'ic_M_to_molality', label: 'M → Molality', desc: 'm = M / (d − M × MW/1000)',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'mw', label: 'Molecular Weight (solute)', unit: 'g/mol' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const M = get('molarity'), mw = get('mw'), d = get('density');
          if (!M || !mw || !d) return null;
          const m = (M * 1000) / (d * 1000 - M * mw);
          return safe(m) ? { value: m.toFixed(6), unit: 'm (mol/kg)' } : null;
        },
      },
      {
        id: 'ic_molality_to_M', label: 'Molality → M', desc: 'M = m × d / (1 + m × MW/1000)',
        fields: [
          { key: 'molality', label: 'Molality', unit: 'm' },
          { key: 'mw', label: 'Molecular Weight (solute)', unit: 'g/mol' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const m = get('molality'), mw = get('mw'), d = get('density');
          if (!m || !mw || !d) return null;
          const M = (m * d) / (1 + m * mw / 1000);
          return safe(M) ? { value: M.toFixed(6), unit: 'M' } : null;
        },
      },
      {
        id: 'ic_M_to_ppm', label: 'M → ppm', desc: 'ppm = M × MW × 1000',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const M = get('molarity'), mw = get('mw');
          return M && mw ? { value: (M * mw * 1000).toFixed(4), unit: 'ppm' } : null;
        },
      },
      {
        id: 'ic_ppm_to_N', label: 'ppm → N', desc: 'N = ppm / (EW × 1000), EW = MW/n',
        fields: [
          { key: 'ppm', label: 'Concentration', unit: 'ppm' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const ppm = get('ppm'), mw = get('mw'), nf = get('nfactor');
          if (!ppm || !mw || !nf) return null;
          return { value: (ppm * nf / (mw * 1000)).toFixed(6), unit: 'N' };
        },
      },
      {
        id: 'ic_N_to_ppm', label: 'N → ppm', desc: 'ppm = N × EW × 1000',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const N = get('normality'), mw = get('mw'), nf = get('nfactor');
          if (!N || !mw || !nf) return null;
          return { value: (N * mw / nf * 1000).toFixed(4), unit: 'ppm' };
        },
      },
      {
        id: 'ic_M_to_wv', label: 'M → %w/v', desc: '%w/v = M × MW / 10',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const M = get('molarity'), mw = get('mw');
          return M && mw ? { value: (M * mw / 10).toFixed(4), unit: '%w/v' } : null;
        },
      },
      {
        id: 'ic_wv_to_M', label: '%w/v → M', desc: 'M = (%w/v × 10) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw');
          return pct && mw ? { value: (pct * 10 / mw).toFixed(6), unit: 'M' } : null;
        },
      },
      {
        id: 'ic_M_to_ww', label: 'M → %w/w', desc: '%w/w = (M × MW × 100) / (d × 1000)',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const M = get('molarity'), mw = get('mw'), d = get('density');
          if (!M || !mw || !d) return null;
          return { value: ((M * mw * 100) / (d * 1000)).toFixed(4), unit: '%w/w' };
        },
      },
      {
        id: 'ic_ww_to_M', label: '%w/w → M', desc: 'M = (%w/w × d × 1000) / (MW × 100)',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/w' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw'), d = get('density');
          if (!pct || !mw || !d) return null;
          return { value: ((pct * d * 1000) / (mw * 100)).toFixed(6), unit: 'M' };
        },
      },
      {
        id: 'ic_ww_to_wv', label: '%w/w → %w/v', desc: '%w/v = %w/w × d',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/w' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        calculate: (get) => {
          const pct = get('percent'), d = get('density');
          return pct && d ? { value: (pct * d).toFixed(4), unit: '%w/v' } : null;
        },
      },
      {
        id: 'ic_wv_to_ww', label: '%w/v → %w/w', desc: '%w/w = %w/v / d',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        calculate: (get) => {
          const pct = get('percent'), d = get('density');
          return pct && d ? { value: (pct / d).toFixed(4), unit: '%w/w' } : null;
        },
      },
      {
        id: 'ic_ww_to_N', label: '%w/w → N', desc: 'N = (%w/w × d × 10 × n) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/w' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw'), nf = get('nfactor'), d = get('density');
          if (!pct || !mw || !nf || !d) return null;
          return { value: ((pct * d * 10 * nf) / mw).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'ic_N_to_ww', label: 'N → %w/w', desc: '%w/w = (N × MW × 100) / (n × d × 1000)',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const N = get('normality'), mw = get('mw'), nf = get('nfactor'), d = get('density');
          if (!N || !mw || !nf || !d) return null;
          return { value: ((N * mw * 100) / (nf * d * 1000)).toFixed(4), unit: '%w/w' };
        },
      },
      {
        id: 'ic_wv_to_N', label: '%w/v → N', desc: 'N = (%w/v × 10 × n) / MW',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw'), nf = get('nfactor');
          if (!pct || !mw || !nf) return null;
          return { value: ((pct * 10 * nf) / mw).toFixed(4), unit: 'N' };
        },
      },
      {
        id: 'ic_N_to_wv', label: 'N → %w/v', desc: '%w/v = (N × MW) / (n × 10)',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const N = get('normality'), mw = get('mw'), nf = get('nfactor');
          if (!N || !mw || !nf) return null;
          return { value: ((N * mw) / (nf * 10)).toFixed(4), unit: '%w/v' };
        },
      },
      {
        id: 'ic_M_to_N', label: 'M ↔ N (Full)', desc: 'N = M × n, M = N / n',
        fields: [
          { key: 'value', label: 'Value', unit: 'M or N' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'direction', label: 'Direction (1=M→N, 2=N→M)', unit: '', placeholder: '1' },
        ],
        calculate: (get) => {
          const val = get('value'), nf = get('nfactor'), dir = get('direction') || 1;
          if (!val || !nf) return null;
          if (dir === 1) return { value: (val * nf).toFixed(4), unit: 'N' };
          return { value: (val / nf).toFixed(4), unit: 'M' };
        },
      },
      {
        id: 'ic_M_to_F', label: 'M → F (Formality)', desc: 'F ≈ M for ionic compounds',
        fields: [
          { key: 'molarity', label: 'Molarity', unit: 'M' },
        ],
        calculate: (get) => {
          const M = get('molarity');
          return M ? { value: M.toFixed(6), unit: 'F' } : null;
        },
      },
      {
        id: 'ic_molality_to_N', label: 'Molality → N', desc: 'N = m × n × d / (1 + m × MW/1000)',
        fields: [
          { key: 'molality', label: 'Molality', unit: 'm' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const m = get('molality'), mw = get('mw'), nf = get('nfactor'), d = get('density');
          if (!m || !mw || !nf || !d) return null;
          const M = (m * d) / (1 + m * mw / 1000);
          return safe(M * nf) ? { value: (M * nf).toFixed(4), unit: 'N' } : null;
        },
      },
      {
        id: 'ic_N_to_molality', label: 'N → Molality', desc: 'm = N / (n × (d − N×EW/1000))',
        fields: [
          { key: 'normality', label: 'Normality', unit: 'N' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
          { key: 'nfactor', label: 'n-Factor', unit: '' },
          { key: 'density', label: 'Solution Density', unit: 'g/mL' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const N = get('normality'), mw = get('mw'), nf = get('nfactor'), d = get('density');
          if (!N || !mw || !nf || !d) return null;
          const M = N / nf;
          const m = (M * 1000) / (d * 1000 - M * mw);
          return safe(m) ? { value: m.toFixed(6), unit: 'm (mol/kg)' } : null;
        },
      },
      {
        id: 'ic_ppm_to_wv', label: 'ppm → %w/v', desc: '%w/v = ppm / 10000',
        fields: [
          { key: 'ppm', label: 'Concentration', unit: 'ppm' },
        ],
        calculate: (get) => {
          const ppm = get('ppm');
          return ppm ? { value: (ppm / 10000).toFixed(6), unit: '%w/v' } : null;
        },
      },
      {
        id: 'ic_wv_to_ppm', label: '%w/v → ppm', desc: 'ppm = %w/v × 10000',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/v' },
        ],
        calculate: (get) => {
          const pct = get('percent');
          return pct ? { value: (pct * 10000).toFixed(4), unit: 'ppm' } : null;
        },
      },
      {
        id: 'ic_ppm_to_ww', label: 'ppm → %w/w', desc: '%w/w = ppm / 10000',
        fields: [
          { key: 'ppm', label: 'Concentration', unit: 'ppm' },
        ],
        calculate: (get) => {
          const ppm = get('ppm');
          return ppm ? { value: (ppm / 10000).toFixed(6), unit: '%w/w' } : null;
        },
      },
      {
        id: 'ic_ww_to_ppm', label: '%w/w → ppm', desc: 'ppm = %w/w × 10000',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/w' },
        ],
        calculate: (get) => {
          const pct = get('percent');
          return pct ? { value: (pct * 10000).toFixed(4), unit: 'ppm' } : null;
        },
      },
      {
        id: 'ic_molality_to_ww', label: 'Molality → %w/w', desc: '%w/w = (m × MW) / (1000 + m × MW) × 100',
        fields: [
          { key: 'molality', label: 'Molality', unit: 'm' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const m = get('molality'), mw = get('mw');
          if (!m || !mw) return null;
          return { value: ((m * mw) / (1000 + m * mw) * 100).toFixed(4), unit: '%w/w' };
        },
      },
      {
        id: 'ic_ww_to_molality', label: '%w/w → Molality', desc: 'm = (%w/w × 1000) / (MW × (100 − %w/w))',
        fields: [
          { key: 'percent', label: 'Concentration', unit: '%w/w' },
          { key: 'mw', label: 'Molecular Weight', unit: 'g/mol' },
        ],
        inventoryAutoFill: true,
        calculate: (get) => {
          const pct = get('percent'), mw = get('mw');
          if (!pct || !mw || pct >= 100) return null;
          return { value: ((pct * 1000) / (mw * (100 - pct))).toFixed(6), unit: 'm (mol/kg)' };
        },
      },
    ],
  },
];

// Flatten for easy lookup
export const allConversions: ConversionDef[] = conversionCategories.flatMap(c => c.conversions);
export const getConversion = (id: string) => allConversions.find(c => c.id === id);
