import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';

export function MolarityCalculator() {
  const [mass, setMass] = useState('');
  const [mw, setMw] = useState('');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [locked, setLocked] = useState(false);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const effectiveMass = parseFloat(mass) * purityFactor;

  const molarity = mass && mw && volume
    ? ((effectiveMass / parseFloat(mw)) / (parseFloat(volume) / 1000))
    : null;

  const result = molarity !== null && isFinite(molarity)
    ? { value: molarity.toFixed(4), unit: 'M (mol/L)' }
    : null;

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setMw(compound.molarMass.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
  };

  return (
    <CalculatorCard
      title="Molarity Calculator"
      subtitle="M = (mass × purity / MW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setMw(''); setVolume(''); setPurity('100'); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Molecular Weight" unit="g/mol" value={mw} onChange={setMw} disabled={locked} />
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
