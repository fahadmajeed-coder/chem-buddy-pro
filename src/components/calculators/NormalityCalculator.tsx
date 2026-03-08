import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';

export function NormalityCalculator() {
  const [mass, setMass] = useState('');
  const [eqWeight, setEqWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [locked, setLocked] = useState(false);

  const normality = mass && eqWeight && volume
    ? ((parseFloat(mass) / parseFloat(eqWeight)) / (parseFloat(volume) / 1000))
    : null;

  const result = normality !== null && isFinite(normality)
    ? { value: normality.toFixed(4), unit: 'N (eq/L)' }
    : null;

  return (
    <CalculatorCard
      title="Normality Calculator"
      subtitle="N = (mass / Eq. Weight) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setEqWeight(''); setVolume(''); } }}
      result={result}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Equivalent Weight" unit="g/eq" value={eqWeight} onChange={setEqWeight} disabled={locked} />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
      </div>
    </CalculatorCard>
  );
}
