import { useState, useEffect } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { MolarMassLookup } from './MolarMassLookup';
import { ChemicalCompound } from '@/lib/chemicalInventory';

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
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (initialMw) setMw(initialMw.toString());
  }, [initialMw]);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const massVal = parseFloat(mass);
  const mwVal = parseFloat(mw);
  const volVal = parseFloat(volume);
  const densityVal = parseFloat(density);
  const nFactorVal = parseFloat(nFactor) || 1;
  const eqWeight = mwVal / nFactorVal;

  // N = (mass × purity / Eq.Wt) / V(L)
  const normality = massVal && mwVal && volVal && nFactorVal
    ? ((massVal * purityFactor / eqWeight) / (volVal / 1000))
    : null;

  // Stock normality from density + purity: N = (density × purity% × 1000 × n-factor) / MW
  const normalityFromDensity = densityVal > 0 && mwVal && nFactorVal
    ? (densityVal * purityFactor * 1000 * nFactorVal) / mwVal
    : null;

  const result = normality !== null && isFinite(normality)
    ? { value: normality.toFixed(4), unit: 'N (eq/L)' }
    : null;

  // Volume to pipette
  const volumeToPipette = massVal && densityVal > 0
    ? (massVal / densityVal)
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
      <MolarMassLookup onSelect={(mw) => setMw(mw.toString())} disabled={locked} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Molecular Weight" unit="g/mol" value={mw} onChange={setMw} disabled={locked} />
        <InputField label="n-Factor" unit="" value={nFactor} onChange={setNFactor} disabled={locked} placeholder="1" />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
        <InputField label="Purity" unit="%" value={purity} onChange={setPurity} disabled={locked} />
        <InputField label="Density" unit="g/mL" value={density} onChange={setDensity} disabled={locked} placeholder="Optional" />
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
