import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { MolarMassLookup } from './MolarMassLookup';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { Scale, Pipette } from 'lucide-react';

interface FormalityCalculatorProps {
  initialMw?: number | null;
  isAdmin?: boolean;
}

export function FormalityCalculator({ initialMw, isAdmin = false }: FormalityCalculatorProps) {
  const [mass, setMass] = useState('');
  const [fw, setFw] = useState('');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [density, setDensity] = useState('');
  const [targetConc, setTargetConc] = useState('');
  const [reagentState, setReagentState] = useState<'solid' | 'liquid'>('solid');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (initialMw) setFw(initialMw.toString());
  }, [initialMw]);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const fwVal = parseFloat(fw);
  const volVal = parseFloat(volume);
  const densityVal = parseFloat(density);
  const targetConcVal = parseFloat(targetConc);
  const isLiquid = reagentState === 'liquid';

  // For liquid: auto-calculate mass from target formality
  const autoMass = isLiquid && targetConcVal > 0 && fwVal > 0 && volVal > 0
    ? (targetConcVal * fwVal * (volVal / 1000)) / purityFactor
    : null;

  const massVal = isLiquid ? (autoMass ?? 0) : parseFloat(mass);

  const formality = massVal && fwVal && volVal
    ? ((massVal * purityFactor / fwVal) / (volVal / 1000))
    : null;

  const formalityFromDensity = densityVal > 0 && fwVal && purityFactor
    ? (densityVal * purityFactor * 1000) / fwVal
    : null;

  const volumeToPipette = massVal && densityVal > 0
    ? (massVal / densityVal)
    : null;

  const result = isLiquid && volumeToPipette !== null && formality !== null
    ? { value: volumeToPipette.toFixed(4), unit: 'mL to pipette' }
    : formality !== null && isFinite(formality)
      ? { value: formality.toFixed(4), unit: 'F (FW/L)' }
      : null;

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setFw(compound.molarMass.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
    if (compound.density) setDensity(compound.density.toString());
  };

  return (
    <CalculatorCard
      title="Formality Calculator"
      subtitle={isAdmin ? "F = (mass × purity / FW) / Volume(L)" : undefined}
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setFw(''); setVolume(''); setPurity('100'); setDensity(''); setTargetConc(''); setReagentState('solid'); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <MolarMassLookup onSelect={(mw) => setFw(mw.toString())} disabled={locked} />

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLiquid ? (
          <InputField label="Target Concentration" unit="F" value={targetConc} onChange={setTargetConc} disabled={locked} placeholder="Desired F" />
        ) : (
          <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        )}
        <InputField label="Formula Weight" unit="g/FW" value={fw} onChange={setFw} disabled={locked} />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
        <InputField label="Purity" unit="%" value={purity} onChange={setPurity} disabled={locked} />
        <InputField label="Density" unit="g/mL" value={density} onChange={setDensity} disabled={locked} placeholder={isLiquid ? 'Required' : 'Optional'} />
      </div>
      {isAdmin && (
      <div className="mt-2 space-y-1">
        {formalityFromDensity !== null && fwVal > 0 && (
          <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-xs font-medium text-primary">
              Stock concentration (from density & purity): {formalityFromDensity.toFixed(4)} F
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = ({densityVal} × {(purityFactor * 100).toFixed(1)}% × 1000) / {fwVal}
            </p>
          </div>
        )}
        {isLiquid && autoMass !== null && autoMass > 0 && (
          <div className="p-2 bg-accent/30 border border-accent/20 rounded-md">
            <p className="text-xs font-medium text-foreground">
              ⚖️ Required mass: <span className="text-primary font-bold">{autoMass.toFixed(4)} g</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = {targetConcVal} F × {fwVal} g/FW × {(volVal / 1000).toFixed(4)} L / {(purityFactor * 100).toFixed(1)}%
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
        {formality !== null && isLiquid && (
          <p className="text-xs text-muted-foreground font-mono">
            Formality: {formality.toFixed(4)} F
          </p>
        )}
        {purityFactor < 1 && massVal > 0 && (
          <p className="text-xs text-muted-foreground font-mono">
            Effective mass at {purity}% purity: {(massVal * purityFactor).toFixed(4)} g
          </p>
        )}
      </div>
      )}
    </CalculatorCard>
  );
}
