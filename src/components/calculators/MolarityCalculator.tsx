import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';

export function MolarityCalculator() {
  const [mass, setMass] = useState('');
  const [mw, setMw] = useState('');
  const [volume, setVolume] = useState('');
  const [locked, setLocked] = useState(false);

  const molarity = mass && mw && volume
    ? ((parseFloat(mass) / parseFloat(mw)) / (parseFloat(volume) / 1000))
    : null;

  const result = molarity !== null && isFinite(molarity)
    ? { value: molarity.toFixed(4), unit: 'M (mol/L)' }
    : null;

  return (
    <CalculatorCard
      title="Molarity Calculator"
      subtitle="M = (mass / MW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setMw(''); setVolume(''); } }}
      result={result}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Molecular Weight" unit="g/mol" value={mw} onChange={setMw} disabled={locked} />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
      </div>
    </CalculatorCard>
  );
}
