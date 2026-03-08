import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';

export function FormalityCalculator() {
  const [mass, setMass] = useState('');
  const [fw, setFw] = useState('');
  const [volume, setVolume] = useState('');
  const [locked, setLocked] = useState(false);

  const formality = mass && fw && volume
    ? ((parseFloat(mass) / parseFloat(fw)) / (parseFloat(volume) / 1000))
    : null;

  const result = formality !== null && isFinite(formality)
    ? { value: formality.toFixed(4), unit: 'F (FW/L)' }
    : null;

  return (
    <CalculatorCard
      title="Formality Calculator"
      subtitle="F = (mass / FW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setFw(''); setVolume(''); } }}
      result={result}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Formula Weight" unit="g/FW" value={fw} onChange={setFw} disabled={locked} />
        <InputField label="Volume of Solution" unit="mL" value={volume} onChange={setVolume} disabled={locked} />
      </div>
    </CalculatorCard>
  );
}
