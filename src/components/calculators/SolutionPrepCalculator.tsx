import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { Plus, Trash2, ArrowRightLeft, Beaker, Scale, Pipette, FlaskConical, Info } from 'lucide-react';

interface PrepStep {
  id: string;
  reagentState: 'solid' | 'liquid';
  targetConc: string;
  targetUnit: string;
  targetVol: string;
  mw: string;
  nFactor: string;
  purity: string;
  density: string;
  resultUnit: string;
}

interface SolutionPrepCalculatorProps {
  initialMw?: number | null;
}

/** Convert concentration to Molarity as pivot, then to all other units */
function convertConcentration(
  conc: number,
  fromUnit: string,
  mw: number,
  density: number,
  nFactor: number,
  purity: number
): Record<string, number | null> {
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
      if (mw > 0) molarity = (conc * 10) / mw;
      break;
    case '%w/w':
      if (mw > 0 && density > 0) molarity = (conc * density * 10) / mw;
      break;
    case '%v/v':
      break;
  }

  const r: Record<string, number | null> = {};
  r['M'] = molarity;
  r['F'] = molarity;
  r['N'] = molarity !== null ? molarity * nFactor : null;
  r['%w/v'] = molarity !== null && mw > 0 ? (molarity * mw) / 10 : null;
  r['%w/w'] = molarity !== null && mw > 0 && density > 0 ? (molarity * mw) / (density * 10) : null;
  r['%v/v'] = fromUnit === '%v/v' ? conc : null;
  r['mg/mL'] = molarity !== null && mw > 0 ? molarity * mw : null;
  r['ppm'] = r['mg/mL'] !== null ? r['mg/mL'] * 1000 : null;
  r['µg/mL'] = r['mg/mL'] !== null ? r['mg/mL'] * 1000 : null;
  r['g/L'] = r['mg/mL'] !== null ? r['mg/mL'] : null;
  return r;
}

/** Calculate all practical results for solution preparation */
function calcAllResults(step: PrepStep) {
  const conc = parseFloat(step.targetConc);
  const vol = parseFloat(step.targetVol);
  const mw = parseFloat(step.mw);
  const purityPercent = parseFloat(step.purity) || 100;
  const purity = purityPercent / 100;
  const nf = parseFloat(step.nFactor) || 1;
  const density = parseFloat(step.density);
  const isPercentMode = step.targetUnit.startsWith('%');

  // Stock concentration from density & purity
  const stockConc = !isPercentMode && density > 0 && mw > 0 && purity > 0
    ? (step.targetUnit === 'N'
      ? (density * purity * 1000 * nf) / mw
      : (density * purity * 1000) / mw)
    : null;

  // Equivalent weight
  const eqWeight = mw > 0 && nf > 0 ? mw / nf : null;

  // Mass of solute needed (before purity correction — this IS corrected for purity)
  let massNeeded: number | null = null;
  let volumeOfSolute: number | null = null; // for %v/v

  if (conc > 0 && vol > 0) {
    switch (step.targetUnit) {
      case 'M':
      case 'F':
        if (mw > 0) massNeeded = (conc * (vol / 1000) * mw) / purity;
        break;
      case 'N':
        if (mw > 0) massNeeded = (conc * (vol / 1000) * mw) / (nf * purity);
        break;
      case '%w/v':
        massNeeded = (conc * vol) / (100 * purity);
        break;
      case '%w/w':
        if (density > 0) {
          const totalMass = vol * density;
          massNeeded = (conc * totalMass) / (100 * purity);
        }
        break;
      case '%v/v':
        volumeOfSolute = (conc * vol) / 100;
        break;
    }
  }

  // Volume to pipette (if reagent is liquid with known density)
  const volumeToPipette = massNeeded !== null && density > 0 ? massNeeded / density : null;

  // Pure solute mass (what actually ends up in solution)
  const pureSoluteMass = massNeeded !== null ? massNeeded * purity : null;

  // Solvent volume (total vol - solute vol)
  const solventVolume = vol > 0 && volumeToPipette !== null
    ? vol - volumeToPipette
    : vol > 0 && volumeOfSolute !== null
      ? vol - volumeOfSolute
      : null;

  // mg/mL equivalent for %w/v
  const mgPerMl = step.targetUnit === '%w/v' && conc > 0 ? conc * 10 : null;

  // Moles of solute
  const molesOfSolute = pureSoluteMass !== null && mw > 0 ? pureSoluteMass / mw : null;

  // Equivalents of solute
  const equivalents = molesOfSolute !== null ? molesOfSolute * nf : null;

  // Unit conversions
  const conversions = conc > 0
    ? convertConcentration(conc, step.targetUnit, mw, density, nf, purity)
    : null;

  return {
    conc, vol, mw, purity, purityPercent, nf, density, isPercentMode,
    stockConc, eqWeight, massNeeded, volumeOfSolute, volumeToPipette,
    pureSoluteMass, solventVolume, mgPerMl, molesOfSolute, equivalents, conversions
  };
}

const unitLabels: Record<string, string> = {
  'M': 'Molarity (M)',
  'F': 'Formality (F)',
  'N': 'Normality (N)',
  '%w/v': '% w/v',
  '%w/w': '% w/w',
  '%v/v': '% v/v',
  'mg/mL': 'mg/mL',
  'ppm': 'ppm (mg/L)',
  'µg/mL': 'µg/mL',
  'g/L': 'g/L',
};

export function SolutionPrepCalculator({ initialMw }: SolutionPrepCalculatorProps) {
  const [locked, setLocked] = useState(false);
  const [steps, setSteps] = useState<PrepStep[]>([
    { id: '1', reagentState: 'solid', targetConc: '', targetUnit: 'M', targetVol: '', mw: '', nFactor: '1', purity: '100', density: '', resultUnit: 'g' }
  ]);

  useEffect(() => {
    if (initialMw) {
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, mw: initialMw.toString() } : s));
    }
  }, [initialMw]);

  const addStep = () => {
    setSteps(prev => [...prev, {
      id: Date.now().toString(), reagentState: 'solid',
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

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const r = calcAllResults(step);
        const isLiquid = step.reagentState === 'liquid';
        const primaryResult = isLiquid && r.volumeToPipette !== null
          ? { value: r.volumeToPipette.toFixed(4), unit: 'mL to pipette' }
          : r.massNeeded !== null && !isLiquid
            ? { value: r.massNeeded.toFixed(4), unit: 'g solute needed' }
            : r.volumeOfSolute !== null
              ? { value: r.volumeOfSolute.toFixed(4), unit: 'mL solute needed' }
              : r.massNeeded !== null
                ? { value: r.massNeeded.toFixed(4), unit: 'g solute needed' }
                : null;

        return (
          <CalculatorCard
            key={step.id}
            title={`Solution Preparation ${steps.length > 1 ? `#${idx + 1}` : ''}`}
            subtitle="Complete solution making guide — mass, volume & conversions"
            locked={locked}
            onToggleLock={() => setLocked(!locked)}
            onReset={() => {
              if (!locked) setSteps(prev => prev.map(s => s.id === step.id
                ? { ...s, reagentState: 'solid', targetConc: '', targetVol: '', mw: '', nFactor: '1', purity: '100', density: '' }
                : s
              ));
            }}
            result={primaryResult}
          >
            {/* Compound Selector */}
            <CompoundSelector onSelect={(c) => handleCompoundSelect(step.id, c)} disabled={locked} />

            {/* ───── Reagent State Toggle ───── */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reagent Type:</span>
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => !locked && updateStep(step.id, 'reagentState', 'solid')}
                  disabled={locked}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    step.reagentState === 'solid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
                  } disabled:opacity-50`}
                >
                  <Scale className="w-3 h-3" /> Solid
                </button>
                <button
                  type="button"
                  onClick={() => !locked && updateStep(step.id, 'reagentState', 'liquid')}
                  disabled={locked}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    step.reagentState === 'liquid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
                  } disabled:opacity-50`}
                >
                  <Pipette className="w-3 h-3" /> Liquid
                </button>
              </div>
            </div>

            {/* ───── Section 1: Target Solution ───── */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Target Solution</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concentration Unit</label>
                  <select
                    value={step.targetUnit}
                    onChange={(e) => updateStep(step.id, 'targetUnit', e.target.value)}
                    disabled={locked}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="M">Molarity (M)</option>
                    <option value="N">Normality (N)</option>
                    <option value="F">Formality (F)</option>
                    <option value="%w/v">% w/v</option>
                    <option value="%w/w">% w/w</option>
                    <option value="%v/v">% v/v</option>
                  </select>
                </div>
                <InputField label="Required Concentration" unit={step.targetUnit} value={step.targetConc} onChange={(v) => updateStep(step.id, 'targetConc', v)} disabled={locked} />
                <InputField label="Required Volume" unit="mL" value={step.targetVol} onChange={(v) => updateStep(step.id, 'targetVol', v)} disabled={locked} />
              </div>
            </div>

            {/* ───── Section 2: Reagent Properties ───── */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Reagent Properties</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InputField label="Molecular Weight" unit="g/mol" value={step.mw} onChange={(v) => updateStep(step.id, 'mw', v)} disabled={locked} />
                <InputField label="n-Factor" unit="" value={step.nFactor} onChange={(v) => updateStep(step.id, 'nFactor', v)} disabled={locked} placeholder="1" />
                <InputField label="Purity" unit="%" value={step.purity} onChange={(v) => updateStep(step.id, 'purity', v)} disabled={locked} placeholder="100" />
                <InputField label="Density" unit="g/mL" value={step.density} onChange={(v) => updateStep(step.id, 'density', v)} disabled={locked} placeholder={step.reagentState === 'liquid' ? 'Required' : 'Optional'} />
              </div>
            </div>

            {/* ───── Section 3: Results ───── */}
            {(r.massNeeded !== null || r.volumeOfSolute !== null || r.stockConc !== null) && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Preparation Results</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* PRIMARY: For liquids show Volume to Pipette first */}
                  {isLiquid && r.volumeToPipette !== null && (
                    <ResultCard
                      icon="📐"
                      label="Volume to Pipette"
                      value={`${r.volumeToPipette.toFixed(4)} mL`}
                      detail={`(${r.massNeeded!.toFixed(4)} g ÷ ${r.density} g/mL) — adjusted for ${r.purityPercent}% purity`}
                      highlight
                    />
                  )}

                  {/* PRIMARY: For solids show Mass to Weigh first */}
                  {!isLiquid && r.massNeeded !== null && (
                    <ResultCard
                      icon="⚖️"
                      label="Mass of Solute to Weigh"
                      value={`${r.massNeeded.toFixed(4)} g`}
                      detail={r.purityPercent < 100 ? `(adjusted for ${r.purityPercent}% purity)` : undefined}
                      highlight
                    />
                  )}

                  {/* Secondary: For liquids also show mass for reference */}
                  {isLiquid && r.massNeeded !== null && (
                    <ResultCard
                      icon="⚖️"
                      label="Equivalent Mass"
                      value={`${r.massNeeded.toFixed(4)} g`}
                      detail="For reference only"
                    />
                  )}

                  {/* Secondary: For solids show pipette volume if density known */}
                  {!isLiquid && r.volumeToPipette !== null && (
                    <ResultCard
                      icon="📐"
                      label="Equivalent Volume"
                      value={`${r.volumeToPipette.toFixed(4)} mL`}
                      detail="If dissolved — for reference"
                    />
                  )}

                  {/* Volume of solute (%v/v) */}
                  {r.volumeOfSolute !== null && (
                    <ResultCard
                      icon="🧪"
                      label="Volume of Solute"
                      value={`${r.volumeOfSolute.toFixed(4)} mL`}
                      highlight
                    />
                  )}

                  {/* Pure solute mass */}
                  {r.pureSoluteMass !== null && r.purityPercent < 100 && (
                    <ResultCard
                      icon="💎"
                      label="Pure Solute in Solution"
                      value={`${r.pureSoluteMass.toFixed(4)} g`}
                      detail={`Actual active mass at ${r.purityPercent}%`}
                    />
                  )}

                  {/* Moles of solute */}
                  {r.molesOfSolute !== null && (
                    <ResultCard
                      icon="🔬"
                      label="Moles of Solute"
                      value={`${r.molesOfSolute.toFixed(6)} mol`}
                      detail={r.equivalents !== null && r.nf !== 1 ? `= ${r.equivalents.toFixed(6)} eq` : undefined}
                    />
                  )}

                  {/* Solvent volume */}
                  {r.solventVolume !== null && r.solventVolume > 0 && (
                    <ResultCard
                      icon="💧"
                      label="Solvent to Add"
                      value={`${r.solventVolume.toFixed(2)} mL`}
                      detail="Make up to final volume"
                    />
                  )}

                  {/* Stock concentration */}
                  {r.stockConc !== null && (
                    <ResultCard
                      icon="📦"
                      label="Stock Reagent Concentration"
                      value={`${r.stockConc.toFixed(4)} ${step.targetUnit}`}
                      detail={`(ρ=${r.density} × ${r.purityPercent}% × 1000${step.targetUnit === 'N' ? ` × n=${r.nf}` : ''}) / MW=${r.mw}`}
                    />
                  )}

                  {/* Equivalent weight */}
                  {r.eqWeight !== null && step.targetUnit === 'N' && (
                    <ResultCard
                      icon="⚗️"
                      label="Equivalent Weight"
                      value={`${r.eqWeight.toFixed(3)} g/eq`}
                      detail={`MW ${r.mw} ÷ n-factor ${r.nf}`}
                    />
                  )}

                  {/* mg/mL for %w/v */}
                  {r.mgPerMl !== null && (
                    <ResultCard
                      icon="📊"
                      label="Concentration"
                      value={`${r.mgPerMl.toFixed(2)} mg/mL`}
                      detail={`= ${r.conc}% w/v × 10`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ───── Section 4: Quick Unit Converter ───── */}
            <QuickUnitConverter step={step} locked={locked} />

            {/* ───── Section 5: Equivalent Concentrations ───── */}
            {r.conversions && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Equivalent Concentrations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {Object.entries(r.conversions)
                    .filter(([unit]) => unit !== step.targetUnit && !(step.targetUnit === 'M' && unit === 'F') && !(step.targetUnit === 'F' && unit === 'M'))
                    .map(([unit, val]) => (
                      <div key={unit} className="flex flex-col p-2 bg-muted/40 rounded-md border border-border/50">
                        <span className="text-[10px] text-muted-foreground font-medium">{unitLabels[unit] || unit}</span>
                        <span className="text-sm font-mono font-semibold text-foreground">
                          {val !== null ? val.toFixed(4) : '—'}
                        </span>
                      </div>
                    ))}
                </div>
                {(!r.mw || r.mw <= 0) && !r.isPercentMode && (
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="w-3 h-3" /> Enter MW for molar conversions
                  </p>
                )}
                {(!r.density || r.density <= 0) && (
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="w-3 h-3" /> Enter density for %w/w & pipette volume
                  </p>
                )}
              </div>
            )}

            {/* Delete button for multi-step */}
            {steps.length > 1 && (
              <div className="flex justify-end">
                <button onClick={() => removeStep(step.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
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

const convertUnits = ['M', 'N', 'F', '%w/v', '%w/w', '%v/v', 'mg/mL', 'ppm', 'µg/mL', 'g/L'] as const;

/** Inline quick unit converter */
function QuickUnitConverter({ step, locked }: { step: PrepStep; locked: boolean }) {
  const [fromUnit, setFromUnit] = useState('M');
  const [toUnit, setToUnit] = useState('N');
  const [inputVal, setInputVal] = useState('');

  const mw = parseFloat(step.mw) || 0;
  const density = parseFloat(step.density) || 0;
  const nFactor = parseFloat(step.nFactor) || 1;
  const purity = (parseFloat(step.purity) || 100) / 100;

  const numVal = parseFloat(inputVal);
  let result: string | null = null;

  if (numVal > 0) {
    const allConversions = convertConcentration(numVal, fromUnit, mw, density, nFactor, purity);
    const converted = allConversions[toUnit];
    result = converted !== null ? converted.toFixed(6) : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Quick Convert</span>
      </div>
      <div className="flex flex-wrap items-end gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Value</label>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={locked}
            className="w-24 bg-input border border-border rounded-md px-2 py-1.5 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary disabled:opacity-50"
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium uppercase">From</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            disabled={locked}
            className="bg-input border border-border rounded-md px-2 py-1.5 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            {convertUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <span className="text-muted-foreground text-sm font-bold pb-1">→</span>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-medium uppercase">To</label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            disabled={locked}
            className="bg-input border border-border rounded-md px-2 py-1.5 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            {convertUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[100px]">
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Result</label>
          <div className="px-2 py-1.5 bg-primary/5 border border-primary/20 rounded-md text-sm font-mono font-bold text-primary min-h-[34px] flex items-center">
            {result ?? '—'}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground italic">Uses MW, density, n-factor & purity from reagent properties above</p>
    </div>
  );
}

/** Small result display card */
function ResultCard({ icon, label, value, detail, highlight }: {
  icon: string;
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`text-sm font-mono font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
      {detail && (
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{detail}</p>
      )}
    </div>
  );
}
