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
  { id: 'percent_to_M', label: '%w/v → M', desc: 'M = (%×10) / MW' },
  { id: 'dilution', label: 'Dilution', desc: 'C₁V₁ = C₂V₂' },
  { id: 'vol_for_N', label: 'Vol for N', desc: 'V(mL) = (mass / Eq.Wt) / N × 1000' },
  { id: 'N_from_mass', label: 'N from Mass', desc: 'N = (mass / Eq.Wt) / V(L)' },
  { id: 'N_from_pct', label: 'N from %', desc: 'N = (% × density × 10) / Eq.Wt' },
  { id: 'vol_pct_to_pct', label: '% → % Vol', desc: 'V₁ = (C₂ × V₂) / C₁' },
  { id: 'gm_from_pellet', label: 'gm for %', desc: 'mass = (% × V(mL)) / (purity × 100)' },
  { id: 'pct_wv', label: '%w/v', desc: '%w/v = (mass of solute / volume of solution) × 100' },
  { id: 'pct_ww', label: '%w/w', desc: '%w/w = (mass of solute / mass of solution) × 100' },
  { id: 'pct_vv', label: '%v/v', desc: '%v/v = (volume of solute / volume of solution) × 100' },
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
    if (compound.molarMass) updates.eqWt = compound.molarMass.toString();
    if (compound.molarMass) updates.mw = compound.molarMass.toString();
    if (compound.purityValue) updates.purity = compound.purityValue.toString();
    if (compound.density) updates.density = compound.density.toString();
    setInputs(prev => ({ ...prev, ...updates }));
  };

  const needsInventory = ['vol_for_N', 'N_from_mass', 'N_from_pct', 'vol_pct_to_pct', 'gm_from_pellet'].includes(activeConv);

  const calculate = (): { value: string; unit: string } | null => {
    const get = (k: string) => parseFloat(inputs[k] || '');
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
        const pct = get('percent'); const mw = get('mw');
        return pct && mw ? { value: ((pct * 10) / mw).toFixed(4), unit: 'M' } : null;
      }
      case 'dilution': {
        const c1 = get('c1'); const v1 = get('v1'); const c2 = get('c2'); const v2 = get('v2');
        if (c1 && v1 && c2) return { value: ((c1 * v1) / c2).toFixed(2), unit: 'mL (V₂)' };
        if (c1 && v1 && v2) return { value: ((c1 * v1) / v2).toFixed(4), unit: 'M (C₂)' };
        return null;
      }
      case 'vol_for_N': {
        // V(mL) = (mass / Eq.Wt) / N × 1000
        const mass = get('mass'); const eqWt = get('eqWt'); const n = get('normality');
        const purity = get('purity') || 100;
        const effectiveMass = mass * (purity / 100);
        return mass && eqWt && n ? { value: ((effectiveMass / eqWt) / n * 1000).toFixed(2), unit: 'mL' } : null;
      }
      case 'N_from_mass': {
        // N = (mass / Eq.Wt) / V(L)
        const mass = get('mass'); const eqWt = get('eqWt'); const vol = get('volume');
        const purity = get('purity') || 100;
        const effectiveMass = mass * (purity / 100);
        return mass && eqWt && vol ? { value: ((effectiveMass / eqWt) / (vol / 1000)).toFixed(4), unit: 'N' } : null;
      }
      case 'N_from_pct': {
        // N = (% × density × 10) / Eq.Wt
        const pct = get('percent'); const density = get('density'); const eqWt = get('eqWt');
        return pct && density && eqWt ? { value: ((pct * density * 10) / eqWt).toFixed(4), unit: 'N' } : null;
      }
      case 'vol_pct_to_pct': {
        // V₁ = (C₂ × V₂) / C₁
        const c1 = get('c1pct'); const c2 = get('c2pct'); const v2 = get('v2');
        return c1 && c2 && v2 ? { value: ((c2 * v2) / c1).toFixed(2), unit: 'mL' } : null;
      }
      case 'gm_from_pellet': {
        // mass = (desired% × V(mL) × density) / (purity)
        // For solids: mass = (desired_conc_pct × V(mL)) / (purity/100 × 100)
        const desiredPct = get('desiredPct'); const vol = get('volume'); const purity = get('purity') || 100;
        return desiredPct && vol ? { value: ((desiredPct * vol) / purity).toFixed(4), unit: 'g' } : null;
      }
      case 'pct_wv': {
        // %w/v = (mass / volume) × 100
        const mass = get('mass'); const vol = get('volume');
        const purity = get('purity') || 100;
        const effectiveMass = mass * (purity / 100);
        return mass && vol ? { value: ((effectiveMass / vol) * 100).toFixed(4), unit: '%w/v' } : null;
      }
      case 'pct_ww': {
        // %w/w = (mass of solute / mass of solution) × 100
        const massSolute = get('massSolute'); const massSolution = get('massSolution');
        const purity = get('purity') || 100;
        const effectiveMass = massSolute * (purity / 100);
        return massSolute && massSolution ? { value: ((effectiveMass / massSolution) * 100).toFixed(4), unit: '%w/w' } : null;
      }
      case 'pct_vv': {
        // %v/v = (volume of solute / volume of solution) × 100
        const volSolute = get('volSolute'); const volSolution = get('volSolution');
        return volSolute && volSolution ? { value: ((volSolute / volSolution) * 100).toFixed(4), unit: '%v/v' } : null;
      }
      default: return null;
    }
  };

  const result = calculate();

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

      {needsInventory && (
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
            <InputField label="Concentration" unit="%w/v" value={inputs.percent || ''} onChange={(v) => updateInput('percent', v)} disabled={locked} />
            <InputField label="Molecular Weight" unit="g/mol" value={inputs.mw || ''} onChange={(v) => updateInput('mw', v)} disabled={locked} />
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

        {/* New conversion types */}
        {activeConv === 'vol_for_N' && (
          <>
            <InputField label="Mass of Solute" unit="g" value={inputs.mass || ''} onChange={(v) => updateInput('mass', v)} disabled={locked} />
            <InputField label="Equivalent Weight" unit="g/eq" value={inputs.eqWt || ''} onChange={(v) => updateInput('eqWt', v)} disabled={locked} />
            <InputField label="Desired Normality" unit="N" value={inputs.normality || ''} onChange={(v) => updateInput('normality', v)} disabled={locked} />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'N_from_mass' && (
          <>
            <InputField label="Mass of Solute" unit="g" value={inputs.mass || ''} onChange={(v) => updateInput('mass', v)} disabled={locked} />
            <InputField label="Equivalent Weight" unit="g/eq" value={inputs.eqWt || ''} onChange={(v) => updateInput('eqWt', v)} disabled={locked} />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volume || ''} onChange={(v) => updateInput('volume', v)} disabled={locked} />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'N_from_pct' && (
          <>
            <InputField label="Concentration" unit="%" value={inputs.percent || ''} onChange={(v) => updateInput('percent', v)} disabled={locked} />
            <InputField label="Density" unit="g/mL" value={inputs.density || ''} onChange={(v) => updateInput('density', v)} disabled={locked} />
            <InputField label="Equivalent Weight" unit="g/eq" value={inputs.eqWt || ''} onChange={(v) => updateInput('eqWt', v)} disabled={locked} />
          </>
        )}
        {activeConv === 'vol_pct_to_pct' && (
          <>
            <InputField label="Initial Concentration" unit="%" value={inputs.c1pct || ''} onChange={(v) => updateInput('c1pct', v)} disabled={locked} />
            <InputField label="Desired Concentration" unit="%" value={inputs.c2pct || ''} onChange={(v) => updateInput('c2pct', v)} disabled={locked} />
            <InputField label="Final Volume Needed" unit="mL" value={inputs.v2 || ''} onChange={(v) => updateInput('v2', v)} disabled={locked} />
          </>
        )}
        {activeConv === 'gm_from_pellet' && (
          <>
            <InputField label="Desired Concentration" unit="%" value={inputs.desiredPct || ''} onChange={(v) => updateInput('desiredPct', v)} disabled={locked} />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volume || ''} onChange={(v) => updateInput('volume', v)} disabled={locked} />
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
            <InputField label="Mass of Solution" unit="g" value={inputs.massSolution || ''} onChange={(v) => updateInput('massSolution', v)} disabled={locked} />
            <InputField label="Purity" unit="%" value={inputs.purity || ''} onChange={(v) => updateInput('purity', v)} disabled={locked} placeholder="100" />
          </>
        )}
        {activeConv === 'pct_vv' && (
          <>
            <InputField label="Volume of Solute" unit="mL" value={inputs.volSolute || ''} onChange={(v) => updateInput('volSolute', v)} disabled={locked} />
            <InputField label="Volume of Solution" unit="mL" value={inputs.volSolution || ''} onChange={(v) => updateInput('volSolution', v)} disabled={locked} />
          </>
        )}
      </div>

      {/* Show effective mass hint for purity-affected calcs */}
      {(['vol_for_N', 'N_from_mass', 'pct_wv', 'pct_ww'].includes(activeConv)) && inputs.purity && parseFloat(inputs.purity) < 100 && (inputs.mass || inputs.massSolute) && (
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          Effective mass at {inputs.purity}% purity: {(parseFloat(inputs.mass || inputs.massSolute || '0') * parseFloat(inputs.purity) / 100).toFixed(4)} g
        </p>
      )}
    </CalculatorCard>
  );
}
