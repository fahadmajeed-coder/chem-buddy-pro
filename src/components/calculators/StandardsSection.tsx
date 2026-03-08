import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';

type ComparisonOp = '≤' | '≥' | '=' | 'range';

interface StandardEntry {
  id: string;
  name: string;
  expectedValue: string;
  tolerance: string;
  actualValue: string;
  unit: string;
  comparison: ComparisonOp;
}

export function StandardsSection() {
  const [standards, setStandards] = useState<StandardEntry[]>([
    { id: '1', name: '', expectedValue: '', tolerance: '', actualValue: '', unit: '', comparison: 'range' }
  ]);

  const addStandard = () => {
    setStandards(prev => [...prev, {
      id: Date.now().toString(), name: '', expectedValue: '', tolerance: '', actualValue: '', unit: '', comparison: 'range'
    }]);
  };

  const removeStandard = (id: string) => {
    if (standards.length > 1) setStandards(prev => prev.filter(s => s.id !== id));
  };

  const updateStandard = (id: string, field: keyof StandardEntry, value: string) => {
    setStandards(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const getStatus = (s: StandardEntry) => {
    const expected = parseFloat(s.expectedValue);
    const tolerance = parseFloat(s.tolerance);
    const actual = parseFloat(s.actualValue);
    if (isNaN(expected) || isNaN(actual)) return 'pending';
    switch (s.comparison) {
      case '≤': return actual <= expected ? 'pass' : 'fail';
      case '≥': return actual >= expected ? 'pass' : 'fail';
      case '=': {
        const tol = isNaN(tolerance) ? 0 : tolerance;
        return actual === expected || (actual >= expected - tol && actual <= expected + tol) ? 'pass' : 'fail';
      }
      case 'range':
      default: {
        const tol = isNaN(tolerance) ? 0 : tolerance;
        return (actual >= expected - tol && actual <= expected + tol) ? 'pass' : 'fail';
      }
    }
  };

  const passCount = standards.filter(s => getStatus(s) === 'pass').length;
  const failCount = standards.filter(s => getStatus(s) === 'fail').length;
  const testedCount = passCount + failCount;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="glass-panel rounded-lg p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-foreground mb-3">Standards Compliance Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-md bg-secondary">
            <div className="font-mono text-2xl font-bold text-foreground">{testedCount}</div>
            <div className="text-xs text-muted-foreground">Tested</div>
          </div>
          <div className="text-center p-3 rounded-md bg-success/10">
            <div className="font-mono text-2xl font-bold text-success">{passCount}</div>
            <div className="text-xs text-muted-foreground">Pass</div>
          </div>
          <div className="text-center p-3 rounded-md bg-destructive/10">
            <div className="font-mono text-2xl font-bold text-destructive">{failCount}</div>
            <div className="text-xs text-muted-foreground">Fail</div>
          </div>
        </div>
      </div>

      {/* Standards Table */}
      <div className="glass-panel rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Standard</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">±Tolerance</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Criteria</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actual</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {standards.map((s) => {
                const status = getStatus(s);
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    {(['name', 'expectedValue', 'tolerance', 'actualValue', 'unit'] as const).map((field) => (
                      <td key={field} className="py-2 px-2">
                        <input
                          type={field === 'name' || field === 'unit' ? 'text' : 'number'}
                          value={s[field]}
                          onChange={(e) => updateStandard(s.id, field, e.target.value)}
                          placeholder={field === 'name' ? 'Name' : '0'}
                          className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center">
                      {status === 'pass' && <CheckCircle2 className="w-4 h-4 text-success mx-auto" />}
                      {status === 'fail' && <XCircle className="w-4 h-4 text-destructive mx-auto" />}
                      {status === 'pending' && <Clock className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </td>
                    <td className="py-2 px-2">
                      {standards.length > 1 && (
                        <button onClick={() => removeStandard(s.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
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
      </div>

      <button onClick={addStandard}
        className="w-full py-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm transition-all">
        <Plus className="w-4 h-4" /> Add Standard
      </button>
    </div>
  );
}
