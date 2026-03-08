import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';

interface MolarityCalculatorProps {
  initialMw?: number | null;
}

export function MolarityCalculator({ initialMw }: MolarityCalculatorProps) {
  const [mass, setMass] = useState('');
  const [mw, setMw] = useState('');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [density, setDensity] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (initialMw) setMw(initialMw.toString());
  }, [initialMw]);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const effectiveMass = parseFloat(mass) * purityFactor;
  const densityVal = parseFloat(density);

  // M = (mass × purity / MW) / V(L)
  // Or from density & %: M = (% × density × 10) / MW
  const molarity = mass && mw && volume
    ? ((effectiveMass / parseFloat(mw)) / (parseFloat(volume) / 1000))
    : null;

  const result = molarity !== null && isFinite(molarity)
    ? { value: molarity.toFixed(4), unit: 'M (mol/L)' }
    : null;

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    if (compound.molarMass) setMw(compound.molarMass.toString());
    if (compound.purityValue) setPurity(compound.purityValue.toString());
    if (compound.density) setDensity(compound.density.toString());
  };

  return (
    <CalculatorCard
      title="Molarity Calculator"
      subtitle="M = (mass × purity / MW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setMw(''); setVolume(''); setPurity('100'); setDensity(''); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Molecular Weight" unit="g/mol" value={mw} onChange={setMw} disabled={locked} />
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
