import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { MolarMassLookup } from './MolarMassLookup';
import { ChemicalCompound } from '@/lib/chemicalInventory';

type SolveFor = 'V1' | 'C2' | 'V2';

interface DilutionCalculatorProps {
  initialMw?: number | null;
  isAdmin?: boolean;
}

export function DilutionCalculator({ initialMw }: DilutionCalculatorProps) {
  const [locked, setLocked] = useState(false);
  const [solveFor, setSolveFor] = useState<SolveFor>('V1');
  const [c1, setC1] = useState('');
  const [v1, setV1] = useState('');
  const [c2, setC2] = useState('');
  const [v2, setV2] = useState('');
  const [unit, setUnit] = useState('M');
  const [mw, setMw] = useState('');
  const [purity, setPurity] = useState('100');
  const [density, setDensity] = useState('');
  const [nFactor, setNFactor] = useState('1');
  const [useStock, setUseStock] = useState(false);

  useEffect(() => {
    if (initialMw) setMw(initialMw.toString());
  }, [initialMw]);

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setMw(compound.molarMass.toString());
    if (compound.nFactor) setNFactor(compound.nFactor.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
    if (compound.density) setDensity(compound.density.toString());
  };

  const mwVal = parseFloat(mw);
  const densityVal = parseFloat(density);
  const purityFrac = (parseFloat(purity) || 100) / 100;
  const nfVal = parseFloat(nFactor) || 1;

  // Stock concentration from density & purity
  const stockConc = densityVal > 0 && mwVal > 0 && purityFrac > 0
    ? (unit === 'N'
      ? (densityVal * purityFrac * 1000 * nfVal) / mwVal
      : (densityVal * purityFrac * 1000) / mwVal)
    : null;

  const effectiveC1 = useStock && stockConc ? stockConc : parseFloat(c1);

  const calculate = (): { value: number; label: string } | null => {
    const C1 = effectiveC1;
    const V1 = parseFloat(v1);
    const C2 = parseFloat(c2);
    const V2 = parseFloat(v2);

    switch (solveFor) {
      case 'V1':
        if (!C1 || !C2 || !V2) return null;
        return { value: (C2 * V2) / C1, label: 'mL (V₁)' };
      case 'C2':
        if (!C1 || !V1 || !V2) return null;
        return { value: (C1 * V1) / V2, label: `${unit} (C₂)` };
      case 'V2':
        if (!C1 || !V1 || !C2) return null;
        return { value: (C1 * V1) / C2, label: 'mL (V₂)' };
      default:
        return null;
    }
  };

  const calcRes = calculate();
  const result = calcRes ? { value: calcRes.value.toFixed(4), unit: calcRes.label } : null;

  const reset = () => {
    if (locked) return;
    setC1(''); setV1(''); setC2(''); setV2('');
    setMw(''); setPurity('100'); setDensity(''); setNFactor('1');
    setUseStock(false);
  };

  return (
    <CalculatorCard
      title="Dilution Calculator"
      subtitle="C₁V₁ = C₂V₂"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={reset}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />

      {/* Solve-for selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Solve for:</span>
        {(['V1', 'C2', 'V2'] as SolveFor[]).map((s) => (
          <button
            key={s}
            onClick={() => !locked && setSolveFor(s)}
            disabled={locked}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all
              ${solveFor === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } disabled:opacity-50`}
          >
            {s === 'V1' ? 'V₁' : s === 'C2' ? 'C₂' : 'V₂'}
          </button>
        ))}
        <select
          value={unit}
          onChange={(e) => !locked && setUnit(e.target.value)}
          disabled={locked}
          className="ml-auto bg-input border border-border rounded-md px-2 py-1.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
        >
          <option value="M">Molarity (M)</option>
          <option value="N">Normality (N)</option>
          <option value="F">Formality (F)</option>
          <option value="%w/v">% w/v</option>
        </select>
      </div>

      {/* Stock concentration from density */}
      {stockConc !== null && (
        <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-primary">
              Stock concentration: {stockConc.toFixed(4)} {unit}
            </p>
            <button
              onClick={() => !locked && setUseStock(!useStock)}
              disabled={locked}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all
                ${useStock
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
                } disabled:opacity-50`}
            >
              {useStock ? '✓ Using as C₁' : 'Use as C₁'}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            = ({densityVal} × {(purityFrac * 100).toFixed(1)}% × 1000{unit === 'N' ? ` × ${nfVal}` : ''}) / {mwVal}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={solveFor === 'V1' ? '' : ''}>
          <InputField
            label={`C₁ (Stock)${useStock && stockConc ? ' — auto' : ''}`}
            unit={unit}
            value={useStock && stockConc ? stockConc.toFixed(4) : c1}
            onChange={(v) => setC1(v)}
            disabled={locked || (useStock && !!stockConc)}
          />
        </div>
        <div className={solveFor === 'V1' ? 'opacity-50' : ''}>
          <InputField
            label="V₁ (Stock Volume)"
            unit="mL"
            value={solveFor === 'V1' && calcRes ? calcRes.value.toFixed(4) : v1}
            onChange={(v) => setV1(v)}
            disabled={locked || solveFor === 'V1'}
          />
        </div>
        <div className={solveFor === 'C2' ? 'opacity-50' : ''}>
          <InputField
            label="C₂ (Desired)"
            unit={unit}
            value={solveFor === 'C2' && calcRes ? calcRes.value.toFixed(4) : c2}
            onChange={(v) => setC2(v)}
            disabled={locked || solveFor === 'C2'}
          />
        </div>
        <div className={solveFor === 'V2' ? 'opacity-50' : ''}>
          <InputField
            label="V₂ (Final Volume)"
            unit="mL"
            value={solveFor === 'V2' && calcRes ? calcRes.value.toFixed(4) : v2}
            onChange={(v) => setV2(v)}
            disabled={locked || solveFor === 'V2'}
          />
        </div>
      </div>


      {/* Equation display */}
      {calcRes && (
        <div className="p-2 bg-muted/40 border border-border rounded-md">
          <p className="text-xs font-mono text-muted-foreground text-center">
            {(useStock && stockConc ? stockConc.toFixed(4) : c1 || '?')} {unit} × {solveFor === 'V1' ? calcRes.value.toFixed(4) : (v1 || '?')} mL
            {' = '}
            {solveFor === 'C2' ? calcRes.value.toFixed(4) : (c2 || '?')} {unit} × {solveFor === 'V2' ? calcRes.value.toFixed(4) : (v2 || '?')} mL
          </p>
        </div>
      )}
    </CalculatorCard>
  );
}
