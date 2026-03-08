import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { Plus, Trash2 } from 'lucide-react';

interface CustomField {
  id: string;
  label: string;
  value: string;
  unit: string;
}

interface CustomCalculatorSectionProps {
  name: string;
}

export function CustomCalculatorSection({ name }: CustomCalculatorSectionProps) {
  const [locked, setLocked] = useState(false);
  const [fields, setFields] = useState<CustomField[]>([
    { id: '1', label: 'Value 1', value: '', unit: '' },
    { id: '2', label: 'Value 2', value: '', unit: '' },
  ]);
  const [notes, setNotes] = useState('');

  const addField = () => {
    setFields(prev => [...prev, {
      id: Date.now().toString(), label: `Value ${prev.length + 1}`, value: '', unit: ''
    }]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) setFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: keyof CustomField, value: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  return (
    <CalculatorCard
      title={name}
      subtitle="Custom calculation section"
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) { setFields(fields.map(f => ({ ...f, value: '' }))); setNotes(''); } }}
    >
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="w-32">
              <input type="text" value={field.label} onChange={(e) => updateField(field.id, 'label', e.target.value)}
                disabled={locked}
                className="w-full bg-transparent border-b border-border text-xs text-muted-foreground focus:border-primary focus:outline-none py-1 transition-colors" />
            </div>
            <div className="flex-1">
              <InputField label="" value={field.value} onChange={(v) => updateField(field.id, 'value', v)} disabled={locked} />
            </div>
            <div className="w-16">
              <input type="text" value={field.unit} onChange={(e) => updateField(field.id, 'unit', e.target.value)}
                placeholder="unit" disabled={locked}
                className="w-full bg-transparent border-b border-border text-xs font-mono text-muted-foreground focus:border-primary focus:outline-none py-1 transition-colors" />
            </div>
            {fields.length > 1 && !locked && (
              <button onClick={() => removeField(field.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors mb-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {!locked && (
          <button onClick={addField}
            className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs transition-all">
            <Plus className="w-3 h-3" /> Add Field
          </button>
        )}
        <div className="space-y-1.5 mt-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={locked}
            rows={3} placeholder="Add calculation notes..."
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary focus:outline-none resize-none" />
        </div>
      </div>
    </CalculatorCard>
  );
}
