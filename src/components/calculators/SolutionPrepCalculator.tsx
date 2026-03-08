import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react';

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

interface SolutionPrepCalculatorProps {
  initialMw?: number | null;
}

/** Given a concentration in `fromUnit`, compute equivalents in all other units */
function convertConcentration(
  conc: number,
  fromUnit: string,
  mw: number,
  density: number,
  nFactor: number,
  purity: number // 0-1
): Record<string, number | null> {
  // First convert everything to Molarity (M) as the pivot
  let molarity: number | null = null;

  switch (fromUnit) {
    case 'M':
    case 'F':
      molarity = conc;
      break;
    case 'N':
      if (nFactor > 0) molarity = conc / nFactor;
      break;
    case '%w/v':
      // %w/v = (mass_g / vol_mL) × 100 → mass_g/L = conc×10 → M = (conc×10)/MW
      if (mw > 0) molarity = (conc * 10) / mw;
      break;
    case '%w/w':
      // %w/w needs density: mass_solute_per_L = conc/100 × density × 1000
      if (mw > 0 && density > 0) molarity = (conc * density * 10) / mw;
      break;
    case '%v/v':
      // Can't convert %v/v to M without solute density/MW — return null for molar types
      break;
  }

  const results: Record<string, number | null> = {};

  // M
  results['M'] = molarity;
  // F (same as M for this purpose)
  results['F'] = molarity;
  // N
  results['N'] = molarity !== null ? molarity * nFactor : null;
  // %w/v = M × MW / 10
  results['%w/v'] = molarity !== null && mw > 0 ? (molarity * mw) / 10 : null;
  // %w/w = (M × MW) / (density × 1000) × 100 = M × MW / (density × 10)
  results['%w/w'] = molarity !== null && mw > 0 && density > 0
    ? (molarity * mw) / (density * 10) : null;
  // %v/v — only from %v/v input
  results['%v/v'] = fromUnit === '%v/v' ? conc : null;

  // mg/mL = M × MW (or %w/v × 10)
  results['mg/mL'] = molarity !== null && mw > 0 ? molarity * mw : null;
  // ppm = mg/L = molarity × MW × 1000... actually ppm ≈ mg/L for dilute = %w/v × 10000
  results['ppm'] = results['mg/mL'] !== null ? results['mg/mL'] * 1000 : null;

  // Remove the source unit from display
  // Don't — we'll filter in rendering

  return results;
}

export function SolutionPrepCalculator({ initialMw }: SolutionPrepCalculatorProps) {
  const [locked, setLocked] = useState(false);
  const [steps, setSteps] = useState<PrepStep[]>([
    { id: '1', targetConc: '', targetUnit: 'M', targetVol: '', mw: '', nFactor: '1', purity: '100', density: '' }
  ]);

  useEffect(() => {
    if (initialMw) {
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, mw: initialMw.toString() } : s));
    }
  }, [initialMw]);

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

  const calcResult = (step: PrepStep): { value: number; unit: string } | null => {
    const conc = parseFloat(step.targetConc);
    const vol = parseFloat(step.targetVol);
    const mw = parseFloat(step.mw);
    const purity = parseFloat(step.purity) / 100 || 1;
    const nf = parseFloat(step.nFactor) || 1;
    const density = parseFloat(step.density);

    if (!conc || !vol) return null;

    switch (step.targetUnit) {
      case 'M':
      case 'F': {
        if (!mw || !purity) return null;
        const mass = (conc * (vol / 1000) * mw) / purity;
        return { value: mass, unit: 'g required' };
      }
      case 'N': {
        if (!mw || !purity) return null;
        const mass = (conc * (vol / 1000) * mw) / (nf * purity);
        return { value: mass, unit: 'g required' };
      }
      case '%w/v': {
        const mass = (conc * vol) / (100 * purity);
        return { value: mass, unit: 'g required' };
      }
      case '%w/w': {
        if (!density) return null;
        const totalMass = vol * density;
        const mass = (conc * totalMass) / (100 * purity);
        return { value: mass, unit: 'g required' };
      }
      case '%v/v': {
        const soluteVol = (conc * vol) / 100;
        return { value: soluteVol, unit: 'mL required' };
      }
      default:
        return null;
    }
  };

  const unitLabels: Record<string, string> = {
    'M': 'Molarity (M)',
    'F': 'Formality (F)',
    'N': 'Normality (N)',
    '%w/v': '% w/v',
    '%w/w': '% w/w',
    '%v/v': '% v/v',
    'mg/mL': 'mg/mL',
    'ppm': 'ppm (mg/L)',
  };

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const calcRes = calcResult(step);
        const result = calcRes ? { value: calcRes.value.toFixed(4), unit: calcRes.unit } : null;
        const mass = calcRes?.unit === 'g required' ? calcRes.value : null;
        const purityVal = parseFloat(step.purity);
        const purityFactor = purityVal / 100;
        const densityVal = parseFloat(step.density);
        const mwVal = parseFloat(step.mw);
        const nfVal = parseFloat(step.nFactor) || 1;

        const volumeToPipette = mass && densityVal > 0 ? mass / densityVal : null;

        const isPercentMode = step.targetUnit.startsWith('%');
        const stockConc = !isPercentMode && densityVal > 0 && mwVal > 0 && purityFactor > 0
          ? (step.targetUnit === 'N'
            ? (densityVal * purityFactor * 1000 * nfVal) / mwVal
            : (densityVal * purityFactor * 1000) / mwVal)
          : null;

        const mgPerMl = step.targetUnit === '%w/v' && parseFloat(step.targetConc)
          ? parseFloat(step.targetConc) * 10
          : null;

        // Unit conversions
        const concVal = parseFloat(step.targetConc);
        const conversions = concVal > 0
          ? convertConcentration(concVal, step.targetUnit, mwVal, densityVal, nfVal, purityFactor)
          : null;

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
              <InputField label={step.targetUnit === '%v/v' ? 'Total Volume' : 'Volume Required'} unit="mL" value={step.targetVol} onChange={(v) => updateStep(step.id, 'targetVol', v)} disabled={locked} />
              {!isPercentMode && (
                <InputField label="Molecular Weight" unit="g/mol" value={step.mw} onChange={(v) => updateStep(step.id, 'mw', v)} disabled={locked} />
              )}
              {step.targetUnit !== '%v/v' && (
                <InputField label="Purity" unit="%" value={step.purity} onChange={(v) => updateStep(step.id, 'purity', v)} disabled={locked} />
              )}
              <InputField label="Density" unit="g/mL" value={step.density} onChange={(v) => updateStep(step.id, 'density', v)} disabled={locked} placeholder={step.targetUnit === '%w/w' ? 'Required' : 'Optional'} />
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
                <option value="%w/v">% w/v</option>
                <option value="%w/w">% w/w</option>
                <option value="%v/v">% v/v</option>
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
            <div className="mt-2 space-y-1">
              {step.targetUnit === 'N' && mwVal > 0 && nfVal > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  Eq. Weight: {mwVal} / {nfVal} = {(mwVal / nfVal).toFixed(3)} g/eq
                </p>
              )}
              {mgPerMl !== null && (
                <p className="text-xs text-muted-foreground font-mono">
                  {parseFloat(step.targetConc)}% w/v = {mgPerMl.toFixed(2)} mg/mL
                </p>
              )}
              {stockConc !== null && (
                <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
                  <p className="text-xs font-medium text-primary">
                    Stock concentration (from density & purity): {stockConc.toFixed(4)} {step.targetUnit}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    = ({densityVal} × {(purityFactor * 100).toFixed(1)}% × 1000{step.targetUnit === 'N' ? ` × ${nfVal}` : ''}) / {mwVal}
                  </p>
                </div>
              )}
              {volumeToPipette !== null && (
                <div className="p-2 bg-accent/30 border border-accent/20 rounded-md">
                  <p className="text-xs font-medium text-foreground">
                    📐 Volume to pipette: <span className="text-primary font-bold">{volumeToPipette.toFixed(4)} mL</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    = {mass!.toFixed(4)} g / {densityVal} g/mL
                  </p>
                </div>
              )}
              {purityVal < 100 && mass && (
                <p className="text-xs text-muted-foreground font-mono">
                  Effective mass at {step.purity}% purity: {(mass * purityFactor).toFixed(4)} g
                </p>
              )}
            </div>

            {/* Unit Conversion Panel */}
            {conversions && (
              <div className="mt-3 p-3 bg-muted/40 border border-border rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Equivalent Concentrations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(conversions)
                    .filter(([unit]) => unit !== step.targetUnit && !(step.targetUnit === 'M' && unit === 'F') && !(step.targetUnit === 'F' && unit === 'M'))
                    .map(([unit, val]) => (
                      <div key={unit} className="flex items-baseline gap-1.5 p-1.5 bg-background rounded border border-border/50">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">{unitLabels[unit] || unit}</span>
                        <span className="text-xs font-mono font-medium text-foreground">
                          {val !== null ? val.toFixed(4) : '—'}
                        </span>
                      </div>
                    ))}
                </div>
                {(!mwVal || mwVal <= 0) && !isPercentMode && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                    Enter MW for more conversions
                  </p>
                )}
                {(!densityVal || densityVal <= 0) && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">
                    Enter density for %w/w conversion
                  </p>
                )}
              </div>
            )}
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
