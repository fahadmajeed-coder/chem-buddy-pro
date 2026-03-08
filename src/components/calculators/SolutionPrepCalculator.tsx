import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { Plus, Trash2 } from 'lucide-react';

interface PrepStep {
  id: string;
  targetConc: string;
  targetUnit: string;
  targetVol: string;
  mw: string;
  purity: string;
}

export function SolutionPrepCalculator() {
  const [locked, setLocked] = useState(false);
  const [steps, setSteps] = useState<PrepStep[]>([
    { id: '1', targetConc: '', targetUnit: 'M', targetVol: '', mw: '', purity: '100' }
  ]);

  const addStep = () => {
    setSteps(prev => [...prev, {
      id: Date.now().toString(),
      targetConc: '', targetUnit: 'M', targetVol: '', mw: '', purity: '100'
    }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = (id: string, field: keyof PrepStep, value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const calcMass = (step: PrepStep) => {
    const conc = parseFloat(step.targetConc);
    const vol = parseFloat(step.targetVol);
    const mw = parseFloat(step.mw);
    const purity = parseFloat(step.purity) / 100;
    if (!conc || !vol || !mw || !purity) return null;
    const volL = vol / 1000;
    const mass = (conc * volL * mw) / purity;
    return mass;
  };

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const mass = calcMass(step);
        const result = mass !== null ? { value: mass.toFixed(4), unit: 'g required' } : null;

        return (
          <CalculatorCard
            key={step.id}
            title={`Solution Preparation ${steps.length > 1 ? `#${idx + 1}` : ''}`}
            subtitle="Calculate solute mass for desired solution"
            locked={locked}
            onToggleLock={() => setLocked(!locked)}
            onReset={() => {
              if (!locked) updateStep(step.id, 'targetConc', '');
            }}
            result={result}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField label="Target Concentration" unit={step.targetUnit} value={step.targetConc} onChange={(v) => updateStep(step.id, 'targetConc', v)} disabled={locked} />
              <InputField label="Volume Required" unit="mL" value={step.targetVol} onChange={(v) => updateStep(step.id, 'targetVol', v)} disabled={locked} />
              <InputField label="Molecular Weight" unit="g/mol" value={step.mw} onChange={(v) => updateStep(step.id, 'mw', v)} disabled={locked} />
              <InputField label="Purity" unit="%" value={step.purity} onChange={(v) => updateStep(step.id, 'purity', v)} disabled={locked} />
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
              {steps.length > 1 && (
                <button onClick={() => removeStep(step.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
