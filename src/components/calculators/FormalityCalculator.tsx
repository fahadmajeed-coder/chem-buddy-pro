import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';

export function FormalityCalculator() {
  const [mass, setMass] = useState('');
  const [fw, setFw] = useState('');
  const [volume, setVolume] = useState('');
  const [purity, setPurity] = useState('100');
  const [locked, setLocked] = useState(false);

  const purityFactor = parseFloat(purity) / 100 || 1;
  const effectiveMass = parseFloat(mass) * purityFactor;

  const formality = mass && fw && volume
    ? ((effectiveMass / parseFloat(fw)) / (parseFloat(volume) / 1000))
    : null;

  const result = formality !== null && isFinite(formality)
    ? { value: formality.toFixed(4), unit: 'F (FW/L)' }
    : null;

  return (
    <CalculatorCard
      title="Formality Calculator"
      subtitle="F = (mass × purity / FW) / Volume(L)"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setMass(''); setFw(''); setVolume(''); setPurity('100'); } }}
      result={result}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField label="Mass of Solute" unit="g" value={mass} onChange={setMass} disabled={locked} />
        <InputField label="Formula Weight" unit="g/FW" value={fw} onChange={setFw} disabled={locked} />
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
