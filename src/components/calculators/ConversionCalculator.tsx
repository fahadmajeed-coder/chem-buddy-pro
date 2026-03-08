import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';

type ConversionType = 'M_to_N' | 'N_to_M' | 'M_to_F' | 'ppm_to_M' | 'percent_to_M' | 'dilution';

const conversions: { id: ConversionType; label: string; desc: string }[] = [
  { id: 'M_to_N', label: 'M → N', desc: 'N = M × n-factor' },
  { id: 'N_to_M', label: 'N → M', desc: 'M = N / n-factor' },
  { id: 'M_to_F', label: 'M → F', desc: 'F ≈ M (for strong electrolytes)' },
  { id: 'ppm_to_M', label: 'ppm → M', desc: 'M = ppm / (MW × 1000)' },
  { id: 'percent_to_M', label: '%w/v → M', desc: 'M = (%×10) / MW' },
  { id: 'dilution', label: 'Dilution', desc: 'C₁V₁ = C₂V₂' },
];

export function ConversionCalculator() {
  const [activeConv, setActiveConv] = useState<ConversionType>('M_to_N');
  const [locked, setLocked] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const updateInput = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

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
      </div>
    </CalculatorCard>
  );
}
