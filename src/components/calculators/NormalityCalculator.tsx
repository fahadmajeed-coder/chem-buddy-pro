import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';

export function NormalityCalculator() {
  const [mass, setMass] = useState('');
  const [eqWeight, setEqWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [locked, setLocked] = useState(false);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const effectiveMass = parseFloat(mass) * purityFactor;

  const normality = mass && eqWeight && volume
    ? ((effectiveMass / parseFloat(eqWeight)) / (parseFloat(volume) / 1000))
    : null;

  const result = normality !== null && isFinite(normality)
    ? { value: normality.toFixed(4), unit: 'N (eq/L)' }
    : null;

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setEqWeight(compound.molarMass.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
  };

  return (
    <CalculatorCard
      title="Normality Calculator"
      subtitle="N = (mass × purity / Eq. Weight) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setEqWeight(''); setVolume(''); setPurity('100'); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Equivalent Weight" unit="g/eq" value={eqWeight} onChange={setEqWeight} disabled={locked} />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
        <InputField label="Purity" unit="%" value={purity} onChange={setPurity} disabled={locked} />
      </div>
      {purity && parseFloat(purity) < 100 && mass && (
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          Effective mass at {purity}% purity: {effectiveMass.toFixed(4)} g
        </p>
      )}
    </CalculatorCard>
  );
}
