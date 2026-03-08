import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { ChemicalCompound } from '@/lib/chemicalInventory';

export function NormalityCalculator() {
  const [mass, setMass] = useState('');
  const [mw, setMw] = useState('');
  const [nFactor, setNFactor] = useState('1');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [density, setDensity] = useState('');
  const [locked, setLocked] = useState(false);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const effectiveMass = parseFloat(mass) * purityFactor;
  const densityVal = parseFloat(density);
  const mwVal = parseFloat(mw);
  const nFactorVal = parseFloat(nFactor) || 1;
  const eqWeight = mwVal / nFactorVal;

  // N = (mass × purity / Eq.Wt) / V(L)  where Eq.Wt = MW / n-factor
  const normality = mass && mw && volume && nFactor
    ? ((effectiveMass / eqWeight) / (parseFloat(volume) / 1000))
    : null;

  const result = normality !== null && isFinite(normality)
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
      onReset={() => { if (!locked) { setMass(''); setMw(''); setNFactor('1'); setVolume(''); setPurity('100'); setDensity(''); } }}
      result={result}
    >
      <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Molecular Weight" unit="g/mol" value={mw} onChange={setMw} disabled={locked} />
        <InputField label="n-Factor" unit="" value={nFactor} onChange={setNFactor} disabled={locked} placeholder="1" />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
        <InputField label="Purity" unit="%" value={purity} onChange={setPurity} disabled={locked} />
        <InputField label="Density" unit="g/mL" value={density} onChange={setDensity} disabled={locked} placeholder="Optional" />
      </div>
      <div className="mt-2 space-y-0.5">
        {mwVal > 0 && nFactorVal > 0 && (
          <p className="text-xs text-muted-foreground font-mono">
            Equivalent Weight: {mwVal} / {nFactorVal} = {eqWeight.toFixed(3)} g/eq
          </p>
        )}
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
