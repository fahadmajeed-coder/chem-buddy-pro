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
  const effectiveMass = parseFloat(mass) * purityFactor;
  const densityVal = parseFloat(density);

  const formality = mass && fw && volume
    ? ((effectiveMass / parseFloat(fw)) / (parseFloat(volume) / 1000))
    : null;

  const result = formality !== null && isFinite(formality)
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
      <div className="mt-2 space-y-0.5">
        {purity && parseFloat(purity) < 100 && mass && (
          <p className="text-xs text-muted-foreground font-mono">
            Effective mass at {purity}% purity: {effectiveMass.toFixed(4)} g
          </p>
        )}
        {densityVal > 0 && mass && (
          <p className="text-xs text-muted-foreground font-mono">
            Volume of pure solute: {(parseFloat(mass) / densityVal).toFixed(4)} mL
          </p>
        )}
      </div>
    </CalculatorCard>
  );
}
