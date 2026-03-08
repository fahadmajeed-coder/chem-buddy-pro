import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { MolarMassLookup } from './MolarMassLookup';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { Scale, Pipette } from 'lucide-react';

interface NormalityCalculatorProps {
  initialMw?: number | null;
}

export function NormalityCalculator({ initialMw }: NormalityCalculatorProps) {
  const [mass, setMass] = useState('');
  const [mw, setMw] = useState('');
  const [nFactor, setNFactor] = useState('1');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [density, setDensity] = useState('');
  const [targetConc, setTargetConc] = useState('');
  const [reagentState, setReagentState] = useState<'solid' | 'liquid'>('solid');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (initialMw) setMw(initialMw.toString());
  }, [initialMw]);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const mwVal = parseFloat(mw);
  const volVal = parseFloat(volume);
  const densityVal = parseFloat(density);
  const nFactorVal = parseFloat(nFactor) || 1;
  const eqWeight = mwVal / nFactorVal;
  const targetConcVal = parseFloat(targetConc);
  const isLiquid = reagentState === 'liquid';

  // For liquid: auto-calculate mass from target normality
  const autoMass = isLiquid && targetConcVal > 0 && eqWeight > 0 && volVal > 0
    ? (targetConcVal * eqWeight * (volVal / 1000)) / purityFactor
    : null;

  const massVal = isLiquid ? (autoMass ?? 0) : parseFloat(mass);

  const normality = massVal && mwVal && volVal && nFactorVal
    ? ((massVal * purityFactor / eqWeight) / (volVal / 1000))
    : null;

  const normalityFromDensity = densityVal > 0 && mwVal && nFactorVal
    ? (densityVal * purityFactor * 1000 * nFactorVal) / mwVal
    : null;

  const volumeToPipette = massVal && densityVal > 0
    ? (massVal / densityVal)
    : null;

  const result = isLiquid && volumeToPipette !== null && normality !== null
    ? { value: volumeToPipette.toFixed(4), unit: 'mL to pipette' }
    : normality !== null && isFinite(normality)
      ? { value: normality.toFixed(4), unit: 'N (eq/L)' }
      : null;

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setMw(compound.molarMass.toString());
    if (compound.nFactor) setNFactor(compound.nFactor.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
    if (compound.density) setDensity(compound.density.toString());
  };

  return (
    <CalculatorCard
      title="Normality Calculator"
      subtitle="N = (mass × purity × n-factor / MW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setMw(''); setNFactor('1'); setVolume(''); setPurity('100'); setDensity(''); setTargetConc(''); setReagentState('solid'); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <MolarMassLookup onSelect={(mw) => setMw(mw.toString())} disabled={locked} />

      {/* Reagent State Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reagent Type:</span>
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          <button type="button" onClick={() => !locked && setReagentState('solid')} disabled={locked}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${reagentState === 'solid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'} disabled:opacity-50`}>
            <Scale className="w-3 h-3" /> Solid
          </button>
          <button type="button" onClick={() => !locked && setReagentState('liquid')} disabled={locked}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${reagentState === 'liquid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'} disabled:opacity-50`}>
            <Pipette className="w-3 h-3" /> Liquid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {isLiquid ? (
          <InputField label="Target Concentration" unit="N" value={targetConc} onChange={setTargetConc} disabled={locked} placeholder="Desired N" />
        ) : (
          <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        )}
        <InputField label="Molecular Weight" unit="g/mol" value={mw} onChange={setMw} disabled={locked} />
        <InputField label="n-Factor" unit="" value={nFactor} onChange={setNFactor} disabled={locked} placeholder="1" />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
        <InputField label="Purity" unit="%" value={purity} onChange={setPurity} disabled={locked} />
        <InputField label="Density" unit="g/mL" value={density} onChange={setDensity} disabled={locked} placeholder={isLiquid ? 'Required' : 'Optional'} />
      </div>
      <div className="mt-2 space-y-1">
        {mwVal > 0 && nFactorVal > 0 && (
          <p className="text-xs text-muted-foreground font-mono">
            Equivalent Weight: {mwVal} / {nFactorVal} = {eqWeight.toFixed(3)} g/eq
          </p>
        )}
        {normalityFromDensity !== null && mwVal > 0 && (
          <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-xs font-medium text-primary">
              Stock concentration (from density & purity): {normalityFromDensity.toFixed(4)} N
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = ({densityVal} × {(purityFactor * 100).toFixed(1)}% × 1000 × {nFactorVal}) / {mwVal}
            </p>
          </div>
        )}
        {isLiquid && autoMass !== null && autoMass > 0 && (
          <div className="p-2 bg-accent/30 border border-accent/20 rounded-md">
            <p className="text-xs font-medium text-foreground">
              ⚖️ Required mass: <span className="text-primary font-bold">{autoMass.toFixed(4)} g</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = {targetConcVal} N × {eqWeight.toFixed(3)} g/eq × {(volVal / 1000).toFixed(4)} L / {(purityFactor * 100).toFixed(1)}%
            </p>
          </div>
        )}
        {isLiquid && volumeToPipette !== null && (
          <div className="p-2 bg-accent/30 border border-accent/20 rounded-md">
            <p className="text-xs font-medium text-foreground">
              📐 Volume to pipette: <span className="text-primary font-bold">{volumeToPipette.toFixed(4)} mL</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = {massVal.toFixed(4)} g / {densityVal} g/mL
            </p>
          </div>
        )}
        {!isLiquid && volumeToPipette !== null && (
          <div className="p-2 bg-accent/30 border border-accent/20 rounded-md">
            <p className="text-xs font-medium text-foreground">
              📐 Equivalent volume: <span className="text-primary font-bold">{volumeToPipette.toFixed(4)} mL</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = {massVal} g / {densityVal} g/mL (for reference)
            </p>
          </div>
        )}
        {normality !== null && isLiquid && (
          <p className="text-xs text-muted-foreground font-mono">
            Normality: {normality.toFixed(4)} N
          </p>
        )}
        {purityFactor < 1 && massVal > 0 && (
          <p className="text-xs text-muted-foreground font-mono">
            Effective mass at {purity}% purity: {(massVal * purityFactor).toFixed(4)} g
          </p>
        )}
      </div>
    </CalculatorCard>
  );
}
