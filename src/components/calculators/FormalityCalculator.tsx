import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';

interface FormalityCalculatorProps {
  initialMw?: number | null;
}

export function FormalityCalculator({ initialMw }: FormalityCalculatorProps) {
  const [mass, setMass] = useState('');
  const [fw, setFw] = useState('');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [density, setDensity] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (initialMw) setFw(initialMw.toString());
  }, [initialMw]);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const massVal = parseFloat(mass);
  const fwVal = parseFloat(fw);
  const volVal = parseFloat(volume);
  const densityVal = parseFloat(density);

  const formality = massVal && fwVal && volVal
    ? ((massVal * purityFactor / fwVal) / (volVal / 1000))
    : null;

  // Stock formality from density + purity: F = (density × purity% × 1000) / FW
  const formalityFromDensity = densityVal > 0 && fwVal && purityFactor
    ? (densityVal * purityFactor * 1000) / fwVal
    : null;

  const result = formality !== null && isFinite(formality)
    ? { value: formality.toFixed(4), unit: 'F (FW/L)' }
    : null;

  // Volume to pipette
  const volumeToPipette = massVal && densityVal > 0
    ? (massVal / densityVal)
    : null;

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setFw(compound.molarMass.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
    if (compound.density) setDensity(compound.density.toString());
  };

  return (
    <CalculatorCard
      title="Formality Calculator"
      subtitle="F = (mass × purity / FW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setFw(''); setVolume(''); setPurity('100'); setDensity(''); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Formula Weight" unit="g/FW" value={fw} onChange={setFw} disabled={locked} />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
        <InputField label="Purity" unit="%" value={purity} onChange={setPurity} disabled={locked} />
        <InputField label="Density" unit="g/mL" value={density} onChange={setDensity} disabled={locked} placeholder="Optional" />
      </div>
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
        {volumeToPipette !== null && (
          <div className="p-2 bg-accent/30 border border-accent/20 rounded-md">
            <p className="text-xs font-medium text-foreground">
              📐 Volume to pipette: <span className="text-primary font-bold">{volumeToPipette.toFixed(4)} mL</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              = {massVal} g / {densityVal} g/mL
            </p>
          </div>
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
