import { useState } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { Plus, Trash2 } from 'lucide-react';

interface TestRow {
  id: string;
  sampleId: string;
  reading1: string;
  reading2: string;
  reading3: string;
  blankReading: string;
  dilutionFactor: string;
}

export function AnalyticalTestSection() {
  const [locked, setLocked] = useState(false);
  const [rows, setRows] = useState<TestRow[]>([
    { id: '1', sampleId: '', reading1: '', reading2: '', reading3: '', blankReading: '', dilutionFactor: '1' }
  ]);

  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now().toString(), sampleId: '', reading1: '', reading2: '', reading3: '', blankReading: '', dilutionFactor: '1'
    }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof TestRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const calcAvg = (row: TestRow) => {
    const vals = [row.reading1, row.reading2, row.reading3].map(Number).filter(v => !isNaN(v) && v > 0);
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const blank = parseFloat(row.blankReading) || 0;
    const df = parseFloat(row.dilutionFactor) || 1;
    return ((avg - blank) * df);
  };

  return (
    <div className="space-y-4">
      <CalculatorCard
        title="Analytical Testing"
        subtitle="Enter sample readings for analysis"
        locked={locked}
        onToggleLock={() => setLocked(!locked)}
        onReset={() => { if (!locked) setRows([{ id: '1', sampleId: '', reading1: '', reading2: '', reading3: '', blankReading: '', dilutionFactor: '1' }]); }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">R1</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">R2</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">R3</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Blank</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">DF</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const result = calcAvg(row);
                return (
                  <tr key={row.id} className="border-b border-border/50">
                    <td className="py-2 px-1">
                      <input type="text" value={row.sampleId} onChange={(e) => updateRow(row.id, 'sampleId', e.target.value)} disabled={locked}
                        placeholder="ID" className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary" />
                    </td>
                    {(['reading1', 'reading2', 'reading3', 'blankReading', 'dilutionFactor'] as const).map((field) => (
                      <td key={field} className="py-2 px-1">
                        <input type="number" value={row[field]} onChange={(e) => updateRow(row.id, field, e.target.value)} disabled={locked}
                          placeholder="0" className="w-16 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary" />
                      </td>
                    ))}
                    <td className="py-2 px-2">
                      <span className="font-mono text-sm font-bold text-primary">
                        {result !== null ? result.toFixed(4) : '—'}
                      </span>
                    </td>
                    <td className="py-2 px-1">
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(row.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CalculatorCard>
      <button onClick={addRow}
        className="w-full py-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm transition-all">
        <Plus className="w-4 h-4" /> Add Sample Row
      </button>
    </div>
  );
}
