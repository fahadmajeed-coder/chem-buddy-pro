import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { Plus, Trash2 } from 'lucide-react';

interface PrepStep {
  id: string;
  targetConc: string;
  targetUnit: string;
  targetVol: string;
  mw: string;
  nFactor: string;
  purity: string;
  density: string;
}

export function SolutionPrepCalculator() {
  const [locked, setLocked] = useState(false);
  const [steps, setSteps] = useState<PrepStep[]>([
    { id: '1', targetConc: '', targetUnit: 'M', targetVol: '', mw: '', nFactor: '1', purity: '100', density: '' }
  ]);

  const addStep = () => {
    setSteps(prev => [...prev, {
      id: Date.now().toString(),
      targetConc: '', targetUnit: 'M', targetVol: '', mw: '', nFactor: '1', purity: '100', density: ''
    }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = (id: string, field: keyof PrepStep, value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleCompoundSelect = (id: string, compound: ChemicalCompound) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        mw: compound.molarMass?.toString() || s.mw,
        nFactor: compound.nFactor?.toString() || s.nFactor,
        purity: compound.purityValue?.toString() || s.purity,
        density: compound.density?.toString() || s.density,
      };
    }));
  };

  const calcMass = (step: PrepStep) => {
    const conc = parseFloat(step.targetConc);
    const vol = parseFloat(step.targetVol);
    const mw = parseFloat(step.mw);
    const purity = parseFloat(step.purity) / 100;
    const nf = parseFloat(step.nFactor) || 1;
    if (!conc || !vol || !mw || !purity) return null;
    const volL = vol / 1000;

    // For Normality: mass = (N × V(L) × MW) / (n-factor × purity)
    // For Molarity/Formality: mass = (M × V(L) × MW) / purity
    const mass = step.targetUnit === 'N'
      ? (conc * volL * mw) / (nf * purity)
      : (conc * volL * mw) / purity;
    return mass;
  };

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const mass = calcMass(step);
        const result = mass !== null ? { value: mass.toFixed(4), unit: 'g required' } : null;
        const purityVal = parseFloat(step.purity);
        const densityVal = parseFloat(step.density);
        const mwVal = parseFloat(step.mw);
        const nfVal = parseFloat(step.nFactor);

        return (
          <CalculatorCard
            key={step.id}
            title={`Solution Preparation ${steps.length > 1 ? `#${idx + 1}` : ''}`}
            subtitle="Calculate solute mass for desired solution"
            locked={locked}
            onToggleLock={() => setLocked(!locked)}
            onReset={() => {
              if (!locked) setSteps(prev => prev.map(s => s.id === step.id
                ? { ...s, targetConc: '', targetVol: '', mw: '', nFactor: '1', purity: '100', density: '' }
                : s
              ));
            }}
            result={result}
          >
            <CompoundSelector onSelect={(c) => handleCompoundSelect(step.id, c)} disabled={locked} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <InputField label="Target Concentration" unit={step.targetUnit} value={step.targetConc} onChange={(v) => updateStep(step.id, 'targetConc', v)} disabled={locked} />
              <InputField label="Volume Required" unit="mL" value={step.targetVol} onChange={(v) => updateStep(step.id, 'targetVol', v)} disabled={locked} />
              <InputField label="Molecular Weight" unit="g/mol" value={step.mw} onChange={(v) => updateStep(step.id, 'mw', v)} disabled={locked} />
              <InputField label="Purity" unit="%" value={step.purity} onChange={(v) => updateStep(step.id, 'purity', v)} disabled={locked} />
              <InputField label="Density" unit="g/mL" value={step.density} onChange={(v) => updateStep(step.id, 'density', v)} disabled={locked} placeholder="Optional" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={step.targetUnit}
                onChange={(e) => updateStep(step.id, 'targetUnit', e.target.value)}
                disabled={locked}
                className="bg-input border border-border rounded-md px-2 py-1.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="M">Molarity (M)</option>
                <option value="N">Normality (N)</option>
                <option value="F">Formality (F)</option>
              </select>
              {step.targetUnit === 'N' && (
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">n-Factor:</label>
                  <input
                    type="number"
                    value={step.nFactor}
                    onChange={(e) => updateStep(step.id, 'nFactor', e.target.value)}
                    disabled={locked}
                    className="w-16 bg-input border border-border rounded-md px-2 py-1.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary disabled:opacity-50"
                    placeholder="1"
                  />
                </div>
              )}
              {steps.length > 1 && (
                <button onClick={() => removeStep(step.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="mt-2 space-y-0.5">
              {step.targetUnit === 'N' && mwVal > 0 && nfVal > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  Eq. Weight: {mwVal} / {nfVal} = {(mwVal / nfVal).toFixed(3)} g/eq
                </p>
              )}
              {purityVal < 100 && mass && (
                <p className="text-xs text-muted-foreground font-mono">
                  Effective mass at {step.purity}% purity: {(mass * (purityVal / 100)).toFixed(4)} g
                </p>
              )}
              {densityVal > 0 && mass && (
                <p className="text-xs text-muted-foreground font-mono">
                  Volume of solute: {(mass / densityVal).toFixed(4)} mL
                </p>
              )}
            </div>
          </CalculatorCard>
        );
      })}
      <button
        onClick={addStep}
        className="w-full py-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm transition-all"
      >
        <Plus className="w-4 h-4" /> Add Another Solution
      </button>
    </div>
  );
}
