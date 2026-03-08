import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';

type ConversionType = 'M_to_N' | 'N_to_M' | 'M_to_F' | 'ppm_to_M' | 'percent_to_M' | 'dilution' | 'vol_for_N' | 'N_from_mass' | 'N_from_pct' | 'vol_pct_to_pct' | 'gm_from_pellet' | 'pct_wv' | 'pct_ww' | 'pct_vv';

const conversions: { id: ConversionType; label: string; desc: string }[] = [
  { id: 'M_to_N', label: 'M → N', desc: 'N = M × n-factor' },
  { id: 'N_to_M', label: 'N → M', desc: 'M = N / n-factor' },
  { id: 'M_to_F', label: 'M → F', desc: 'F ≈ M (for strong electrolytes)' },
  { id: 'ppm_to_M', label: 'ppm → M', desc: 'M = ppm / (MW × 1000)' },
  { id: 'percent_to_M', label: '%w/v → M', desc: 'M = (% × density × 10) / MW' },
  { id: 'dilution', label: 'Dilution', desc: 'C₁V₁ = C₂V₂' },
  { id: 'vol_for_N', label: 'Vol for N', desc: 'V(mL) = (mass × purity × n / MW) / N × 1000' },
  { id: 'N_from_mass', label: 'N from Mass', desc: 'N = (mass × purity × n / MW) / V(L)' },
  { id: 'N_from_pct', label: 'N from %', desc: 'N = (% × density × 10 × n) / MW' },
  { id: 'vol_pct_to_pct', label: '% → % Vol', desc: 'V₁ = (C₂ × V₂) / C₁ (density-adjusted)' },
  { id: 'gm_from_pellet', label: 'gm for %', desc: 'mass = (% × V × density) / (purity)' },
  { id: 'pct_wv', label: '%w/v', desc: '%w/v = (mass × purity / volume) × 100' },
  { id: 'pct_ww', label: '%w/w', desc: '%w/w = (mass solute × purity / mass solution) × 100' },
  { id: 'pct_vv', label: '%v/v', desc: '%v/v = (vol solute / vol solution) × 100' },
];

// Which conversions benefit from inventory auto-fill
const inventoryConversions: ConversionType[] = [
  'percent_to_M', 'vol_for_N', 'N_from_mass', 'N_from_pct',
  'vol_pct_to_pct', 'gm_from_pellet', 'pct_wv', 'pct_ww', 'pct_vv',
];

export function ConversionCalculator() {
  const [activeConv, setActiveConv] = useState<ConversionType>('M_to_N');
  const [locked, setLocked] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const updateInput = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    const updates: Record<string, string> = {};
    if (compound.molarMass) { updates.mw = compound.molarMass.toString(); }
    if (compound.nFactor) updates.nfactor = compound.nFactor.toString();
    if (compound.purityValue) updates.purity = compound.purityValue.toString();
    if (compound.density) updates.density = compound.density.toString();
    setInputs(prev => ({ ...prev, ...updates }));
  };

  const calculate = (): { value: string; unit: string } | null => {
    const get = (k: string) => parseFloat(inputs[k] || '');
    const getPurity = () => get('purity') || 100;
    const getDensity = () => get('density') || 1;

    switch (activeConv) {
      case 'M_to_N': {
        const m = get('molarity'); const n = get('nfactor');
        return m && n ? { value: (m * n).toFixed(4), unit: 'N' } : null;
      }
      case 'N_to_M': {
        const norm = get('normality'); const n = get('nfactor');
        return norm && n ? { value: (norm / n).toFixed(4), unit: 'M' } : null;
      }
      case 'M_to_F': {
        const m = get('molarity');
        return m ? { value: m.toFixed(4), unit: 'F' } : null;
      }
      case 'ppm_to_M': {
        const ppm = get('ppm'); const mw = get('mw');
        return ppm && mw ? { value: (ppm / (mw * 1000)).toFixed(6), unit: 'M' } : null;
      }
      case 'percent_to_M': {
        // M = (% × density × 10) / MW
        const pct = get('percent'); const mw = get('mw'); const d = getDensity();
        return pct && mw ? { value: ((pct * d * 10) / mw).toFixed(4), unit: 'M' } : null;
      }
      case 'dilution': {
        const c1 = get('c1'); const v1 = get('v1'); const c2 = get('c2'); const v2 = get('v2');
        if (c1 && v1 && c2) return { value: ((c1 * v1) / c2).toFixed(2), unit: 'mL (V₂)' };
        if (c1 && v1 && v2) return { value: ((c1 * v1) / v2).toFixed(4), unit: 'M (C₂)' };
        return null;
      }
      case 'vol_for_N': {
        // V(mL) = (mass × purity / (MW/n)) / N × 1000
        const mass = get('mass'); const mw = get('mw'); const nf = get('nfactor') || 1; const n = get('normality');
        const eqWt = mw / nf;
        const effectiveMass = mass * (getPurity() / 100);
        return mass && mw && n ? { value: ((effectiveMass / eqWt) / n * 1000).toFixed(2), unit: 'mL' } : null;
      }
      case 'N_from_mass': {
        // N = (mass × purity / (MW/n)) / V(L)
        const mass = get('mass'); const mw = get('mw'); const nf = get('nfactor') || 1; const vol = get('volume');
        const eqWt = mw / nf;
        const effectiveMass = mass * (getPurity() / 100);
        return mass && mw && vol ? { value: ((effectiveMass / eqWt) / (vol / 1000)).toFixed(4), unit: 'N' } : null;
      }
      case 'N_from_pct': {
        // N = (% × density × 10 × n) / MW
        const pct = get('percent'); const density = get('density'); const mw = get('mw'); const nf = get('nfactor') || 1;
        return pct && density && mw ? { value: ((pct * density * 10 * nf) / mw).toFixed(4), unit: 'N' } : null;
      }
      case 'vol_pct_to_pct': {
        // V₁(mL) = (C₂% × V₂ × d₂) / (C₁% × d₁)
        // Simplified when same density: V₁ = (C₂ × V₂) / C₁
        const c1 = get('c1pct'); const c2 = get('c2pct'); const v2 = get('v2');
        const d1 = get('density') || 1;
        const d2 = get('density2') || 1;
        return c1 && c2 && v2 ? { value: ((c2 * v2 * d2) / (c1 * d1)).toFixed(2), unit: 'mL' } : null;
      }
      case 'gm_from_pellet': {
        // mass(g) = (desired% × V(mL) × density_solution) / (purity)
        const desiredPct = get('desiredPct'); const vol = get('volume');
        const purity = getPurity(); const density = getDensity();
        return desiredPct && vol ? { value: ((desiredPct * vol * density) / purity).toFixed(4), unit: 'g' } : null;
      }
      case 'pct_wv': {
        // %w/v = (mass × purity / volume) × 100
        const mass = get('mass'); const vol = get('volume');
        const effectiveMass = mass * (getPurity() / 100);
        return mass && vol ? { value: ((effectiveMass / vol) * 100).toFixed(4), unit: '%w/v' } : null;
      }
      case 'pct_ww': {
        // %w/w = (mass_solute × purity) / (mass_solution) × 100
        // mass_solution can be derived from vol × density if density provided
        const massSolute = get('massSolute');
        const effectiveMass = massSolute * (getPurity() / 100);
        const massSolution = get('massSolution');
        const vol = get('volume'); const density = get('density');
        const totalMass = massSolution || (vol && density ? vol * density : 0);
        return massSolute && totalMass ? { value: ((effectiveMass / totalMass) * 100).toFixed(4), unit: '%w/w' } : null;
      }
      case 'pct_vv': {
        // %v/v = (vol_solute / vol_solution) × 100
        // vol_solute can be mass/density if density provided
        const volSolute = get('volSolute'); const volSolution = get('volSolution');
        const mass = get('mass'); const density = get('density');
        const effectiveVolSolute = volSolute || (mass && density ? mass / density : 0);
        return effectiveVolSolute && volSolution ? { value: ((effectiveVolSolute / volSolution) * 100).toFixed(4), unit: '%v/v' } : null;
      }
      default: return null;
    }
  };

  const result = calculate();

  // Build info hints
  const hints: string[] = [];
  const purity = parseFloat(inputs.purity || '');
  const density = parseFloat(inputs.density || '');
  const mwHint = parseFloat(inputs.mw || '');
  const nfHint = parseFloat(inputs.nfactor || '');
  if (mwHint > 0 && nfHint > 0 && ['vol_for_N', 'N_from_mass', 'N_from_pct'].includes(activeConv)) {
    hints.push(`Eq. Weight: ${mwHint} / ${nfHint} = ${(mwHint / nfHint).toFixed(3)} g/eq`);
  }
  if (purity && purity < 100 && (inputs.mass || inputs.massSolute)) {
    const mass = parseFloat(inputs.mass || inputs.massSolute || '0');
    hints.push(`Effective mass at ${purity}% purity: ${(mass * purity / 100).toFixed(4)} g`);
  }
  if (density && ['pct_ww', 'pct_vv', 'gm_from_pellet', 'vol_pct_to_pct', 'percent_to_M', 'N_from_pct'].includes(activeConv)) {
    hints.push(`Using density: ${density} g/mL`);
  }

  return (
    <CalculatorCard
      title="Unit Conversions"
      subtitle="Convert between concentration units"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) setInputs({}); }}
      result={result}
    >
      <div className="flex flex-wrap gap-1.5 mb-4">
        {conversions.map((c) => (
          <button
            key={c.id}
            onClick={() => { setActiveConv(c.id); setInputs({}); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${activeConv === c.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-3 font-mono">
        {conversions.find(c => c.id === activeConv)?.desc}
      </p>

      {inventoryConversions.includes(activeConv) && (
        <div className="mb-4">
          <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeConv === 'M_to_N' && (
          <>
            <InputField label="Molarity" unit="M" value={inputs.molarity || ''} onChange={(v) => updateInput('molarity', v)} disabled={locked} />
            <InputField label="n-Factor" unit="" value={inputs.nfactor || ''} onChange={(v) => updateInput('nfactor', v)} disabled={locked} />
          </>
        )}
        {activeConv === 'N_to_M' && (
          <>
            <InputField label="Normality" unit="N" value={inputs.normality || ''} onChange={(v) => updateInput('normality', v)} disabled={locked} />
            <InputField label="n-Factor" unit="" value={inputs.nfactor || ''} onChange={(v) => updateInput('nfactor', v)} disabled={locked} />
          </>
        )}
        {activeConv === 'M_to_F' && (
          <InputField label="Molarity" unit="M" value={inputs.molarity || ''} onChange={(v) => updateInput('molarity', v)} disabled={locked} />
        )}
        {activeConv === 'ppm_to_M' && (
          <>
            <InputField label="Concentration" unit="ppm" value={inputs.ppm || ''} onChange={(v) => updateInput('ppm', v)} disabled={locked} />
            <InputField label="Molecular Weight" unit="g/mol" value={inputs.mw || ''} onChange={(v) => updateInput('mw', v)} disabled={locked} />
          </>
        )}
        {activeConv === 'percent_to_M' && (
          <>
            <InputField label="Concentration" unit="%" value={inputs.percent || ''} onChange={(v) => updateInput('percent', v)} disabled={locked} />
            <InputField label="Molecular Weight" unit="g/mol" value={inputs.mw || ''} onChange={(v) => updateInput('mw', v)} disabled={locked} />
            <InputField label="Density" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} placeholder="1" />
          </>
        )}
        {activeConv === 'dilution' && (
          <>
            <InputField label="C₁ (Initial Conc.)" unit="M" value={inputs.c1 || ''} onChange={(v) => updateInput('c1', v)} disabled={locked} />
            <InputField label="V₁ (Initial Vol.)" unit="mL" value={inputs.v1 || ''} onChange={(v) => updateInput('v1', v)} disabled={locked} />
            <InputField label="C₂ (Final Conc.)" unit="M" value={inputs.c2 || ''} onChange={(v) => updateInput('c2', v)} disabled={locked} placeholder="Leave blank to solve" />
            <InputField label="V₂ (Final Vol.)" unit="mL" value={inputs.v2 || ''} onChange={(v) => updateInput('v2', v)} disabled={locked} placeholder="Leave blank to solve" />
          </>
        )}

        {activeConv === 'vol_for_N' && (
          <>
            <InputField label="Mass of Solute" unit="g" value={inputs.mass || ''} onChange={(v) => updateInput('mass', v)} disabled={locked} />
            <InputField label="Molecular Weight" unit="g/mol" value={inputs.mw || ''} onChange={(v) => updateInput('mw', v)} disabled={locked} />
            <InputField label="n-Factor" unit="" value={inputs.nfactor || ''} onChange={(v) => updateInput('nfactor', v)} disabled={locked} placeholder="1" />
            <InputField label="Desired Normality" unit="N" value={inputs.normality || ''} onChange={(v) => updateInput('normality', v)} disabled={locked} />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'N_from_mass' && (
          <>
            <InputField label="Mass of Solute" unit="g" value={inputs.mass || ''} onChange={(v) => updateInput('mass', v)} disabled={locked} />
            <InputField label="Molecular Weight" unit="g/mol" value={inputs.mw || ''} onChange={(v) => updateInput('mw', v)} disabled={locked} />
            <InputField label="n-Factor" unit="" value={inputs.nfactor || ''} onChange={(v) => updateInput('nfactor', v)} disabled={locked} placeholder="1" />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volume || ''} onChange={(v) => updateInput('volume', v)} disabled={locked} />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'N_from_pct' && (
          <>
            <InputField label="Concentration" unit="%" value={inputs.percent || ''} onChange={(v) => updateInput('percent', v)} disabled={locked} />
            <InputField label="Density" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} />
            <InputField label="Molecular Weight" unit="g/mol" value={inputs.mw || ''} onChange={(v) => updateInput('mw', v)} disabled={locked} />
            <InputField label="n-Factor" unit="" value={inputs.nfactor || ''} onChange={(v) => updateInput('nfactor', v)} disabled={locked} placeholder="1" />
          </>
        )}
        {activeConv === 'vol_pct_to_pct' && (
          <>
            <InputField label="Initial Concentration" unit="%" value={inputs.c1pct || ''} onChange={(v) => updateInput('c1pct', v)} disabled={locked} />
            <InputField label="Desired Concentration" unit="%" value={inputs.c2pct || ''} onChange={(v) => updateInput('c2pct', v)} disabled={locked} />
            <InputField label="Final Volume Needed" unit="mL" value={inputs.v2 || ''} onChange={(v) => updateInput('v2', v)} disabled={locked} />
            <InputField label="Density (stock)" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} placeholder="1" />
            <InputField label="Density (final)" unit="g/mL" value={inputs.density2 || ''} onChange={(v) => updateInput('density2', v)} disabled={locked} placeholder="1" />
          </>
        )}
        {activeConv === 'gm_from_pellet' && (
          <>
            <InputField label="Desired Concentration" unit="%" value={inputs.desiredPct || ''} onChange={(v) => updateInput('desiredPct', v)} disabled={locked} />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volume || ''} onChange={(v) => updateInput('volume', v)} disabled={locked} />
            <InputField label="Density of Solution" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} placeholder="1" />
            <InputField label="Purity of Pellet" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'pct_wv' && (
          <>
            <InputField label="Mass of Solute" unit="g" value={inputs.mass || ''} onChange={(v) => updateInput('mass', v)} disabled={locked} />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volume || ''} onChange={(v) => updateInput('volume', v)} disabled={locked} />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'pct_ww' && (
          <>
            <InputField label="Mass of Solute" unit="g" value={inputs.massSolute || ''} onChange={(v) => updateInput('massSolute', v)} disabled={locked} />
            <InputField label="Mass of Solution" unit="g" value={inputs.massSolution || ''} onChange={(v) => updateInput('massSolution', v)} disabled={locked} placeholder="Or use vol × density" />
            <InputField label="Volume (if no mass)" unit="mL" value={inputs.volume || ''} onChange={(v) => updateInput('volume', v)} disabled={locked} placeholder="Optional" />
            <InputField label="Density" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} placeholder="For vol → mass" />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'pct_vv' && (
          <>
            <InputField label="Volume of Solute" unit="mL" value={inputs.volSolute || ''} onChange={(v) => updateInput('volSolute', v)} disabled={locked} placeholder="Or use mass ÷ density" />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volSolution || ''} onChange={(v) => updateInput('volSolution', v)} disabled={locked} />
            <InputField label="Mass (if no vol)" unit="g" value={inputs.mass || ''} onChange={(v) => updateInput('mass', v)} disabled={locked} placeholder="Optional" />
            <InputField label="Density" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} placeholder="For mass → vol" />
          </>
        )}
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {hints.map((h, i) => (
            <p key={i} className="text-xs text-muted-foreground font-mono">{h}</p>
          ))}
        </div>
      )}
    </CalculatorCard>
  );
}
